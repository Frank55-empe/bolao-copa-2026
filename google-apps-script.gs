// ============================================================
//  BOLÃO COPA 2026 — Google Apps Script (versão corrigida)
//  CORREÇÃO: trava inline em cada ação (sem callback anônimo)
// ============================================================

function montarResposta(obj, nomeCallback) {
  var json = JSON.stringify(obj);
  if (nomeCallback) {
    var saida = ContentService.createTextOutput(nomeCallback + '(' + json + ');');
    saida.setMimeType(ContentService.MimeType.JAVASCRIPT);
    return saida;
  }
  var saida = ContentService.createTextOutput(json);
  saida.setMimeType(ContentService.MimeType.JSON);
  return saida;
}

function lerAba(nomeAba) {
  var ss  = SpreadsheetApp.getActiveSpreadsheet();
  var aba = ss.getSheetByName(nomeAba);
  if (!aba) return [];
  var dados = aba.getDataRange().getValues();
  if (dados.length <= 1) return [];
  var cabecalho = dados[0];
  var resultado = [];
  for (var i = 1; i < dados.length; i++) {
    var linha = dados[i];
    var vazia = true;
    for (var k = 0; k < linha.length; k++) {
      if (linha[k] !== '' && linha[k] !== null && linha[k] !== undefined) { vazia = false; break; }
    }
    if (vazia) continue;
    var obj = {};
    for (var j = 0; j < cabecalho.length; j++) {
      obj[String(cabecalho[j]).trim()] = linha[j];
    }
    resultado.push(obj);
  }
  return resultado;
}

function doGet(e) {
  var params = e.parameter || {};
  var acao         = params.action   || params.Action   || '';
  var nomeCallback = params.callback || params.Callback || null;
  var dados        = {};

  if (params.payload) {
    try { dados = JSON.parse(decodeURIComponent(params.payload)); }
    catch (err) { dados = {}; }
  }

  if (!acao && e.queryString) {
    var qs = e.queryString;
    var mAcao = qs.match(/(?:^|&)action=([^&]*)/i);
    if (mAcao) acao = decodeURIComponent(mAcao[1]);
    var mCb = qs.match(/(?:^|&)callback=([^&]*)/i);
    if (mCb) nomeCallback = decodeURIComponent(mCb[1]);
    var mPl = qs.match(/(?:^|&)payload=([^&]*)/i);
    if (mPl) {
      try { dados = JSON.parse(decodeURIComponent(mPl[1])); } catch(e2) {}
    }
  }

  console.log('doGet acao=[' + acao + '] callback=[' + nomeCallback + ']');
  return roteador(acao, dados, nomeCallback);
}

function doPost(e) {
  var dados = {};
  if (e.postData && e.postData.contents) {
    try { dados = JSON.parse(e.postData.contents); } catch(err) {}
  }
  var acao         = dados.action || (e.parameter && e.parameter.action) || '';
  var nomeCallback = (e.parameter && e.parameter.callback) || null;
  return roteador(acao, dados, nomeCallback);
}

function roteador(acao, dados, nomeCallback) {
  try {

    // ── GET_MATCHES ──────────────────────────────────────────
    if (acao === 'GET_MATCHES') {
      return montarResposta({ success: true, matches: lerAba('Matches') }, nomeCallback);
    }

    // ── GET_SETTINGS ─────────────────────────────────────────
    if (acao === 'GET_SETTINGS') {
      var linhas   = lerAba('Settings');
      var settings = {};
      for (var i = 0; i < linhas.length; i++) {
        var chave = String(linhas[i].key || '').trim();
        if (chave) settings[chave] = linhas[i].value;
      }
      return montarResposta({ success: true, settings: settings }, nomeCallback);
    }

    // ── GET_ALL_PREDICTIONS ───────────────────────────────────
    if (acao === 'GET_ALL_PREDICTIONS') {
      var lista = lerAba('Predictions');
      for (var i = 0; i < lista.length; i++) {
        lista[i].goalsA = Number(lista[i].goalsA);
        lista[i].goalsB = Number(lista[i].goalsB);
      }
      return montarResposta({ success: true, predictions: lista }, nomeCallback);
    }

    // ── CHECK_DUPLICATES ──────────────────────────────────────
    if (acao === 'CHECK_DUPLICATES') {
      var todos  = lerAba('Predictions');
      var total  = 0;
      for (var i = 0; i < todos.length; i++) {
        if (String(todos[i].matchId) === String(dados.matchId) &&
            Number(todos[i].goalsA)  === Number(dados.goalsA)  &&
            Number(todos[i].goalsB)  === Number(dados.goalsB)) { total++; }
      }
      return montarResposta({ success: true, count: total }, nomeCallback);
    }

    // ── GET_STATS ─────────────────────────────────────────────
    if (acao === 'GET_STATS') {
      var preds  = lerAba('Predictions');
      var grupos = {};
      for (var i = 0; i < preds.length; i++) {
        if (String(preds[i].matchId) === String(dados.matchId)) {
          var chavePlacar = preds[i].goalsA + '-' + preds[i].goalsB;
          if (!grupos[chavePlacar]) grupos[chavePlacar] = { goalsA: Number(preds[i].goalsA), goalsB: Number(preds[i].goalsB), count: 0 };
          grupos[chavePlacar].count++;
        }
      }
      var listaStats = [];
      var keysStats  = Object.keys(grupos);
      for (var k = 0; k < keysStats.length; k++) listaStats.push(grupos[keysStats[k]]);
      listaStats.sort(function(a, b) { return b.count - a.count; });
      return montarResposta({ success: true, stats: listaStats.slice(0, 3) }, nomeCallback);
    }

    // ── SUBMIT_PREDICTION ─────────────────────────────────────
    if (acao === 'SUBMIT_PREDICTION') {
      var trava1 = LockService.getScriptLock();
      trava1.waitLock(15000);
      try {
        var ss1  = SpreadsheetApp.getActiveSpreadsheet();
        var aba1 = ss1.getSheetByName('Predictions');
        if (!aba1) return montarResposta({ success: false, error: 'Aba Predictions nao encontrada' }, nomeCallback);
        var p = dados.prediction;
        if (!p || !p.matchId || !p.name) return montarResposta({ success: false, error: 'Dados incompletos' }, nomeCallback);
        var jogos = lerAba('Matches');
        var jogo  = {};
        for (var i = 0; i < jogos.length; i++) {
          if (String(jogos[i].id) === String(p.matchId)) { jogo = jogos[i]; break; }
        }
        var novoId   = new Date().getTime();
        var criadoEm = Utilities.formatDate(new Date(), 'America/Sao_Paulo', 'dd/MM/yyyy HH:mm:ss');
        aba1.appendRow([
          novoId, String(p.matchId), String(p.name), String(p.whatsapp),
          Number(p.goalsA), Number(p.goalsB), 'PENDENTE', criadoEm,
          String(jogo.teamA || ''), String(jogo.teamB || '')
        ]);
        var ultima = aba1.getLastRow();
        aba1.getRange(ultima, 5, 1, 2).setNumberFormat('0');
        aba1.getRange(ultima, 7).setFontColor('#FF8C00').setFontWeight('bold');
        return montarResposta({ success: true, predictionId: novoId }, nomeCallback);
      } finally {
        trava1.releaseLock();
      }
    }

    // ── CONFIRM_PAYMENT ───────────────────────────────────────
    if (acao === 'CONFIRM_PAYMENT') {
      var trava2 = LockService.getScriptLock();
      trava2.waitLock(15000);
      try {
        var aba2    = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('Predictions');
        var linhas2 = aba2.getDataRange().getValues();
        var pred2   = null;
        var idx2    = -1;
        for (var i = 1; i < linhas2.length; i++) {
          if (String(linhas2[i][0]) === String(dados.id)) {
            idx2  = i + 1;
            pred2 = {
              name: linhas2[i][2], whatsapp: linhas2[i][3],
              goalsA: linhas2[i][4], goalsB: linhas2[i][5],
              teamA: linhas2[i][8] || '', teamB: linhas2[i][9] || ''
            };
            break;
          }
        }
        if (!pred2) return montarResposta({ success: false, error: 'Palpite nao encontrado' }, nomeCallback);
        aba2.getRange(idx2, 7).setValue('PAGO').setFontColor('#006400').setFontWeight('bold');
        aba2.getRange(idx2, 7).setBackground('#E8F5E9');
        var msg2    = 'Olá ' + pred2.name + '! ✅ Pagamento CONFIRMADO! Palpite: ' + pred2.teamA + ' ' + pred2.goalsA + ' x ' + pred2.goalsB + ' ' + pred2.teamB + '. Boa sorte!';
        var fone2   = String(pred2.whatsapp).replace(/\D/g, '');
        var waLink2 = 'https://api.whatsapp.com/send?phone=55' + fone2 + '&text=' + encodeURIComponent(msg2);
        return montarResposta({ success: true, waLink: waLink2 }, nomeCallback);
      } finally {
        trava2.releaseLock();
      }
    }

    // ── BULK_CONFIRM ──────────────────────────────────────────
    if (acao === 'BULK_CONFIRM') {
      var trava3 = LockService.getScriptLock();
      trava3.waitLock(15000);
      try {
        var aba3      = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('Predictions');
        var linhas3   = aba3.getDataRange().getValues();
        var confirmed = 0;
        var waLinks   = [];
        for (var i = 1; i < linhas3.length; i++) {
          if (String(linhas3[i][1]) === String(dados.matchId) && String(linhas3[i][6]) !== 'PAGO') {
            aba3.getRange(i + 1, 7).setValue('PAGO').setFontColor('#006400').setFontWeight('bold');
            aba3.getRange(i + 1, 7).setBackground('#E8F5E9');
            var fone3 = String(linhas3[i][3]).replace(/\D/g, '');
            var msg3  = 'Olá ' + linhas3[i][2] + '! ✅ Pagamento CONFIRMADO no Bolão Copa 2026. Boa sorte!';
            waLinks.push('https://api.whatsapp.com/send?phone=55' + fone3 + '&text=' + encodeURIComponent(msg3));
            confirmed++;
          }
        }
        return montarResposta({ success: true, confirmed: confirmed, waLinks: waLinks }, nomeCallback);
      } finally {
        trava3.releaseLock();
      }
    }

    // ── SAVE_MATCH ────────────────────────────────────────────
    if (acao === 'SAVE_MATCH') {
      var trava4 = LockService.getScriptLock();
      trava4.waitLock(15000);
      try {
        var aba4 = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('Matches');
        if (!aba4) return montarResposta({ success: false, error: 'Aba Matches nao encontrada' }, nomeCallback);
        var m = dados.match;
        if (!m || !m.id) return montarResposta({ success: false, error: 'Dados incompletos' }, nomeCallback);
        var linhas4   = aba4.getDataRange().getValues();
        var idxLinha4 = -1;
        for (var i = 1; i < linhas4.length; i++) {
          if (String(linhas4[i][0]) === String(m.id)) { idxLinha4 = i + 1; break; }
        }
        var gA4   = (m.resultGoalsA !== undefined && m.resultGoalsA !== null && m.resultGoalsA !== '') ? Number(m.resultGoalsA) : '';
        var gB4   = (m.resultGoalsB !== undefined && m.resultGoalsB !== null && m.resultGoalsB !== '') ? Number(m.resultGoalsB) : '';
        var linha4 = [
          String(m.id), String(m.teamA||''), String(m.teamAFlag||''),
          String(m.teamB||''), String(m.teamBFlag||''), String(m.date||''),
          String(m.time||''), String(m.stadium||''), String(m.round||''),
          gA4, gB4, String(m.status||'PENDING')
        ];
        if (idxLinha4 > 0) {
          aba4.getRange(idxLinha4, 1, 1, 12).setValues([linha4]);
        } else {
          aba4.appendRow(linha4);
        }
        return montarResposta({ success: true }, nomeCallback);
      } finally {
        trava4.releaseLock();
      }
    }

    // ── DELETE_MATCH ──────────────────────────────────────────
    if (acao === 'DELETE_MATCH') {
      var trava5 = LockService.getScriptLock();
      trava5.waitLock(15000);
      try {
        var aba5    = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('Matches');
        var linhas5 = aba5.getDataRange().getValues();
        for (var i = 1; i < linhas5.length; i++) {
          if (String(linhas5[i][0]) === String(dados.id)) { aba5.deleteRow(i + 1); break; }
        }
        return montarResposta({ success: true }, nomeCallback);
      } finally {
        trava5.releaseLock();
      }
    }

    // ── SAVE_SETTINGS ─────────────────────────────────────────
    if (acao === 'SAVE_SETTINGS') {
      var trava6 = LockService.getScriptLock();
      trava6.waitLock(15000);
      try {
        var aba6 = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('Settings');
        if (!aba6) return montarResposta({ success: false, error: 'Aba Settings nao encontrada' }, nomeCallback);
        var configs6 = dados.settings;
        if (!configs6) return montarResposta({ success: false, error: 'settings ausente' }, nomeCallback);
        var linhasAtuais6 = aba6.getDataRange().getValues();
        var chaves6       = Object.keys(configs6);
        for (var c = 0; c < chaves6.length; c++) {
          var chave6    = chaves6[c];
          var valor6    = configs6[chave6];
          var encontrou = false;
          for (var i = 1; i < linhasAtuais6.length; i++) {
            if (String(linhasAtuais6[i][0]).trim() === String(chave6).trim()) {
              aba6.getRange(i + 1, 2).setValue(valor6);
              linhasAtuais6[i][1] = valor6;
              encontrou = true;
              break;
            }
          }
          if (!encontrou) {
            aba6.appendRow([chave6, valor6]);
            linhasAtuais6.push([chave6, valor6]);
          }
        }
        return montarResposta({ success: true }, nomeCallback);
      } finally {
        trava6.releaseLock();
      }
    }

    // ── Ação desconhecida ─────────────────────────────────────
    return montarResposta({
      success: false,
      error: 'Acao desconhecida: [' + acao + ']'
    }, nomeCallback);

  } catch (erro) {
    return montarResposta({ success: false, error: erro.toString() }, nomeCallback);
  }
}

// Utilitário: corrigir cabeçalhos das abas
function corrigirCabecalhos() {
  var ss   = SpreadsheetApp.getActiveSpreadsheet();
  var abas = ['Predictions','Matches','Settings'];
  var rel  = '';
  for (var a = 0; a < abas.length; a++) {
    var aba = ss.getSheetByName(abas[a]);
    if (!aba) { rel += abas[a] + ': nao encontrada\n'; continue; }
    var cab = aba.getRange(1, 1, 1, aba.getLastColumn()).getValues()[0];
    var cor = [];
    for (var c = 0; c < cab.length; c++) cor.push(String(cab[c]).trim());
    aba.getRange(1, 1, 1, cor.length).setValues([cor]);
    rel += '✅ ' + abas[a] + ': ' + cor.join(' | ') + '\n';
  }
  SpreadsheetApp.getUi().alert('Cabeçalhos corrigidos!\n\n' + rel);
}

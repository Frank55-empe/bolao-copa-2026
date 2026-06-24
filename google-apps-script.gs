/**
 * BOLÃO BRASIL 2026 — GOOGLE APPS SCRIPT
 * Apague tudo no editor e cole este arquivo inteiro.
 * Depois: Implantar > Nova implantação > App da Web > Qualquer pessoa.
 */

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
  var acao         = e.parameter.action   || '';
  var nomeCallback = e.parameter.callback || null;
  var dados        = {};
  if (e.parameter.payload) {
    try { dados = JSON.parse(e.parameter.payload); }
    catch (err) { return montarResposta({ success: false, error: 'Payload invalido' }, nomeCallback); }
  }
  return roteador(acao, dados, nomeCallback);
}

function doPost(e) {
  var dados = {};
  if (e.postData && e.postData.contents) {
    try { dados = JSON.parse(e.postData.contents); } catch(err) {}
  }
  var acao         = dados.action || e.parameter.action || '';
  var nomeCallback = e.parameter.callback || null;
  return roteador(acao, dados, nomeCallback);
}

function roteador(acao, dados, nomeCallback) {
  try {

    if (acao === 'GET_MATCHES') {
      return montarResposta({ success: true, matches: lerAba('Matches') }, nomeCallback);
    }

    if (acao === 'GET_SETTINGS') {
      var linhas   = lerAba('Settings');
      var settings = {};
      for (var i = 0; i < linhas.length; i++) {
        var chave = String(linhas[i].key || '').trim();
        if (chave) settings[chave] = linhas[i].value;
      }
      return montarResposta({ success: true, settings: settings }, nomeCallback);
    }

    if (acao === 'GET_ALL_PREDICTIONS') {
      var lista = lerAba('Predictions');
      for (var i = 0; i < lista.length; i++) {
        lista[i].goalsA = Number(lista[i].goalsA);
        lista[i].goalsB = Number(lista[i].goalsB);
      }
      return montarResposta({ success: true, predictions: lista }, nomeCallback);
    }

    if (acao === 'CHECK_DUPLICATES') {
      var todos = lerAba('Predictions');
      var total = 0;
      for (var i = 0; i < todos.length; i++) {
        if (String(todos[i].matchId) === String(dados.matchId) &&
            Number(todos[i].goalsA)  === Number(dados.goalsA)  &&
            Number(todos[i].goalsB)  === Number(dados.goalsB)) { total++; }
      }
      return montarResposta({ success: true, count: total }, nomeCallback);
    }

    if (acao === 'GET_STATS') {
      var preds  = lerAba('Predictions');
      var grupos = {};
      for (var i = 0; i < preds.length; i++) {
        if (String(preds[i].matchId) === String(dados.matchId)) {
          var ch = preds[i].goalsA + '-' + preds[i].goalsB;
          if (!grupos[ch]) grupos[ch] = { goalsA: Number(preds[i].goalsA), goalsB: Number(preds[i].goalsB), count: 0 };
          grupos[ch].count++;
        }
      }
      var lista = [];
      var keys  = Object.keys(grupos);
      for (var k = 0; k < keys.length; k++) lista.push(grupos[keys[k]]);
      lista.sort(function(a, b) { return b.count - a.count; });
      return montarResposta({ success: true, stats: lista.slice(0, 3) }, nomeCallback);
    }

    if (acao === 'SUBMIT_PREDICTION') {
      var trava = LockService.getScriptLock();
      trava.waitLock(15000);
      try {
        var ss  = SpreadsheetApp.getActiveSpreadsheet();
        var aba = ss.getSheetByName('Predictions');
        if (!aba) { trava.releaseLock(); return montarResposta({ success: false, error: 'Aba Predictions nao encontrada' }, nomeCallback); }

        var p = dados.prediction;
        if (!p || !p.matchId || !p.name) { trava.releaseLock(); return montarResposta({ success: false, error: 'Dados incompletos' }, nomeCallback); }

        var jogos = lerAba('Matches');
        var jogo  = {};
        for (var i = 0; i < jogos.length; i++) {
          if (String(jogos[i].id) === String(p.matchId)) { jogo = jogos[i]; break; }
        }

        var novoId   = new Date().getTime();
        var criadoEm = Utilities.formatDate(new Date(), 'America/Sao_Paulo', 'dd/MM/yyyy HH:mm:ss');

        aba.appendRow([
          novoId,
          String(p.matchId),
          String(p.name),
          String(p.whatsapp),
          Number(p.goalsA),
          Number(p.goalsB),
          'PENDENTE',
          criadoEm,
          String(jogo.teamA || ''),
          String(jogo.teamB || '')
        ]);

        var ultima = aba.getLastRow();
        aba.getRange(ultima, 5, 1, 2).setNumberFormat('0');
        aba.getRange(ultima, 7).setFontColor('#FF8C00').setFontWeight('bold');

        return montarResposta({ success: true, predictionId: novoId }, nomeCallback);
      } finally {
        trava.releaseLock();
      }
    }

    if (acao === 'CONFIRM_PAYMENT') {
      var trava = LockService.getScriptLock();
      trava.waitLock(15000);
      try {
        var aba    = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('Predictions');
        var linhas = aba.getDataRange().getValues();
        var pred   = null;
        var idx    = -1;
        for (var i = 1; i < linhas.length; i++) {
          if (String(linhas[i][0]) === String(dados.id)) {
            idx  = i + 1;
            pred = {
              name:     linhas[i][2],
              whatsapp: linhas[i][3],
              goalsA:   linhas[i][4],
              goalsB:   linhas[i][5],
              teamA:    linhas[i][8] || '',
              teamB:    linhas[i][9] || ''
            };
            break;
          }
        }
        if (!pred) return montarResposta({ success: false, error: 'Palpite nao encontrado' }, nomeCallback);

        aba.getRange(idx, 7).setValue('PAGO');
        aba.getRange(idx, 7).setFontColor('#006400');
        aba.getRange(idx, 7).setFontWeight('bold');
        aba.getRange(idx, 7).setBackground('#E8F5E9');

        var msg    = 'Ola ' + pred.name + '! Pagamento CONFIRMADO! Palpite: ' + pred.teamA + ' ' + pred.goalsA + ' x ' + pred.goalsB + ' ' + pred.teamB + '. Boa sorte!';
        var fone   = String(pred.whatsapp).replace(/\D/g, '');
        var waLink = 'https://api.whatsapp.com/send?phone=55' + fone + '&text=' + encodeURIComponent(msg);
        return montarResposta({ success: true, waLink: waLink }, nomeCallback);
      } finally {
        trava.releaseLock();
      }
    }

    if (acao === 'SAVE_MATCH') {
      var trava = LockService.getScriptLock();
      trava.waitLock(15000);
      try {
        var aba = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('Matches');
        if (!aba) return montarResposta({ success: false, error: 'Aba Matches nao encontrada' }, nomeCallback);

        var m = dados.match;
        if (!m || !m.id) return montarResposta({ success: false, error: 'Dados incompletos' }, nomeCallback);

        var linhas   = aba.getDataRange().getValues();
        var idxLinha = -1;
        for (var i = 1; i < linhas.length; i++) {
          if (String(linhas[i][0]) === String(m.id)) { idxLinha = i + 1; break; }
        }

        var gA    = (m.resultGoalsA !== undefined && m.resultGoalsA !== null && m.resultGoalsA !== '') ? Number(m.resultGoalsA) : '';
        var gB    = (m.resultGoalsB !== undefined && m.resultGoalsB !== null && m.resultGoalsB !== '') ? Number(m.resultGoalsB) : '';
        var linha = [
          String(m.id), String(m.teamA||''), String(m.teamAFlag||''),
          String(m.teamB||''), String(m.teamBFlag||''), String(m.date||''),
          String(m.time||''), String(m.stadium||''), String(m.round||''),
          gA, gB, String(m.status||'PENDING')
        ];

        if (idxLinha > 0) { aba.getRange(idxLinha, 1, 1, 12).setValues([linha]); }
        else { aba.appendRow(linha); }

        return montarResposta({ success: true }, nomeCallback);
      } finally {
        trava.releaseLock();
      }
    }

    if (acao === 'DELETE_MATCH') {
      var trava = LockService.getScriptLock();
      trava.waitLock(15000);
      try {
        var aba    = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('Matches');
        var linhas = aba.getDataRange().getValues();
        for (var i = 1; i < linhas.length; i++) {
          if (String(linhas[i][0]) === String(dados.id)) { aba.deleteRow(i + 1); break; }
        }
        return montarResposta({ success: true }, nomeCallback);
      } finally {
        trava.releaseLock();
      }
    }

    if (acao === 'SAVE_SETTINGS') {
      var trava = LockService.getScriptLock();
      trava.waitLock(15000);
      try {
        var aba = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('Settings');
        if (!aba) return montarResposta({ success: false, error: 'Aba Settings nao encontrada' }, nomeCallback);

        var configs = dados.settings;
        if (!configs) return montarResposta({ success: false, error: 'settings ausente' }, nomeCallback);

        var linhasAtuais = aba.getDataRange().getValues();
        var chaves       = Object.keys(configs);
        for (var c = 0; c < chaves.length; c++) {
          var chave     = chaves[c];
          var valor     = configs[chave];
          var encontrou = false;
          for (var i = 1; i < linhasAtuais.length; i++) {
            if (String(linhasAtuais[i][0]).trim() === String(chave).trim()) {
              aba.getRange(i + 1, 2).setValue(valor);
              linhasAtuais[i][1] = valor;
              encontrou = true;
              break;
            }
          }
          if (!encontrou) { aba.appendRow([chave, valor]); linhasAtuais.push([chave, valor]); }
        }
        return montarResposta({ success: true }, nomeCallback);
      } finally {
        trava.releaseLock();
      }
    }

    return montarResposta({ success: false, error: 'Acao desconhecida: ' + acao }, nomeCallback);

  } catch (erro) {
    return montarResposta({ success: false, error: erro.toString() }, nomeCallback);
  }
}

function corrigirCabecalhos() {
  var ss   = SpreadsheetApp.getActiveSpreadsheet();
  var abas = ['Predictions', 'Matches', 'Settings'];
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

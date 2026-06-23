/**
 * BOLÃO COPA 2026 — GOOGLE APPS SCRIPT
 *
 * INSTRUÇÕES:
 * 1. Abra sua planilha > Extensões > Apps Script
 * 2. Apague TUDO e cole este arquivo inteiro
 * 3. Salve (Ctrl+S)
 * 4. Executar > criarEstruturaPlanilha  (cria as abas automaticamente)
 * 5. Implantar > Nova implantação > App da Web
 *    - Executar como: Eu
 *    - Quem acessa: Qualquer pessoa
 * 6. Copie a URL e cole em src/services/api.ts na constante SHEETS_API_URL
 */

// ─── Resposta JSON ou JSONP ──────────────────────────────────────────────────
function resp(obj, cb) {
  var json = JSON.stringify(obj);
  if (cb) {
    var o = ContentService.createTextOutput(cb + '(' + json + ');');
    o.setMimeType(ContentService.MimeType.JAVASCRIPT);
    return o;
  }
  var o = ContentService.createTextOutput(json);
  o.setMimeType(ContentService.MimeType.JSON);
  return o;
}

// ─── Lê aba e retorna array de objetos ──────────────────────────────────────
function lerAba(nome) {
  var ss  = SpreadsheetApp.getActiveSpreadsheet();
  var aba = ss.getSheetByName(nome);
  if (!aba) return [];
  var vals = aba.getDataRange().getValues();
  if (vals.length < 2) return [];
  var head = vals[0].map(function(h) { return String(h).trim(); });
  var rows = [];
  for (var i = 1; i < vals.length; i++) {
    var row = vals[i];
    var empty = row.every(function(c) { return c === '' || c === null; });
    if (empty) continue;
    var obj = {};
    for (var j = 0; j < head.length; j++) {
      obj[head[j]] = row[j];
    }
    rows.push(obj);
  }
  return rows;
}

// ─── Entry point GET (app usa JSONP) ────────────────────────────────────────
function doGet(e) {
  var acao = e.parameter.action   || '';
  var cb   = e.parameter.callback || null;
  var data = {};
  if (e.parameter.payload) {
    try { data = JSON.parse(e.parameter.payload); } catch(err) {}
  }
  return handle(acao, data, cb);
}

// ─── Entry point POST (compatibilidade) ─────────────────────────────────────
function doPost(e) {
  var data = {};
  try { data = JSON.parse(e.postData.contents); } catch(err) {}
  var acao = data.action || e.parameter.action || '';
  var cb   = e.parameter.callback || null;
  return handle(acao, data, cb);
}

// ─── Roteador ────────────────────────────────────────────────────────────────
function handle(acao, data, cb) {
  try {
    var ss = SpreadsheetApp.getActiveSpreadsheet();

    // ── LEITURAS ────────────────────────────────────────────────────────────

    if (acao === 'GET_MATCHES') {
      return resp({ success: true, matches: lerAba('Matches') }, cb);
    }

    if (acao === 'GET_SETTINGS') {
      var rows = lerAba('Settings');
      var cfg  = {};
      for (var i = 0; i < rows.length; i++) {
        var k = String(rows[i].key   || '').trim();
        var v = String(rows[i].value || '').trim();
        if (k) cfg[k] = v;
      }
      return resp({ success: true, settings: cfg }, cb);
    }

    if (acao === 'GET_ALL_PREDICTIONS') {
      var preds = lerAba('Predictions');
      for (var i = 0; i < preds.length; i++) {
        preds[i].goalsA = Number(preds[i].goalsA);
        preds[i].goalsB = Number(preds[i].goalsB);
      }
      return resp({ success: true, predictions: preds }, cb);
    }

    if (acao === 'CHECK_DUPLICATES') {
      var all = lerAba('Predictions');
      var cnt = 0;
      for (var i = 0; i < all.length; i++) {
        if (String(all[i].matchId).trim() === String(data.matchId).trim() &&
            Number(all[i].goalsA) === Number(data.goalsA) &&
            Number(all[i].goalsB) === Number(data.goalsB)) cnt++;
      }
      return resp({ success: true, count: cnt }, cb);
    }

    if (acao === 'GET_STATS') {
      var preds = lerAba('Predictions');
      var g = {};
      for (var i = 0; i < preds.length; i++) {
        if (String(preds[i].matchId).trim() === String(data.matchId).trim()) {
          var key = preds[i].goalsA + '-' + preds[i].goalsB;
          if (!g[key]) g[key] = { goalsA: Number(preds[i].goalsA), goalsB: Number(preds[i].goalsB), count: 0 };
          g[key].count++;
        }
      }
      var arr = Object.keys(g).map(function(k) { return g[k]; });
      arr.sort(function(a, b) { return b.count - a.count; });
      return resp({ success: true, stats: arr.slice(0, 3) }, cb);
    }

    // ── GRAVAÇÕES ───────────────────────────────────────────────────────────

    if (acao === 'SUBMIT_PREDICTION') {
      var aba = ss.getSheetByName('Predictions');
      if (!aba) return resp({ success: false, error: 'Aba Predictions nao encontrada' }, cb);

      var p = data.prediction;
      if (!p || !p.matchId || !p.name) return resp({ success: false, error: 'Dados incompletos' }, cb);

      // Busca nome dos times na aba Matches
      var jogos = lerAba('Matches');
      var jogo  = {};
      for (var i = 0; i < jogos.length; i++) {
        if (String(jogos[i].id).trim() === String(p.matchId).trim()) { jogo = jogos[i]; break; }
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
        'PENDING',
        criadoEm,
        String(jogo.teamA || ''),
        String(jogo.teamB || '')
      ]);

      return resp({ success: true, predictionId: novoId }, cb);
    }

    if (acao === 'CONFIRM_PAYMENT') {
      var aba    = ss.getSheetByName('Predictions');
      var vals   = aba.getDataRange().getValues();
      var pred   = null;
      var rowIdx = -1;

      for (var i = 1; i < vals.length; i++) {
        if (String(vals[i][0]) === String(data.id)) {
          rowIdx = i + 1;
          pred   = { name: vals[i][2], whatsapp: vals[i][3],
                     goalsA: vals[i][4], goalsB: vals[i][5],
                     teamA: vals[i][8] || '', teamB: vals[i][9] || '' };
          break;
        }
      }

      if (!pred) return resp({ success: false, error: 'Palpite nao encontrado' }, cb);

      aba.getRange(rowIdx, 7).setValue('PAID');
      aba.getRange(rowIdx, 7).setFontColor('#006400').setFontWeight('bold');
      aba.getRange(rowIdx, 7).setBackground('#E8F5E9');

      var msg    = 'Ola ' + pred.name + '! Pagamento CONFIRMADO! Palpite: ' +
                   pred.teamA + ' ' + pred.goalsA + ' x ' + pred.goalsB + ' ' + pred.teamB + '. Boa sorte!';
      var fone   = String(pred.whatsapp).replace(/\D/g, '');
      var waLink = 'https://api.whatsapp.com/send?phone=55' + fone + '&text=' + encodeURIComponent(msg);

      return resp({ success: true, waLink: waLink }, cb);
    }

    if (acao === 'SAVE_MATCH') {
      var aba = ss.getSheetByName('Matches');
      if (!aba) return resp({ success: false, error: 'Aba Matches nao encontrada' }, cb);

      var m = data.match;
      if (!m || !m.id) return resp({ success: false, error: 'Dados do jogo incompletos' }, cb);

      var vals   = aba.getDataRange().getValues();
      var rowIdx = -1;
      for (var i = 1; i < vals.length; i++) {
        if (String(vals[i][0]).trim() === String(m.id).trim()) { rowIdx = i + 1; break; }
      }

      var gA = (m.resultGoalsA !== undefined && m.resultGoalsA !== null && m.resultGoalsA !== '') ? Number(m.resultGoalsA) : '';
      var gB = (m.resultGoalsB !== undefined && m.resultGoalsB !== null && m.resultGoalsB !== '') ? Number(m.resultGoalsB) : '';

      var linha = [
        String(m.id), String(m.teamA||''), String(m.teamAFlag||''),
        String(m.teamB||''), String(m.teamBFlag||''), String(m.date||''),
        String(m.time||''), String(m.stadium||''), String(m.round||''),
        gA, gB, String(m.status||'PENDING')
      ];

      if (rowIdx > 0) {
        aba.getRange(rowIdx, 1, 1, 12).setValues([linha]);
      } else {
        aba.appendRow(linha);
      }

      return resp({ success: true }, cb);
    }

    if (acao === 'DELETE_MATCH') {
      var aba  = ss.getSheetByName('Matches');
      var vals = aba.getDataRange().getValues();
      for (var i = 1; i < vals.length; i++) {
        if (String(vals[i][0]).trim() === String(data.id).trim()) { aba.deleteRow(i + 1); break; }
      }
      return resp({ success: true }, cb);
    }

    if (acao === 'SAVE_SETTINGS') {
      var aba  = ss.getSheetByName('Settings');
      if (!aba) return resp({ success: false, error: 'Aba Settings nao encontrada' }, cb);

      var cfg  = data.settings;
      if (!cfg) return resp({ success: false, error: 'settings ausente' }, cb);

      var vals  = aba.getDataRange().getValues();
      var chaves = Object.keys(cfg);

      for (var c = 0; c < chaves.length; c++) {
        var chave = chaves[c];
        var valor = cfg[chave];
        var found = false;
        for (var i = 1; i < vals.length; i++) {
          if (String(vals[i][0]).trim() === String(chave).trim()) {
            aba.getRange(i + 1, 2).setValue(valor);
            vals[i][1] = valor;
            found = true;
            break;
          }
        }
        if (!found) {
          aba.appendRow([chave, valor]);
          vals.push([chave, valor]);
        }
      }

      return resp({ success: true }, cb);
    }

    return resp({ success: false, error: 'Acao desconhecida: ' + acao }, cb);

  } catch (erro) {
    return resp({ success: false, error: erro.toString() }, cb);
  }
}

// ─── Cria estrutura da planilha automaticamente ──────────────────────────────
function criarEstruturaPlanilha() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();

  // Predictions
  var p = ss.getSheetByName('Predictions') || ss.insertSheet('Predictions');
  if (p.getLastRow() === 0) {
    p.appendRow(['id','matchId','name','whatsapp','goalsA','goalsB','statusPix','createdAt','teamA','teamB']);
  }
  p.getRange('1:1').setFontWeight('bold').setBackground('#1a5276').setFontColor('#fff');
  p.setFrozenRows(1);

  // Matches
  var m = ss.getSheetByName('Matches') || ss.insertSheet('Matches');
  if (m.getLastRow() === 0) {
    m.appendRow(['id','teamA','teamAFlag','teamB','teamBFlag','date','time','stadium','round','resultGoalsA','resultGoalsB','status']);
  }
  m.getRange('1:1').setFontWeight('bold').setBackground('#1a5276').setFontColor('#fff');
  m.setFrozenRows(1);

  // Settings
  var s = ss.getSheetByName('Settings') || ss.insertSheet('Settings');
  if (s.getLastRow() === 0) {
    s.getRange(1,1,9,2).setValues([
      ['key','value'],
      ['pix_value','30.00'],
      ['pix_key','COLE_SUA_CHAVE_PIX_AQUI'],
      ['active_match_id',''],
      ['admin_phone','35991717912'],
      ['accumulated_amount','0.00'],
      ['predictions_locked','false'],
      ['regulamento','1. Cada palpite custa o valor definido.\n2. Palpite valido apos confirmacao do PIX.\n3. Premio: 80% do arrecadado.\n4. Limite: 5 palpites iguais por jogo.\n5. Prazo: ate 10 min antes do jogo.\n6. Premio dividido entre acertadores.\n7. Sem acertadores, acumula para proxima rodada.'],
    ]);
  }
  s.getRange('1:1').setFontWeight('bold').setBackground('#1a5276').setFontColor('#fff');
  s.setFrozenRows(1);

  // Remove aba padrão
  var pad = ss.getSheetByName('Plan1') || ss.getSheetByName('Sheet1');
  if (pad && ss.getSheets().length > 1) ss.deleteSheet(pad);

  SpreadsheetApp.getUi().alert(
    '✅ Estrutura criada!\n\n' +
    'Abas: Predictions | Matches | Settings\n\n' +
    'Agora:\n' +
    '1. Edite "pix_key" na aba Settings com sua chave real\n' +
    '2. Implantar > Nova implantação > App da Web\n' +
    '3. Cole a URL no api.ts'
  );
}

// ─── Corrige espaços nos cabeçalhos (rode se tiver problemas) ───────────────
function corrigirCabecalhos() {
  var ss   = SpreadsheetApp.getActiveSpreadsheet();
  var abas = ['Predictions','Matches','Settings'];
  var rel  = '';
  for (var a = 0; a < abas.length; a++) {
    var aba = ss.getSheetByName(abas[a]);
    if (!aba) { rel += abas[a] + ': nao encontrada\n'; continue; }
    var cab = aba.getRange(1,1,1,aba.getLastColumn()).getValues()[0];
    var cor = cab.map(function(c) { return String(c).trim(); });
    aba.getRange(1,1,1,cor.length).setValues([cor]);
    rel += '✅ ' + abas[a] + ': ' + cor.join(' | ') + '\n';
  }
  SpreadsheetApp.getUi().alert('Cabeçalhos corrigidos!\n\n' + rel);
}

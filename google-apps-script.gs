**
 * ╔══════════════════════════════════════════════════════════════════╗
 * ║         BOLÃO COPA 2026 — GOOGLE APPS SCRIPT v6.0              ║
 * ╚══════════════════════════════════════════════════════════════════╝
 *
 * INSTALAÇÃO (passo a passo):
 * 1. Abra sua planilha Google Sheets
 * 2. Menu: Extensões > Apps Script
 * 3. Apague TUDO e cole este arquivo inteiro
 * 4. Salve (Ctrl+S)
 * 5. Execute: criarEstruturaPlanilha()  → autorize quando pedir
 * 6. Menu: Implantar > Nova implantação
 *    - Tipo: App da Web
 *    - Executar como: EU (sua conta Google)
 *    - Quem acessa: Qualquer pessoa (anônimo)
 *    - Clique em Implantar e copie a URL
 * 7. Cole a URL em src/services/api.ts na constante SHEETS_API_URL
 *
 * ATENÇÃO: Sempre que modificar o script, faça uma NOVA implantação
 * (não edite a existente) para garantir que o cache seja atualizado.
 */

// ═══════════════════════════════════════════════════════════════════
// UTILITÁRIOS
// ═══════════════════════════════════════════════════════════════════

function jsonResp(obj, cb) {
  var json = JSON.stringify(obj);
  if (cb) {
    var out = ContentService.createTextOutput(cb + '(' + json + ');');
    out.setMimeType(ContentService.MimeType.JAVASCRIPT);
    return out;
  }
  var out = ContentService.createTextOutput(json);
  out.setMimeType(ContentService.MimeType.JSON);
  return out;
}

function getSheet(name) {
  return SpreadsheetApp.getActiveSpreadsheet().getSheetByName(name);
}

// Lê uma aba e retorna array de objetos {coluna: valor}
function readSheet(name) {
  var sheet = getSheet(name);
  if (!sheet) return [];
  var data = sheet.getDataRange().getValues();
  if (data.length < 2) return [];
  var headers = data[0].map(function(h) { return String(h).trim(); });
  var rows = [];
  for (var i = 1; i < data.length; i++) {
    var row = data[i];
    var allEmpty = row.every(function(c) { return c === '' || c === null || c === undefined; });
    if (allEmpty) continue;
    var obj = {};
    for (var j = 0; j < headers.length; j++) {
      obj[headers[j]] = row[j];
    }
    rows.push(obj);
  }
  return rows;
}

// ═══════════════════════════════════════════════════════════════════
// ENTRY POINTS
// ═══════════════════════════════════════════════════════════════════

function doGet(e) {
  var action  = e.parameter.action   || '';
  var cb      = e.parameter.callback || null;
  var payload = {};
  if (e.parameter.payload) {
    try { payload = JSON.parse(e.parameter.payload); } catch(err) {}
  }
  return route(action, payload, cb);
}

function doPost(e) {
  var payload = {};
  try { payload = JSON.parse(e.postData.contents); } catch(err) {}
  var action = payload.action || e.parameter.action || '';
  var cb     = e.parameter.callback || null;
  return route(action, payload, cb);
}

// ═══════════════════════════════════════════════════════════════════
// ROTEADOR
// ═══════════════════════════════════════════════════════════════════

function route(action, data, cb) {
  try {

    // ── GET_MATCHES ──────────────────────────────────────────────
    if (action === 'GET_MATCHES') {
  var rows = readSheet('Matches');
  var matches = rows.map(function(r) {
    // Cells formatadas como Data/Hora chegam como objetos Date — formatar explicitamente
    var dateVal = r.date;
    var timeVal = r.time;

    if (dateVal instanceof Date) {
      dateVal = Utilities.formatDate(dateVal, 'America/Sao_Paulo', 'dd/MM/yyyy');
    } else {
      dateVal = String(dateVal || '').trim();
    }

    if (timeVal instanceof Date) {
      timeVal = Utilities.formatDate(timeVal, 'America/Sao_Paulo', 'HH:mm');
    } else {
      timeVal = String(timeVal || '').trim();
    }

    return {
      id:           String(r.id          || '').trim(),
      teamA:        String(r.teamA       || '').trim(),
      teamAFlag:    String(r.teamAFlag   || '').trim(),
      teamB:        String(r.teamB       || '').trim(),
      teamBFlag:    String(r.teamBFlag   || '').trim(),
      date:         dateVal,
      time:         timeVal,
      stadium:      String(r.stadium     || '').trim(),
      round:        String(r.round       || '').trim(),
      status:       String(r.status      || 'PENDING').trim(),
      resultGoalsA: r.resultGoalsA !== '' && r.resultGoalsA != null ? Number(r.resultGoalsA) : null,
      resultGoalsB: r.resultGoalsB !== '' && r.resultGoalsB != null ? Number(r.resultGoalsB) : null,
    };
  }).filter(function(m) { return m.id && m.teamA && m.teamB; });
  return jsonResp({ success: true, matches: matches }, cb);
}


    // ── GET_SETTINGS ─────────────────────────────────────────────
    // Retorna objeto {chave: valor} — NÃO array
    if (action === 'GET_SETTINGS') {
      var rows  = readSheet('Settings');
      var cfg   = {};
      rows.forEach(function(r) {
        var k = String(r.key   || '').trim();
        var v = String(r.value || '').trim();
        if (k) cfg[k] = v;
      });
      return jsonResp({ success: true, settings: cfg }, cb);
    }

    // ── GET_ALL_PREDICTIONS ──────────────────────────────────────
    if (action === 'GET_ALL_PREDICTIONS') {
      var rows  = readSheet('Predictions');
      var preds = rows.map(function(r) {
        return {
          id:         r.id,
          matchId:    String(r.matchId    || '').trim(),
          name:       String(r.name       || '').trim(),
          whatsapp:   String(r.whatsapp   || '').trim(),
          goalsA:     Number(r.goalsA),
          goalsB:     Number(r.goalsB),
          statusPix:  String(r.statusPix  || 'PENDING').trim(),
          createdAt:  String(r.createdAt  || '').trim(),
        };
      });
      return jsonResp({ success: true, predictions: preds }, cb);
    }

    // ── CHECK_DUPLICATES ─────────────────────────────────────────
    if (action === 'CHECK_DUPLICATES') {
      var all = readSheet('Predictions');
      var cnt = 0;
      all.forEach(function(r) {
        if (String(r.matchId).trim() === String(data.matchId).trim() &&
            Number(r.goalsA) === Number(data.goalsA) &&
            Number(r.goalsB) === Number(data.goalsB)) cnt++;
      });
      return jsonResp({ success: true, count: cnt }, cb);
    }

    // ── GET_STATS ────────────────────────────────────────────────
    if (action === 'GET_STATS') {
      var all = readSheet('Predictions');
      var groups = {};
      all.forEach(function(r) {
        if (String(r.matchId).trim() !== String(data.matchId).trim()) return;
        var key = r.goalsA + '-' + r.goalsB;
        if (!groups[key]) groups[key] = { goalsA: Number(r.goalsA), goalsB: Number(r.goalsB), count: 0 };
        groups[key].count++;
      });
      var arr = Object.keys(groups).map(function(k) { return groups[k]; });
      arr.sort(function(a,b) { return b.count - a.count; });
      return jsonResp({ success: true, stats: arr.slice(0, 3) }, cb);
    }

    // ── SUBMIT_PREDICTION ────────────────────────────────────────
    if (action === 'SUBMIT_PREDICTION') {
      var sheet = getSheet('Predictions');
      if (!sheet) return jsonResp({ success: false, error: 'Aba Predictions não encontrada' }, cb);

      var p = data.prediction;
      if (!p || !p.matchId || !p.name) {
        return jsonResp({ success: false, error: 'Dados incompletos' }, cb);
      }

      // Busca dados do jogo
      var jogos  = readSheet('Matches');
      var jogo   = {};
      for (var i = 0; i < jogos.length; i++) {
        if (String(jogos[i].id).trim() === String(p.matchId).trim()) { jogo = jogos[i]; break; }
      }

      var newId = new Date().getTime();
      var agora = Utilities.formatDate(new Date(), 'America/Sao_Paulo', 'dd/MM/yyyy HH:mm:ss');

      sheet.appendRow([
        newId,
        String(p.matchId).trim(),
        String(p.name).trim(),
        String(p.whatsapp || '').trim(),
        Number(p.goalsA),
        Number(p.goalsB),
        'PENDING',
        agora,
        String(jogo.teamA || '').trim(),
        String(jogo.teamB || '').trim(),
      ]);

      return jsonResp({ success: true, predictionId: newId }, cb);
    }

    // ── CONFIRM_PAYMENT ──────────────────────────────────────────
    if (action === 'CONFIRM_PAYMENT') {
      var sheet  = getSheet('Predictions');
      var vals   = sheet.getDataRange().getValues();
      var rowIdx = -1;
      var pred   = null;

      for (var i = 1; i < vals.length; i++) {
        if (String(vals[i][0]) === String(data.id)) {
          rowIdx = i + 1;
          pred   = { name: vals[i][2], whatsapp: vals[i][3], goalsA: vals[i][4], goalsB: vals[i][5], teamA: vals[i][8], teamB: vals[i][9] };
          break;
        }
      }

      if (!pred) return jsonResp({ success: false, error: 'Palpite não encontrado' }, cb);

      sheet.getRange(rowIdx, 7).setValue('PAID')
           .setBackground('#E8F5E9').setFontColor('#006400').setFontWeight('bold');

      var msg  = 'Olá ' + pred.name + '! ✅ Pagamento CONFIRMADO! Seu palpite: ' +
                 pred.teamA + ' ' + pred.goalsA + ' x ' + pred.goalsB + ' ' + pred.teamB +
                 '. Boa sorte no Bolão Copa 2026! 🏆⚽';
      var fone = String(pred.whatsapp).replace(/\D/g, '');
      var link = 'https://api.whatsapp.com/send?phone=55' + fone + '&text=' + encodeURIComponent(msg);

      return jsonResp({ success: true, waLink: link }, cb);
    }

    // ── SAVE_MATCH ───────────────────────────────────────────────
    if (action === 'SAVE_MATCH') {
      var sheet = getSheet('Matches');
      if (!sheet) return jsonResp({ success: false, error: 'Aba Matches não encontrada' }, cb);

      var m    = data.match;
      if (!m || !m.id) return jsonResp({ success: false, error: 'Match id ausente' }, cb);

      var vals   = sheet.getDataRange().getValues();
      var rowIdx = -1;
      for (var i = 1; i < vals.length; i++) {
        if (String(vals[i][0]).trim() === String(m.id).trim()) { rowIdx = i + 1; break; }
      }

      var gA = (m.resultGoalsA != null && m.resultGoalsA !== '') ? Number(m.resultGoalsA) : '';
      var gB = (m.resultGoalsB != null && m.resultGoalsB !== '') ? Number(m.resultGoalsB) : '';

      var linha = [
        String(m.id), String(m.teamA||''), String(m.teamAFlag||''),
        String(m.teamB||''), String(m.teamBFlag||''), String(m.date||''),
        String(m.time||''), String(m.stadium||''), String(m.round||''),
        gA, gB, String(m.status||'PENDING')
      ];

      if (rowIdx > 0) {
        sheet.getRange(rowIdx, 1, 1, 12).setValues([linha]);
      } else {
        sheet.appendRow(linha);
      }
      return jsonResp({ success: true }, cb);
    }

    // ── DELETE_MATCH ─────────────────────────────────────────────
    if (action === 'DELETE_MATCH') {
      var sheet = getSheet('Matches');
      var vals  = sheet.getDataRange().getValues();
      for (var i = 1; i < vals.length; i++) {
        if (String(vals[i][0]).trim() === String(data.id).trim()) { sheet.deleteRow(i + 1); break; }
      }
      return jsonResp({ success: true }, cb);
    }

    // ── SAVE_SETTINGS ────────────────────────────────────────────
    if (action === 'SAVE_SETTINGS') {
      var sheet    = getSheet('Settings');
      if (!sheet) return jsonResp({ success: false, error: 'Aba Settings não encontrada' }, cb);

      var updates  = data.settings || {};
      var vals     = sheet.getDataRange().getValues();
      var keys     = Object.keys(updates);

      keys.forEach(function(chave) {
        var valor = updates[chave];
        var found = false;
        for (var i = 1; i < vals.length; i++) {
          if (String(vals[i][0]).trim() === String(chave).trim()) {
            sheet.getRange(i + 1, 2).setValue(valor);
            vals[i][1] = valor;
            found = true;
            break;
          }
        }
        if (!found) {
          sheet.appendRow([chave, valor]);
          vals.push([chave, valor]);
        }
      });
      return jsonResp({ success: true }, cb);
    }

    // ── SAVE_HISTORY_ENTRY ───────────────────────────────────────
    if (action === 'SAVE_HISTORY_ENTRY') {
      var sheet = getSheet('History');
      if (!sheet) return jsonResp({ success: false, error: 'Aba History não encontrada' }, cb);

      var h = data.entry;
      if (!h) return jsonResp({ success: false, error: 'entry ausente' }, cb);

      var vals   = sheet.getDataRange().getValues();
      var rowIdx = -1;
      for (var i = 1; i < vals.length; i++) {
        if (String(vals[i][0]).trim() === String(h.matchId).trim()) { rowIdx = i + 1; break; }
      }

      var winners = JSON.stringify(h.winners || []);
      var closedAt = h.closedAt || Utilities.formatDate(new Date(), 'America/Sao_Paulo', 'dd/MM/yyyy HH:mm:ss');

      var linha = [
        String(h.matchId), String(h.teamA||''), String(h.teamAFlag||''),
        String(h.teamB||''), String(h.teamBFlag||''),
        Number(h.resultGoalsA||0), Number(h.resultGoalsB||0),
        Number(h.totalCollected||0), Number(h.prize||0),
        Number(h.accumulated||0), winners, closedAt
      ];

      if (rowIdx > 0) {
        sheet.getRange(rowIdx, 1, 1, 12).setValues([linha]);
      } else {
        sheet.appendRow(linha);
      }
      return jsonResp({ success: true }, cb);
    }

    return jsonResp({ success: false, error: 'Ação desconhecida: ' + action }, cb);

  } catch(e) {
    return jsonResp({ success: false, error: e.toString() }, cb);
  }
}

// ═══════════════════════════════════════════════════════════════════
// SETUP — Execute UMA VEZ após colar o script
// ═══════════════════════════════════════════════════════════════════

function criarEstruturaPlanilha() {
  var ss    = SpreadsheetApp.getActiveSpreadsheet();
  var verde = '#1a5276';
  var white = '#ffffff';

  // Predictions
  var pred = ss.getSheetByName('Predictions') || ss.insertSheet('Predictions');
  if (pred.getLastRow() === 0) {
    pred.appendRow(['id','matchId','name','whatsapp','goalsA','goalsB','statusPix','createdAt','teamA','teamB']);
  }
  pred.getRange('1:1').setBackground(verde).setFontColor(white).setFontWeight('bold');
  pred.setFrozenRows(1);

  // Matches
  var mtch = ss.getSheetByName('Matches') || ss.insertSheet('Matches');
  if (mtch.getLastRow() === 0) {
    mtch.appendRow(['id','teamA','teamAFlag','teamB','teamBFlag','date','time','stadium','round','resultGoalsA','resultGoalsB','status']);
  }
  mtch.getRange('1:1').setBackground(verde).setFontColor(white).setFontWeight('bold');
  mtch.setFrozenRows(1);

  // Settings
  var cfg = ss.getSheetByName('Settings') || ss.insertSheet('Settings');
  if (cfg.getLastRow() === 0) {
    cfg.getRange(1,1,8,2).setValues([
      ['key','value'],
      ['pix_value','30.00'],
      ['pix_key','00020126360014br.gov.bcb.pix0114+5535991717912520400005303986540530.005802BR5921FRANK DE SOUZA BORGES6006LAVRAS62060502Br63042ADA'],
      ['active_match_id','m24'],
      ['admin_phone','35991717912'],
      ['accumulated_amount','0.00'],
      ['regulamento','1. Cada palpite custa o valor definido por aposta.\n2. O palpite só é validado após confirmação do PIX.\n3. Premiação: 80% do valor arrecadado.\n4. Limite: 5 palpites idênticos por partida.\n5. Prazo: até 10 min antes do jogo.\n6. Múltiplos acertadores dividem o prêmio igualmente.\n7. Sem acertadores: prêmio acumula para a próxima rodada.'],
    ]);
  }
  cfg.getRange('1:1').setBackground(verde).setFontColor(white).setFontWeight('bold');
  cfg.setFrozenRows(1);
  cfg.setColumnWidth(1, 220);
  cfg.setColumnWidth(2, 600);

  // History
  var hist = ss.getSheetByName('History') || ss.insertSheet('History');
  if (hist.getLastRow() === 0) {
    hist.appendRow(['matchId','teamA','teamAFlag','teamB','teamBFlag','resultGoalsA','resultGoalsB','totalCollected','prize','accumulated','winners','closedAt']);
  }
  hist.getRange('1:1').setBackground('#0d6b38').setFontColor(white).setFontWeight('bold');
  hist.setFrozenRows(1);

  // Remove aba padrão vazia
  ['Plan1','Sheet1','Página1'].forEach(function(nome) {
    var aba = ss.getSheetByName(nome);
    if (aba && ss.getSheets().length > 1) {
      try { ss.deleteSheet(aba); } catch(e) {}
    }
  });

  SpreadsheetApp.getUi().alert(
    '✅ ESTRUTURA CRIADA!\n\n' +
    'Abas: Predictions | Matches | Settings | History\n\n' +
    'PRÓXIMOS PASSOS:\n' +
    '1. Vá em: Implantar > Nova implantação\n' +
    '2. Tipo: App da Web\n' +
    '3. Executar como: EU\n' +
    '4. Acesso: Qualquer pessoa\n' +
    '5. Copie a URL e cole em src/services/api.ts\n\n' +
    'Para cadastrar jogos: use o Painel Admin do app (/admin)'
  );
}

/** Diagnóstico — mostra o que a planilha retorna */
function testarGetSettings() {
  var rows = readSheet('Settings');
  var cfg  = {};
  rows.forEach(function(r) {
    var k = String(r.key || '').trim();
    var v = String(r.value || '').trim();
    if (k) cfg[k] = v;
  });
  Logger.log('Settings: ' + JSON.stringify(cfg, null, 2));
  SpreadsheetApp.getUi().alert('Settings retornados:\n\n' + JSON.stringify(cfg, null, 2));
}

/** Diagnóstico — mostra os matches */
function testarGetMatches() {
  var rows = readSheet('Matches');
  Logger.log('Matches (' + rows.length + '): ' + JSON.stringify(rows.slice(0,3), null, 2));
  SpreadsheetApp.getUi().alert('Total de jogos: ' + rows.length + '\n\nPrimeiros 3:\n' + JSON.stringify(rows.slice(0,3), null, 2));
}

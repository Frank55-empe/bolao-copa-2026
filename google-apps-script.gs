/**
 * ╔══════════════════════════════════════════════════════════════════════╗
 * ║         BOLÃO MUNDIAL 2026 — GOOGLE APPS SCRIPT (BACKEND)           ║
 * ╚══════════════════════════════════════════════════════════════════════╝
 *
 * CONFIGURAÇÃO DA PLANILHA (3 abas obrigatórias):
 *
 * Aba "Matches"  — linha 1 (cabeçalho):
 *   id | teamA | teamAFlag | teamB | teamBFlag | date | time | stadium | round | resultGoalsA | resultGoalsB | status
 *
 * Aba "Predictions" — linha 1 (cabeçalho):
 *   id | matchId | name | whatsapp | goalsA | goalsB | statusPix | createdAt
 *
 * Aba "Settings" — linha 1 (cabeçalho):
 *   key | value
 *
 *   Linhas obrigatórias na aba Settings:
 *   active_match_id  | m6          ← ID do jogo ativo (ex: m6, m24)
 *   pix_key          | sua@chave   ← chave Pix ou código Copia e Cola
 *   pix_value        | 30.00       ← valor em R$
 *   admin_phone      | 35991717912 ← celular do admin (só dígitos)
 *   regulamento      | 1. Regra... ← texto do regulamento
 *   accumulated_amount | 0.00      ← prêmio acumulado
 *
 * DEPLOY:
 *   Extensões → Apps Script → cole este código
 *   Implantar → Nova implantação → App da Web
 *   Executar como: Eu | Acesso: Qualquer pessoa
 *   Copie a URL e cole em config.js → CONFIG.API_URL
 */

// ─────────────────────────────────────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────────────────────────────────────

function jsonResult(obj) {
  return ContentService
    .createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}

function lockWrapper(fn) {
  var lock = LockService.getScriptLock();
  lock.waitLock(10000);
  try { return fn(); }
  finally { lock.releaseLock(); }
}

/** Lê uma aba e retorna array de objetos {coluna: valor} */
function readSheet(sheetName) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName(sheetName);
  if (!sheet) return [];
  var data = sheet.getDataRange().getValues();
  if (data.length <= 1) return [];
  var headers = data[0];
  var rows = [];
  for (var i = 1; i < data.length; i++) {
    if (!data[i][0] && data[i][0] !== 0) continue; // pula linhas vazias
    var obj = {};
    for (var j = 0; j < headers.length; j++) {
      obj[String(headers[j]).trim()] = data[i][j];
    }
    rows.push(obj);
  }
  return rows;
}

/** Converte array [{key, value}] → {key: value} */
function settingsToObject(arr) {
  var obj = {};
  arr.forEach(function(row) {
    var k = String(row['key'] || '').trim();
    var v = row['value'];
    if (k) obj[k] = (v === undefined || v === null) ? '' : String(v).trim();
  });
  return obj;
}

// ─────────────────────────────────────────────────────────────────────────────
// ENTRY POINTS
// ─────────────────────────────────────────────────────────────────────────────

function doGet(e) {
  var action  = (e.parameter && e.parameter.action) ? e.parameter.action : '';
  var payload = {};
  if (e.parameter && e.parameter.payload) {
    try { payload = JSON.parse(e.parameter.payload); }
    catch(err) { return jsonResult({ success: false, error: 'payload JSON inválido: ' + err }); }
  }
  return handleRequest(action, payload);
}

function doPost(e) {
  var data = {};
  if (e.postData && e.postData.contents) {
    try { data = JSON.parse(e.postData.contents); }
    catch(err) { return jsonResult({ success: false, error: 'body JSON inválido' }); }
  }
  return handleRequest(data.action || '', data);
}

// ─────────────────────────────────────────────────────────────────────────────
// HANDLER CENTRAL
// ─────────────────────────────────────────────────────────────────────────────

function handleRequest(action, data) {
  try {
    var ss = SpreadsheetApp.getActiveSpreadsheet();

    // ── LEITURAS ─────────────────────────────────────────────────────────────

    if (action === 'GET_MATCHES') {
      var matches = readSheet('Matches');
      return jsonResult({ matches: matches });
    }

    if (action === 'GET_SETTINGS') {
      var arr = readSheet('Settings');
      // ✅ CORRIGIDO: retorna objeto chave-valor, não array
      var settings = settingsToObject(arr);
      return jsonResult({ settings: settings });
    }

    if (action === 'GET_ALL_PREDICTIONS') {
      return jsonResult({ predictions: readSheet('Predictions') });
    }

    if (action === 'GET_STATS') {
      var matchId = String(data.matchId || '');
      var preds   = readSheet('Predictions');
      var counts  = {};
      preds.forEach(function(p) {
        if (String(p.matchId) === matchId) {
          var key = p.goalsA + '-' + p.goalsB;
          if (!counts[key]) counts[key] = { goalsA: Number(p.goalsA), goalsB: Number(p.goalsB), count: 0 };
          counts[key].count++;
        }
      });
      var stats = Object.keys(counts).map(function(k) { return counts[k]; });
      stats.sort(function(a, b) { return b.count - a.count; });
      return jsonResult({ stats: stats.slice(0, 3) });
    }

    if (action === 'CHECK_DUPLICATES') {
      var preds = readSheet('Predictions');
      var count = 0;
      preds.forEach(function(p) {
        if (String(p.matchId) === String(data.matchId) &&
            Number(p.goalsA)  === Number(data.goalsA)  &&
            Number(p.goalsB)  === Number(data.goalsB)) count++;
      });
      return jsonResult({ count: count });
    }

    // ── GRAVAÇÕES ─────────────────────────────────────────────────────────────

    if (action === 'SUBMIT_PREDICTION') {
      return lockWrapper(function() {
        var sheet = ss.getSheetByName('Predictions');
        if (!sheet) return jsonResult({ success: false, error: 'Aba Predictions não encontrada' });
        var p  = data.prediction;
        var id = new Date().getTime();
        sheet.appendRow([
          id,
          p.matchId,
          p.name,
          p.whatsapp,
          Number(p.goalsA),
          Number(p.goalsB),
          'PENDING',
          new Date().toISOString()
        ]);
        return jsonResult({ success: true, predictionId: id });
      });
    }

    if (action === 'SAVE_MATCH') {
      return lockWrapper(function() {
        var sheet = ss.getSheetByName('Matches');
        if (!sheet) return jsonResult({ success: false, error: 'Aba Matches não encontrada' });
        var m   = data.match;
        var raw = sheet.getDataRange().getValues();
        var rowIdx = -1;
        for (var i = 1; i < raw.length; i++) {
          if (String(raw[i][0]) === String(m.id)) { rowIdx = i + 1; break; }
        }
        var row = [
          m.id, m.teamA, m.teamAFlag, m.teamB, m.teamBFlag,
          m.date, m.time, m.stadium, m.round,
          (m.resultGoalsA !== undefined && m.resultGoalsA !== null) ? m.resultGoalsA : '',
          (m.resultGoalsB !== undefined && m.resultGoalsB !== null) ? m.resultGoalsB : '',
          m.status || 'PENDING'
        ];
        if (rowIdx > -1) sheet.getRange(rowIdx, 1, 1, 12).setValues([row]);
        else sheet.appendRow(row);
        return jsonResult({ success: true });
      });
    }

    if (action === 'DELETE_MATCH') {
      return lockWrapper(function() {
        var sheet = ss.getSheetByName('Matches');
        var raw   = sheet.getDataRange().getValues();
        for (var i = 1; i < raw.length; i++) {
          if (String(raw[i][0]) === String(data.id)) { sheet.deleteRow(i + 1); break; }
        }
        return jsonResult({ success: true });
      });
    }

    if (action === 'SAVE_SETTINGS') {
      return lockWrapper(function() {
        var sheet = ss.getSheetByName('Settings');
        if (!sheet) return jsonResult({ success: false, error: 'Aba Settings não encontrada' });
        var raw    = sheet.getDataRange().getValues();
        var toSave = data.settings;
        Object.keys(toSave).forEach(function(k) {
          var found = false;
          for (var i = 1; i < raw.length; i++) {
            if (String(raw[i][0]).trim() === k) {
              sheet.getRange(i + 1, 2).setValue(toSave[k]);
              raw[i][1] = toSave[k]; // atualiza cache local
              found = true;
              break;
            }
          }
          if (!found) sheet.appendRow([k, toSave[k]]);
        });
        return jsonResult({ success: true });
      });
    }

    if (action === 'CONFIRM_PAYMENT') {
      return lockWrapper(function() {
        var sheet = ss.getSheetByName('Predictions');
        var raw   = sheet.getDataRange().getValues();
        var pred;
        for (var i = 1; i < raw.length; i++) {
          if (String(raw[i][0]) === String(data.id)) {
            sheet.getRange(i + 1, 7).setValue('PAID');
            pred = { name: raw[i][2], whatsapp: String(raw[i][3]), goalsA: raw[i][4], goalsB: raw[i][5], matchId: String(raw[i][1]) };
            break;
          }
        }
        if (!pred) return jsonResult({ waLink: '' });

        var matchSheet = ss.getSheetByName('Matches');
        var mRaw = matchSheet.getDataRange().getValues();
        var teamA = 'Time A', teamB = 'Time B';
        for (var j = 1; j < mRaw.length; j++) {
          if (String(mRaw[j][0]) === pred.matchId) { teamA = mRaw[j][1]; teamB = mRaw[j][3]; break; }
        }
        var msg  = 'Olá, ' + pred.name + '! 🏆 Pagamento confirmado! Palpite: ' + teamA + ' ' + pred.goalsA + ' x ' + pred.goalsB + ' ' + teamB + '. Boa sorte no Bolão!';
        var link = 'https://api.whatsapp.com/send?phone=55' + pred.whatsapp.replace(/\D/g, '') + '&text=' + encodeURIComponent(msg);
        return jsonResult({ waLink: link });
      });
    }

    return jsonResult({ success: false, error: 'Ação desconhecida: ' + action });

  } catch (err) {
    return jsonResult({ success: false, error: err.toString() });
  }
}

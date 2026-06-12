/**
 * BOLÃO BRASIL 2026 - GOOGLE APPS SCRIPT (BACKEND COMPLETO)
 *
 * CONFIGURAÇÃO INICIAL DA PLANILHA:
 * 1. Crie uma planilha em planilhas.google.com
 * 2. Crie 3 abas: 'Matches', 'Predictions', 'Settings'
 *
 * Aba "Matches" - Cabeçalho linha 1 (colunas A até L):
 *   id | teamA | teamAFlag | teamB | teamBFlag | date | time | stadium | round | resultGoalsA | resultGoalsB | status
 *
 * Aba "Predictions" - Cabeçalho linha 1 (colunas A até H):
 *   id | matchId | name | whatsapp | goalsA | goalsB | statusPix | createdAt
 *
 * Aba "Settings" - Cabeçalho linha 1 (colunas A e B):
 *   key | value
 *
 * Valores iniciais da aba Settings (insira manualmente ou via painel Admin):
 *   pix_value     | 30.00
 *   pix_key       | (sua chave pix)
 *   active_match_id | m6
 *   admin_phone   | (seu número com DDD, ex: 35991717912)
 *   regulamento   | (texto das regras)
 *   accumulated_amount | 0.00
 *
 * IMPLANTAÇÃO:
 * 1. No editor do Apps Script: Implantar > Nova implantação
 * 2. Tipo: App da Web
 * 3. Executar como: Eu (sua conta)
 * 4. Quem tem acesso: Qualquer pessoa
 * 5. Copie a URL gerada e coloque no arquivo .env como VITE_SHEETS_API_URL
 *
 * ATENÇÃO: Sempre que editar este script, crie uma NOVA implantação para aplicar as mudanças.
 */

// ============================================================
//  UTIL
// ============================================================

function lockWrapper(callback) {
  var lock = LockService.getScriptLock();
  lock.waitLock(15000);
  try {
    return callback();
  } finally {
    lock.releaseLock();
  }
}

function jsonResult(obj) {
  var output = ContentService.createTextOutput(JSON.stringify(obj));
  output.setMimeType(ContentService.MimeType.JSON);
  return output;
}

function readSheetAsJson(sheetName) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName(sheetName);
  if (!sheet) return [];
  var data = sheet.getDataRange().getValues();
  if (data.length <= 1) return [];
  var headers = data[0];
  var result = [];
  for (var i = 1; i < data.length; i++) {
    var row = data[i];
    var obj = {};
    for (var j = 0; j < headers.length; j++) {
      obj[headers[j]] = row[j];
    }
    result.push(obj);
  }
  return result;
}

// ============================================================
//  ENTRY POINTS
// ============================================================

/**
 * Todas as chamadas chegam via GET.
 * - e.parameter.action : nome da ação
 * - e.parameter.payload: JSON com os dados da ação (opcional)
 */
function doGet(e) {
  var action = e.parameter.action || '';
  var payload = {};
  if (e.parameter.payload) {
    try {
      payload = JSON.parse(e.parameter.payload);
    } catch (err) {
      return jsonResult({ success: false, error: 'Payload JSON inválido: ' + err.toString() });
    }
  }
  return handleRequest(action, payload);
}

// doPost mantido para compatibilidade, mas o app usa GET
function doPost(e) {
  var data = {};
  if (e.postData && e.postData.contents) {
    try { data = JSON.parse(e.postData.contents); } catch(err) {}
  }
  var action = data.action || e.parameter.action || '';
  return handleRequest(action, data);
}

// ============================================================
//  ROUTER
// ============================================================

function handleRequest(action, data) {
  try {
    var ss = SpreadsheetApp.getActiveSpreadsheet();

    // ---------- LEITURAS ----------

    if (action === 'GET_MATCHES') {
      return jsonResult({ matches: readSheetAsJson('Matches') });
    }

    if (action === 'GET_SETTINGS') {
      var arr = readSheetAsJson('Settings');
      var settings = {};
      arr.forEach(function(row) {
        if (row.key) settings[row.key] = row.value;
      });
      return jsonResult({ settings: settings });
    }

    if (action === 'GET_ALL_PREDICTIONS') {
      return jsonResult({ predictions: readSheetAsJson('Predictions') });
    }

    if (action === 'GET_STATS') {
      var preds = readSheetAsJson('Predictions');
      var matchId = data.matchId;
      var counts = {};
      preds.forEach(function(p) {
        if (String(p.matchId) === String(matchId)) {
          var key = p.goalsA + '-' + p.goalsB;
          if (!counts[key]) counts[key] = { goalsA: Number(p.goalsA), goalsB: Number(p.goalsB), count: 0 };
          counts[key].count++;
        }
      });
      var statsArr = Object.keys(counts).map(function(k) { return counts[k]; });
      statsArr.sort(function(a, b) { return b.count - a.count; });
      return jsonResult({ stats: statsArr.slice(0, 3) });
    }

    if (action === 'CHECK_DUPLICATES') {
      var preds = readSheetAsJson('Predictions');
      var count = 0;
      preds.forEach(function(p) {
        if (String(p.matchId) === String(data.matchId) &&
            Number(p.goalsA) === Number(data.goalsA) &&
            Number(p.goalsB) === Number(data.goalsB)) {
          count++;
        }
      });
      return jsonResult({ count: count });
    }

    // ---------- GRAVAÇÕES ----------

    if (action === 'SUBMIT_PREDICTION') {
      return lockWrapper(function() {
        var sheet = ss.getSheetByName('Predictions');
        var p = data.prediction;
        if (!p) return jsonResult({ success: false, error: 'prediction ausente' });
        var id = new Date().getTime();
        var createdAt = new Date().toISOString();
        sheet.appendRow([id, p.matchId, p.name, p.whatsapp, Number(p.goalsA), Number(p.goalsB), 'PENDING', createdAt]);
        return jsonResult({ success: true, predictionId: id });
      });
    }

    if (action === 'SAVE_MATCH') {
      return lockWrapper(function() {
        var sheet = ss.getSheetByName('Matches');
        var m = data.match;
        if (!m) return jsonResult({ success: false, error: 'match ausente' });
        var existingRaw = sheet.getDataRange().getValues();
        var rowIdx = -1;
        for (var i = 1; i < existingRaw.length; i++) {
          if (String(existingRaw[i][0]) === String(m.id)) { rowIdx = i + 1; break; }
        }
        var goalsA = (m.resultGoalsA !== undefined && m.resultGoalsA !== null && m.resultGoalsA !== '') ? Number(m.resultGoalsA) : '';
        var goalsB = (m.resultGoalsB !== undefined && m.resultGoalsB !== null && m.resultGoalsB !== '') ? Number(m.resultGoalsB) : '';
        var status = m.status || 'PENDING';
        var rowData = [m.id, m.teamA, m.teamAFlag, m.teamB, m.teamBFlag, m.date, m.time, m.stadium, m.round, goalsA, goalsB, status];
        if (rowIdx > 0) {
          sheet.getRange(rowIdx, 1, 1, 12).setValues([rowData]);
        } else {
          sheet.appendRow(rowData);
        }
        return jsonResult({ success: true });
      });
    }

    if (action === 'DELETE_MATCH') {
      return lockWrapper(function() {
        var sheet = ss.getSheetByName('Matches');
        var existingRaw = sheet.getDataRange().getValues();
        for (var i = 1; i < existingRaw.length; i++) {
          if (String(existingRaw[i][0]) === String(data.id)) {
            sheet.deleteRow(i + 1);
            break;
          }
        }
        return jsonResult({ success: true });
      });
    }

    if (action === 'SAVE_SETTINGS') {
      return lockWrapper(function() {
        var sheet = ss.getSheetByName('Settings');
        if (!sheet) return jsonResult({ success: false, error: 'Aba Settings não encontrada' });
        var settingsRaw = sheet.getDataRange().getValues();
        var toSave = data.settings;
        if (!toSave) return jsonResult({ success: false, error: 'settings ausente' });
        Object.keys(toSave).forEach(function(k) {
          var found = false;
          for (var i = 1; i < settingsRaw.length; i++) {
            if (String(settingsRaw[i][0]) === String(k)) {
              sheet.getRange(i + 1, 2).setValue(toSave[k]);
              // Atualiza cache local para evitar gravar duplicata na mesma chamada
              settingsRaw[i][1] = toSave[k];
              found = true;
              break;
            }
          }
          if (!found) {
            sheet.appendRow([k, toSave[k]]);
            settingsRaw.push([k, toSave[k]]);
          }
        });
        return jsonResult({ success: true });
      });
    }

    if (action === 'CONFIRM_PAYMENT') {
      return lockWrapper(function() {
        var sheet = ss.getSheetByName('Predictions');
        var predsRaw = sheet.getDataRange().getValues();
        var prediction = null;
        for (var i = 1; i < predsRaw.length; i++) {
          if (String(predsRaw[i][0]) === String(data.id)) {
            sheet.getRange(i + 1, 7).setValue('PAID');
            prediction = {
              id: predsRaw[i][0],
              matchId: predsRaw[i][1],
              name: predsRaw[i][2],
              whatsapp: predsRaw[i][3],
              goalsA: predsRaw[i][4],
              goalsB: predsRaw[i][5]
            };
            break;
          }
        }
        if (!prediction) return jsonResult({ waLink: '' });

        var matchSheet = ss.getSheetByName('Matches');
        var matchesRaw = matchSheet.getDataRange().getValues();
        var teamA = 'Time A', teamB = 'Time B';
        for (var j = 1; j < matchesRaw.length; j++) {
          if (String(matchesRaw[j][0]) === String(prediction.matchId)) {
            teamA = matchesRaw[j][1];
            teamB = matchesRaw[j][3];
            break;
          }
        }
        var msg = 'Olá, ' + prediction.name + '! 🏆 Seu pagamento foi confirmado. ' +
          'Palpite: ' + teamA + ' ' + prediction.goalsA + ' x ' + prediction.goalsB + ' ' + teamB + '. Boa sorte!';
        var link = 'https://api.whatsapp.com/send?phone=55' +
          String(prediction.whatsapp).replace(/\D/g, '') +
          '&text=' + encodeURIComponent(msg);
        return jsonResult({ waLink: link });
      });
    }

    return jsonResult({ success: false, error: 'Ação desconhecida: ' + action });

  } catch (error) {
    return jsonResult({ success: false, error: error.toString() });
  }
}

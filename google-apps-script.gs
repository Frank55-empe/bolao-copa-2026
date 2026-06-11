/**
 * BOLÃO BRASIL 2026 - GOOGLE APPS SCRIPT (FULL BACKEND)
 * 
 * Instruções:
 * 1. Crie uma nova planilha no Google Sheets (planilhas.google.com).
 * 2. Crie 3 abas e renomeie-as exatamente para: 'Matches', 'Predictions', 'Settings'.
 * 3. Aba "Matches" - Cabecalho (A1:L1):
 *    id | teamA | teamAFlag | teamB | teamBFlag | date | time | stadium | round | resultGoalsA | resultGoalsB | status
 * 4. Aba "Predictions" - Cabecalho (A1:H1):
 *    id | matchId | name | whatsapp | goalsA | goalsB | statusPix | createdAt
 * 5. Aba "Settings" - Cabecalho (A1:B1):
 *    key | value
 * 6. Vá em 'Extensões' > 'Apps Script'.
 * 7. Cole este código substituindo tudo.
 * 8. Clique em 'Implantar' > 'Nova implantação'.
 * 9. Tipo: 'App da Web'. Acesso: 'Qualquer pessoa'.
 * 10. Copie a URL do App da Web e coloque no VITE_SHEETS_API_URL do aplicativo.
 */

function lockWrapper(callback) {
  var lock = LockService.getScriptLock();
  lock.waitLock(10000);
  try {
    return callback();
  } finally {
    lock.releaseLock();
  }
}

function doGet(e) {
  var action = e.parameter.action;
  return handleRequest(action, e.parameter, 'GET');
}

function doPost(e) {
  var data = {};
  if (e.postData && e.postData.contents) {
    data = JSON.parse(e.postData.contents);
  }
  return handleRequest(data.action, data, 'POST');
}

function jsonResult(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);
}

function readSheetAsJson(sheetName) {
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(sheetName);
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

function handleRequest(action, data, method) {
  try {
    var ss = SpreadsheetApp.getActiveSpreadsheet();

    if (action === 'GET_MATCHES') {
      return jsonResult({ matches: readSheetAsJson('Matches') });
    }

    if (action === 'GET_SETTINGS') {
      var arr = readSheetAsJson('Settings');
      var settings = {};
      arr.forEach(function(row) { settings[row.key] = row.value; });
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
        if (p.matchId == matchId) {
          var key = p.goalsA + "-" + p.goalsB;
          if (!counts[key]) counts[key] = { goalsA: p.goalsA, goalsB: p.goalsB, count: 0 };
          counts[key].count++;
        }
      });
      var arr = Object.keys(counts).map(function(k) { return counts[k]; });
      arr.sort(function(a, b) { return b.count - a.count; });
      return jsonResult({ stats: arr.slice(0, 3) });
    }

    if (action === 'CHECK_DUPLICATES') {
      var preds = readSheetAsJson('Predictions');
      var count = 0;
      preds.forEach(function(p) {
        if (p.matchId == data.matchId && p.goalsA == data.goalsA && p.goalsB == data.goalsB) count++;
      });
      return jsonResult({ count: count });
    }

    // POST ACTIONS
    if (action === 'SAVE_MATCH') {
      return lockWrapper(function() {
        var sheet = ss.getSheetByName('Matches');
        var m = data.match;
        var existingRaw = sheet.getDataRange().getValues();
        var rowIdx = -1;
        for (var i = 1; i < existingRaw.length; i++) {
          if (existingRaw[i][0] == m.id) { rowIdx = i + 1; break; }
        }
        var goalsA = m.resultGoalsA !== undefined && m.resultGoalsA !== null ? m.resultGoalsA : '';
        var goalsB = m.resultGoalsB !== undefined && m.resultGoalsB !== null ? m.resultGoalsB : '';
        var status = m.status || 'PENDING';
        var rowData = [m.id, m.teamA, m.teamAFlag, m.teamB, m.teamBFlag, m.date, m.time, m.stadium, m.round, goalsA, goalsB, status];
        if (rowIdx > -1) {
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
          if (existingRaw[i][0] == data.id) {
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
        if (!sheet) return jsonResult({ success: false });
        var settingsRaw = sheet.getDataRange().getValues();
        
        var toSave = data.settings;
        Object.keys(toSave).forEach(function(k) {
          var found = false;
          for (var i = 1; i < settingsRaw.length; i++) {
            if (settingsRaw[i][0] == k) {
              sheet.getRange(i + 1, 2).setValue(toSave[k]);
              found = true;
              break;
            }
          }
          if (!found) {
            sheet.appendRow([k, toSave[k]]);
          }
        });
        return jsonResult({ success: true });
      });
    }

    if (action === 'SUBMIT_PREDICTION') {
      return lockWrapper(function() {
        var sheet = ss.getSheetByName('Predictions');
        var p = data.prediction;
        var id = new Date().getTime();
        sheet.appendRow([id, p.matchId, p.name, p.whatsapp, p.goalsA, p.goalsB, "PENDING", new Date().toISOString()]);
        return jsonResult({ success: true, predictionId: id });
      });
    }

    if (action === 'CONFIRM_PAYMENT') {
      return lockWrapper(function() {
        var sheet = ss.getSheetByName('Predictions');
        var predsRaw = sheet.getDataRange().getValues();
        
        var prediction;
        for (var i = 1; i < predsRaw.length; i++) {
          if (predsRaw[i][0] == data.id) {
            sheet.getRange(i + 1, 7).setValue("PAID");
            prediction = {
              id: predsRaw[i][0], matchId: predsRaw[i][1], name: predsRaw[i][2],
              whatsapp: predsRaw[i][3], goalsA: predsRaw[i][4], goalsB: predsRaw[i][5]
            };
            break;
          }
        }
        if (!prediction) return jsonResult({ waLink: '' });

        var matchSheet = ss.getSheetByName('Matches');
        var matchesRaw = matchSheet.getDataRange().getValues();
        var teamA = "Time A", teamB = "Time B";
        for (var j = 1; j < matchesRaw.length; j++) {
          if (matchesRaw[j][0] == prediction.matchId) {
            teamA = matchesRaw[j][1];
            teamB = matchesRaw[j][3];
            break;
          }
        }
        var msg = "Olá, " + prediction.name + "! 🏆 Seu pagamento foi confirmado com sucesso. O seu palpite para " + teamA + " " + prediction.goalsA + " x " + prediction.goalsB + " " + teamB + " já está valendo. Boa sorte!";
        var link = "https://api.whatsapp.com/send?phone=55" + prediction.whatsapp.replace(/\D/g, '') + "&text=" + encodeURIComponent(msg);
        
        return jsonResult({ waLink: link });
      });
    }

    return jsonResult({ success: false, error: 'Unknown action' });

  } catch (error) {
    return jsonResult({ success: false, error: error.toString() });
  }
}


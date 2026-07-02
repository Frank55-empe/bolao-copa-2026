/**
 * BOLÃO BRASIL 2026 - GOOGLE APPS SCRIPT (BACKEND COMPLETO)
 *
 * COMO CONFIGURAR:
 * 1. Crie uma planilha no Google Sheets (planilhas.google.com)
 * 2. Crie 3 abas renomeadas EXATAMENTE para: Matches | Predictions | Settings
 *
 * Aba "Matches" — cabeçalho linha 1 (A1:L1):
 *   id | teamA | teamAFlag | teamB | teamBFlag | date | time | stadium | round | resultGoalsA | resultGoalsB | status
 *
 * Aba "Predictions" — cabeçalho linha 1 (A1:H1):
 *   id | matchId | name | whatsapp | goalsA | goalsB | statusPix | createdAt
 *
 * Aba "Settings" — cabeçalho linha 1 (A1:B1):
 *   key | value
 *
 * 3. Menu Extensões > Apps Script > cole este código (substituindo tudo)
 * 4. Implantar > Nova implantação > Tipo: App da Web
 *    Executar como: Eu | Acesso: Qualquer pessoa
 * 5. Copie a URL gerada e cole em config.js → CONFIG.API_URL
 *
 * ════════════════════════════════════════════════════════════
 * NOTIFICAÇÃO AUTOMÁTICA DE PAGAMENTO CONFIRMADO (WhatsApp)
 * ════════════════════════════════════════════════════════════
 * 6. Para ativar o envio automático de WhatsApp quando o admin
 *    escrever "PAGO" na coluna statusPix:
 *
 *    a) No editor do Apps Script, clique no ícone de relógio
 *       (Gatilhos / Triggers) no menu lateral esquerdo.
 *    b) Clique em "+ Adicionar gatilho" (canto inferior direito).
 *    c) Configure assim:
 *         Função a executar : onEditTrigger
 *         Tipo de evento    : Da planilha → Ao editar
 *         Implantação       : Cabeçalho (não usar implantação)
 *    d) Clique em Salvar e autorize as permissões.
 *
 *    Pronto! Toda vez que você digitar "PAGO" (qualquer
 *    capitalização) na coluna statusPix da aba Predictions,
 *    o link do WhatsApp com a mensagem de confirmação será
 *    aberto automaticamente no seu navegador.
 */

// ─────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────

function lockWrapper(callback) {
  if (typeof callback !== 'function') {
    throw new Error('lockWrapper foi chamado sem uma função válida. Recebido: ' + typeof callback);
  }
  var lock = LockService.getScriptLock();
  lock.waitLock(10000);
  try { return callback(); }
  finally { lock.releaseLock(); }
}

// Nome do callback JSONP da requisição atual (definido em doGet/doPost).
// O frontend (api.ts) faz a chamada via <script src="...&callback=NOME">,
// então a resposta PRECISA vir como "NOME({...})" e não como JSON puro,
// senão o navegador não consegue executar o retorno e a chamada trava
// até dar timeout (fallback local é usado, dados da planilha são ignorados).
var _jsonpCallback = null;

function jsonResult(obj) {
  var json = JSON.stringify(obj);
  if (_jsonpCallback) {
    return ContentService
      .createTextOutput(_jsonpCallback + '(' + json + ')')
      .setMimeType(ContentService.MimeType.JAVASCRIPT);
  }
  return ContentService
    .createTextOutput(json)
    .setMimeType(ContentService.MimeType.JSON);
}

function readSheetAsJson(sheetName) {
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(sheetName);
  if (!sheet) return [];
  var data = sheet.getDataRange().getValues();
  if (data.length <= 1) return [];
  var headers = data[0];
  var result = [];
  for (var i = 1; i < data.length; i++) {
    var obj = {};
    for (var j = 0; j < headers.length; j++) {
      obj[headers[j]] = data[i][j];
    }
    result.push(obj);
  }
  return result;
}

// ─────────────────────────────────────────────────────────────
// MENSAGEM DE BOAS-VINDAS — enviada ao receber um novo palpite
// ─────────────────────────────────────────────────────────────
//
// Chamada automaticamente dentro de SUBMIT_PREDICTION sempre
// que um participante registra um palpite via aplicativo.
// Abre um popup para o admin com o botão do WhatsApp já pronto.

function enviarBoasVindas(nome, whatsapp, teamA, goalsA, goalsB, teamB, dataJogo, horaJogo) {
  try {
    var numero = '55' + String(whatsapp).replace(/\D/g, '');
    if (numero.length < 12) return;

    var msg =
      '⚽ *BOLÃO COPA 2026* ⚽\n' +
      '━━━━━━━━━━━━━━━━━━━━━━━\n\n' +
      '🎉 *Seja bem-vindo(a) ao Bolão, ' + nome + '!*\n\n' +
      'Recebemos seu palpite com sucesso. Agora é só torcer! 🤞\n\n' +
      '🎯 *Seu palpite registrado:*\n' +
      '   ' + teamA + ' *' + goalsA + ' x ' + goalsB + '* ' + teamB + '\n' +
      (dataJogo ? '   📅 ' + dataJogo + (horaJogo ? ' às ' + horaJogo : '') + '\n' : '') +
      '\n' +
      '━━━━━━━━━━━━━━━━━━━━━━━\n' +
      '💳 *Para confirmar sua participação,\n' +
      'efetue o pagamento via PIX:*\n\n' +
      '📱 *Chave PIX (celular):*\n' +
      '   35991717912\n\n' +
      '👤 *Favorecido:*\n' +
      '   Frank de Souza Borges\n\n' +
      'Após o pagamento, envie o comprovante\n' +
      'para que seu palpite seja validado. ✅\n\n' +
      '━━━━━━━━━━━━━━━━━━━━━━━\n' +
      '🍀 *BOA SORTE!!!* 🍀';

    var waUrl = 'https://api.whatsapp.com/send?phone=' + numero +
                '&text=' + encodeURIComponent(msg);

    var ui = SpreadsheetApp.getUi();
    var html = HtmlService.createHtmlOutput(
      '<html><body style="font-family:Arial,sans-serif;padding:20px;">' +
      '<h3 style="color:#009739;">⚽ Novo palpite recebido!</h3>' +
      '<p>Clique no botão abaixo para enviar a mensagem de boas-vindas para <strong>' + nome + '</strong>:</p>' +
      '<a href="' + waUrl + '" target="_blank" ' +
      'style="display:inline-block;background:#25D366;color:white;padding:12px 24px;' +
      'border-radius:8px;text-decoration:none;font-weight:bold;font-size:15px;">' +
      '📲 Enviar Boas-Vindas</a>' +
      '<p style="color:#555;font-size:13px;margin-top:14px;">' +
      'Palpite: <strong>' + teamA + ' ' + goalsA + ' x ' + goalsB + ' ' + teamB + '</strong></p>' +
      '<p style="color:#888;font-size:12px;margin-top:4px;">Número: ' + numero + '</p>' +
      '</body></html>'
    ).setWidth(420).setHeight(240);

    ui.showModalDialog(html, '📲 Boas-vindas — ' + nome);
  } catch (err) {
    console.error('enviarBoasVindas error:', err);
  }
}

// ─────────────────────────────────────────────
// NOTIFICAÇÃO AUTOMÁTICA VIA WHATSAPP
// ─────────────────────────────────────────────
//
// Este gatilho é disparado sempre que qualquer célula da planilha
// for editada. Ele verifica se:
//   • a edição foi na aba "Predictions"
//   • a coluna editada é "statusPix" (coluna G = índice 7)
//   • o novo valor digitado é "PAGO" (qualquer capitalização)
//
// Se tudo bater, monta a mensagem de confirmação e abre o
// WhatsApp Web no navegador do admin com o link já preenchido.
//
// IMPORTANTE: registre esta função como gatilho "Ao editar"
// conforme as instruções no cabeçalho deste arquivo.

function onEditTrigger(e) {
  try {
    var range = e.range;
    var sheet = range.getSheet();

    // Só age na aba Predictions
    if (sheet.getName() !== 'Predictions') return;

    // Coluna G (índice 7) = statusPix
    // Cabeçalho: id(1) | matchId(2) | name(3) | whatsapp(4) | goalsA(5) | goalsB(6) | statusPix(7) | createdAt(8)
    var STATUS_PIX_COL = 7;
    if (range.getColumn() !== STATUS_PIX_COL) return;

    // Verifica se o novo valor é "PAGO" (case-insensitive)
    var novoValor = String(e.value || '').trim().toUpperCase();
    if (novoValor !== 'PAGO') return;

    // Lê os dados da linha editada
    var row      = range.getRow();
    var rowData  = sheet.getRange(row, 1, 1, 8).getValues()[0];

    var matchId  = String(rowData[1]).trim();
    var nome     = String(rowData[2]).trim();
    var whatsapp = String(rowData[3]).trim().replace(/\D/g, '');
    var goalsA   = rowData[4];
    var goalsB   = rowData[5];

    if (!whatsapp || whatsapp.length < 10) return;

    // Busca os times do jogo correspondente
    var matchSheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('Matches');
    var teamA = 'Time A';
    var teamB = 'Time B';
    var dataJogo = '';
    var horaJogo = '';

    if (matchSheet) {
      var matchData = matchSheet.getDataRange().getValues();
      for (var i = 1; i < matchData.length; i++) {
        if (String(matchData[i][0]).trim() === matchId) {
          teamA    = String(matchData[i][1]).trim();
          teamB    = String(matchData[i][3]).trim();
          dataJogo = String(matchData[i][5]).trim();
          horaJogo = String(matchData[i][6]).trim();
          break;
        }
      }
    }

    // ── Monta a mensagem de confirmação ──────────────────────
    var msg =
      '🏆 *BOLÃO COPA 2026* 🏆\n' +
      '━━━━━━━━━━━━━━━━━━━━━━━\n\n' +
      '✅ *PALPITE CONFIRMADO!*\n\n' +
      'Olá, *' + nome + '*! Seu pagamento foi recebido e seu palpite está oficialmente registrado no bolão.\n\n' +
      '⚽ *Jogo:*\n' +
      '   ' + teamA + ' x ' + teamB + '\n' +
      (dataJogo ? '   📅 ' + dataJogo + (horaJogo ? ' às ' + horaJogo : '') + '\n' : '') +
      '\n' +
      '🎯 *Seu palpite:*\n' +
      '   ' + teamA + ' *' + goalsA + ' x ' + goalsB + '* ' + teamB + '\n\n' +
      '━━━━━━━━━━━━━━━━━━━━━━━\n' +
      '🍀 *BOA SORTE!!!* 🍀';

    // Formata o número com DDI 55 (Brasil)
    var numero = '55' + whatsapp;

    // Abre o WhatsApp Web no navegador do admin com a mensagem pronta
    var waUrl = 'https://api.whatsapp.com/send?phone=' + numero +
                '&text=' + encodeURIComponent(msg);

    // Exibe um popup no Sheets com o link (o admin clica para abrir)
    var ui = SpreadsheetApp.getUi();
    var html = HtmlService.createHtmlOutput(
      '<html><body style="font-family:Arial,sans-serif;padding:20px;">' +
      '<h3 style="color:#128C7E;">✅ Pagamento confirmado!</h3>' +
      '<p>Clique no botão abaixo para enviar a mensagem de confirmação para <strong>' + nome + '</strong> no WhatsApp:</p>' +
      '<a href="' + waUrl + '" target="_blank" ' +
      'style="display:inline-block;background:#25D366;color:white;padding:12px 24px;' +
      'border-radius:8px;text-decoration:none;font-weight:bold;font-size:15px;">' +
      '📲 Abrir WhatsApp</a>' +
      '<p style="color:#888;font-size:12px;margin-top:16px;">Número: ' + numero + '</p>' +
      '</body></html>'
    ).setWidth(400).setHeight(220);

    ui.showModalDialog(html, '📲 Enviar confirmação — ' + nome);

  } catch (err) {
    // Falha silenciosa para não interromper a edição do admin
    console.error('onEditTrigger error:', err);
  }
}

// ─────────────────────────────────────────────
// ENTRY POINTS
// ─────────────────────────────────────────────

function doGet(e) {
  // Captura o nome do callback JSONP (ex: _gs_169999_123456), se enviado.
  _jsonpCallback = (e.parameter.callback || '').trim() || null;

  var action  = e.parameter.action || '';
  var payload = {};
  if (e.parameter.payload) {
    try { payload = JSON.parse(e.parameter.payload); }
    catch(err) { return jsonResult({ success: false, error: 'payload JSON inválido: ' + err }); }
  }
  return handleRequest(action, payload);
}

function doPost(e) {
  _jsonpCallback = (e.parameter && e.parameter.callback || '').trim() || null;

  var data = {};
  if (e.postData && e.postData.contents) {
    try { data = JSON.parse(e.postData.contents); }
    catch(err) { return jsonResult({ success: false, error: 'body JSON inválido' }); }
  }
  return handleRequest(data.action || '', data);
}

// ─────────────────────────────────────────────
// HANDLER CENTRAL
// ─────────────────────────────────────────────

function handleRequest(action, data) {
  try {
    var ss = SpreadsheetApp.getActiveSpreadsheet();

    if (action === 'GET_MATCHES') {
      return jsonResult({ matches: readSheetAsJson('Matches') });
    }

    if (action === 'GET_SETTINGS') {
      var arr = readSheetAsJson('Settings');
      var settings = {};
      arr.forEach(function(row) { settings[row['key']] = row['value']; });
      return jsonResult({ settings: settings });
    }

    if (action === 'GET_ALL_PREDICTIONS') {
      return jsonResult({ predictions: readSheetAsJson('Predictions') });
    }

    if (action === 'GET_STATS') {
      var matchId = data.matchId;
      var preds   = readSheetAsJson('Predictions');
      var counts  = {};
      preds.forEach(function(p) {
        if (p.matchId == matchId) {
          var key = p.goalsA + '-' + p.goalsB;
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

    if (action === 'SAVE_MATCH') {
      return lockWrapper(function() {
        var sheet = ss.getSheetByName('Matches');
        var m     = data.match;
        var raw   = sheet.getDataRange().getValues();
        var rowIdx = -1;
        for (var i = 1; i < raw.length; i++) {
          if (raw[i][0] == m.id) { rowIdx = i + 1; break; }
        }
        var goalsA = (m.resultGoalsA !== undefined && m.resultGoalsA !== null) ? m.resultGoalsA : '';
        var goalsB = (m.resultGoalsB !== undefined && m.resultGoalsB !== null) ? m.resultGoalsB : '';
        var rowData = [m.id, m.teamA, m.teamAFlag, m.teamB, m.teamBFlag, m.date, m.time, m.stadium, m.round, goalsA, goalsB, m.status || 'PENDING'];
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
        var raw   = sheet.getDataRange().getValues();
        for (var i = 1; i < raw.length; i++) {
          if (raw[i][0] == data.id) { sheet.deleteRow(i + 1); break; }
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
            if (raw[i][0] == k) {
              sheet.getRange(i + 1, 2).setValue(toSave[k]);
              found = true;
              break;
            }
          }
          if (!found) sheet.appendRow([k, toSave[k]]);
        });
        return jsonResult({ success: true });
      });
    }

    if (action === 'SUBMIT_PREDICTION') {
      return lockWrapper(function() {
        var sheet = ss.getSheetByName('Predictions');
        var p     = data.prediction;
        var id    = new Date().getTime();
        sheet.appendRow([
          id,
          p.matchId,
          p.name,
          p.whatsapp,
          p.goalsA,
          p.goalsB,
          'PENDING',
          new Date().toISOString()
        ]);

        // Busca dados do jogo para montar o link de boas-vindas.
        // IMPORTANTE: getUi() NAO funciona em Web App (doGet/doPost).
        // Retornamos waLink para o frontend abrir via window.open().
        var teamA    = 'Time A';
        var teamB    = 'Time B';
        var dataJogo = '';
        var horaJogo = '';
        var matchSheet = ss.getSheetByName('Matches');
        if (matchSheet) {
          var matchRows = matchSheet.getDataRange().getValues();
          for (var mi = 1; mi < matchRows.length; mi++) {
            if (String(matchRows[mi][0]).trim() === String(p.matchId).trim()) {
              teamA    = String(matchRows[mi][1]).trim();
              teamB    = String(matchRows[mi][3]).trim();
              dataJogo = String(matchRows[mi][5]).trim();
              horaJogo = String(matchRows[mi][6]).trim();
              break;
            }
          }
        }

        var numero = '55' + String(p.whatsapp).replace(/\D/g, '');
        var msg =
          '\u26bd *BOLAO COPA 2026* \u26bd\n' +
          '\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\n\n' +
          '\ud83c\udf89 *Seja bem-vindo(a) ao Bolao, ' + p.name + '!*\n\n' +
          'Recebemos seu palpite com sucesso. Agora e so torcer!\n\n' +
          '\ud83c\udfaf *Seu palpite registrado:*\n' +
          '   ' + teamA + ' *' + p.goalsA + ' x ' + p.goalsB + '* ' + teamB + '\n' +
          (dataJogo ? '   \ud83d\udcc5 ' + dataJogo + (horaJogo ? ' as ' + horaJogo : '') + '\n' : '') +
          '\n\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\n' +
          '\ud83d\udcb3 *Para confirmar sua participacao,\nefetue o pagamento via PIX:*\n\n' +
          '\ud83d\udcf1 *Chave PIX (celular):*\n   35991717912\n\n' +
          '\ud83d\udc64 *Favorecido:*\n   Frank de Souza Borges\n\n' +
          'Apos o pagamento, envie o comprovante\npara que seu palpite seja validado.\n\n' +
          '\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\n' +
          '\ud83c\udf40 *BOA SORTE!!!* \ud83c\udf40';

        var waLink = 'https://api.whatsapp.com/send?phone=' + numero +
                     '&text=' + encodeURIComponent(msg);

        return jsonResult({ success: true, predictionId: id, waLink: waLink });
      });
    }

    if (action === 'CONFIRM_PAYMENT') {
      return lockWrapper(function() {
        var sheet    = ss.getSheetByName('Predictions');
        var raw      = sheet.getDataRange().getValues();
        var prediction;
        for (var i = 1; i < raw.length; i++) {
          if (raw[i][0] == data.id) {
            sheet.getRange(i + 1, 7).setValue('PAID');
            prediction = {
              id: raw[i][0], matchId: raw[i][1], name: raw[i][2],
              whatsapp: raw[i][3], goalsA: raw[i][4], goalsB: raw[i][5]
            };
            break;
          }
        }
        if (!prediction) return jsonResult({ waLink: '' });

        var matchSheet = ss.getSheetByName('Matches');
        var matchesRaw = matchSheet.getDataRange().getValues();
        var teamA = 'Time A', teamB = 'Time B';
        for (var j = 1; j < matchesRaw.length; j++) {
          if (matchesRaw[j][0] == prediction.matchId) {
            teamA = matchesRaw[j][1];
            teamB = matchesRaw[j][3];
            break;
          }
        }
        var msg  = 'Olá, ' + prediction.name + '! 🏆 Pagamento confirmado. Palpite: ' + teamA + ' ' + prediction.goalsA + ' x ' + prediction.goalsB + ' ' + teamB + '. Boa sorte!';
        var link = 'https://api.whatsapp.com/send?phone=55' + prediction.whatsapp.replace(/\D/g, '') + '&text=' + encodeURIComponent(msg);
        return jsonResult({ waLink: link });
      });
    }

    return jsonResult({ success: false, error: 'Ação desconhecida: ' + action });

  } catch (error) {
    return jsonResult({ success: false, error: error.toString() });
  }
}

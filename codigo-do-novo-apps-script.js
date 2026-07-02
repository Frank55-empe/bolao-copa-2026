function doGet(e) {
  try {
    const action = e.parameter.action;
    if (!action) return json({ error: 'Ação não fornecida' });

    if (action === 'getSettings' || action === 'config') return getSettings();
    if (action === 'getMatches' || action === 'jogos') return getMatches();
    if (action === 'getUserPredictions') return getUserPredictions(e.parameter.whatsapp);
    if (action === 'getPredictionStats') return getPredictionStats(e.parameter.matchId);
    if (action === 'getRanking' || action === 'ranking') return getRanking();
    if (action === 'getAdminPredictions') return getAdminPredictions();

    return json({ error: 'Ação inválida: ' + action });
  } catch (err) {
    return json({ error: err.message });
  }
}

function doPost(e) {
  try {
    const body = JSON.parse(e.postData.contents);
    const action = body.action;
    if (!action) return json({ error: 'Ação não fornecida no corpo' });

    if (action === 'savePrediction') return savePrediction(body);
    if (action === 'checkDuplicates') return checkDuplicates(body);
    if (action === 'updateSettings') return updateSettings(body);
    if (action === 'confirmPayment') return confirmPayment(body);
    if (action === 'cancelPrediction') return cancelPrediction(body);
    if (action === 'addMatch') return addMatch(body);
    if (action === 'toggleMatch') return toggleMatch(body);
    if (action === 'deleteMatch') return deleteMatch(body);
    if (action === 'setResult') return setResult(body);

    // Compatibilidade com o formato mais antigo
    if (body.nome && body.jogo && body.palpite) {
      return savePredictionLegacy(body);
    }

    return json({ error: 'Ação POST inválida: ' + action });
  } catch (err) {
    return json({ error: err.message });
  }
}

function json(data) {
  return ContentService.createTextOutput(JSON.stringify(data)).setMimeType(ContentService.MimeType.JSON);
}

// ======================== GET MÉTODOS ======================== //

function getSettings() {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('Config');
  if (!sheet) return json({ settings: {} });
  const data = sheet.getDataRange().getValues();
  const settings = {};
  for (let i = 1; i < data.length; i++) {
    settings[data[i][0]] = data[i][1];
  }
  return json({ settings });
}

function getMatches() {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('Jogos');
  if (!sheet) return json({ matches: [] }); // default
  const data = sheet.getDataRange().getValues();
  const matches = [];
  for (let i = 1; i < data.length; i++) {
    matches.push({
      id: data[i][0].toString(),
      teamA: data[i][1],
      teamAFlag: data[i][2],
      teamB: data[i][3],
      teamBFlag: data[i][4],
      date: data[i][5],
      time: data[i][6],
      stadium: data[i][7],
      round: data[i][8],
      isActive: data[i][9] === '' ? 1 : data[i][9],
      isClosed: data[i][10] === '' ? 0 : data[i][10],
      resultA: data[i][11] === '' ? null : data[i][11],
      resultB: data[i][12] === '' ? null : data[i][12]
    });
  }
  return json({ matches });
}

function getUserPredictions(whatsapp) {
  if (!whatsapp) return json([]);
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('Palpites');
  if (!sheet) return json([]);
  const data = sheet.getDataRange().getValues();
  const preds = [];
  for (let i = 1; i < data.length; i++) {
    if (data[i][2] && data[i][2].toString() === whatsapp.toString()) {
      preds.push({
        id: data[i][0],
        match_id: data[i][3]?.toString().split(' ')[0], // improvisado, melhor criar schema limpo
        goalsA: data[i][4],
        goalsB: data[i][5],
        status: data[i][6] || 'PENDING',
        score: data[i][7] || 0
      });
    }
  }
  return json(preds);
}

function getPredictionStats(matchId) {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('Palpites');
  if (!sheet) return json({ stats: [] });
  const data = sheet.getDataRange().getValues();
  const map = {};
  for (let i = 1; i < data.length; i++) {
    if (data[i][6] === 'CONFIRMED' && data[i][3]?.toString() === matchId?.toString()) {
      const gA = data[i][4];
      const gB = data[i][5];
      const k = `${gA}x${gB}`;
      map[k] = (map[k] || 0) + 1;
    }
  }
  const stats = Object.keys(map).map(k => {
    let ptsA = parseInt(k.split('x')[0]);
    let ptsB = parseInt(k.split('x')[1]);
    return {
      resultA: ptsA,
      resultB: ptsB,
      count: map[k]
    }
  });
  return json({ stats });
}

function getRanking() {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('Palpites');
  if (!sheet) return json({ ranking: [] });
  const data = sheet.getDataRange().getValues();
  const users = {};
  for (let i = 1; i < data.length; i++) {
    if (data[i][6] === 'CONFIRMED') {
      const wapp = data[i][2];
      const name = data[i][1];
      const pts = parseInt(data[i][7]) || 0;
      if (!users[wapp]) {
        users[wapp] = { name: name, totalPoints: 0 };
      }
      users[wapp].totalPoints += pts;
    }
  }
  const ranking = Object.values(users).sort((a,b) => b.totalPoints - a.totalPoints);
  return json({ ranking });
}

function getAdminPredictions() {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('Palpites');
  if (!sheet) return json({ predictions: [] });
  const data = sheet.getDataRange().getValues();
  const predictions = [];
  for (let i = 1; i < data.length; i++) {
    predictions.push({
      id: data[i][0], // row number ou id único
      name: data[i][1],
      whatsapp: data[i][2],
      match_id: data[i][3],
      goalsA: data[i][4],
      goalsB: data[i][5],
      status: data[i][6],
      score: data[i][7],
      matchDetails: data[i][8] || data[i][3] // Para o admin ver qual é o jogo
    });
  }
  return json({ predictions });
}

// ======================== POST MÉTODOS ======================== //

function checkDuplicates(body) {
  const { matchId, goalsA, goalsB } = body;
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('Palpites');
  if (!sheet) return json({ count: 0 });
  const data = sheet.getDataRange().getValues();
  let c = 0;
  for (let i = 1; i < data.length; i++) {
    if (data[i][3]?.toString() === matchId?.toString() && data[i][4] == goalsA && data[i][5] == goalsB && data[i][6] !== 'CANCELLED') {
      c++;
    }
  }
  return json({ count: c });
}

function savePrediction(body) {
  const { matchId, name, whatsapp, goalsA, goalsB, teamA, teamB } = body;
  setupSheets();
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('Palpites');
  const id = new Date().getTime();
  const matchDetails = `${teamA} x ${teamB}`;
  sheet.appendRow([id, name, whatsapp, matchId, goalsA, goalsB, 'PENDING', 0, matchDetails]);
  return json({ success: true });
}

function savePredictionLegacy(body) {
  const { nome, whatsapp, jogo, palpite } = body;
  setupSheets();
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('Palpites');
  const id = new Date().getTime();
  let gA = 0; let gB = 0;
  if(palpite && palpite.includes('x')) {
    gA = palpite.split('x')[0].trim();
    gB = palpite.split('x')[1].trim();
  }
  sheet.appendRow([id, nome, whatsapp, jogo, gA, gB, 'PENDING', 0, jogo]);
  return json({ success: true, legacy: true });
}

function updateSettings(settings) {
  setupSheets();
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('Config');
  sheet.clear();
  sheet.appendRow(['Chave', 'Valor']);
  for (let k in settings) {
    sheet.appendRow([k, settings[k]]);
  }
  return json({ success: true });
}

function confirmPayment(body) {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('Palpites');
  const data = sheet.getDataRange().getValues();
  let number = "";
  for (let i = 1; i < data.length; i++) {
    if (data[i][0]?.toString() === body.id?.toString()) {
      sheet.getRange(i + 1, 7).setValue('CONFIRMED');
      number = data[i][2];
      break;
    }
  }
  let link = "";
  if (number) {
    link = "https://wa.me/" + number.replace(/\D/g,'') + "?text=" + encodeURIComponent("Seu palpite foi confirmado com sucesso!");
  }
  return json({ success: true, waLink: link });
}

function cancelPrediction(body) {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('Palpites');
  const data = sheet.getDataRange().getValues();
  for (let i = 1; i < data.length; i++) {
    if (data[i][0]?.toString() === body.id?.toString()) {
      sheet.deleteRow(i + 1);
      break;
    }
  }
  return json({ success: true });
}

function addMatch(body) {
  setupSheets();
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('Jogos');
  const id = new Date().getTime();
  const defaultFlag = 'https://upload.wikimedia.org/wikipedia/commons/e/e8/Flaticon_flag.svg';
  sheet.appendRow([
    id, 
    body.teamA, 
    body.teamAFlag || defaultFlag, 
    body.teamB, 
    body.teamBFlag || defaultFlag, 
    body.date, 
    body.time, 
    body.stadium, 
    body.round, 
    1, 
    0, 
    '', 
    ''
  ]);
  return json({ success: true });
}

function toggleMatch(body) {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('Jogos');
  const data = sheet.getDataRange().getValues();
  for (let i = 1; i < data.length; i++) {
    if (data[i][0]?.toString() === body.matchId?.toString()) {
      sheet.getRange(i + 1, 10).setValue(body.isActive ? 1 : 0);
      break;
    }
  }
  return json({ success: true });
}

function deleteMatch(body) {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('Jogos');
  const data = sheet.getDataRange().getValues();
  for (let i = 1; i < data.length; i++) {
    if (data[i][0]?.toString() === body.id?.toString()) {
      sheet.deleteRow(i + 1);
      break;
    }
  }
  return json({ success: true });
}

function setResult(body) {
  const { matchId, resultA, resultB } = body;
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('Jogos');
  const matches = sheet.getDataRange().getValues();
  for (let i = 1; i < matches.length; i++) {
    if (matches[i][0]?.toString() === matchId?.toString()) {
      sheet.getRange(i + 1, 12).setValue(resultA); // resultA
      sheet.getRange(i + 1, 13).setValue(resultB); // resultB
      sheet.getRange(i + 1, 11).setValue(1); // isClosed = true
      break;
    }
  }
  
  // Atualizar pontos nos Palpites
  const pSheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('Palpites');
  if(!pSheet) return json({success: true});
  const pData = pSheet.getDataRange().getValues();
  for (let i = 1; i < pData.length; i++) {
    if (pData[i][3]?.toString() === matchId?.toString() && pData[i][6] === 'CONFIRMED') {
      const goalsA = parseInt(pData[i][4]);
      const goalsB = parseInt(pData[i][5]);
      let pts = 0;
      if (goalsA === parseInt(resultA) && goalsB === parseInt(resultB)) {
         pts = 3; // na mosca
      } else if (Math.sign(goalsA - goalsB) === Math.sign(resultA - resultB)) {
         pts = 1; // acertou o vencedor
      }
      pSheet.getRange(i+1, 8).setValue(pts);
    }
  }
  
  return json({ success: true });
}

// INICIALIZADOR DE ABAS 
function setupSheets() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  
  let p = ss.getSheetByName('Palpites');
  if(!p) {
    p = ss.insertSheet('Palpites');
    p.appendRow(['ID', 'Nome', 'Whatsapp', 'MatchID', 'GoalsA', 'GoalsB', 'Status', 'Score', 'Details']);
  }
  
  let j = ss.getSheetByName('Jogos');
  if(!j) {
    j = ss.insertSheet('Jogos');
    j.appendRow(['ID', 'TeamA', 'FlagA', 'TeamB', 'FlagB', 'Date', 'Time', 'Stadium', 'Round', 'IsActive', 'IsClosed', 'ResultA', 'ResultB']);
    const defaultId = new Date().getTime() || 'brazil_game_1';
    j.appendRow([
      defaultId,
      'Brasil',
      'https://upload.wikimedia.org/wikipedia/en/0/05/Flag_of_Brazil.svg',
      'Suíça',
      'https://upload.wikimedia.org/wikipedia/commons/f/f3/Flag_of_Switzerland.svg',
      '10/06/2026',
      '16:00',
      'Estádio MetLife - NY',
      'Fase de Grupos',
      1,
      0,
      '',
      ''
    ]);
  }
  
  let c = ss.getSheetByName('Config');
  if(!c) {
    c = ss.insertSheet('Config');
    c.appendRow(['Chave', 'Valor']);
    c.appendRow(['active_match_id', '']);
    c.appendRow(['pix_key', '']);
    c.appendRow(['pix_value', '']);
  }
}

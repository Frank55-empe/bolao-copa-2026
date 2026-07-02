export async function syncDataToSheets(spreadsheetId: string, accessToken: string, matches: any[], predictions: any[], settings: any) {
  const SPREADSHEETS_URL = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}`;

  // 1. Get Spreadsheet Metadata to check if tabs exist
  let metaRes = await fetch(SPREADSHEETS_URL, {
    headers: { Authorization: `Bearer ${accessToken}` }
  });
  
  if (!metaRes.ok) {
    throw new Error('Failed to fetch spreadsheet. Check if ID is correct and you have permission.');
  }
  
  const meta = await metaRes.json();
  const existingSheets = meta.sheets.map((s: any) => s.properties.title);
  
  const requiredSheets = ['Palpites', 'Jogos', 'Configuracoes'];
  const missingSheets = requiredSheets.filter(s => !existingSheets.includes(s));
  
  // 2. Create missing sheets
  if (missingSheets.length > 0) {
    const requests = missingSheets.map(title => ({
      addSheet: { properties: { title } }
    }));
    const batchUpdateRes = await fetch(`${SPREADSHEETS_URL}:batchUpdate`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ requests })
    });
    if (!batchUpdateRes.ok) {
      throw new Error('Failed to create missing tabs in the spreadsheet.');
    }
  }

  // 3. Prepare data
  // - Palpites
  const palpitesHeader = ['Id', 'Data', 'Nome', 'WhatsApp', 'Jogo do dia', 'Palpite', 'Status Pix'];
  const palpitesRows = predictions.map(p => {
    let dateStr = '';
    if (p.createdAt) {
      dateStr = new Date(p.createdAt + (p.createdAt.includes('Z') ? '' : 'Z')).toLocaleString('pt-BR');
    }
    return [
      String(p.id || ''),
      dateStr,
      String(p.name || ''),
      String(p.whatsapp || ''),
      `${p.teamA || ''} x ${p.teamB || ''}`,
      `${p.goalsA}x${p.goalsB}`,
      p.statusPix === 'PAID' ? 'Pago' : 'Pendente'
    ];
  });
  const palpitesData = [palpitesHeader, ...palpitesRows];

  // - Jogos
  const jogosHeader = ['Id', 'Time A', 'Time B', 'Data', 'Horario', 'Estadio', 'Rodada', 'Resultado', 'Status'];
  const jogosRows = matches.map(m => [
    m.id,
    m.teamA,
    m.teamB,
    m.date,
    m.time,
    m.stadium,
    m.round,
    m.isClosed === 1 ? `${m.resultA} x ${m.resultB}` : 'Aberto',
    m.isActive === 1 ? 'No Bolao' : 'Inativo'
  ]);
  const jogosData = [jogosHeader, ...jogosRows];

  // - Configs
  const configHeader = ['Chave', 'Valor'];
  const configRows = Object.keys(settings).map(key => [key, settings[key]]);
  const configData = [configHeader, ...configRows];

  // 4. Update cells (this overwrites existing data in these ranges)
  const updateData = [
    { range: 'Palpites!A1', values: palpitesData },
    { range: 'Jogos!A1', values: jogosData },
    { range: 'Configuracoes!A1', values: configData }
  ];

  // Before updating, it's good to clear the ranges to avoid orphaned old rows 
  // but for simplicity, we'll just overwrite. If the new data is shorter, old rows remain.
  // Let's clear first using batchClear:
  await fetch(`${SPREADSHEETS_URL}/values:batchClear`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      ranges: ['Palpites!A:H', 'Jogos!A:I', 'Configuracoes!A:B']
    })
  });

  const updateRes = await fetch(`${SPREADSHEETS_URL}/values:batchUpdate`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      valueInputOption: 'USER_ENTERED',
      data: updateData
    })
  });

  if (!updateRes.ok) {
    const err = await updateRes.json();
    console.warn('Update error:', err);
    throw new Error('Failed to update spreadsheet data.');
  }

  return true;
}

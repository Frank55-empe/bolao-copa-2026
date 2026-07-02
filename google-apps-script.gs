/**
 * BOLÃO BRASIL 2026 - GOOGLE APPS SCRIPT
 * 
 * Instruções:
 * 1. Crie uma nova planilha no Google Sheets (planilhas.google.com).
 * 2. Renomeie a primeira aba (Página 1) para 'Palpites'.
 * 3. Coloque os seguintes cabeçalhos na linha 1 (A1 até G1):
 *    Data/Hora | Nome | WhatsApp | Jogo | Palpite | Quantidade Iguais | Status PIX
 * 4. Vá em 'Extensões' > 'Apps Script'.
 * 5. Cole o código abaixo, substituindo tudo que estiver lá.
 * 6. Clique em 'Implantar' > 'Nova implantação'.
 * 7. Tipo: 'App da Web'. 
 *    Acesso: 'Qualquer pessoa'.
 * 8. Copie a URL do App da Web e integre no seu front-end original.
 * 
 * NOTA: O applet do AI Studio já possui um backend em Express.ts funcionando perfeitamente 
 * com SQLite para demonstração local. Este script é fornecido conforme solicitado nas 
 * instruções, caso você queira fazer o deploy na sua própria infraestrutura usando Sheets.
 */

const SHEET_NAME = 'Palpites';

function doPost(e) {
  try {
    const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEET_NAME);
    
    // Parse the incoming JSON body
    const data = JSON.parse(e.postData.contents);
    const { nome, whatsapp, jogo, golsBrasil, golsAdversario, quantidadeIguais, statusPix } = data;
    const palpite = `Brasil ${golsBrasil} x ${golsAdversario} Adversário`;
    const dataHora = new Date().toLocaleString("pt-BR");
    
    // Append the row
    sheet.appendRow([
      dataHora,
      nome,
      whatsapp,
      jogo,
      palpite,
      quantidadeIguais || 0,
      statusPix || 'PENDENTE'
    ]);
    
    return ContentService.createTextOutput(JSON.stringify({
      success: true,
      message: "Palpite salvo com sucesso."
    })).setMimeType(ContentService.MimeType.JSON);
    
  } catch (error) {
    return ContentService.createTextOutput(JSON.stringify({
      success: false,
      error: error.message
    })).setMimeType(ContentService.MimeType.JSON);
  }
}

// Para verificação de repetidos
function doGet(e) {
  try {
    const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEET_NAME);
    const params = e.parameter;
    const jogoInfo = params.jogo;
    let golsBr = params.golsBrasil;
    let golsAdv = params.golsAdversario;
    
    if (!jogoInfo) {
       return ContentService.createTextOutput(JSON.stringify({
         success: false,
         error: "Parâmetro jogo não fornecido para checagem."
       })).setMimeType(ContentService.MimeType.JSON);
    }
    
    const data = sheet.getDataRange().getValues();
    let contagem = 0;
    const palpiteFormatado = `Brasil ${golsBr} x ${golsAdv} Adversário`;

    // Ignora cabeçalho (i=1)
    for (let i = 1; i < data.length; i++) {
      if (data[i][3] == jogoInfo && data[i][4] == palpiteFormatado) {
        contagem++;
      }
    }
    
    return ContentService.createTextOutput(JSON.stringify({
      success: true,
      count: contagem
    })).setMimeType(ContentService.MimeType.JSON);
    
  } catch (error) {
    return ContentService.createTextOutput(JSON.stringify({
      success: false,
      error: error.message
    })).setMimeType(ContentService.MimeType.JSON);
  }
}

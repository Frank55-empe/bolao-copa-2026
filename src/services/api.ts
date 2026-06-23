// ─── Tipos ───────────────────────────────────────────────────────────────────
export type MatchData = {
  id: string;
  teamA: string; teamAFlag: string;
  teamB: string; teamBFlag: string;
  date: string; time: string;
  stadium: string; round: string;
  resultGoalsA?: number; resultGoalsB?: number;
  status?: 'PENDING' | 'FINISHED';
};

export type Prediction = {
  id: number; matchId: string;
  name: string; whatsapp: string;
  goalsA: number; goalsB: number;
  teamA?: string; teamB?: string;
  teamAFlag?: string; teamBFlag?: string;
  date?: string; time?: string;
  statusPix: string; createdAt: string;
};

// ─── Bandeiras via flagcdn.com ────────────────────────────────────────────────
const F: Record<string,string> = {
  'México':          'https://flagcdn.com/w160/mx.png',
  'África do Sul':   'https://flagcdn.com/w160/za.png',
  'Coreia do Sul':   'https://flagcdn.com/w160/kr.png',
  'Tchéquia':        'https://flagcdn.com/w160/cz.png',
  'Canadá':          'https://flagcdn.com/w160/ca.png',
  'Bósnia':          'https://flagcdn.com/w160/ba.png',
  'EUA':             'https://flagcdn.com/w160/us.png',
  'Paraguai':        'https://flagcdn.com/w160/py.png',
  'Catar':           'https://flagcdn.com/w160/qa.png',
  'Suíça':           'https://flagcdn.com/w160/ch.png',
  'Brasil':          'https://flagcdn.com/w160/br.png',
  'Marrocos':        'https://flagcdn.com/w160/ma.png',
  'Haiti':           'https://flagcdn.com/w160/ht.png',
  'Escócia':         'https://flagcdn.com/w160/gb-sct.png',
  'Alemanha':        'https://flagcdn.com/w160/de.png',
  'Curaçao':         'https://flagcdn.com/w160/cw.png',
  'Holanda':         'https://flagcdn.com/w160/nl.png',
  'Japão':           'https://flagcdn.com/w160/jp.png',
  'Costa do Marfim': 'https://flagcdn.com/w160/ci.png',
  'Equador':         'https://flagcdn.com/w160/ec.png',
  'Suécia':          'https://flagcdn.com/w160/se.png',
  'Tunísia':         'https://flagcdn.com/w160/tn.png',
  'Espanha':         'https://flagcdn.com/w160/es.png',
  'Cabo Verde':      'https://flagcdn.com/w160/cv.png',
  'Bélgica':         'https://flagcdn.com/w160/be.png',
  'Egito':           'https://flagcdn.com/w160/eg.png',
  'Arábia Saudita':  'https://flagcdn.com/w160/sa.png',
  'Uruguai':         'https://flagcdn.com/w160/uy.png',
  'Irã':             'https://flagcdn.com/w160/ir.png',
  'Nova Zelândia':   'https://flagcdn.com/w160/nz.png',
  'França':          'https://flagcdn.com/w160/fr.png',
  'Senegal':         'https://flagcdn.com/w160/sn.png',
  'Iraque':          'https://flagcdn.com/w160/iq.png',
  'Noruega':         'https://flagcdn.com/w160/no.png',
  'Argentina':       'https://flagcdn.com/w160/ar.png',
  'Argélia':         'https://flagcdn.com/w160/dz.png',
  'Áustria':         'https://flagcdn.com/w160/at.png',
  'Jordânia':        'https://flagcdn.com/w160/jo.png',
  'Portugal':        'https://flagcdn.com/w160/pt.png',
  'Rep. D. Congo':   'https://flagcdn.com/w160/cd.png',
  'Uzbequistão':     'https://flagcdn.com/w160/uz.png',
  'Colômbia':        'https://flagcdn.com/w160/co.png',
  'Inglaterra':      'https://flagcdn.com/w160/gb-eng.png',
  'Croácia':         'https://flagcdn.com/w160/hr.png',
  'Gana':            'https://flagcdn.com/w160/gh.png',
  'Panamá':          'https://flagcdn.com/w160/pa.png',
  'Austrália':       'https://flagcdn.com/w160/au.png',
  'Turquia':         'https://flagcdn.com/w160/tr.png',
};

// ─── Helper ───────────────────────────────────────────────────────────────────
function m(id: string, gA: string, tA: string, tB: string, gB: string,
           date: string, time: string, stadium: string, round: string): MatchData {
  return { id, teamA: tA, teamAFlag: F[tA]||'', teamB: tB, teamBFlag: F[tB]||'',
           date, time, stadium, round, status: 'PENDING' };
}

// ─── Jogos reais da Copa 2026 — Fase de Grupos completa ─────────────────────
// Horários em BRT (Brasília = ET + 1h)
const initialMatches: MatchData[] = [
  // GRUPO A
  m('m01','A','México','África do Sul',     '','11/06/2026','16:00','Estadio Azteca, Cidade do México','Grupo A'),
  m('m02','A','Coreia do Sul','Tchéquia',   '','11/06/2026','23:00','Estadio Akron, Zapopan',          'Grupo A'),
  m('m03','A','Tchéquia','África do Sul',   '','18/06/2026','13:00','Mercedes-Benz Stadium, Atlanta',  'Grupo A'),
  m('m04','A','México','Coreia do Sul',     '','18/06/2026','22:00','Estadio Akron, Zapopan',          'Grupo A'),
  m('m05','A','Tchéquia','México',          '','25/06/2026','22:00','Estadio Azteca, Cidade do México','Grupo A'),
  m('m06','A','África do Sul','Coreia do Sul','','25/06/2026','22:00','Estadio BBVA, Monterrey',       'Grupo A'),

  // GRUPO B
  m('m07','B','Canadá','Bósnia',            '','12/06/2026','16:00','BMO Field, Toronto',              'Grupo B'),
  m('m08','B','Catar','Suíça',              '','13/06/2026','16:00','Levi\'s Stadium, Santa Clara',    'Grupo B'),
  m('m09','B','Suíça','Bósnia',             '','18/06/2026','16:00','SoFi Stadium, Los Angeles',       'Grupo B'),
  m('m10','B','Canadá','Catar',             '','18/06/2026','19:00','BC Place, Vancouver',             'Grupo B'),
  m('m11','B','Suíça','Canadá',             '','24/06/2026','16:00','BC Place, Vancouver',             'Grupo B'),
  m('m12','B','Bósnia','Catar',             '','24/06/2026','16:00','Lumen Field, Seattle',            'Grupo B'),

  // GRUPO C
  m('m13','C','Brasil','Marrocos',          '','13/06/2026','20:00','MetLife Stadium, Nova Jersey',    'Grupo C'),
  m('m14','C','Haiti','Escócia',            '','13/06/2026','23:00','Gillette Stadium, Foxborough',    'Grupo C'),
  m('m15','C','Escócia','Marrocos',         '','19/06/2026','19:00','Gillette Stadium, Foxborough',    'Grupo C'),
  m('m16','C','Brasil','Haiti',             '','19/06/2026','21:30','Lincoln Financial Field, Filadélfia','Grupo C'),
  m('m17','C','Escócia','Brasil',           '','24/06/2026','19:00','Hard Rock Stadium, Miami',        'Grupo C'),
  m('m18','C','Marrocos','Haiti',           '','24/06/2026','19:00','Mercedes-Benz Stadium, Atlanta',  'Grupo C'),

  // GRUPO D
  m('m19','D','EUA','Paraguai',             '','12/06/2026','22:00','SoFi Stadium, Los Angeles',       'Grupo D'),
  m('m20','D','EUA','Austrália',            '','19/06/2026','16:00','Lumen Field, Seattle',            'Grupo D'),
  m('m21','D','Turquia','Paraguai',         '','19/06/2026','23:00','Levi\'s Stadium, Santa Clara',    'Grupo D'),
  m('m22','D','Turquia','EUA',              '','25/06/2026','23:00','SoFi Stadium, Los Angeles',       'Grupo D'),
  m('m23','D','Paraguai','Austrália',       '','25/06/2026','23:00','Levi\'s Stadium, Santa Clara',    'Grupo D'),

  // GRUPO E
  m('m24','E','Alemanha','Curaçao',         '','14/06/2026','15:00','Houston Stadium, Houston',        'Grupo E'),
  m('m25','E','Costa do Marfim','Equador',  '','14/06/2026','21:00','Philadelphia Stadium, Filadélfia','Grupo E'),
  m('m26','E','Alemanha','Costa do Marfim', '','20/06/2026','17:00','BMO Field, Toronto',              'Grupo E'),
  m('m27','E','Equador','Curaçao',          '','20/06/2026','21:00','Arrowhead Stadium, Kansas City',  'Grupo E'),
  m('m28','E','Equador','Alemanha',         '','25/06/2026','17:00','MetLife Stadium, Nova Jersey',    'Grupo E'),
  m('m29','E','Curaçao','Costa do Marfim',  '','25/06/2026','17:00','Lincoln Financial Field, Filadélfia','Grupo E'),

  // GRUPO F
  m('m30','F','Holanda','Japão',            '','14/06/2026','18:00','Dallas Stadium, Arlington',       'Grupo F'),
  m('m31','F','Suécia','Tunísia',           '','14/06/2026','23:00','Estadio BBVA, Monterrey',         'Grupo F'),
  m('m32','F','Holanda','Suécia',           '','20/06/2026','14:00','NRG Stadium, Houston',            'Grupo F'),
  m('m33','F','Tunísia','Japão',            '','21/06/2026','01:00','Estadio BBVA, Monterrey',         'Grupo F'),
  m('m34','F','Japão','Suécia',             '','25/06/2026','20:00','AT&T Stadium, Arlington',         'Grupo F'),
  m('m35','F','Tunísia','Holanda',          '','25/06/2026','20:00','Arrowhead Stadium, Kansas City',  'Grupo F'),

  // GRUPO G
  m('m36','G','Bélgica','Egito',            '','15/06/2026','16:00','Lumen Field, Seattle',            'Grupo G'),
  m('m37','G','Irã','Nova Zelândia',        '','15/06/2026','22:00','SoFi Stadium, Los Angeles',       'Grupo G'),
  m('m38','G','Bélgica','Irã',              '','21/06/2026','16:00','SoFi Stadium, Los Angeles',       'Grupo G'),
  m('m39','G','Nova Zelândia','Egito',      '','21/06/2026','22:00','BC Place, Vancouver',             'Grupo G'),
  m('m40','G','Egito','Irã',               '','26/06/2026','23:00','Lumen Field, Seattle',            'Grupo G'),
  m('m41','G','Nova Zelândia','Bélgica',    '','26/06/2026','23:00','BC Place, Vancouver',             'Grupo G'),

  // GRUPO H
  m('m42','H','Espanha','Cabo Verde',       '','15/06/2026','13:00','Mercedes-Benz Stadium, Atlanta',  'Grupo H'),
  m('m43','H','Arábia Saudita','Uruguai',   '','15/06/2026','19:00','Hard Rock Stadium, Miami',        'Grupo H'),
  m('m44','H','Espanha','Arábia Saudita',   '','21/06/2026','13:00','Mercedes-Benz Stadium, Atlanta',  'Grupo H'),
  m('m45','H','Uruguai','Cabo Verde',       '','21/06/2026','19:00','Hard Rock Stadium, Miami',        'Grupo H'),
  m('m46','H','Cabo Verde','Arábia Saudita','','26/06/2026','21:00','NRG Stadium, Houston',            'Grupo H'),
  m('m47','H','Uruguai','Espanha',          '','26/06/2026','21:00','Estadio Akron, Zapopan',          'Grupo H'),

  // GRUPO I
  m('m48','I','França','Senegal',           '','16/06/2026','16:00','MetLife Stadium, Nova Jersey',    'Grupo I'),
  m('m49','I','Iraque','Noruega',           '','16/06/2026','19:00','Gillette Stadium, Foxborough',    'Grupo I'),
  m('m50','I','França','Iraque',            '','22/06/2026','18:00','Lincoln Financial Field, Filadélfia','Grupo I'),
  m('m51','I','Noruega','Senegal',          '','22/06/2026','21:00','MetLife Stadium, Nova Jersey',    'Grupo I'),
  m('m52','I','Noruega','França',           '','26/06/2026','16:00','Gillette Stadium, Foxborough',    'Grupo I'),
  m('m53','I','Senegal','Iraque',           '','26/06/2026','16:00','BMO Field, Toronto',              'Grupo I'),

  // GRUPO J
  m('m54','J','Argentina','Argélia',        '','16/06/2026','22:00','Arrowhead Stadium, Kansas City',  'Grupo J'),
  m('m55','J','Áustria','Jordânia',         '','17/06/2026','01:00','Levi\'s Stadium, Santa Clara',    'Grupo J'),
  m('m56','J','Argentina','Áustria',        '','22/06/2026','14:00','AT&T Stadium, Arlington',         'Grupo J'),
  m('m57','J','Jordânia','Argélia',         '','22/06/2026','23:00','Levi\'s Stadium, Santa Clara',    'Grupo J'),
  m('m58','J','Argélia','Áustria',          '','27/06/2026','23:00','Arrowhead Stadium, Kansas City',  'Grupo J'),
  m('m59','J','Jordânia','Argentina',       '','27/06/2026','23:00','AT&T Stadium, Arlington',         'Grupo J'),

  // GRUPO K
  m('m60','K','Portugal','Rep. D. Congo',   '','17/06/2026','14:00','NRG Stadium, Houston',            'Grupo K'),
  m('m61','K','Uzbequistão','Colômbia',     '','17/06/2026','23:00','Estadio Azteca, Cidade do México','Grupo K'),
  m('m62','K','Portugal','Uzbequistão',     '','23/06/2026','14:00','NRG Stadium, Houston',            'Grupo K'),
  m('m63','K','Colômbia','Rep. D. Congo',   '','23/06/2026','23:00','Estadio Akron, Zapopan',          'Grupo K'),
  m('m64','K','Colômbia','Portugal',        '','27/06/2026','20:30','Hard Rock Stadium, Miami',        'Grupo K'),
  m('m65','K','Rep. D. Congo','Uzbequistão','','27/06/2026','20:30','Mercedes-Benz Stadium, Atlanta',  'Grupo K'),

  // GRUPO L
  m('m66','L','Inglaterra','Croácia',       '','17/06/2026','17:00','AT&T Stadium, Arlington',         'Grupo L'),
  m('m67','L','Gana','Panamá',              '','17/06/2026','20:00','BMO Field, Toronto',              'Grupo L'),
  m('m68','L','Inglaterra','Gana',          '','23/06/2026','17:00','Gillette Stadium, Foxborough',    'Grupo L'),
  m('m69','L','Panamá','Croácia',           '','23/06/2026','20:00','BMO Field, Toronto',              'Grupo L'),
  m('m70','L','Panamá','Inglaterra',        '','27/06/2026','18:00','MetLife Stadium, Nova Jersey',    'Grupo L'),
  m('m71','L','Croácia','Gana',             '','27/06/2026','18:00','Lincoln Financial Field, Filadélfia','Grupo L'),
];

const INITIAL_SETTINGS = {
  pix_value: '30.00',
  pix_key: '00020126360014br.gov.bcb.pix0114+5535991717912520400005303986540530.005802BR5921FRANK DE SOUZA BORGES6006LAVRAS62060502Br63042ADA',
  active_match_id: 'm13',
  regulamento: '1. Cada palpite custa o valor definido por aposta.\n2. O palpite só será validado após a confirmação do pagamento via PIX.\n3. A premiação corresponde a 80% do valor arrecadado.\n4. Limite de 5 palpites idênticos por partida.\n5. Prazo: até 10 minutos antes do jogo.\n6. Prêmio dividido entre acertadores.\n7. Sem acertadores, o prêmio acumula para a próxima rodada.',
  admin_phone: '35991717912',
  accumulated_amount: '0.00',
};

// ─── URL do Apps Script ───────────────────────────────────────────────────────
export const SHEETS_API_URL =
  (import.meta.env.VITE_SHEETS_API_URL as string) ||
  'https://script.google.com/macros/s/AKfycbxKLOUMKvXh4fP86rtK6fvgPGRFSJ5ZfBoYJKdNUPq1VvcTmGBiOtPrOY8gxKmsdZ3C/exec';

// ─── JSONP helper — contorna CORS do Google Apps Script ──────────────────────
function jsonp(action: string, payload?: any): Promise<any> {
  return new Promise((resolve, reject) => {
    const cbName = `_cb_${Date.now()}_${Math.floor(Math.random() * 1e6)}`;
    const timer  = setTimeout(() => { cleanup(); reject(new Error(`Timeout: ${action}`)); }, 20000);

    function cleanup() {
      clearTimeout(timer);
      delete (window as any)[cbName];
      document.getElementById(cbName)?.remove();
    }

    (window as any)[cbName] = (data: any) => { cleanup(); resolve(data); };

    const params = new URLSearchParams({ action, callback: cbName });
    if (payload) params.set('payload', JSON.stringify(payload));

    const s = document.createElement('script');
    s.id  = cbName;
    s.src = `${SHEETS_API_URL}?${params}`;
    s.onerror = () => { cleanup(); reject(new Error(`Erro de rede: ${action}`)); };
    document.head.appendChild(s);
  });
}

// ─── Limpa espaços vindos do Sheets ──────────────────────────────────────────
function cleanObj(obj: any): any {
  if (!obj || typeof obj !== 'object') return obj;
  const out: any = {};
  Object.keys(obj).forEach(k => {
    const val = obj[k];
    out[k.trim()] = typeof val === 'string' ? val.trim() : val;
  });
  return out;
}

// ─── API ─────────────────────────────────────────────────────────────────────
class ApiService {

  // MATCHES
  async getMatches(): Promise<MatchData[]> {
    try {
      const data = await jsonp('GET_MATCHES');
      if (data?.matches?.length) {
        return data.matches.map(cleanObj);
      }
    } catch (e) { console.warn('[API] getMatches falhou, usando hardcoded', e); }
    return initialMatches;
  }

  async saveMatch(match: MatchData): Promise<void> {
    await jsonp('SAVE_MATCH', { match });
  }

  async deleteMatch(id: string): Promise<void> {
    await jsonp('DELETE_MATCH', { id });
  }

  // SETTINGS
  async getSettings(): Promise<any> {
    try {
      const data = await jsonp('GET_SETTINGS');
      if (data?.settings) {
        const s = cleanObj(data.settings);
        return { ...INITIAL_SETTINGS, ...s };
      }
    } catch (e) { console.warn('[API] getSettings falhou', e); }
    return INITIAL_SETTINGS;
  }

  async saveSettings(update: any): Promise<void> {
    await jsonp('SAVE_SETTINGS', { settings: update });
  }

  // PREDICTIONS
  async getAllPredictions(): Promise<Prediction[]> {
    try {
      const data = await jsonp('GET_ALL_PREDICTIONS');
      if (data?.predictions) {
        return data.predictions.map((p: any) => {
          const c = cleanObj(p);
          c.goalsA = Number(c.goalsA);
          c.goalsB = Number(c.goalsB);
          return c;
        });
      }
    } catch (e) { console.warn('[API] getAllPredictions falhou', e); }
    return [];
  }

  async getUserPredictions(whatsapp: string): Promise<Prediction[]> {
    const [all, matches] = await Promise.all([this.getAllPredictions(), this.getMatches()]);
    return all
      .filter(p => String(p.whatsapp).replace(/\D/g,'') === String(whatsapp).replace(/\D/g,''))
      .map(p => {
        const mx = matches.find(mx => String(mx.id).trim() === String(p.matchId).trim()) || {} as MatchData;
        return { ...p, teamA: mx.teamA||p.teamA, teamB: mx.teamB||p.teamB,
                        teamAFlag: mx.teamAFlag||p.teamAFlag, teamBFlag: mx.teamBFlag||p.teamBFlag,
                        date: mx.date||p.date, time: mx.time||p.time };
      });
  }

  async checkDuplicates(matchId: string, goalsA: number, goalsB: number): Promise<number> {
    try {
      const data = await jsonp('CHECK_DUPLICATES', { matchId, goalsA, goalsB });
      return Number(data?.count) || 0;
    } catch { return 0; }
  }

  async submitPrediction(pred: Omit<Prediction,'id'|'statusPix'|'createdAt'>): Promise<{ success: boolean; predictionId: number }> {
    try {
      const result = await jsonp('SUBMIT_PREDICTION', { prediction: pred });
      if (result?.success) {
        return { success: true, predictionId: Number(result.predictionId) || 0 };
      }
      console.error('[API] SUBMIT_PREDICTION retornou erro:', result);
      return { success: false, predictionId: 0 };
    } catch (err) {
      console.error('[API] submitPrediction exception:', err);
      return { success: false, predictionId: 0 };
    }
  }

  async confirmPayment(id: number): Promise<{ waLink?: string }> {
    try {
      const result = await jsonp('CONFIRM_PAYMENT', { id });
      return { waLink: result?.waLink || '' };
    } catch { return {}; }
  }

  async getPredictionStats(matchId: string): Promise<any[]> {
    try {
      const data = await jsonp('GET_STATS', { matchId });
      return data?.stats || [];
    } catch { return []; }
  }
}

export const api = new ApiService();

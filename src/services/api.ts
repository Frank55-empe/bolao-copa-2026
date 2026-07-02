// ─────────────────────────────────────────────────────────────────────────────
// BOLÃO COPA 2026 — API SERVICE
// ─────────────────────────────────────────────────────────────────────────────

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

// ─── Jogos hardcoded (fallback se planilha não responder) ────────────────────
const FALLBACK_MATCHES: MatchData[] = [
  { id:'m1',  teamA:'México',        teamAFlag:'https://flagcdn.com/w160/mx.png',     teamB:'África do Sul', teamBFlag:'https://flagcdn.com/w160/za.png',     date:'11/06/2026',time:'16:00',stadium:'Estadio Azteca, Cidade do México',          round:'Grupo A',status:'PENDING'},
  { id:'m2',  teamA:'Coreia do Sul', teamAFlag:'https://flagcdn.com/w160/kr.png',     teamB:'Tchéquia',      teamBFlag:'https://flagcdn.com/w160/cz.png',     date:'11/06/2026',time:'23:00',stadium:'Estadio Akron, Zapopan',                   round:'Grupo A',status:'PENDING'},
  { id:'m3',  teamA:'Canadá',        teamAFlag:'https://flagcdn.com/w160/ca.png',     teamB:'Bósnia',        teamBFlag:'https://flagcdn.com/w160/ba.png',     date:'12/06/2026',time:'16:00',stadium:'BMO Field, Toronto',                        round:'Grupo B',status:'PENDING'},
  { id:'m4',  teamA:'EUA',           teamAFlag:'https://flagcdn.com/w160/us.png',     teamB:'Paraguai',      teamBFlag:'https://flagcdn.com/w160/py.png',     date:'12/06/2026',time:'22:00',stadium:'SoFi Stadium, Los Angeles',                 round:'Grupo D',status:'PENDING'},
  { id:'m5',  teamA:'Catar',         teamAFlag:'https://flagcdn.com/w160/qa.png',     teamB:'Suíça',         teamBFlag:'https://flagcdn.com/w160/ch.png',     date:'13/06/2026',time:'16:00',stadium:"Levi's Stadium, Santa Clara",               round:'Grupo B',status:'PENDING'},
  { id:'m6',  teamA:'Brasil',        teamAFlag:'https://flagcdn.com/w160/br.png',     teamB:'Marrocos',      teamBFlag:'https://flagcdn.com/w160/ma.png',     date:'13/06/2026',time:'19:00',stadium:'MetLife Stadium, Nova Jersey',              round:'Grupo C',status:'PENDING'},
  { id:'m7',  teamA:'Haiti',         teamAFlag:'https://flagcdn.com/w160/ht.png',     teamB:'Escócia',       teamBFlag:'https://flagcdn.com/w160/gb-sct.png', date:'13/06/2026',time:'22:00',stadium:'Gillette Stadium, Foxborough',             round:'Grupo C',status:'PENDING'},
  { id:'m8',  teamA:'Alemanha',      teamAFlag:'https://flagcdn.com/w160/de.png',     teamB:'Curaçao',       teamBFlag:'https://flagcdn.com/w160/cw.png',     date:'14/06/2026',time:'14:00',stadium:'NRG Stadium, Houston',                     round:'Grupo E',status:'PENDING'},
  { id:'m9',  teamA:'Holanda',       teamAFlag:'https://flagcdn.com/w160/nl.png',     teamB:'Japão',         teamBFlag:'https://flagcdn.com/w160/jp.png',     date:'14/06/2026',time:'17:00',stadium:'AT&T Stadium, Arlington',                  round:'Grupo F',status:'PENDING'},
  { id:'m10', teamA:'Costa do Marfim',teamAFlag:'https://flagcdn.com/w160/ci.png',   teamB:'Equador',       teamBFlag:'https://flagcdn.com/w160/ec.png',     date:'14/06/2026',time:'20:00',stadium:'Lincoln Financial Field, Filadélfia',     round:'Grupo E',status:'PENDING'},
  { id:'m11', teamA:'Espanha',       teamAFlag:'https://flagcdn.com/w160/es.png',     teamB:'Cabo Verde',    teamBFlag:'https://flagcdn.com/w160/cv.png',     date:'15/06/2026',time:'13:00',stadium:'Mercedes-Benz Stadium, Atlanta',           round:'Grupo H',status:'PENDING'},
  { id:'m12', teamA:'Bélgica',       teamAFlag:'https://flagcdn.com/w160/be.png',     teamB:'Egito',         teamBFlag:'https://flagcdn.com/w160/eg.png',     date:'15/06/2026',time:'16:00',stadium:'Lumen Field, Seattle',                    round:'Grupo G',status:'PENDING'},
  { id:'m13', teamA:'Arábia Saudita',teamAFlag:'https://flagcdn.com/w160/sa.png',     teamB:'Uruguai',       teamBFlag:'https://flagcdn.com/w160/uy.png',     date:'15/06/2026',time:'19:00',stadium:'Hard Rock Stadium, Miami',                round:'Grupo H',status:'PENDING'},
  { id:'m14', teamA:'França',        teamAFlag:'https://flagcdn.com/w160/fr.png',     teamB:'Senegal',       teamBFlag:'https://flagcdn.com/w160/sn.png',     date:'16/06/2026',time:'16:00',stadium:'MetLife Stadium, Nova Jersey',              round:'Grupo I',status:'PENDING'},
  { id:'m15', teamA:'Iraque',        teamAFlag:'https://flagcdn.com/w160/iq.png',     teamB:'Noruega',       teamBFlag:'https://flagcdn.com/w160/no.png',     date:'16/06/2026',time:'19:00',stadium:'Gillette Stadium, Foxborough',             round:'Grupo I',status:'PENDING'},
  { id:'m16', teamA:'Argentina',     teamAFlag:'https://flagcdn.com/w160/ar.png',     teamB:'Argélia',       teamBFlag:'https://flagcdn.com/w160/dz.png',     date:'16/06/2026',time:'22:00',stadium:'Arrowhead Stadium, Kansas City',          round:'Grupo J',status:'PENDING'},
  { id:'m17', teamA:'Portugal',      teamAFlag:'https://flagcdn.com/w160/pt.png',     teamB:'Rep. D. Congo', teamBFlag:'https://flagcdn.com/w160/cd.png',     date:'17/06/2026',time:'14:00',stadium:'NRG Stadium, Houston',                     round:'Grupo K',status:'PENDING'},
  { id:'m18', teamA:'Inglaterra',    teamAFlag:'https://flagcdn.com/w160/gb-eng.png', teamB:'Croácia',       teamBFlag:'https://flagcdn.com/w160/hr.png',     date:'17/06/2026',time:'17:00',stadium:'AT&T Stadium, Arlington',                  round:'Grupo L',status:'PENDING'},
  { id:'m19', teamA:'Gana',          teamAFlag:'https://flagcdn.com/w160/gh.png',     teamB:'Panamá',        teamBFlag:'https://flagcdn.com/w160/pa.png',     date:'17/06/2026',time:'20:00',stadium:'BMO Field, Toronto',                       round:'Grupo L',status:'PENDING'},
  { id:'m20', teamA:'Escócia',       teamAFlag:'https://flagcdn.com/w160/gb-sct.png', teamB:'Marrocos',      teamBFlag:'https://flagcdn.com/w160/ma.png',     date:'19/06/2026',time:'19:00',stadium:'Gillette Stadium, Foxborough',             round:'Grupo C',status:'PENDING'},
  { id:'m21', teamA:'Brasil',        teamAFlag:'https://flagcdn.com/w160/br.png',     teamB:'Haiti',         teamBFlag:'https://flagcdn.com/w160/ht.png',     date:'19/06/2026',time:'21:30',stadium:'Lincoln Financial Field, Filadélfia',     round:'Grupo C',status:'PENDING'},
  { id:'m22', teamA:'Argentina',     teamAFlag:'https://flagcdn.com/w160/ar.png',     teamB:'Áustria',       teamBFlag:'https://flagcdn.com/w160/at.png',     date:'22/06/2026',time:'14:00',stadium:'AT&T Stadium, Arlington',                  round:'Grupo J',status:'PENDING'},
  { id:'m23', teamA:'França',        teamAFlag:'https://flagcdn.com/w160/fr.png',     teamB:'Iraque',        teamBFlag:'https://flagcdn.com/w160/iq.png',     date:'22/06/2026',time:'18:00',stadium:'Lincoln Financial Field, Filadélfia',     round:'Grupo I',status:'PENDING'},
  { id:'m24', teamA:'Escócia',       teamAFlag:'https://flagcdn.com/w160/gb-sct.png', teamB:'Brasil',        teamBFlag:'https://flagcdn.com/w160/br.png',     date:'24/06/2026',time:'19:00',stadium:'Hard Rock Stadium, Miami',                round:'Grupo C',status:'PENDING'},
  { id:'m25', teamA:'Marrocos',      teamAFlag:'https://flagcdn.com/w160/ma.png',     teamB:'Haiti',         teamBFlag:'https://flagcdn.com/w160/ht.png',     date:'24/06/2026',time:'19:00',stadium:'Mercedes-Benz Stadium, Atlanta',           round:'Grupo C',status:'PENDING'},
  { id:'m26', teamA:'Argélia',       teamAFlag:'https://flagcdn.com/w160/dz.png',     teamB:'Áustria',       teamBFlag:'https://flagcdn.com/w160/at.png',     date:'27/06/2026',time:'23:00',stadium:'Arrowhead Stadium, Kansas City',          round:'Grupo J',status:'PENDING'},
  { id:'m27', teamA:'Jordânia',      teamAFlag:'https://flagcdn.com/w160/jo.png',     teamB:'Argentina',     teamBFlag:'https://flagcdn.com/w160/ar.png',     date:'27/06/2026',time:'23:00',stadium:'AT&T Stadium, Arlington',                  round:'Grupo J',status:'PENDING'},
];

// ─── Settings padrão (fallback) ──────────────────────────────────────────────
// active_match_id vazio = código escolhe o próximo jogo disponível automaticamente
const FALLBACK_SETTINGS: Record<string,string> = {
  pix_value:        '20.00',
  pix_key:          '00020126360014br.gov.bcb.pix0114+5535991717912520400005303986540530.005802BR5921FRANK DE SOUZA BORGES6006LAVRAS62060502Br63042ADA',
  active_match_id:  '',   // vazio = auto-seleciona o próximo jogo
  regulamento:      '1. Cada palpite custa o valor definido por aposta.\n2. O palpite só será validado após a confirmação do pagamento via PIX.\n3. A premiação principal corresponde a 80% do valor total arrecadado.\n4. Limite de 5 palpites idênticos por partida.\n5. Prazo: até 10 minutos antes do início do jogo.\n6. Múltiplos acertadores dividem o prêmio em partes iguais.\n7. Sem acertadores: prêmio acumula para a próxima rodada.',
  admin_phone:      '35991717912',
  accumulated_amount: '0.00',
};

// ─── URL do Google Apps Script ────────────────────────────────────────────────
export const SHEETS_API_URL: string =
  (import.meta.env.VITE_SHEETS_API_URL as string) ||
  'https://script.google.com/macros/s/AKfycbyXrVdC6PJQ5hmpwNXZ20P2VfdN0evrj6NG-Qr0D78JiM78n8Lcj9tYS4oJT9qkPgtc/exec';

// ─── JSONP helper ─────────────────────────────────────────────────────────────
function callSheets(action: string, payload?: Record<string,any>): Promise<any> {
  return new Promise((resolve, reject) => {
    const cbName = `_gs_${Date.now()}_${Math.floor(Math.random() * 1e6)}`;

    const timer = setTimeout(() => {
      cleanup();
      reject(new Error(`Timeout: ${action}`));
    }, 20000);

    const cleanup = () => {
      clearTimeout(timer);
      delete (window as any)[cbName];
      document.getElementById(cbName)?.remove();
    };

    (window as any)[cbName] = (data: any) => { cleanup(); resolve(data); };

    const params = new URLSearchParams({ action, callback: cbName });
    if (payload) params.set('payload', JSON.stringify(payload));

    const s = document.createElement('script');
    s.id = cbName;
    s.src = `${SHEETS_API_URL}?${params}`;
    s.onerror = () => { cleanup(); reject(new Error(`Rede: ${action}`)); };
    document.head.appendChild(s);
  });
}

// ─── Normaliza o retorno de GET_SETTINGS ─────────────────────────────────────
// O Apps Script pode retornar:
//   { settings: { key:'pix_value', value:'30.00' }[] }  ← array de linhas
//   { settings: { pix_value:'30.00', ... } }            ← objeto já normalizado
function normalizeSettings(raw: any): Record<string,string> {
  if (!raw) return { ...FALLBACK_SETTINGS };

  // Array de {key, value} (formato mais comum do Apps Script)
  if (Array.isArray(raw)) {
    const out: Record<string,string> = { ...FALLBACK_SETTINGS };
    for (const row of raw) {
      const k = String(row.key   || '').trim();
      const v = String(row.value || '').trim();
      if (k) out[k] = v;
    }
    return out;
  }

  // Objeto plano (já no formato correto)
  if (typeof raw === 'object') {
    return { ...FALLBACK_SETTINGS, ...raw };
  }

  return { ...FALLBACK_SETTINGS };
}

// ─── Normaliza uma linha de match ─────────────────────────────────────────────
function normalizeMatch(m: any): MatchData {
  return {
    id:           String(m.id          || '').trim(),
    teamA:        String(m.teamA       || '').trim(),
    teamAFlag:    String(m.teamAFlag   || '').trim(),
    teamB:        String(m.teamB       || '').trim(),
    teamBFlag:    String(m.teamBFlag   || '').trim(),
    date:         String(m.date        || '').trim(),
    time:         String(m.time        || '').trim(),
    stadium:      String(m.stadium     || '').trim(),
    round:        String(m.round       || '').trim(),
    status:       (m.status === 'FINISHED' ? 'FINISHED' : 'PENDING') as 'PENDING'|'FINISHED',
    resultGoalsA: m.resultGoalsA !== '' && m.resultGoalsA != null ? Number(m.resultGoalsA) : undefined,
    resultGoalsB: m.resultGoalsB !== '' && m.resultGoalsB != null ? Number(m.resultGoalsB) : undefined,
  };
}

// ─────────────────────────────────────────────────────────────────────────────
class ApiService {

  // MATCHES ───────────────────────────────────────────────────────────────────
  async getMatches(): Promise<MatchData[]> {
    try {
      const data = await callSheets('GET_MATCHES');
      const rows: any[] = data?.matches || data?.data || [];
      if (rows.length > 0) {
        const normalized = rows.map(normalizeMatch).filter(m => m.id && m.teamA && m.teamB);
        if (normalized.length > 0) return normalized;
      }
    } catch (e) {
      console.warn('[API] getMatches falhou, usando fallback:', e);
    }
    return FALLBACK_MATCHES;
  }

  async saveMatch(match: MatchData): Promise<void> {
    await callSheets('SAVE_MATCH', { match });
  }

  async deleteMatch(id: string): Promise<void> {
    await callSheets('DELETE_MATCH', { id });
  }

  // SETTINGS ──────────────────────────────────────────────────────────────────
  async getSettings(): Promise<Record<string,string>> {
    try {
      const data = await callSheets('GET_SETTINGS');
      // Tenta ambos os formatos de resposta
      const raw = data?.settings ?? data?.data ?? data;
      const normalized = normalizeSettings(raw);
      // Valida que tem pelo menos um campo útil
      if (normalized.pix_value || normalized.active_match_id !== undefined) {
        return normalized;
      }
    } catch (e) {
      console.warn('[API] getSettings falhou, usando fallback:', e);
    }
    return { ...FALLBACK_SETTINGS };
  }

  async saveSettings(update: Record<string,string>): Promise<void> {
    await callSheets('SAVE_SETTINGS', { settings: update });
  }

  // PREDICTIONS ───────────────────────────────────────────────────────────────
  async getAllPredictions(): Promise<Prediction[]> {
    try {
      const data = await callSheets('GET_ALL_PREDICTIONS');
      const rows: any[] = data?.predictions || data?.data || [];
      return rows.map(p => ({
        ...p,
        goalsA: Number(p.goalsA),
        goalsB: Number(p.goalsB),
      }));
    } catch (e) {
      console.warn('[API] getAllPredictions falhou:', e);
      return [];
    }
  }

  async getUserPredictions(whatsapp: string): Promise<Prediction[]> {
    const [all, matches] = await Promise.all([
      this.getAllPredictions(),
      this.getMatches(),
    ]);
    const clean = whatsapp.replace(/\D/g, '');
    return all
      .filter(p => p.whatsapp.replace(/\D/g, '') === clean)
      .map(p => {
        const m = matches.find(mx => mx.id === p.matchId) || {} as MatchData;
        return {
          ...p,
          teamA:    m.teamA    || p.teamA,
          teamB:    m.teamB    || p.teamB,
          teamAFlag:m.teamAFlag|| p.teamAFlag,
          teamBFlag:m.teamBFlag|| p.teamBFlag,
          date:     m.date     || p.date,
          time:     m.time     || p.time,
        };
      });
  }

  async checkDuplicates(matchId: string, goalsA: number, goalsB: number): Promise<number> {
    try {
      const data = await callSheets('CHECK_DUPLICATES', { matchId, goalsA, goalsB });
      return Number(data?.count) || 0;
    } catch { return 0; }
  }

  async submitPrediction(
    pred: Omit<Prediction, 'id'|'statusPix'|'createdAt'>
  ): Promise<{ success: boolean; predictionId: number }> {
    try {
      const result = await callSheets('SUBMIT_PREDICTION', { prediction: pred });
      if (result?.success === true) {
        return { success: true, predictionId: Number(result.predictionId) || 0 };
      }
      console.error('[API] submitPrediction retornou erro:', result);
      return { success: false, predictionId: 0 };
    } catch (err) {
      console.error('[API] submitPrediction exception:', err);
      return { success: false, predictionId: 0 };
    }
  }

  async confirmPayment(id: number): Promise<{ waLink?: string }> {
    try {
      const result = await callSheets('CONFIRM_PAYMENT', { id });
      return { waLink: result?.waLink || '' };
    } catch { return {}; }
  }

  async getPredictionStats(matchId: string): Promise<any[]> {
    try {
      const data = await callSheets('GET_STATS', { matchId });
      return data?.stats || [];
    } catch { return []; }
  }
}

export const api = new ApiService();

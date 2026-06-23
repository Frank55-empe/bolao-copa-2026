export type MatchData = {
  id: string;
  teamA: string;
  teamAFlag: string;
  teamB: string;
  teamBFlag: string;
  date: string;
  time: string;
  stadium: string;
  round: string;
  resultGoalsA?: number;
  resultGoalsB?: number;
  status?: 'PENDING' | 'FINISHED';
};

export type Prediction = {
  id: number;
  matchId: string;
  name: string;
  whatsapp: string;
  goalsA: number;
  goalsB: number;
  teamA?: string;
  teamB?: string;
  teamAFlag?: string;
  teamBFlag?: string;
  date?: string;
  time?: string;
  statusPix: string;
  createdAt: string;
};

const initialMatches: MatchData[] = [
  { id: "m1",  teamA: "México",       teamAFlag: "https://flagcdn.com/w160/mx.png", teamB: "África do Sul", teamBFlag: "https://flagcdn.com/w160/za.png", date: "11/06/2026", time: "16:00", stadium: "Estadio Azteca, Cidade do México", round: "Grupo A", status: "PENDING" },
  { id: "m2",  teamA: "Coreia do Sul",teamAFlag: "https://flagcdn.com/w160/kr.png", teamB: "Tchéquia",       teamBFlag: "https://flagcdn.com/w160/cz.png", date: "11/06/2026", time: "23:00", stadium: "Estadio Akron, Zapopan",           round: "Grupo A", status: "PENDING" },
  { id: "m3",  teamA: "Canadá",       teamAFlag: "https://flagcdn.com/w160/ca.png", teamB: "Bósnia",        teamBFlag: "https://flagcdn.com/w160/ba.png", date: "12/06/2026", time: "16:00", stadium: "BMO Field, Toronto",               round: "Grupo B", status: "PENDING" },
  { id: "m4",  teamA: "EUA",          teamAFlag: "https://flagcdn.com/w160/us.png", teamB: "Paraguai",      teamBFlag: "https://flagcdn.com/w160/py.png", date: "12/06/2026", time: "22:00", stadium: "SoFi Stadium, Inglewood",          round: "Grupo D", status: "PENDING" },
  { id: "m5",  teamA: "Catar",        teamAFlag: "https://flagcdn.com/w160/qa.png", teamB: "Suíça",         teamBFlag: "https://flagcdn.com/w160/ch.png", date: "13/06/2026", time: "16:00", stadium: "Levi's Stadium, Santa Clara",      round: "Grupo B", status: "PENDING" },
  { id: "m6",  teamA: "Brasil",       teamAFlag: "https://flagcdn.com/w160/br.png", teamB: "Marrocos",      teamBFlag: "https://flagcdn.com/w160/ma.png", date: "13/06/2026", time: "19:00", stadium: "MetLife Stadium, Nova Jersey",     round: "Grupo C", status: "PENDING" },
  { id: "m7",  teamA: "Haiti",        teamAFlag: "https://flagcdn.com/w160/ht.png", teamB: "Escócia",       teamBFlag: "https://flagcdn.com/w160/gb-sct.png", date: "13/06/2026", time: "22:00", stadium: "Gillette Stadium, Foxborough",  round: "Grupo C", status: "PENDING" },
  { id: "m8",  teamA: "Alemanha",     teamAFlag: "https://flagcdn.com/w160/de.png", teamB: "Curaçao",       teamBFlag: "https://flagcdn.com/w160/cw.png", date: "14/06/2026", time: "14:00", stadium: "NRG Stadium, Houston",             round: "Grupo E", status: "PENDING" },
  { id: "m9",  teamA: "Holanda",      teamAFlag: "https://flagcdn.com/w160/nl.png", teamB: "Japão",         teamBFlag: "https://flagcdn.com/w160/jp.png", date: "14/06/2026", time: "17:00", stadium: "AT&T Stadium, Arlington",          round: "Grupo F", status: "PENDING" },
  { id: "m10", teamA: "Costa do Marfim", teamAFlag: "https://flagcdn.com/w160/ci.png", teamB: "Equador",    teamBFlag: "https://flagcdn.com/w160/ec.png", date: "14/06/2026", time: "20:00", stadium: "Lincoln Financial Field, Philadelphia", round: "Grupo E", status: "PENDING" },
  { id: "m11", teamA: "Espanha",      teamAFlag: "https://flagcdn.com/w160/es.png", teamB: "Cabo Verde",    teamBFlag: "https://flagcdn.com/w160/cv.png", date: "15/06/2026", time: "13:00", stadium: "Mercedes-Benz Stadium, Atlanta",   round: "Grupo H", status: "PENDING" },
  { id: "m12", teamA: "Bélgica",      teamAFlag: "https://flagcdn.com/w160/be.png", teamB: "Egito",         teamBFlag: "https://flagcdn.com/w160/eg.png", date: "15/06/2026", time: "16:00", stadium: "Lumen Field, Seattle",             round: "Grupo G", status: "PENDING" },
  { id: "m13", teamA: "Arábia Saudita",teamAFlag:"https://flagcdn.com/w160/sa.png", teamB: "Uruguai",       teamBFlag: "https://flagcdn.com/w160/uy.png", date: "15/06/2026", time: "19:00", stadium: "Hard Rock Stadium, Miami",         round: "Grupo H", status: "PENDING" },
  { id: "m14", teamA: "França",       teamAFlag: "https://flagcdn.com/w160/fr.png", teamB: "Senegal",       teamBFlag: "https://flagcdn.com/w160/sn.png", date: "16/06/2026", time: "16:00", stadium: "MetLife Stadium, Nova Jersey",     round: "Grupo I", status: "PENDING" },
  { id: "m15", teamA: "Iraque",       teamAFlag: "https://flagcdn.com/w160/iq.png", teamB: "Noruega",       teamBFlag: "https://flagcdn.com/w160/no.png", date: "16/06/2026", time: "19:00", stadium: "Gillette Stadium, Foxborough",     round: "Grupo I", status: "PENDING" },
  { id: "m16", teamA: "Argentina",    teamAFlag: "https://flagcdn.com/w160/ar.png", teamB: "Argélia",       teamBFlag: "https://flagcdn.com/w160/dz.png", date: "16/06/2026", time: "22:00", stadium: "Arrowhead Stadium, Kansas City",   round: "Grupo J", status: "PENDING" },
  { id: "m17", teamA: "Portugal",     teamAFlag: "https://flagcdn.com/w160/pt.png", teamB: "Rep. D. Congo", teamBFlag: "https://flagcdn.com/w160/cd.png", date: "17/06/2026", time: "14:00", stadium: "NRG Stadium, Houston",             round: "Grupo K", status: "PENDING" },
  { id: "m18", teamA: "Inglaterra",   teamAFlag: "https://flagcdn.com/w160/gb-eng.png", teamB: "Croácia",   teamBFlag: "https://flagcdn.com/w160/hr.png", date: "17/06/2026", time: "17:00", stadium: "AT&T Stadium, Arlington",          round: "Grupo L", status: "PENDING" },
  { id: "m19", teamA: "Gana",         teamAFlag: "https://flagcdn.com/w160/gh.png", teamB: "Panamá",        teamBFlag: "https://flagcdn.com/w160/pa.png", date: "17/06/2026", time: "20:00", stadium: "BMO Field, Toronto",               round: "Grupo L", status: "PENDING" },
  { id: "m20", teamA: "Escócia",      teamAFlag: "https://flagcdn.com/w160/gb-sct.png", teamB: "Marrocos",  teamBFlag: "https://flagcdn.com/w160/ma.png", date: "19/06/2026", time: "19:00", stadium: "Gillette Stadium, Foxborough",     round: "Grupo C", status: "PENDING" },
  { id: "m21", teamA: "Brasil",       teamAFlag: "https://flagcdn.com/w160/br.png", teamB: "Haiti",         teamBFlag: "https://flagcdn.com/w160/ht.png", date: "19/06/2026", time: "21:30", stadium: "Lincoln Financial Field, Philadelphia", round: "Grupo C", status: "PENDING" },
  { id: "m22", teamA: "Argentina",    teamAFlag: "https://flagcdn.com/w160/ar.png", teamB: "Áustria",       teamBFlag: "https://flagcdn.com/w160/at.png", date: "22/06/2026", time: "14:00", stadium: "AT&T Stadium, Arlington",          round: "Grupo J", status: "PENDING" },
  { id: "m23", teamA: "França",       teamAFlag: "https://flagcdn.com/w160/fr.png", teamB: "Iraque",        teamBFlag: "https://flagcdn.com/w160/iq.png", date: "22/06/2026", time: "18:00", stadium: "Lincoln Financial Field, Philadelphia", round: "Grupo I", status: "PENDING" },
  { id: "m24", teamA: "Escócia",      teamAFlag: "https://flagcdn.com/w160/gb-sct.png", teamB: "Brasil",    teamBFlag: "https://flagcdn.com/w160/br.png", date: "24/06/2026", time: "19:00", stadium: "Hard Rock Stadium, Miami",         round: "Grupo C", status: "PENDING" },
  { id: "m25", teamA: "Marrocos",     teamAFlag: "https://flagcdn.com/w160/ma.png", teamB: "Haiti",         teamBFlag: "https://flagcdn.com/w160/ht.png", date: "24/06/2026", time: "19:00", stadium: "Mercedes-Benz Stadium, Atlanta",   round: "Grupo C", status: "PENDING" },
  { id: "m26", teamA: "Argélia",      teamAFlag: "https://flagcdn.com/w160/dz.png", teamB: "Áustria",       teamBFlag: "https://flagcdn.com/w160/at.png", date: "27/06/2026", time: "23:00", stadium: "Arrowhead Stadium, Kansas City",   round: "Grupo J", status: "PENDING" },
  { id: "m27", teamA: "Jordânia",     teamAFlag: "https://flagcdn.com/w160/jo.png", teamB: "Argentina",     teamBFlag: "https://flagcdn.com/w160/ar.png", date: "27/06/2026", time: "23:00", stadium: "AT&T Stadium, Arlington",          round: "Grupo J", status: "PENDING" },
];

const INITIAL_SETTINGS = {
  pix_value: "30.00",
  pix_key: "00020126360014br.gov.bcb.pix0114+5535991717912520400005303986540530.005802BR5921FRANK DE SOUZA BORGES6006LAVRAS62060502Br63042ADA",
  active_match_id: "m6",
  regulamento: "1. Cada palpite custa o valor definido por aposta.\n2. O palpite só será validado após a confirmação do pagamento via PIX.\n3. A premiação principal corresponderá a 80% do valor total arrecadado, sendo 20% destinados a despesas administrativas do bolão.\n4. O limite máximo de palpites idênticos (com o mesmo placar correto) é de 5 por partida. Após atingir este limite, o placar ficará indisponível.\n5. O prazo máximo para enviar ou mudar o palpite é de até 10 minutos antes do início de cada confronto.\n6. Em caso de empate e múltiplos acertadores do placar vencedor, os 80% do prêmio acumulado serão divididos entre eles em partes iguais.\n7. Caso não haja ganhadores na rodada (nenhum palpite acertar o placar final), o valor total do prêmio (80% da arrecadação) acumulará automaticamente para a próxima rodada.",
  admin_phone: "35991717912",
  accumulated_amount: "0.00"
};

export const SHEETS_API_URL =
  (import.meta.env.VITE_SHEETS_API_URL as string) ||
  "https://script.google.com/macros/s/AKfycbxp7mfKt5pOOV7BPswm6S-GTVQVW0gU9glLN68AYLTBDHnXkLJAUxDFDD91Dr0rwlLM/exec";

// ── Normaliza status da planilha (PT) → frontend (EN) ──────────
function normalizarStatusPix(status: any): string {
  const s = String(status || '').toUpperCase().trim();
  if (s === 'PAGO' || s === 'PAID') return 'PAID';
  return 'PENDING';
}

function normalizarStatusJogo(status: any): 'PENDING' | 'FINISHED' {
  const s = String(status || '').toUpperCase().trim();
  if (s === 'FINISHED' || s === 'ENCERRADO') return 'FINISHED';
  return 'PENDING';
}

class ApiService {
  private fetchSheets(action: string, payload?: any): Promise<any> {
    return new Promise((resolve, reject) => {
      const cbName = `_gsCallback_${Date.now()}_${Math.floor(Math.random() * 1e6)}`;

      const timer = setTimeout(() => {
        cleanup();
        reject(new Error(`[API] Timeout na ação ${action}`));
      }, 15000);

      const cleanup = () => {
        clearTimeout(timer);
        delete (window as any)[cbName];
        const el = document.getElementById(cbName);
        if (el) el.remove();
      };

      (window as any)[cbName] = (data: any) => {
        cleanup();
        resolve(data);
      };

      const params = new URLSearchParams({ action, callback: cbName });
      if (payload) params.set('payload', JSON.stringify(payload));
      const url = `${SHEETS_API_URL}?${params.toString()}`;

      const script = document.createElement('script');
      script.id = cbName;
      script.src = url;
      script.onerror = () => { cleanup(); reject(new Error(`[API] Erro de rede na ação ${action}`)); };
      document.head.appendChild(script);
    });
  }

  async getMatches(): Promise<MatchData[]> {
    try {
      const data = await this.fetchSheets('GET_MATCHES');
      if (data.matches && data.matches.length > 0) {
        return data.matches.map((m: any) => ({
          ...m,
          id: String(m.id).trim(),                        // FIX: garante id como string
          status: normalizarStatusJogo(m.status),
        }));
      }
      return initialMatches;
    } catch {
      return initialMatches;
    }
  }

  async saveMatch(match: MatchData): Promise<void> {
    await this.fetchSheets('SAVE_MATCH', { match });
  }

  async deleteMatch(id: string): Promise<void> {
    await this.fetchSheets('DELETE_MATCH', { id });
  }

  async getSettings(): Promise<any> {
    try {
      const data = await this.fetchSheets('GET_SETTINGS');
      return { ...INITIAL_SETTINGS, ...(data.settings || {}) };
    } catch {
      return INITIAL_SETTINGS;
    }
  }

  async saveSettings(settingsUpdate: any): Promise<void> {
    await this.fetchSheets('SAVE_SETTINGS', { settings: settingsUpdate });
  }

  async getAllPredictions(): Promise<Prediction[]> {
    try {
      const data = await this.fetchSheets('GET_ALL_PREDICTIONS');
      const lista: any[] = data.predictions || [];
      return lista.map(p => ({
        ...p,
        goalsA: Number(p.goalsA),
        goalsB: Number(p.goalsB),
        statusPix: normalizarStatusPix(p.statusPix),   // FIX: normaliza PAGO→PAID
      }));
    } catch {
      return [];
    }
  }

  async getUserPredictions(whatsapp: string): Promise<Prediction[]> {
    const all = await this.getAllPredictions();
    const matches = await this.getMatches();
    return all
      .filter(p => p.whatsapp === whatsapp)
      .map(p => {
        const m = matches.find(mx => String(mx.id).trim() === String(p.matchId).trim()) || {} as MatchData;
        return {
          ...p,
          goalsA: Number(p.goalsA),
          goalsB: Number(p.goalsB),
          teamA: m.teamA,
          teamB: m.teamB,
          teamAFlag: m.teamAFlag,
          teamBFlag: m.teamBFlag,
          date: m.date,
          time: m.time,
          statusPix: normalizarStatusPix(p.statusPix),
        };
      });
  }

  async checkDuplicates(matchId: string, goalsA: number, goalsB: number): Promise<number> {
    try {
      const data = await this.fetchSheets('CHECK_DUPLICATES', { matchId, goalsA, goalsB });
      return data.count || 0;
    } catch {
      return 0;
    }
  }

  async submitPrediction(pred: Omit<Prediction, 'id' | 'statusPix' | 'createdAt'>): Promise<{ success: boolean; predictionId: number }> {
    try {
      const result = await this.fetchSheets('SUBMIT_PREDICTION', { prediction: pred });
      return { success: result.success === true, predictionId: result.predictionId || 0 };
    } catch (err) {
      console.error('[API] Erro ao submeter palpite:', err);
      return { success: false, predictionId: 0 };
    }
  }

  async confirmPayment(id: number): Promise<{ waLink?: string }> {
    try {
      const result = await this.fetchSheets('CONFIRM_PAYMENT', { id });
      return { waLink: result.waLink };
    } catch {
      return {};
    }
  }

  async getPredictionStats(matchId: string): Promise<any[]> {
    try {
      const data = await this.fetchSheets('GET_STATS', { matchId });
      return data.stats || [];
    } catch {
      return [];
    }
  }
}

export const api = new ApiService();

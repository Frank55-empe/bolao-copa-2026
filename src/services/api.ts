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

// Initial Mocks for seamless Preview behavior
const initialMatches: MatchData[] = [
  { id: "m1", teamA: "Brasil", teamAFlag: "https://flagcdn.com/w160/br.png", teamB: "Argentina", teamBFlag: "https://flagcdn.com/w160/ar.png", date: "15/06/2026", time: "21:30", stadium: "Maracanã", round: "Final", status: "PENDING" },
  { id: "m2", teamA: "Brasil", teamAFlag: "https://flagcdn.com/w160/br.png", teamB: "França", teamBFlag: "https://flagcdn.com/w160/fr.png", date: "18/06/2026", time: "16:00", stadium: "Lusail", round: "Semifinal", status: "PENDING" },
  { id: "m3", teamA: "Inglaterra", teamAFlag: "https://flagcdn.com/w160/gb-eng.png", teamB: "Brasil", teamBFlag: "https://flagcdn.com/w160/br.png", date: "24/06/2026", time: "19:00", stadium: "Wembley", round: "Quartas", status: "PENDING" }
];

const INITIAL_SETTINGS = { 
  pix_value: "30.00", 
  pix_key: "00020126360014br.gov.bcb.pix0114+5535991717912520400005303986540530.005802BR5921FRANK DE SOUZA BORGES6006LAVRAS62060502Br63042ADA", 
  active_match_id: "m1",
  regulamento: "1. Cada palpite custa o valor definido por aposta.\n2. O palpite só será validado após a confirmação do pagamento via PIX.\n3. A premiação principal corresponderá a 80% do valor total arrecadado, sendo 20% destinados a despesas administrativas do bolão.\n4. O limite máximo de palpites idênticos (com o mesmo placar correto) é de 5 por partida. Após atingir este limite, o placar ficará indisponível.\n5. O prazo máximo para enviar ou mudar o palpite é de até 10 minutos antes do início de cada confronto.\n6. Em caso de empate e múltiplos acertadores do placar vencedor, os 80% do prêmio acumulado serão divididos entre eles em partes iguais.\n7. Caso não haja ganhadores na rodada (nenhum palpite acertar o placar final), o valor total do prêmio (80% da arrecadação) acumulará automaticamente para a próxima rodada.",
  admin_phone: "35991717912",
  accumulated_amount: "0.00"
};

export const SHEETS_API_URL = import.meta.env.VITE_SHEETS_API_URL;

class ApiService {
  private useMock(): boolean {
    return !SHEETS_API_URL;
  }

  // Helper for actual Google Sheets
  private async fetchSheets(action: string, payload?: any) {
  const method = payload ? "POST" : "GET";

  const response = await fetch(
    method === "GET"
      ? `${SHEETS_API_URL}?action=${action}`
      : SHEETS_API_URL,
    {
      method,
      headers: {
        "Content-Type": "application/json"
      },
      body: payload
        ? JSON.stringify({
            action,
            ...payload
          })
        : undefined
    }
  );

  return await response.json();
}
  }

  // --- Matches ---
  async getMatches(): Promise<MatchData[]> {
    if (this.useMock()) {
      const stored = localStorage.getItem('matches');
      if (stored) {
        const parsed = JSON.parse(stored);
        if (parsed.length > 0) return parsed;
      }
      return initialMatches;
    }
    const data = await this.fetchSheets('GET_MATCHES');
    return data.matches || [];
  }

  async saveMatch(match: MatchData): Promise<void> {
    if (this.useMock()) {
      const matches = await this.getMatches();
      const idx = matches.findIndex(m => m.id === match.id);
      if (idx >= 0) matches[idx] = match;
      else matches.push({ ...match, id: match.id || Date.now().toString() });
      localStorage.setItem('matches', JSON.stringify(matches));
      return;
    }
    await this.fetchSheets('SAVE_MATCH', { match });
  }

  async deleteMatch(id: string): Promise<void> {
    if (this.useMock()) {
      const matches = await this.getMatches();
      localStorage.setItem('matches', JSON.stringify(matches.filter(m => m.id !== id)));
      return;
    }
    await this.fetchSheets('DELETE_MATCH', { id });
  }

  // --- Settings ---
  async getSettings(): Promise<any> {
    if (this.useMock()) {
      return JSON.parse(localStorage.getItem('settings') || JSON.stringify(INITIAL_SETTINGS));
    }
    const data = await this.fetchSheets('GET_SETTINGS');
    return data.settings || INITIAL_SETTINGS;
  }

  async saveSettings(settingsUpdate: any): Promise<void> {
    if (this.useMock()) {
      const current = await this.getSettings();
      localStorage.setItem('settings', JSON.stringify({ ...current, ...settingsUpdate }));
      return;
    }
    await this.fetchSheets('SAVE_SETTINGS', { settings: settingsUpdate });
  }

  // --- Predictions ---
  async getAllPredictions(): Promise<Prediction[]> {
    if (this.useMock()) {
      return JSON.parse(localStorage.getItem('predictions') || '[]');
    }
    const data = await this.fetchSheets('GET_ALL_PREDICTIONS');
    return data.predictions || [];
  }

  async getUserPredictions(whatsapp: string): Promise<Prediction[]> {
    const all = await this.getAllPredictions();
    const matches = await this.getMatches();
    const userPreds = all.filter(p => p.whatsapp === whatsapp).map(p => {
      const m = matches.find(mx => mx.id === p.matchId) || {} as MatchData;
      return { ...p, teamA: m.teamA, teamB: m.teamB, teamAFlag: m.teamAFlag, teamBFlag: m.teamBFlag, date: m.date, time: m.time };
    });
    return userPreds;
  }

  async checkDuplicates(matchId: string, goalsA: number, goalsB: number): Promise<number> {
    if (this.useMock()) {
      const all = await this.getAllPredictions();
      return all.filter(p => p.matchId === matchId && p.goalsA === goalsA && p.goalsB === goalsB).length;
    }
    const data = await this.fetchSheets('CHECK_DUPLICATES', { matchId, goalsA, goalsB });
    return data.count || 0;
  }

  async submitPrediction(pred: Omit<Prediction, 'id'|'statusPix'|'createdAt'>): Promise<{success: boolean, predictionId: number}> {
    if (this.useMock()) {
      const all = await this.getAllPredictions();
      const newPred: Prediction = {
        ...pred,
        id: Date.now(),
        statusPix: 'PENDING',
        createdAt: new Date().toISOString()
      };
      all.push(newPred);
      localStorage.setItem('predictions', JSON.stringify(all));
      return { success: true, predictionId: newPred.id };
    }
    return await this.fetchSheets('SUBMIT_PREDICTION', { prediction: pred });
  }

  async confirmPayment(id: number): Promise<{waLink?: string}> {
    let prediction: Prediction|undefined;
    let match: MatchData|undefined;

    if (this.useMock()) {
      const all = await this.getAllPredictions();
      const idx = all.findIndex(p => p.id === id);
      if (idx >= 0) {
        all[idx].statusPix = 'PAID';
        prediction = all[idx];
        localStorage.setItem('predictions', JSON.stringify(all));
        
        const matches = await this.getMatches();
        match = matches.find(m => m.id === prediction!.matchId);
      }
    } else {
      const result = await this.fetchSheets('CONFIRM_PAYMENT', { id });
      return { waLink: result.waLink };
    }

    if (prediction && match) {
      const message = `Olá, ${prediction.name}! 🏆 Seu pagamento foi confirmado com sucesso. O seu palpite para ${match.teamA} ${prediction.goalsA} x ${prediction.goalsB} ${match.teamB} já está valendo. Boa sorte no Bolão!`;
      const phoneClean = prediction.whatsapp.replace(/\D/g, '');
      return { waLink: `https://api.whatsapp.com/send?phone=55${phoneClean}&text=${encodeURIComponent(message)}` };
    }
    return {};
  }

  async getPredictionStats(matchId: string): Promise<any[]> {
    if (this.useMock()) {
      const all = await this.getAllPredictions();
      const matchPreds = all.filter(p => p.matchId === matchId);
      const groups: Record<string, {goalsA:number, goalsB:number, count:number}> = {};
      matchPreds.forEach(p => {
        const key = `${p.goalsA}-${p.goalsB}`;
        if(!groups[key]) groups[key] = {goalsA: p.goalsA, goalsB: p.goalsB, count: 0};
        groups[key].count++;
      });
      return Object.values(groups).sort((a,b) => b.count - a.count).slice(0,3);
    }
    const data = await this.fetchSheets('GET_STATS', { matchId });
    return data.stats || [];
  }

export const api = new ApiService();

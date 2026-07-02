export const GAS_URL = "https://script.google.com/macros/s/AKfycbwVjBOpiRYP4Xeqy9PONQJPe-8jlAGWXo48QA2UmvgIAQgANQgnJVHYYt95FROqVqUo2A/exec";

export const api = {
  async get(action: string, params: Record<string, string> = {}) {
    const q = new URLSearchParams({ action, ...params }).toString();
    try {
      const res = await fetch(`${GAS_URL}?${q}`, { redirect: 'follow' });
      const data = await res.json();
      if (!data || data.error) {
         throw new Error(data?.error || 'Invalid response from GAS');
      }
      if (action === 'getMatches' && data && Array.isArray(data.matches) && data.matches.length === 0) {
         data.matches = [
            {
               id: 'brazil_game_1',
               teamA: 'Brasil',
               teamAFlag: 'https://upload.wikimedia.org/wikipedia/en/0/05/Flag_of_Brazil.svg',
               teamB: 'Suíça', 
               teamBFlag: 'https://upload.wikimedia.org/wikipedia/commons/f/f3/Flag_of_Switzerland.svg',
               date: '10/06/2026',
               time: '16:00',
               stadium: 'Estádio MetLife - NY',
               round: 'Fase de Grupos',
               isActive: 1,
               isClosed: 0,
               resultA: null,
               resultB: null
            }
         ];
      }
      return data;
    } catch (e) {
      console.warn(`GAS fetch failed for ${action}:`, e);
      throw e;
    }
  },

  async post(action: string, body: any) {
    try {
      const payload = { action, ...body };
      const res = await fetch(GAS_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        body: JSON.stringify(payload),
        redirect: 'follow'
      });
      const data = await res.json();
      if (!data || data.error) {
         throw new Error(data?.error || 'Invalid response from GAS');
      }
      return data;
    } catch (e) {
      console.warn(`GAS post failed for ${action}:`, e);
      throw e;
    }
  }
};
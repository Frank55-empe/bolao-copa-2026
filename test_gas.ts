const GAS_URL = "https://script.google.com/macros/s/AKfycbzC8Qo2ps-OhRJk5NsHSriEe7nFfShRhSZMKOMYpkfLhzjnoeTCgGo_vQ2X4s8hHHyj/exec";

async function testgas() {
  const params = [
    { method: 'GET', url: GAS_URL + "?action=getJogos" },
    { method: 'POST', body: JSON.stringify({ action: 'getJogos' }) },
  ];
  
  for (const t of params) {
    try {
      const resp = await fetch(t.url || GAS_URL, {
        method: t.method,
        body: t.body,
        headers: t.method === 'POST' ? { 'Content-Type': 'application/json' } : undefined
      });
      const data = await resp.text();
      console.log(t.method, t.url || 'POST', data);
    } catch(e) {
      console.log('Error', t.method, e.message);
    }
  }
}
testgas();

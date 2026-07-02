const GAS_URL = "https://script.google.com/macros/s/AKfycbzC8Qo2ps-OhRJk5NsHSriEe7nFfShRhSZMKOMYpkfLhzjnoeTCgGo_vQ2X4s8hHHyj/exec";

async function testgas2() {
  const params = [
    { method: 'GET', url: GAS_URL + "?action=jogos" },
    { method: 'GET', url: GAS_URL + "?action=getMatches" },
    { method: 'GET', url: GAS_URL + "?type=matches" },
    { method: 'GET', url: GAS_URL + "?action=config" }
  ];
  
  for (const t of params) {
    try {
      const resp = await fetch(t.url);
      const data = await resp.text();
      console.log(t.url, data);
    } catch(e) {}
  }
}
testgas2();

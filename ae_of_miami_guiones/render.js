const { chromium } = require('playwright');
(async () => { const b = await chromium.launch(); const p = await b.newPage();
  await p.goto('file://' + process.cwd() + '/guiones.html');
  await p.pdf({ path: 'AE_of_Miami_Guiones_12_Reels.pdf', format: 'Letter', printBackground: true, preferCSSPageSize: true });
  await b.close(); })();

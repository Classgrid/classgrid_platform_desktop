const puppeteer = require('puppeteer');
(async () => {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  page.on('console', msg => {
    if (msg.type() === 'error') {
      console.log('PAGE ERROR LOG:', msg.text());
      Promise.all(msg.args().map(a => a.jsonValue())).then(args => console.log('ARGS:', args));
    }
  });
  page.on('pageerror', error => {
    console.log('PAGE ERROR MESSAGE:', error.message);
    console.log('PAGE ERROR STACK:', error.stack);
  });
  
  await page.goto('http://localhost:4173/onboarding?token=test', { waitUntil: 'networkidle2' });
  await new Promise(r => setTimeout(r, 2000));
  await browser.close();
})();

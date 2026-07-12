const puppeteer = require('puppeteer');

const BASE = 'http://localhost:5174';
const PAGES = [
  ['home',              '/'],
  ['auth',              '/auth'],
  ['director',          '/director'],
  ['inputer',           '/inputer'],
  ['overlays',          '/overlays'],
  ['overlay_blank',     '/overlay/blank'],
  ['overlay_scoreboard','/overlay/scoreboard'],
  ['overlay_killfeed',  '/overlay/killfeed'],
  ['overlay_standings', '/overlay/standings'],
  ['overlay_mvp',       '/overlay/mvp'],
  ['overlay_champions', '/overlay/champions'],
  ['overlay_casters',   '/overlay/casters'],
  ['overlay_maplabel',  '/overlay/maplabel'],
  ['overlay_teams',     '/overlay/teams'],
];

(async () => {
  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox','--disable-setuid-sandbox','--disable-dev-shm-usage'],
  });
  for (const [name, path] of PAGES) {
    const page = await browser.newPage();
    try {
      await page.setViewport({ width: 1280, height: 800 });
      await page.goto(`${BASE}${path}`, { waitUntil: 'networkidle2', timeout: 12000 });
      await new Promise(r => setTimeout(r, 1500));
      await page.screenshot({ path: `/tmp/preview_${name}.png` });
      console.log(`✅ ${name}`);
    } catch(e) {
      console.log(`❌ ${name}: ${e.message}`);
    }
    await page.close();
  }
  await browser.close();
})();

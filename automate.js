const puppeteer = require("puppeteer");
const fs = require("fs");
const path = require("path");

const SETTINGS_FILE = path.join(__dirname, "../data/settings.json");
const STATS_FILE = path.join(__dirname, "../data/stats.json");

if (!fs.existsSync(SETTINGS_FILE)) {
  console.log("No settings.json found. Exiting.");
  process.exit(0);
}

let settings = JSON.parse(fs.readFileSync(SETTINGS_FILE));
let stats = fs.existsSync(STATS_FILE)
  ? JSON.parse(fs.readFileSync(STATS_FILE))
  : { totalVisits: 0, totalClicks: 0 };

(async () => {
  const perRun = Math.ceil(settings.totalVisits / (settings.duration * 60 / 5));
  const toDo = Math.min(perRun, settings.totalVisits - stats.totalVisits);
  if (toDo <= 0) return console.log("All visits completed.");

  const browser = await puppeteer.launch({ headless: true });
  for (let i = 0; i < toDo; i++) {
    const page = await browser.newPage();
    await page.goto(settings.url, { waitUntil: "networkidle2", timeout: 0 });

    for (let j = 0; j < 5; j++) {
      await page.evaluate(() => window.scrollBy(0, 300));
      await new Promise(r => setTimeout(r, 1000));
    }

    if (Math.random() <= 0.2) {
      const ads = await page.$$("iframe, .adsterra");
      if (ads.length > 0) {
        try {
          const ad = ads[Math.floor(Math.random() * ads.length)];
          await ad.click();
          stats.totalClicks++;
        } catch (e) {}
      }
    }

    stats.totalVisits++;
    await page.close();
  }

  fs.writeFileSync(STATS_FILE, JSON.stringify(stats, null, 2));
  await browser.close();
})();
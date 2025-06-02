const express = require('express');
const cors = require('cors');
const puppeteer = require('puppeteer');
const cheerio = require('cheerio');
const fs = require('fs');

const app = express();
app.use(cors());

const MAX_RETRIES = 3;

async function fetchPageContent(url) {
  let browser;
  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    try {
      browser = await puppeteer.launch({
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox'],
      });

      const page = await browser.newPage();
      await page.setUserAgent(
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 ' +
        '(KHTML, like Gecko) Chrome/115.0.0.0 Safari/537.36'
      );

      await page.goto(url, { waitUntil: 'networkidle2', timeout: 60000 });
      await page.waitForSelector('.dpPanchang', { timeout: 20000 });

      const content = await page.content();
      await browser.close();
      return content;
    } catch (err) {
      console.warn(`⚠️ Attempt ${attempt} failed: ${err.message}`);
      if (browser) await browser.close();
      if (attempt === MAX_RETRIES) throw err;
      await new Promise((r) => setTimeout(r, 2000));
    }
  }
}

app.get('/', (req, res) => {
  res.send('Welcome to Panchang API! Use /api/panchang?date=YYYY-MM-DD');
});

app.get('/api/panchang', async (req, res) => {
  const { date } = req.query;

  if (!date || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    return res.status(400).json({ error: 'Invalid or missing date. Use YYYY-MM-DD format.' });
  }

  const [year, month, day] = date.split('-');
  const formattedDate = `${day}/${month}/${year}`;
  const url = `https://www.drikpanchang.com/panchang/month-panchang.html?geoname-id=1260086&date=${formattedDate}`;

  console.log('🔍 Fetching URL:', url);

  try {
    const html = await fetchPageContent(url);
    fs.writeFileSync('debug_panchang.html', html);

    const $ = cheerio.load(html);
    const panchang = {};
    
    $('.dpPanchang .dpElement').each((_, el) => {
      const key = $(el).find('.dpElementKey').text().trim().replace(/\s+/g, ' ');
      const value = $(el).find('.dpElementValue').text().trim().replace(/\s+/g, ' ');
      if (key && value) {
        panchang[key] = value;
      }
    });

    if (Object.keys(panchang).length > 0) {
      res.json({ date, panchang });
    } else {
      res.json({ date, panchang: {}, message: 'Panchang not found for given date.' });
    }
  } catch (error) {
    console.error('❌ Error fetching Panchang data:', error);
    res.status(500).json({ error: 'Failed to fetch Panchang data' });
  }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 Backend running at http://localhost:${PORT}`);
});

const express = require('express');
const { chromium } = require('playwright');
const cors = require('cors');

const app = express();
app.use(express.json());
app.use(cors());

app.post('/transcript', async (req, res) => {
  const { url } = req.body;
  console.log("📥 Received request with URL:", url);

  if (!url || !url.includes('open.spotify.com/episode')) {
    console.log("❌ Invalid URL format");
    return res.status(400).json({ error: '❌ Invalid Spotify episode URL', received: url });
  }

  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();

  try {
    await page.goto(url, { waitUntil: 'networkidle' });

    await page.waitForSelector('button[aria-label="Transcript"]', { timeout: 10000 });
    await page.click('button[aria-label="Transcript"]');
    await page.waitForSelector('[data-testid="transcript-text"]', { timeout: 10000 });

    const transcript = await page.$$eval('[data-testid="transcript-text"]', elements => {
      return elements.map(el => el.innerText).join('\n');
    });

    await browser.close();
    console.log("✅ Transcript extracted successfully.");
    return res.json({ transcript });
  } catch (err) {
    await browser.close();
    console.log("❌ Failed during processing:", err.message);
    return res.status(500).json({ error: '❌ Failed to extract transcript', details: err.message });
  }
});

app.get('/', (req, res) => {
  res.send('✅ Spotify Transcript Agent is running.');
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 Server listening on port ${PORT}`);
});

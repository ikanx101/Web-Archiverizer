import express from "express";
import { createServer as createViteServer } from "vite";
import * as cheerio from "cheerio";
import { URL } from "url";
import puppeteer from "puppeteer";

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  app.post("/api/fetch-page", async (req, res) => {
    const { url, waitTime } = req.body;
    try {
      const html = await fetchAndInline(url, waitTime || 0);
      res.send({ html });
    } catch (error: any) {
      console.error(`Error fetching ${url}:`, error);
      res.status(500).send({ error: error.message });
    }
  });

  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

async function fetchAndInline(pageUrl: string, waitTime: number) {
  const fetchOptions = {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/115.0.0.0 Safari/537.36'
    }
  };

  let html = '';
  let browser;
  try {
    browser = await puppeteer.launch({ args: ['--no-sandbox', '--disable-setuid-sandbox'] });
    const page = await browser.newPage();
    await page.setUserAgent(fetchOptions.headers['User-Agent']);
    await page.goto(pageUrl, { waitUntil: 'networkidle2', timeout: 60000 });
    
    if (waitTime > 0) {
      await new Promise(resolve => setTimeout(resolve, waitTime * 1000));
    }
    
    html = await page.content();
  } catch (error) {
    console.error(`Puppeteer error for ${pageUrl}:`, error);
    // Fallback to fetch if puppeteer fails
    const response = await fetch(pageUrl, fetchOptions);
    if (!response.ok) throw new Error(`Failed to fetch ${pageUrl}: ${response.statusText}`);
    html = await response.text();
  } finally {
    if (browser) {
      await browser.close();
    }
  }
  
  const $ = cheerio.load(html);
  const baseUrl = new URL(pageUrl);

  const resolveUrl = (href: string) => {
    try {
      return new URL(href, baseUrl).toString();
    } catch {
      return href;
    }
  };

  // Inline Images
  const images = $('img').toArray();
  for (const img of images) {
    const src = $(img).attr('src');
    if (src && !src.startsWith('data:')) {
      try {
        const imgUrl = resolveUrl(src);
        const imgRes = await fetch(imgUrl, fetchOptions);
        if (imgRes.ok) {
          const arrayBuffer = await imgRes.arrayBuffer();
          const buffer = Buffer.from(arrayBuffer);
          const mimeType = imgRes.headers.get('content-type') || 'image/jpeg';
          const base64 = buffer.toString('base64');
          $(img).attr('src', `data:${mimeType};base64,${base64}`);
        }
      } catch (e) {
        // Ignore errors for individual images
      }
    }
  }

  // Inline CSS
  const links = $('link[rel="stylesheet"]').toArray();
  for (const link of links) {
    const href = $(link).attr('href');
    if (href) {
      try {
        const cssUrl = resolveUrl(href);
        const cssRes = await fetch(cssUrl, fetchOptions);
        if (cssRes.ok) {
          const cssText = await cssRes.text();
          $(link).replaceWith(`<style>${cssText}</style>`);
        }
      } catch (e) {
        // Ignore errors for individual css
      }
    }
  }

  // Inline JS
  const scripts = $('script[src]').toArray();
  for (const script of scripts) {
    const src = $(script).attr('src');
    if (src) {
      try {
        const jsUrl = resolveUrl(src);
        const jsRes = await fetch(jsUrl, fetchOptions);
        if (jsRes.ok) {
          const jsText = await jsRes.text();
          $(script).removeAttr('src');
          $(script).text(jsText);
        }
      } catch (e) {
        // Ignore errors for individual js
      }
    }
  }

  return $.html();
}

startServer();

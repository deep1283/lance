// instagram-scraper-v5.2.js - Production Grade Anti-Detection

// For educational/research use only

// Usage: node instagram-scraper-v5.2.js <keyword> [total=20]

const fs = require("fs");
const path = require("path");
const readline = require("readline");
const puppeteer = require("puppeteer-extra");
const StealthPlugin = require("puppeteer-extra-plugin-stealth");

puppeteer.use(StealthPlugin());

const CONFIG = {
  TOTAL_POSTS: 20,
  REELS_RATIO: 0.65, // 65% reels, 35% posts
  PAGE_TIMEOUT: 60000,
  LOGIN_TIMEOUT: 300000,
  HEADLESS: false,
  SESSION_FILE: path.join(__dirname, "instagram-session.json"),
  
  // Anti-detection delays (in milliseconds)
  MIN_SCROLL_DELAY: 2000,
  MAX_SCROLL_DELAY: 4500,
  MIN_POST_DELAY: 6000,
  MAX_POST_DELAY: 15000,
  MIN_ACTION_DELAY: 800,
  MAX_ACTION_DELAY: 2000,
  
  // Scroll behavior
  MIN_SCROLLS: 4,
  MAX_SCROLLS: 9,
  SCROLL_BACK_CHANCE: 0.18,
  PAUSE_CHANCE: 0.25,
  
  // Retry settings
  MAX_RETRIES: 3,
  RETRY_DELAY: 3000,
};

let globalBrowser = null;
let rateLimitHit = false;

// ========== UTILITIES ==========
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const random = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;
const randomFloat = (min, max) => Math.random() * (max - min) + min;

const sanitizeKeyword = (k) =>
  (k || "")
    .toString()
    .replace(/[^a-zA-Z0-9_\s]/g, "")
    .trim()
    .replace(/\s+/g, "_")
    .slice(0, 60) || "default";

function sanitizeCSV(v) {
  if (!v) return "";
  v = String(v);
  if (/^[=+\-@\t\r]/.test(v)) v = "'" + v;
  return v.replace(/"/g, '""').replace(/[\r\n]+/g, " ").trim();
}

function createCSV(posts, keyword) {
  const sanitizedKeyword = sanitizeKeyword(keyword);
  const timestamp = new Date().toISOString().replace(/[:.]/g, "-").slice(0, -5);
  const filename = `instagram_${sanitizedKeyword}_${timestamp}.csv`;

  const header = "URL,Type,Likes,Comments,Views,Caption,Status\n";
  const rows = posts
    .map((p) =>
      [
        `"${sanitizeCSV(p.url)}"`,
        `"${sanitizeCSV(p.type)}"`,
        `"${sanitizeCSV(p.likes)}"`,
        `"${sanitizeCSV(p.comments)}"`,
        `"${sanitizeCSV(p.views)}"`,
        `"${sanitizeCSV(p.caption)}"`,
        `"${sanitizeCSV(p.status || 'success')}"`,
      ].join(",")
    )
    .join("\n");

  fs.writeFileSync(filename, header + rows, "utf8");
  return filename;
}

function waitForEnter(message) {
  return new Promise((resolve) => {
    const rl = readline.createInterface({ 
      input: process.stdin, 
      output: process.stdout 
    });
    rl.question(`\n${message}\nPress ENTER to continue... `, () => {
      rl.close();
      resolve();
    });
  });
}

// ========== SESSION MANAGEMENT ==========
async function saveSession(page) {
  try {
    const cookies = await page.cookies();
    const localStorage = await page.evaluate(() => {
      const items = {};
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        items[key] = localStorage.getItem(key);
      }
      return items;
    });
    
    fs.writeFileSync(
      CONFIG.SESSION_FILE,
      JSON.stringify({ cookies, localStorage }, null, 2)
    );
    console.log("   ✅ Session saved (cookies + localStorage)");
  } catch (e) {
    console.log("   ⚠️ Failed to save session:", e.message);
  }
}

async function loadSession(page) {
  try {
    if (fs.existsSync(CONFIG.SESSION_FILE)) {
      const session = JSON.parse(fs.readFileSync(CONFIG.SESSION_FILE, "utf8"));
      
      if (session.cookies) {
        await page.setCookie(...session.cookies);
      }
      
      if (session.localStorage) {
        await page.evaluateOnNewDocument((items) => {
          for (const [key, value] of Object.entries(items)) {
            localStorage.setItem(key, value);
          }
        }, session.localStorage);
      }
      
      console.log("   ✅ Session loaded");
      return session;
    }
  } catch (e) {
    console.log("   ⚠️ Failed to load session:", e.message);
  }
  return null;
}

async function isLoggedIn(page) {
  try {
    return await page.evaluate(() => {
      const indicators = [
        'svg[aria-label="Home"]',
        'svg[aria-label="Reels"]',
        'svg[aria-label="Search"]',
        'a[href="/direct/inbox/"]',
        'a[href*="/accounts/edit/"]',
      ];
      return indicators.some((sel) => document.querySelector(sel));
    });
  } catch {
    return false;
  }
}

async function waitForManualLogin(page) {
  console.log("\n🔐 Please log in manually in the browser...");
  
  const start = Date.now();
  while (Date.now() - start < CONFIG.LOGIN_TIMEOUT) {
    const loggedIn = await isLoggedIn(page);
    if (loggedIn) {
      console.log("\n✅ Login detected!");
      await sleep(2000);
      await saveSession(page);
      return true;
    }
    
    const elapsed = Math.floor((Date.now() - start) / 1000);
    if (elapsed % 10 === 0) {
      const remaining = Math.floor((CONFIG.LOGIN_TIMEOUT - (Date.now() - start)) / 1000);
      process.stdout.write(`⏳ Waiting for login... ${remaining}s remaining\r`);
    }
    
    await sleep(1000);
  }
  
  console.log("\n❌ Login timeout");
  return false;
}

// ========== ANTI-DETECTION BEHAVIORS ==========
async function enhanceFingerprint(page) {
  await page.evaluateOnNewDocument(() => {
    // Remove automation flags
    Object.defineProperty(navigator, 'webdriver', {
      get: () => undefined,
    });
    
    // Add chrome object
    window.chrome = {
      runtime: {},
      loadTimes: function() {},
      csi: function() {},
      app: {},
    };
    
    // Mock plugins
    Object.defineProperty(navigator, 'plugins', {
      get: () => [1, 2, 3, 4, 5],
    });
    
    // Mock languages
    Object.defineProperty(navigator, 'languages', {
      get: () => ['en-US', 'en'],
    });
    
    // Add permissions
    const originalQuery = window.navigator.permissions.query;
    window.navigator.permissions.query = (parameters) => (
      parameters.name === 'notifications' ?
        Promise.resolve({ state: Notification.permission }) :
        originalQuery(parameters)
    );
  });
}

async function simulateHumanBehavior(page) {
  try {
    await page.evaluate(() => {
      // Random mouse movements
      const createMouseEvent = (x, y) => {
        const event = new MouseEvent('mousemove', {
          clientX: x,
          clientY: y,
          bubbles: true,
        });
        document.dispatchEvent(event);
      };
      
      for (let i = 0; i < 3; i++) {
        const x = Math.random() * window.innerWidth;
        const y = Math.random() * window.innerHeight;
        createMouseEvent(x, y);
      }
    });
  } catch (e) {
    // Silently continue
  }
}

async function dismissPopups(page) {
  try {
    await page.evaluate(() => {
      const selectors = [
        'button:has-text("Not Now")',
        'button:has-text("Not now")',
        'button:has-text("Cancel")',
        'button:has-text("Later")',
        'button:has-text("Decline")',
      ];
      
      const buttons = Array.from(document.querySelectorAll('button'));
      buttons.forEach((btn) => {
        const text = btn.innerText.toLowerCase();
        if (
          text.includes('not now') ||
          text.includes('cancel') ||
          text.includes('later') ||
          text.includes('maybe later') ||
          text.includes('decline')
        ) {
          try {
            btn.click();
          } catch (e) {}
        }
      });
    });
    await sleep(random(800, 1500));
  } catch (e) {
    // Continue if no popups
  }
}

async function humanScroll(page, isMobile = false) {
  const scrollCount = random(CONFIG.MIN_SCROLLS, CONFIG.MAX_SCROLLS);
  const baseScroll = isMobile ? 200 : 500;
  
  for (let i = 0; i < scrollCount; i++) {
    // Variable scroll distance
    const scrollAmount = random(baseScroll - 100, baseScroll + 300);
    
    await page.evaluate((amount) => {
      window.scrollBy({ 
        top: amount, 
        behavior: 'smooth' 
      });
    }, scrollAmount);
    
    // Variable delay between scrolls
    await sleep(random(CONFIG.MIN_SCROLL_DELAY, CONFIG.MAX_SCROLL_DELAY));
    
    // Randomly scroll back up (human behavior)
    if (Math.random() < CONFIG.SCROLL_BACK_CHANCE) {
      await page.evaluate((amount) => {
        window.scrollBy({ 
          top: -amount, 
          behavior: 'smooth' 
        });
      }, random(100, 250));
      await sleep(random(800, 1500));
    }
    
    // Random pauses (human gets distracted)
    if (Math.random() < CONFIG.PAUSE_CHANCE) {
      await sleep(random(2000, 4000));
    }
  }
}

async function expandCaptions(page) {
  try {
    await page.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll('button'));
      const moreButtons = buttons.filter((b) => 
        b.innerText.toLowerCase().includes('more')
      );
      moreButtons.forEach((b) => {
        try { b.click(); } catch (e) {}
      });
    });
    await sleep(random(1000, 2000));
  } catch (e) {
    // Continue if expansion fails
  }
}

// ========== RATE LIMIT DETECTION ==========
async function checkRateLimit(page) {
  try {
    const isLimited = await page.evaluate(() => {
      const body = document.body.innerText.toLowerCase();
      return (
        body.includes('try again later') ||
        body.includes('please wait') ||
        body.includes('action blocked') ||
        body.includes('we restrict certain')
      );
    });
    
    if (isLimited && !rateLimitHit) {
      console.log('\n⚠️  RATE LIMITED - Instagram is blocking requests');
      console.log('   Recommendation: Wait 2-4 hours before continuing');
      rateLimitHit = true;
    }
    
    return isLimited;
  } catch (e) {
    return false;
  }
}

// ========== DATA EXTRACTION ==========
async function extractPostDetails(page, url, type, retryCount = 0) {
  try {
    // Navigate with realistic timing
    await page.goto(url, { 
      waitUntil: 'domcontentloaded',
      timeout: 45000 
    });
    
    // Wait for content with human-like variability
    await sleep(random(3000, 5000));
    
    // Check for rate limiting
    if (await checkRateLimit(page)) {
      return { 
        likes: '', 
        comments: '', 
        views: '', 
        caption: 'Rate-limited',
        status: 'rate_limited' 
      };
    }
    
    // Simulate human behavior
    await simulateHumanBehavior(page);
    await expandCaptions(page);
    await sleep(random(1000, 2000));
    
    const data = await page.evaluate(() => {
      const info = { 
        likes: '', 
        comments: '', 
        views: '', 
        caption: '',
        status: 'success' 
      };
      
      // Priority 1: Meta tags (most reliable)
      const metaDesc = document.querySelector('meta[property="og:description"]');
      if (metaDesc?.content) {
        info.caption = metaDesc.content;
      }
      
      const bodyText = document.body.innerText || '';
      
      // Extract metrics with multiple patterns
      const likesPatterns = [
        /([\d,]+)\s*likes?/i,
        /([\d,]+)\s*others?/i,
        /liked by\s*([\d,]+)/i,
      ];
      
      for (const pattern of likesPatterns) {
        const match = bodyText.match(pattern);
        if (match) {
          info.likes = match[1].replace(/,/g, '');
          break;
        }
      }
      
      // Comments
      const commentsPatterns = [
        /([\d,]+)\s*comments?/i,
        /view all\s*([\d,]+)\s*comments?/i,
      ];
      
      for (const pattern of commentsPatterns) {
        const match = bodyText.match(pattern);
        if (match) {
          info.comments = match[1].replace(/,/g, '');
          break;
        }
      }
      
      // Views (for reels/videos)
      const viewsPatterns = [
        /([\d,\.]+[KMB]?)\s*views?/i,
        /([\d,]+)\s*plays?/i,
      ];
      
      for (const pattern of viewsPatterns) {
        const match = bodyText.match(pattern);
        if (match) {
          info.views = match[1];
          break;
        }
      }
      
      // Caption fallback strategies
      if (!info.caption || info.caption.length < 15) {
        // Try H1
        const h1 = document.querySelector('h1');
        if (h1?.innerText && h1.innerText.length > 10) {
          info.caption = h1.innerText;
        }
      }
      
      if (!info.caption || info.caption.length < 15) {
        // Try finding caption in spans
        const spans = Array.from(document.querySelectorAll('span'));
        const captionSpan = spans.find((s) => {
          const text = s.innerText;
          return (
            text &&
            text.length > 20 &&
            text.length < 2000 &&
            !text.includes('Follow') &&
            !text.includes('Share') &&
            !text.includes('Like') &&
            !text.includes('Comment')
          );
        });
        
        if (captionSpan) {
          info.caption = captionSpan.innerText;
        }
      }
      
      // Final cleanup
      if (info.caption) {
        info.caption = info.caption.trim().slice(0, 500);
      }
      
      return info;
    });
    
    return data;
    
  } catch (e) {
    console.log(`\n   ⚠️ Extraction error on ${url.slice(-15)}: ${e.message}`);
    
    // Retry logic
    if (retryCount < CONFIG.MAX_RETRIES) {
      console.log(`   🔄 Retrying (${retryCount + 1}/${CONFIG.MAX_RETRIES})...`);
      await sleep(CONFIG.RETRY_DELAY);
      return extractPostDetails(page, url, type, retryCount + 1);
    }
    
    return { 
      likes: '', 
      comments: '', 
      views: '', 
      caption: '',
      status: 'failed' 
    };
  }
}

// ========== URL COLLECTION ==========
async function collectDesktopPosts(page, keyword) {
  console.log(`\n💻 Collecting posts from desktop view...`);
  
  await page.goto(`https://www.instagram.com/explore/tags/${keyword}/`, {
    waitUntil: 'domcontentloaded',
    timeout: CONFIG.PAGE_TIMEOUT,
  });
  
  await sleep(random(3000, 5000));
  await dismissPopups(page);
  await humanScroll(page, false);
  
  const urls = await page.evaluate(() => {
    const links = Array.from(document.querySelectorAll('a[href]'));
    const seen = new Set();
    const results = [];
    
    for (const link of links) {
      const href = link.getAttribute('href');
      if (href && (href.includes('/p/') || href.includes('/reel/'))) {
        const full = href.startsWith('http')
          ? href
          : `https://www.instagram.com${href}`;
        const clean = full.split('?')[0];
        
        if (!seen.has(clean)) {
          seen.add(clean);
          results.push({
            url: clean,
            type: clean.includes('/reel/') ? 'reel' : 'post',
          });
        }
      }
    }
    
    return results;
  });
  
  console.log(`   ✅ Found ${urls.length} URLs (${urls.filter(u => u.type === 'reel').length} reels, ${urls.filter(u => u.type === 'post').length} posts)`);
  return urls;
}

async function collectMobileReels(page, keyword) {
  console.log(`\n📱 Collecting reels from mobile view...`);
  
  await page.goto(`https://www.instagram.com/explore/tags/${keyword}/reels/`, {
    waitUntil: 'domcontentloaded',
    timeout: CONFIG.PAGE_TIMEOUT,
  });
  
  await sleep(random(3000, 5000));
  await dismissPopups(page);
  await humanScroll(page, true);
  
  const urls = await page.evaluate(() => {
    const seen = new Set();
    const results = [];
    
    document.querySelectorAll('a[href*="/reel/"]').forEach((a) => {
      const href = a.getAttribute('href');
      if (href) {
        const full = href.startsWith('http')
          ? href
          : `https://www.instagram.com${href}`;
        const clean = full.split('?')[0];
        
        if (!seen.has(clean)) {
          seen.add(clean);
          results.push({ url: clean, type: 'reel' });
        }
      }
    });
    
    return results;
  });
  
  console.log(`   ✅ Found ${urls.length} additional reels`);
  return urls;
}

// ========== MAIN SCRAPER ==========
async function scrapeInstagram(keyword, totalWanted) {
  console.log(`\n🔍 Starting scrape for: #${keyword}`);
  
  const browser = await puppeteer.launch({
    headless: CONFIG.HEADLESS,
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-dev-shm-usage',
      '--disable-blink-features=AutomationControlled',
      '--disable-web-security',
      '--window-size=1920,1080',
    ],
  });
  
  globalBrowser = browser;
  
  try {
    // ========== DESKTOP PAGE SETUP ==========
    const desktopPage = await browser.newPage();
    await enhanceFingerprint(desktopPage);
    
    const userAgents = [
      'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    ];
    
    await desktopPage.setUserAgent(userAgents[random(0, userAgents.length - 1)]);
    await desktopPage.setViewport({ width: 1920, height: 1080 });
    
    // Load session and login
    const session = await loadSession(desktopPage);
    await desktopPage.goto('https://www.instagram.com/', { 
      waitUntil: 'domcontentloaded' 
    });
    
    await sleep(2000);
    
    if (!(await isLoggedIn(desktopPage))) {
      const loginSuccess = await waitForManualLogin(desktopPage);
      if (!loginSuccess) {
        throw new Error('Login required');
      }
    }
    
    await waitForEnter('⚠️  Handle any popups (notifications, save info, etc.)');
    
    // ========== MOBILE PAGE SETUP ==========
    const mobilePage = await browser.newPage();
    await enhanceFingerprint(mobilePage);
    
    await mobilePage.setUserAgent(
      'Mozilla/5.0 (iPhone; CPU iPhone OS 16_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.0 Mobile/15E148 Safari/604.1'
    );
    await mobilePage.setViewport({ width: 390, height: 844 });
    
    // CRITICAL: Load session on mobile page
    if (session?.cookies) {
      await mobilePage.setCookie(...session.cookies);
    }
    
    // ========== COLLECT URLS ==========
    const desktopUrls = await collectDesktopPosts(desktopPage, keyword);
    const mobileReels = await collectMobileReels(mobilePage, keyword);
    
    // Combine and deduplicate
    const allUrls = [...desktopUrls, ...mobileReels];
    const uniqueUrls = Array.from(
      new Map(allUrls.map(item => [item.url, item])).values()
    );
    
    // Separate reels and posts
    const reels = uniqueUrls.filter(u => u.type === 'reel');
    const posts = uniqueUrls.filter(u => u.type === 'post');
    
    // Calculate targets
    const reelTarget = Math.round(totalWanted * CONFIG.REELS_RATIO);
    const postTarget = totalWanted - reelTarget;
    
    // Select final mix
    const selectedReels = reels.slice(0, reelTarget);
    const selectedPosts = posts.slice(0, postTarget);
    const finalList = [...selectedReels, ...selectedPosts];
    
    // Shuffle to avoid patterns
    finalList.sort(() => Math.random() - 0.5);
    
    console.log(`\n📊 Final selection: ${selectedReels.length} reels + ${selectedPosts.length} posts = ${finalList.length} total`);
    console.log(`   Target was: ${reelTarget} reels + ${postTarget} posts = ${totalWanted} total`);
    
    // ========== EXTRACT DATA ==========
    console.log(`\n🔄 Extracting data (this will take a while)...`);
    const results = [];
    
    for (let i = 0; i < finalList.length; i++) {
      const item = finalList[i];
      
      // Use appropriate page for extraction
      const extractPage = item.type === 'reel' ? mobilePage : desktopPage;
      
      process.stdout.write(`\r   [${i + 1}/${finalList.length}] ${item.type}: ${item.url.slice(-20)}`);
      
      const details = await extractPostDetails(extractPage, item.url, item.type);
      results.push({ ...item, ...details });
      
      // Check if we hit rate limit
      if (rateLimitHit) {
        console.log('\n\n⚠️  Stopping due to rate limit. Save partial results? (y/n)');
        await waitForEnter('Press ENTER to save partial results');
        break;
      }
      
      // Human-like delay between posts (critical!)
      if (i < finalList.length - 1) {
        const delay = random(CONFIG.MIN_POST_DELAY, CONFIG.MAX_POST_DELAY);
        await sleep(delay);
      }
    }
    
    console.log('\n');
    await mobilePage.close();
    
    return results;
    
  } catch (e) {
    console.error('\n❌ Scraper error:', e.message);
    return [];
  } finally {
    if (globalBrowser) {
      await globalBrowser.close();
    }
    globalBrowser = null;
  }
}

// ========== MAIN ==========
(async function main() {
  console.log('╔═══════════════════════════════════════════════════╗');
  console.log('║  Instagram Scraper v5.2 - Production Grade       ║');
  console.log('║  Anti-Detection + Separate Mobile/Desktop        ║');
  console.log('╚═══════════════════════════════════════════════════╝');
  
  const keyword = process.argv[2];
  const total = parseInt(process.argv[3], 10) || CONFIG.TOTAL_POSTS;
  
  if (!keyword) {
    console.log('\nUsage: node instagram-scraper-v5.2.js <keyword> [total]');
    console.log('Example: node instagram-scraper-v5.2.js travel 25');
    process.exit(1);
  }
  
  console.log(`\n📌 Keyword: #${keyword}`);
  console.log(`📌 Target: ${total} posts`);
  console.log(`📌 Reels/Posts ratio: ${CONFIG.REELS_RATIO * 100}% / ${(1 - CONFIG.REELS_RATIO) * 100}%`);
  console.log(`📌 Delays: ${CONFIG.MIN_POST_DELAY / 1000}-${CONFIG.MAX_POST_DELAY / 1000}s between posts`);
  console.log(`📌 Mode: ${CONFIG.HEADLESS ? 'Headless' : 'Visible browser'}`);
  
  const posts = await scrapeInstagram(keyword, total);
  
  if (posts.length === 0) {
    console.log('\n❌ No posts scraped');
    process.exit(1);
  }
  
  const filename = createCSV(posts, keyword);
  
  // Summary
  const successful = posts.filter(p => p.status === 'success').length;
  const failed = posts.filter(p => p.status === 'failed').length;
  const rateLimited = posts.filter(p => p.status === 'rate_limited').length;
  const reelCount = posts.filter(p => p.type === 'reel').length;
  
  console.log(`\n✅ Scraping complete!`);
  console.log(`📄 Saved to: ${filename}`);
  console.log(`\n📊 Summary:`);
  console.log(`   Total: ${posts.length} posts`);
  console.log(`   Reels: ${reelCount} | Posts: ${posts.length - reelCount}`);
  console.log(`   Success: ${successful} | Failed: ${failed} | Rate-limited: ${rateLimited}`);
  
  if (rateLimitHit) {
    console.log(`\n⚠️  Instagram rate limit detected!`);
    console.log(`   Recommendation: Wait 2-4 hours before next run`);
  }
})();


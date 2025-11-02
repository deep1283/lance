// instagram-manual-login-scraper.js - COMPLETE VERSION with Reels

// For educational/research use only

// Usage: node instagram-manual-login-scraper.js <keyword> [total=15]

const fs = require("fs");
const path = require("path");
const puppeteer = require("puppeteer-extra");
const StealthPlugin = require("puppeteer-extra-plugin-stealth");

puppeteer.use(StealthPlugin());

// ===================== CONFIG =====================
const CONFIG = {
  TOTAL_POSTS: 15,
  REELS_RATIO: 0.6, // 60% reels, 40% images
  SCROLL_COUNT: 10,
  PAGE_TIMEOUT: 60000,
  HEADLESS: false, // MUST be false for manual login
  LOGIN_TIMEOUT: 180000, // 3 minutes
  SESSION_FILE: path.join(__dirname, 'instagram-session.json'),
};

let globalBrowser = null;

// ===================== CLEANUP =====================
process.on('SIGINT', async () => {
  console.log('\n⚠️  Interrupted - closing...');
  if (globalBrowser) await globalBrowser.close();
  process.exit(0);
});

// ===================== HELPERS =====================
const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

function sanitizeKeyword(k) {
  return (k || "").toString().replace(/[^a-zA-Z0-9_\s]/g, "").trim().replace(/\s+/g, "_").slice(0, 60) || "default";
}

function sanitizeURL(url) {
  if (!url || typeof url !== 'string') return '';
  if (!url.match(/^https:\/\/(www\.)?instagram\.com\/(p|reel|tv)\//)) return '';
  return url.replace(/["'=+\-@\t\r\n]/g, '');
}

function createCSV(urls, keyword) {
  if (!urls || urls.length === 0) throw new Error('No URLs to save');
  
  const sanitizedKeyword = sanitizeKeyword(keyword);
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5);
  const filename = `instagram_${sanitizedKeyword}_${timestamp}.csv`;
  
  const header = "URL\n";
  const rows = urls.map(item => sanitizeURL(typeof item === 'string' ? item : item.url)).filter(Boolean).join("\n");
  
  if (!rows) throw new Error('No valid URLs after sanitization');
  
  fs.writeFileSync(filename, header + rows, "utf8");
  return filename;
}

// ===================== SESSION MANAGEMENT =====================

async function saveSession(page) {
  try {
    const cookies = await page.cookies();
    fs.writeFileSync(CONFIG.SESSION_FILE, JSON.stringify(cookies, null, 2));
    console.log('   ✅ Session saved');
  } catch (error) {
    console.log('   ⚠️ Failed to save session:', error.message);
  }
}

async function loadSession(page) {
  try {
    if (fs.existsSync(CONFIG.SESSION_FILE)) {
      const cookies = JSON.parse(fs.readFileSync(CONFIG.SESSION_FILE, 'utf8'));
      await page.setCookie(...cookies);
      console.log('   ✅ Session loaded');
      return true;
    }
  } catch (error) {
    console.log('   ⚠️ Failed to load session:', error.message);
  }
  return false;
}

async function isLoggedIn(page) {
  try {
    return await page.evaluate(() => {
      const loggedInIndicators = [
        'svg[aria-label="Home"]', 'svg[aria-label="Search"]', 'svg[aria-label="Explore"]',
        'svg[aria-label="Reels"]', 'svg[aria-label="Messages"]', 'svg[aria-label="Notifications"]',
        'img[alt*="profile picture"]', 'a[href*="/accounts/edit/"]',
      ];
      
      for (const selector of loggedInIndicators) {
        if (document.querySelector(selector)) return true;
      }
      
      if (document.querySelector('input[name="username"]') && document.querySelector('input[name="password"]')) {
        return false;
      }
      
      return !window.location.pathname.includes('/accounts/login');
    });
  } catch {
    return false;
  }
}

// ===================== MANUAL LOGIN =====================

async function waitForManualLogin(page) {
  console.log('\n' + '='.repeat(60));
  console.log('🔐 MANUAL LOGIN REQUIRED');
  console.log('='.repeat(60));
  console.log('\n📍 Instructions:');
  console.log('   1. Browser window is now open');
  console.log('   2. Log in to Instagram');
  console.log('   3. Complete 2FA if needed');
  console.log('   4. Click "Not Now" on popups');
  console.log('   5. Wait on home page');
  console.log('\n⏳ Scraper will auto-detect login...\n');
  
  const startTime = Date.now();
  let attempts = 0;
  
  while (Date.now() - startTime < CONFIG.LOGIN_TIMEOUT) {
    attempts++;
    const loggedIn = await isLoggedIn(page);
    
    if (loggedIn) {
      console.log('\n✅ Login detected!');
      await saveSession(page);
      return true;
    }
    
    if (attempts % 2 === 0) {
      const elapsed = Math.floor((Date.now() - startTime) / 1000);
      const remaining = Math.floor((CONFIG.LOGIN_TIMEOUT - (Date.now() - startTime)) / 1000);
      console.log(`   ⏳ Waiting... (${elapsed}s elapsed, ${remaining}s remaining)`);
    }
    
    await sleep(5000);
  }
  
  console.log('\n⚠️ Login timeout');
  return false;
}

// ===================== EXTRACTION HELPER =====================

function extractPostsFromPage() {
  const results = [];
  const seen = new Set();
  const allLinks = document.querySelectorAll('a[href]');
  
  allLinks.forEach(link => {
    const href = link.getAttribute('href');
    if (href && (href.includes('/p/') || href.includes('/reel/') || href.includes('/tv/'))) {
      const fullUrl = href.startsWith('http') ? href : `https://www.instagram.com${href}`;
      const cleanUrl = fullUrl.split('?')[0];
      
      if (seen.has(cleanUrl)) return;
      seen.add(cleanUrl);
      
      let engagement = 0;
      try {
        const parent = link.closest('article') || link.parentElement;
        if (parent) {
          const text = parent.innerText || '';
          
          const likesMatch = text.match(/([\d,]+)\s*likes?/i);
          if (likesMatch) {
            engagement = parseInt(likesMatch[1].replace(/,/g, ''), 10);
          }
          
          const viewsMatch = text.match(/([\d,\.]+)([KMB]?)\s*views?/i);
          if (viewsMatch) {
            let views = parseFloat(viewsMatch[1].replace(/,/g, ''));
            const unit = viewsMatch[2];
            if (unit === 'K') views *= 1000;
            if (unit === 'M') views *= 1000000;
            if (unit === 'B') views *= 1000000000;
            engagement = Math.max(engagement, views);
          }
        }
      } catch {}
      
      results.push({
        url: cleanUrl,
        engagement: engagement,
        isReel: cleanUrl.includes('/reel/') || cleanUrl.includes('/tv/')
      });
    }
  });
  
  return results;
}

// ===================== SCRAPER =====================

async function scrapeInstagramSearch(keyword, totalWanted) {
  console.log(`\n🔍 Starting scrape for: "${keyword}"`);
  
  const browser = await puppeteer.launch({
    headless: CONFIG.HEADLESS,
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage', '--window-size=1920,1080'],
  });
  
  globalBrowser = browser;
  
  try {
    const page = await browser.newPage();
    await page.setUserAgent('Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');
    await page.setViewport({ width: 1920, height: 1080 });
    
    console.log('\n📱 Opening Instagram...');
    await loadSession(page);
    await page.goto('https://www.instagram.com/', { waitUntil: 'domcontentloaded', timeout: CONFIG.PAGE_TIMEOUT });
    await sleep(4000);
    
    const alreadyLoggedIn = await isLoggedIn(page);
    
    if (alreadyLoggedIn) {
      console.log('   ✅ Already logged in (session restored)');
    } else {
      console.log('   ℹ️  Not logged in');
      const loginSuccess = await waitForManualLogin(page);
      if (!loginSuccess) {
        console.log('\n❌ Login failed');
        return [];
      }
    }
    
    console.log('\n⏳ Page stabilizing...');
    await sleep(3000);
    
    // Dismiss popups
    try {
      const buttons = await page.$$('button');
      for (const button of buttons) {
        const text = await page.evaluate(el => el.textContent, button);
        if (text && text.includes('Not Now')) {
          await button.click();
          await sleep(2000);
          break;
        }
      }
    } catch {}
    
    // ========== DESKTOP SCRAPE (Images) ==========
    console.log(`\n🖥️  DESKTOP SCRAPE (Images)`);
    const searchURL = `https://www.instagram.com/explore/search/keyword/?q=${encodeURIComponent(keyword)}`;
    console.log(`   → ${searchURL}`);
    
    await page.goto(searchURL, { waitUntil: 'domcontentloaded', timeout: CONFIG.PAGE_TIMEOUT });
    await sleep(4000);
    
    console.log('   → Scrolling...');
    for (let i = 0; i < CONFIG.SCROLL_COUNT; i++) {
      await page.evaluate(() => window.scrollBy({ top: Math.random() * 500 + 500, behavior: 'smooth' }));
      await sleep(3000);
      console.log(`      ${i + 1}/${CONFIG.SCROLL_COUNT}`);
    }
    
    console.log('   → Extracting...');
    const desktopPosts = await page.evaluate(extractPostsFromPage);
    console.log(`   ✅ ${desktopPosts.length} posts`);
    
    // ========== MOBILE SCRAPE (Mixed) ==========
    console.log(`\n📱 MOBILE SCRAPE (Reels)`);
    await page.setViewport({ width: 375, height: 812 });
    await page.setUserAgent('Mozilla/5.0 (iPhone; CPU iPhone OS 16_6 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.6 Mobile/15E148 Safari/604.1');
    
    const exploreURL = `https://www.instagram.com/explore/tags/${encodeURIComponent(keyword)}/`;
    console.log(`   → ${exploreURL}`);
    
    await page.goto(exploreURL, { waitUntil: 'domcontentloaded', timeout: CONFIG.PAGE_TIMEOUT });
    await sleep(4000);
    
    console.log('   → Scrolling...');
    for (let i = 0; i < CONFIG.SCROLL_COUNT; i++) {
      await page.evaluate(() => window.scrollBy({ top: Math.random() * 400 + 400, behavior: 'smooth' }));
      await sleep(2500);
      console.log(`      ${i + 1}/${CONFIG.SCROLL_COUNT}`);
    }
    
    console.log('   → Extracting...');
    const mobilePosts = await page.evaluate(extractPostsFromPage);
    console.log(`   ✅ ${mobilePosts.length} posts`);
    
    // ========== HASHTAG REELS ==========
    console.log(`\n🎬 HASHTAG REELS PAGE`);
    const reelsURL = `https://www.instagram.com/explore/tags/${encodeURIComponent(keyword)}/reels/`;
    console.log(`   → ${reelsURL}`);
    
    await page.goto(reelsURL, { waitUntil: 'domcontentloaded', timeout: CONFIG.PAGE_TIMEOUT });
    await sleep(4000);
    
    console.log('   → Scrolling...');
    for (let i = 0; i < 3; i++) {
      await page.evaluate(() => window.scrollBy({ top: Math.random() * 400 + 400, behavior: 'smooth' }));
      await sleep(2500);
      console.log(`      ${i + 1}/3`);
    }
    
    console.log('   → Extracting...');
    const reelsPosts = await page.evaluate(extractPostsFromPage);
    console.log(`   ✅ ${reelsPosts.length} reels`);
    
    // ========== COMBINE & PROCESS ==========
    const allPosts = [...desktopPosts, ...mobilePosts, ...reelsPosts];
    
    if (allPosts.length === 0) {
      console.log('\n❌ No posts found');
      return [];
    }
    
    console.log(`\n📊 Processing ${allPosts.length} posts...`);
    
    const uniquePosts = Array.from(new Map(allPosts.map(p => [p.url, p])).values());
    console.log(`   • Unique: ${uniquePosts.length}`);
    
    const reels = uniquePosts.filter(p => p.isReel);
    const regularPosts = uniquePosts.filter(p => !p.isReel);
    
    console.log(`   • Reels: ${reels.length}`);
    console.log(`   • Posts: ${regularPosts.length}`);
    
    if (reels.length === 0) {
      console.log('\n⚠️  No reels found - unusual!');
    }
    
    // Sort by engagement
    reels.sort((a, b) => b.engagement - a.engagement);
    regularPosts.sort((a, b) => b.engagement - a.engagement);
    
    // Calculate targets
    const reelsTarget = Math.round(totalWanted * CONFIG.REELS_RATIO);
    const postsTarget = totalWanted - reelsTarget;
    
    console.log(`\n🎯 Selecting:`);
    console.log(`   • ${reelsTarget} reels (${Math.round(CONFIG.REELS_RATIO * 100)}%)`);
    console.log(`   • ${postsTarget} posts (${Math.round((1 - CONFIG.REELS_RATIO) * 100)}%)`);
    
    // Build final list
    const finalPosts = [...reels.slice(0, reelsTarget), ...regularPosts.slice(0, postsTarget)];
    
    // Fill remaining
    if (finalPosts.length < totalWanted) {
      const remaining = uniquePosts.filter(p => !finalPosts.includes(p)).slice(0, totalWanted - finalPosts.length);
      finalPosts.push(...remaining);
    }
    
    return finalPosts.slice(0, totalWanted);
    
  } catch (error) {
    console.error('\n❌ Error:', error.message);
    return [];
  } finally {
    if (globalBrowser) {
      await globalBrowser.close();
      globalBrowser = null;
    }
  }
}

// ===================== MAIN =====================
(async function main() {
  console.log('╔════════════════════════════════════════════════╗');
  console.log('║  Instagram Manual Login Scraper v2.0          ║');
  console.log('║  ✓ 3-Source Scraping (Desktop+Mobile+Reels)   ║');
  console.log('║  ✓ Manual Login (Safe & Reliable)             ║');
  console.log('║  ✓ Session Persistence                         ║');
  console.log('╚════════════════════════════════════════════════╝');
  
  const keyword = process.argv[2];
  const totalArg = parseInt(process.argv[3], 10);
  const total = Number.isFinite(totalArg) && totalArg > 0 ? totalArg : CONFIG.TOTAL_POSTS;
  if (!keyword) {
    console.log('\nUsage: node instagram-manual-login-scraper.js <keyword> [total]');
    console.log('\nExamples:');
    console.log('  node instagram-manual-login-scraper.js fitness');
    console.log('  node instagram-manual-login-scraper.js "workout" 20\n');
    process.exit(1);
  }
  
  console.log(`\n📌 Keyword: "${keyword}"`);
  console.log(`📌 Target: ${total} URLs (${Math.round(CONFIG.REELS_RATIO * 100)}% reels)`);
  
  const posts = await scrapeInstagramSearch(keyword, total);
  
  if (posts.length === 0) {
    console.log('\n❌ Failed\n');
    process.exit(1);
  }
  
  try {
    const filename = createCSV(posts, keyword);
    const reelCount = posts.filter(p => p.isReel).length;
    const postCount = posts.length - reelCount;
    
    console.log('\n' + '='.repeat(60));
    console.log('✅ SUCCESS!');
    console.log('='.repeat(60));
    console.log(`📄 ${filename}`);
    console.log(`📊 ${posts.length} URLs`);
    console.log(`   • ${reelCount} reels (${Math.round(reelCount/posts.length*100)}%)`);
    console.log(`   • ${postCount} posts (${Math.round(postCount/posts.length*100)}%)`);
    console.log('\n💡 Session saved - next run will be faster!\n');
    
  } catch (error) {
    console.error(`\n❌ ${error.message}\n`);
    process.exit(1);
  }
})();

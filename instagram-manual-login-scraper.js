// instagram-manual-login-scraper.js - Manual Login Version

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
  SCROLL_COUNT: 5,
  PAGE_TIMEOUT: 60000,
  HEADLESS: false, // MUST be false for manual login
  
  LOGIN_TIMEOUT: 180000, // 3 minutes to log in manually
  
  // Session persistence
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
  return (k || "")
    .toString()
    .replace(/[^a-zA-Z0-9_\s]/g, "")
    .trim()
    .replace(/\s+/g, "_")
    .slice(0, 60) || "default";
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
  const rows = urls
    .map(item => sanitizeURL(typeof item === 'string' ? item : item.url))
    .filter(Boolean)
    .join("\n");
  
  if (!rows) throw new Error('No valid URLs after sanitization');
  
  fs.writeFileSync(filename, header + rows, "utf8");
  return filename;
}

// ===================== SESSION MANAGEMENT =====================

async function saveSession(page) {
  try {
    const cookies = await page.cookies();
    fs.writeFileSync(CONFIG.SESSION_FILE, JSON.stringify(cookies, null, 2));
    console.log('   ✅ Session saved to instagram-session.json');
  } catch (error) {
    console.log('   ⚠️ Failed to save session:', error.message);
  }
}

async function loadSession(page) {
  try {
    if (fs.existsSync(CONFIG.SESSION_FILE)) {
      const cookies = JSON.parse(fs.readFileSync(CONFIG.SESSION_FILE, 'utf8'));
      await page.setCookie(...cookies);
      console.log('   ✅ Session loaded from file');
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
      // Multiple indicators that user is logged in
      const loggedInIndicators = [
        // Navigation elements only visible when logged in
        'a[href="/"]', // Home link in nav
        'svg[aria-label="Home"]',
        'svg[aria-label="Search"]',
        'svg[aria-label="Explore"]',
        'svg[aria-label="Reels"]',
        'svg[aria-label="Messages"]',
        'svg[aria-label="Notifications"]',
        'svg[aria-label="Create"]',
        // Profile elements
        'img[alt*="profile picture"]',
        'a[href*="/accounts/edit/"]',
      ];
      
      // Check if any logged-in indicators are present
      for (const selector of loggedInIndicators) {
        if (document.querySelector(selector)) return true;
      }
      
      // If we see the login form, definitely not logged in
      if (document.querySelector('input[name="username"]') && 
          document.querySelector('input[name="password"]')) {
        return false;
      }
      
      // If URL is not login page and we don't see login form, probably logged in
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
  console.log('   1. The browser window should now be open');
  console.log('   2. Log in to Instagram using your credentials');
  console.log('   3. Complete any 2FA if prompted');
  console.log('   4. Click "Not Now" on "Save Login Info" prompt');
  console.log('   5. Click "Not Now" on notifications prompt');
  console.log('   6. Wait on the Instagram home page');
  console.log('\n⏳ The scraper will auto-detect when you\'re logged in...\n');
  
  const startTime = Date.now();
  let attempts = 0;
  
  while (Date.now() - startTime < CONFIG.LOGIN_TIMEOUT) {
    attempts++;
    
    const loggedIn = await isLoggedIn(page);
    
    if (loggedIn) {
      console.log('\n✅ Login detected successfully!');
      await saveSession(page);
      return true;
    }
    
    // Show progress every 10 seconds
    if (attempts % 2 === 0) {
      const elapsed = Math.floor((Date.now() - startTime) / 1000);
      const remaining = Math.floor((CONFIG.LOGIN_TIMEOUT - (Date.now() - startTime)) / 1000);
      console.log(`   ⏳ Still waiting... (${elapsed}s elapsed, ${remaining}s remaining)`);
    }
    
    await sleep(5000);
  }
  
  console.log('\n⚠️ Login timeout reached');
  return false;
}

// ===================== SCRAPER =====================

async function scrapeInstagramSearch(keyword, totalWanted) {
  console.log(`\n🔍 Starting scrape for: "${keyword}"`);
  
  const browser = await puppeteer.launch({
    headless: CONFIG.HEADLESS,
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-dev-shm-usage',
      '--window-size=1920,1080',
    ],
  });
  
  globalBrowser = browser;
  
  try {
    const page = await browser.newPage();
    
    await page.setUserAgent(
      'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
    );
    
    await page.setViewport({ width: 1920, height: 1080 });
    
    console.log('\n📱 Opening Instagram...');
    
    // Try to load existing session first
    const sessionLoaded = await loadSession(page);
    
    await page.goto('https://www.instagram.com/', {
      waitUntil: 'domcontentloaded',
      timeout: CONFIG.PAGE_TIMEOUT,
    });
    
    await sleep(4000);
    
    // Check if already logged in from saved session
    const alreadyLoggedIn = await isLoggedIn(page);
    
    if (alreadyLoggedIn) {
      console.log('   ✅ Already logged in (session restored)');
    } else {
      console.log('   ℹ️  Not logged in - manual login required');
      
      // Wait for manual login
      const loginSuccess = await waitForManualLogin(page);
      
      if (!loginSuccess) {
        console.log('\n❌ Login failed or timeout - cannot continue');
        return [];
      }
    }
    
    // Extra wait after login to ensure everything loads
    console.log('\n⏳ Waiting for page to stabilize...');
    await sleep(3000);
    
    // Dismiss any remaining popups
    console.log('   → Checking for popups...');
    try {
      const buttons = await page.$$('button');
      for (const button of buttons) {
        const text = await page.evaluate(el => el.textContent, button);
        if (text && (text.includes('Not Now') || text.includes('Not now'))) {
          await button.click();
          await sleep(2000);
          console.log('   ✓ Dismissed popup');
          break;
        }
      }
    } catch {}
    
    // Navigate to search/explore
    console.log(`\n🔎 Searching for: "${keyword}"`);
    
    // Use Instagram's search URL directly
    const searchURL = `https://www.instagram.com/explore/search/keyword/?q=${encodeURIComponent(keyword)}`;
    console.log(`   → Navigating to: ${searchURL}`);
    
    await page.goto(searchURL, {
      waitUntil: 'domcontentloaded',
      timeout: CONFIG.PAGE_TIMEOUT,
    });
    
    await sleep(4000);
    
    // Click on "Top" or first tab if visible
    try {
      const links = await page.$$('a, div[role="tab"]');
      for (const link of links) {
        const text = await page.evaluate(el => el.textContent, link);
        if (text && (text.trim() === 'Top' || text.trim() === 'Recent')) {
          console.log(`   ✓ Clicking "${text}" tab`);
          await link.click();
          await sleep(3000);
          break;
        }
      }
    } catch {}
    
    console.log('   → Scrolling to load posts...');
    
    // Scroll to load content
    for (let i = 0; i < CONFIG.SCROLL_COUNT; i++) {
      await page.evaluate(() => {
        window.scrollBy({
          top: Math.random() * 500 + 500,
          behavior: 'smooth'
        });
      });
      await sleep(3000);
      console.log(`      Scroll ${i + 1}/${CONFIG.SCROLL_COUNT}`);
    }
    
    // Scroll back up to capture early posts
    await page.evaluate(() => window.scrollTo(0, 0));
    await sleep(2000);
    
    // One more scroll down
    await page.evaluate(() => window.scrollBy(0, 1000));
    await sleep(2000);
    
    console.log('\n📊 Extracting URLs...');
    
    // Extract post URLs
    const posts = await page.evaluate(() => {
      const results = [];
      const seen = new Set();
      
      // Find all links
      const allLinks = document.querySelectorAll('a[href]');
      
      allLinks.forEach(link => {
        const href = link.getAttribute('href');
        
        // Filter for post/reel URLs
        if (href && (href.includes('/p/') || href.includes('/reel/') || href.includes('/tv/'))) {
          const fullUrl = href.startsWith('http') 
            ? href 
            : `https://www.instagram.com${href}`;
          const cleanUrl = fullUrl.split('?')[0];
          
          if (seen.has(cleanUrl)) return;
          seen.add(cleanUrl);
          
          // Try to get engagement for sorting
          let engagement = 0;
          try {
            const parent = link.closest('article') || link.parentElement;
            if (parent) {
              const text = parent.innerText || '';
              
              // Extract likes
              const likesMatch = text.match(/([\d,]+)\s*likes?/i);
              if (likesMatch) {
                engagement = parseInt(likesMatch[1].replace(/,/g, ''), 10);
              }
              
              // Extract views (reels)
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
    });
    
    console.log(`   ✅ Found ${posts.length} posts`);
    
    if (posts.length === 0) {
      console.log('\n❌ No posts found!');
      console.log('💡 Possible reasons:');
      console.log('   • Keyword has no results');
      console.log('   • Search page structure changed');
      console.log('   • Try a different keyword');
      return [];
    }
    
    // Process results
    console.log(`\n📊 Processing results...`);
    
    const uniquePosts = Array.from(
      new Map(posts.map(p => [p.url, p])).values()
    );
    
    const reels = uniquePosts.filter(p => p.isReel);
    const regularPosts = uniquePosts.filter(p => !p.isReel);
    
    console.log(`   • Reels: ${reels.length}`);
    console.log(`   • Posts: ${regularPosts.length}`);
    
    // Sort by engagement (highest first)
    reels.sort((a, b) => b.engagement - a.engagement);
    regularPosts.sort((a, b) => b.engagement - a.engagement);
    
    // Calculate targets
    const reelsTarget = Math.round(totalWanted * CONFIG.REELS_RATIO);
    const postsTarget = totalWanted - reelsTarget;
    
    console.log(`\n🎯 Selecting top posts:`);
    console.log(`   • Target reels: ${reelsTarget} (${Math.round(CONFIG.REELS_RATIO * 100)}%)`);
    console.log(`   • Target posts: ${postsTarget} (${Math.round((1 - CONFIG.REELS_RATIO) * 100)}%)`);
    
    // Build final list
    const finalPosts = [
      ...reels.slice(0, reelsTarget),
      ...regularPosts.slice(0, postsTarget),
    ];
    
    // Fill remaining slots if needed
    if (finalPosts.length < totalWanted) {
      const remaining = uniquePosts
        .filter(p => !finalPosts.includes(p))
        .slice(0, totalWanted - finalPosts.length);
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
  console.log('║  Instagram Manual Login Scraper                ║');
  console.log('║  ✓ Manual Login (You log in yourself)         ║');
  console.log('║  ✓ Session Persistence                         ║');
  console.log('║  ✓ Top Posts by Engagement                     ║');
  console.log('║  For Educational/Research Use Only             ║');
  console.log('╚════════════════════════════════════════════════╝');
  
  const keyword = process.argv[2];
  const totalArg = parseInt(process.argv[3], 10);
  const total = Number.isFinite(totalArg) && totalArg > 0 ? totalArg : CONFIG.TOTAL_POSTS;
  if (!keyword) {
    console.log('\n❌ Missing keyword!\n');
    console.log('Usage: node instagram-manual-login-scraper.js <keyword> [total]');
    console.log('\nExamples:');
    console.log('  node instagram-manual-login-scraper.js fitness');
    console.log('  node instagram-manual-login-scraper.js "workout tips" 20');
    console.log('\n📌 How it works:');
    console.log('  1. Browser opens automatically');
    console.log('  2. You log in manually (safe!)');
    console.log('  3. Session is saved for next time');
    console.log('  4. Scraper extracts top post URLs');
    console.log('\n⚠️  IMPORTANT: Keep HEADLESS: false for manual login\n');
    process.exit(1);
  }
  
  console.log(`\n📌 Search term: "${keyword}"`);
  console.log(`📌 Target: ${total} URLs (${Math.round(CONFIG.REELS_RATIO * 100)}% reels)`);
  console.log(`📌 Mode: Manual login`);
  
  const posts = await scrapeInstagramSearch(keyword, total);
  
  if (posts.length === 0) {
    console.log('\n❌ No URLs extracted');
    console.log('\n💡 Tips:');
    console.log('  • Try a different keyword');
    console.log('  • Delete instagram-session.json and retry');
    console.log('  • Check if keyword has results on Instagram');
    process.exit(1);
  }
  
  try {
    const filename = createCSV(posts, keyword);
    const reelCount = posts.filter(p => p.isReel).length;
    const postCount = posts.length - reelCount;
    
    console.log('\n' + '='.repeat(60));
    console.log('✅ SUCCESS!');
    console.log('='.repeat(60));
    console.log(`📄 File: ${filename}`);
    console.log(`📊 Total URLs: ${posts.length}`);
    console.log(`   • Reels: ${reelCount} (${Math.round(reelCount/posts.length*100)}%)`);
    console.log(`   • Posts: ${postCount} (${Math.round(postCount/posts.length*100)}%)`);
    console.log('\n💡 Your session is saved!');
    console.log('   Next run will skip manual login ⚡');
    console.log('\n💡 Tips:');
    console.log('  • Wait 30+ minutes before next scrape');
    console.log('  • Session file: instagram-session.json');
    console.log('  • If login fails, delete session file\n');
    
  } catch (error) {
    console.error(`\n❌ Save error: ${error.message}\n`);
    process.exit(1);
  }
})();


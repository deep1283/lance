const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

// Load environment variables from .env.local if it exists
const envPath = path.join(__dirname, '.env.local');
if (fs.existsSync(envPath)) {
    require('dotenv').config({ path: envPath });
}

// Configuration
const INSTAGRAM_EMAIL = process.env.INSTAGRAM_EMAIL || '';
const INSTAGRAM_PASSWORD = process.env.INSTAGRAM_PASSWORD || '';
const INSTAGRAM_USERNAME = process.env.INSTAGRAM_USERNAME || '';

// Helper function to login once and reuse session
async function loginToInstagram(page) {
    // Check if login is required
    const isLoginPage = await page.evaluate(() => {
        return document.querySelector('input[name="username"]') !== null;
    });

    if (isLoginPage) {
        console.log('🔐 Login required, attempting to log in...');

        if (!INSTAGRAM_EMAIL || !INSTAGRAM_PASSWORD) {
            console.error('❌ Instagram credentials not found in environment variables');
            console.log('Please set INSTAGRAM_EMAIL, INSTAGRAM_PASSWORD, and INSTAGRAM_USERNAME in .env file');
            return false;
        }

        // Wait for login form
        await page.waitForSelector('input[name="username"]');

        // Enter credentials
        await page.type('input[name="username"]', INSTAGRAM_EMAIL);
        await page.type('input[name="password"]', INSTAGRAM_PASSWORD);

        // Click login button - try multiple selectors
        try {
            await page.click('button[type="submit"]');
        } catch (e) {
            // Try alternative selector
            try {
                await page.click('button._acan._acap._acas._aj1-');
            } catch (e2) {
                // Press Enter as fallback
                await page.keyboard.press('Enter');
            }
        }

        // Wait for login to complete
        console.log('⏳ Waiting for login to complete...');
        await new Promise(resolve => setTimeout(resolve, 5000));

        // Handle "Save Your Login Info" dialog if it appears
        try {
            const saveInfoButton = await page.$('button:has-text("Not Now")');
            if (saveInfoButton) {
                await saveInfoButton.click();
                await new Promise(resolve => setTimeout(resolve, 2000));
            }
        } catch (e) {
            // Dialog might not appear, that's ok
        }

        // Handle "Turn on Notifications" dialog
        try {
            const notNowButton = await page.$('button:has-text("Not Now")');
            if (notNowButton) {
                await notNowButton.click();
                await new Promise(resolve => setTimeout(resolve, 2000));
            }
        } catch (e) {
            // Dialog might not appear, that's ok
        }
    }

    return true;
}

// Helper function to scrape posts from a page
async function scrapePostsFromPage(page) {
    // Scroll down to load more content (especially reels)
    await page.evaluate(() => {
        window.scrollBy(0, 1000);
    });
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Extract post data - wait longer for posts to load
    await new Promise(resolve => setTimeout(resolve, 5000));

    const posts = await page.evaluate(() => {
        const postsData = [];

        // Try multiple selectors to find posts
        const allLinks = document.querySelectorAll('a[href*="/p/"], a[href*="/reel/"]');

        for (let i = 0; i < Math.min(allLinks.length, 30); i++) {
            const link = allLinks[i];
            const href = link.getAttribute('href');

            if (!href) continue;

            let fullUrl;
            if (href.startsWith('http')) {
                fullUrl = href;
            } else {
                fullUrl = `https://www.instagram.com${href}`;
            }

            postsData.push({
                url: fullUrl,
                likes: 0,
                comments: 0,
                caption: ''
            });
        }

        return postsData;
    });

    return posts;
}

async function scrapeInstagramHashtag(hashtag) {
    console.log(`🔍 Starting scraper for hashtag: #${hashtag}`);

    const browser = await puppeteer.launch({
        headless: true, // Change to false to see browser in action
        args: [
            '--no-sandbox',
            '--disable-setuid-sandbox',
            '--disable-dev-shm-usage',
            '--disable-accelerated-2d-canvas',
            '--no-first-run',
            '--no-zygote',
            '--disable-gpu'
        ]
    });

    try {
        const allPosts = [];

        // ========== MOBILE VIEWPORT SCRAPE ==========
        console.log('📱 Starting mobile viewport scrape...');
        const mobilePage = await browser.newPage();

        // Set mobile viewport and user agent
        await mobilePage.setViewport({ width: 375, height: 812 });
        await mobilePage.setUserAgent('Mozilla/5.0 (iPhone; CPU iPhone OS 14_6 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/14.0.3 Mobile/15E148 Safari/604.1');

        // Navigate to hashtag page
        await mobilePage.goto(`https://www.instagram.com/explore/tags/${hashtag}/`, {
            waitUntil: 'networkidle2',
            timeout: 60000
        });

        // Wait for page to load
        await new Promise(resolve => setTimeout(resolve, 3000));

        // Login if needed
        const mobileLoginSuccess = await loginToInstagram(mobilePage);
        if (!mobileLoginSuccess) {
            await browser.close();
            return null;
        }

        // Navigate back to hashtag REELS page for mobile
        await mobilePage.goto(`https://www.instagram.com/explore/tags/${hashtag}/reels/`, {
            waitUntil: 'networkidle2',
            timeout: 60000
        });
        await new Promise(resolve => setTimeout(resolve, 3000));

        console.log('📊 Scraping mobile posts...');
        const mobilePosts = await scrapePostsFromPage(mobilePage);
        console.log(`✅ Found ${mobilePosts.length} posts from mobile view`);

        allPosts.push(...mobilePosts);
        await mobilePage.close();

        // Wait 30 seconds to avoid rate limiting
        console.log('⏳ Waiting 30 seconds before web scrape...');
        await new Promise(resolve => setTimeout(resolve, 30000));

        // ========== WEB DESKTOP VIEWPORT SCRAPE ==========
        console.log('💻 Starting web desktop viewport scrape...');
        const webPage = await browser.newPage();

        // Set desktop viewport
        await webPage.setViewport({ width: 1920, height: 1080 });
        await webPage.setUserAgent('Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');

        // Navigate to hashtag page (already logged in from mobile, so should work)
        await webPage.goto(`https://www.instagram.com/explore/tags/${hashtag}/`, {
            waitUntil: 'networkidle2',
            timeout: 60000
        });

        // Wait for page to load
        await new Promise(resolve => setTimeout(resolve, 3000));

        // Login if needed (shouldn't be needed but check anyway)
        await loginToInstagram(webPage);

        // Navigate back if needed
        await webPage.goto(`https://www.instagram.com/explore/tags/${hashtag}/`, {
            waitUntil: 'networkidle2',
            timeout: 60000
        });
        await new Promise(resolve => setTimeout(resolve, 3000));

        console.log('📊 Scraping web posts...');
        const webPosts = await scrapePostsFromPage(webPage);
        console.log(`✅ Found ${webPosts.length} posts from web view`);

        allPosts.push(...webPosts);
        await webPage.close();

        // ========== DEDUPLICATE AND PRIORITIZE ==========
        console.log(`📋 Total posts collected: ${allPosts.length}`);

        // Remove duplicates based on URL
        const uniquePostsMap = new Map();
        for (const post of allPosts) {
            if (!uniquePostsMap.has(post.url)) {
                uniquePostsMap.set(post.url, post);
            }
        }

        const uniquePosts = Array.from(uniquePostsMap.values());
        console.log(`📋 Unique posts after deduplication: ${uniquePosts.length}`);

        // Filter and prioritize reels, then carousels
        const reels = [];
        const carousels = [];

        for (const post of uniquePosts) {
            if (post.url.includes('/reel/')) {
                reels.push(post);
            } else if (post.url.includes('/p/')) {
                carousels.push(post);
            }
        }

        // Combine: reels first, then carousels
        const prioritizedPosts = [];
        prioritizedPosts.push(...reels);
        prioritizedPosts.push(...carousels);

        // Take top 10
        const topPosts = prioritizedPosts.slice(0, 10);

        console.log(`📋 Selected top 10 posts (${reels.length} reels, ${topPosts.length - reels.length} carousels)`);

        // No need to fetch details - just return URLs
        // User will manually add likes, comments, captions
        console.log('✅ Extracted URLs only (manual data entry)');

        await browser.close();
        return topPosts;

    } catch (error) {
        console.error('❌ Error during scraping:', error.message);
        await browser.close();
        return null;
    }
}

// Generate CSV
function generateCSV(posts, hashtag) {
    if (!posts || posts.length === 0) {
        return '';
    }

    // CSV header
    let csv = 'Hashtag,url,likes,comments,Caption\n';

    // CSV rows
    for (const post of posts) {
        const hashtagValue = `#${hashtag}`;
        const url = post.url;
        // Leave empty for manual entry
        const likes = '';
        const comments = '';
        const caption = '';

        csv += `"${hashtagValue}","${url}","${likes}","${comments}","${caption}"\n`;
    }

    return csv;
}

// Main function
async function main() {
    // Get hashtag from command line argument
    const hashtag = process.argv[2];

    if (!hashtag) {
        console.log('❌ Usage: node instagram-scraper.js <hashtag>');
        console.log('Example: node instagram-scraper.js jewellery');
        process.exit(1);
    }

    console.log('🚀 Instagram Hashtag Scraper');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    // Scrape hashtag
    const posts = await scrapeInstagramHashtag(hashtag);

    if (!posts || posts.length === 0) {
        console.log('❌ No posts found or scraping failed');
        process.exit(1);
    }

    // Generate CSV
    const csv = generateCSV(posts, hashtag);

    // Save to file
    const filename = `${hashtag}_${new Date().toISOString().split('T')[0]}.csv`;
    const filepath = path.join(__dirname, filename);

    fs.writeFileSync(filepath, csv, 'utf8');

    console.log('\n✅ Scraping completed successfully!');
    console.log(`📄 CSV saved: ${filename}`);
    console.log(`📊 Total posts: ${posts.length}`);
    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━');
}

// Run the scraper
main().catch(console.error);


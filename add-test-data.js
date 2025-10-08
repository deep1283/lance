// Script to add test competitors and data to Supabase
// Run this with: node add-test-data.js

require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

// You'll need to add these to your .env.local file
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY; // Need service role key for admin operations

if (!supabaseUrl || !supabaseServiceKey) {
    console.error('❌ Missing Supabase credentials in .env.local');
    console.log('📝 Add these to your .env.local:');
    console.log('NEXT_PUBLIC_SUPABASE_URL=your_project_url');
    console.log('SUPABASE_SERVICE_ROLE_KEY=your_service_role_key');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function addTestData() {
    try {
        console.log('🚀 Adding test data...');

        // 1. Add sample competitors
        const competitors = [
            {
                name: "Nike",
                industry: "Sports & Fitness",
                status: "active"
            },
            {
                name: "Adidas",
                industry: "Sports & Fitness",
                status: "active"
            },
            {
                name: "Apple",
                industry: "Technology",
                status: "active"
            },
            {
                name: "Samsung",
                industry: "Technology",
                status: "active"
            }
        ];

        console.log('📝 Adding competitors...');
        const { data: competitorData, error: competitorError } = await supabase
            .from('competitors')
            .insert(competitors)
            .select();

        if (competitorError) throw competitorError;
        console.log('✅ Added competitors:', competitorData.map(c => c.name));

        // 2. Get your user ID (you'll need to replace this with your actual user ID)
        console.log('\n👤 To link competitors to your account:');
        console.log('1. Go to your Supabase dashboard → Authentication → Users');
        console.log('2. Find your user ID (UUID)');
        console.log('3. Run this SQL in the SQL editor:');

        competitorData.forEach((comp, index) => {
            console.log(`INSERT INTO user_competitors (user_id, competitor_id) VALUES ('YOUR_USER_ID_HERE', '${comp.id}');`);
        });

        // 3. Add sample ads data
        console.log('\n📊 Adding sample ads...');
        const sampleAds = competitorData.flatMap(comp => [
            {
                competitor_id: comp.id,
                platform: "Meta",
                ad_copy: `New ${comp.name} Collection - Limited Time Offer`,
                image_url: "https://example.com/creative1.jpg",
                cta_text: "Shop Now"
            },
            {
                competitor_id: comp.id,
                platform: "Google",
                ad_copy: `${comp.name} - Best Quality Products`,
                image_url: "https://example.com/creative2.jpg",
                cta_text: "Learn More"
            }
        ]);

        const { error: adsError } = await supabase
            .from('competitor_ads')
            .insert(sampleAds);

        if (adsError) throw adsError;
        console.log('✅ Added sample ads');

        // 4. Add sample creatives
        console.log('📱 Adding sample social creatives...');
        const sampleCreatives = competitorData.flatMap(comp => [
            {
                competitor_id: comp.id,
                platform: "Instagram",
                image_url: "https://example.com/instagram1.jpg",
                caption: `Just launched! Check out our new ${comp.name} collection 🔥 #fashion #style`,
                engagement_count: Math.floor(Math.random() * 1000) + 100,
                posted_at: "2024-01-20"
            },
            {
                competitor_id: comp.id,
                platform: "TikTok",
                image_url: "https://example.com/tiktok1.mp4",
                caption: "POV: You discover the perfect product 💫",
                engagement_count: Math.floor(Math.random() * 5000) + 500,
                posted_at: "2024-01-18"
            }
        ]);

        const { error: creativesError } = await supabase
            .from('competitor_creatives')
            .insert(sampleCreatives);

        if (creativesError) throw creativesError;
        console.log('✅ Added sample creatives');

        console.log('\n🎉 Test data added successfully!');
        console.log('\n📋 Next steps:');
        console.log('1. Link competitors to your user account (see SQL above)');
        console.log('2. Login to your dashboard to see the data');
        console.log('3. The charts will now show real competitor data');

    } catch (error) {
        console.error('❌ Error adding test data:', error.message);
    }
}

addTestData();

require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

async function onboardCustomer(customerEmail, competitors, industry) {
    console.log('🚀 Customer Onboarding Tool\n');
    console.log(`📧 Customer: ${customerEmail}`);
    console.log(`🏢 Industry: ${industry}`);
    console.log(`🎯 Competitors: ${competitors.join(', ')}\n`);

    try {
        // Step 1: Find customer
        console.log('1️⃣ Finding customer...');
        const { data: customer, error: customerError } = await supabase
            .from('users')
            .select('id, email')
            .eq('email', customerEmail)
            .single();

        if (customerError || !customer) {
            console.error('❌ Customer not found. Please ensure they have registered.');
            console.log('💡 Make sure the customer has:');
            console.log('   1. Registered via Google OAuth');
            console.log('   2. Been approved in Supabase (is_approved = true)');
            return;
        }

        console.log(`✅ Found customer: ${customer.email}`);

        // Step 2: Add competitors
        console.log('\n2️⃣ Adding competitors...');
        const competitorData = competitors.map(name => ({
            name: name.trim(),
            industry,
            status: 'active'
        }));

        const { data: insertedCompetitors, error: competitorError } = await supabase
            .from('competitors')
            .insert(competitorData)
            .select();

        if (competitorError) {
            console.error('❌ Error adding competitors:', competitorError);
            return;
        }

        console.log('✅ Competitors added:');
        insertedCompetitors.forEach(comp => {
            console.log(`   - ${comp.name}`);
        });

        // Step 3: Assign competitors to customer
        console.log('\n3️⃣ Assigning competitors to customer...');
        const mappings = insertedCompetitors.map(comp => ({
            user_id: customer.id,
            competitor_id: comp.id
        }));

        const { error: mappingError } = await supabase
            .from('user_competitors')
            .insert(mappings);

        if (mappingError) {
            console.error('❌ Error assigning competitors:', mappingError);
            return;
        }

        console.log('✅ All competitors assigned!');

        // Step 4: Summary
        console.log('\n' + '='.repeat(60));
        console.log('✅ ONBOARDING COMPLETE!');
        console.log('='.repeat(60));
        console.log(`\n📊 Customer: ${customer.email}`);
        console.log(`🏢 Industry: ${industry}`);
        console.log('\n🎯 Competitors:');
        insertedCompetitors.forEach(comp => {
            console.log(`   - ${comp.name} (ID: ${comp.id})`);
        });

        console.log('\n📝 Competitor IDs for reference:');
        insertedCompetitors.forEach(comp => {
            console.log(`   ${comp.name}: ${comp.id}`);
        });

        console.log('\n🚀 Customer can now login and see their dashboard!');
        console.log('\n💡 Next steps:');
        console.log('   1. Upload competitor ads/creatives to Cloudflare R2');
        console.log('   2. Add metadata to Supabase using the IDs above');
        console.log('   3. Dashboard will auto-update with data!');

        return insertedCompetitors;

    } catch (error) {
        console.error('❌ Error:', error);
    }
}

// Command line usage
if (require.main === module) {
    const args = process.argv.slice(2);

    if (args.length < 3) {
        console.log('📋 Usage: node onboard-customer-args.js <customer-email> "<competitor1,competitor2,competitor3>" "<industry>"');
        console.log('');
        console.log('📝 Examples:');
        console.log('   node onboard-customer-args.js "jewelry@example.com" "Tanishq,Kalyan Jewellers,PC Jeweller" "Gold & Diamond Jewelry"');
        console.log('   node onboard-customer-args.js "fashion@example.com" "Zara,H&M,Uniqlo" "Fashion Retail"');
        console.log('   node onboard-customer-args.js "tech@example.com" "Apple,Samsung,Google" "Technology"');
        process.exit(1);
    }

    const [customerEmail, competitorsStr, industry] = args;
    const competitors = competitorsStr.split(',').map(c => c.trim());

    onboardCustomer(customerEmail, competitors, industry);
}

module.exports = { onboardCustomer };

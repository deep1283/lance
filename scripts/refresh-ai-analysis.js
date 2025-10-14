#!/usr/bin/env node

/**
 * AI Analysis Refresh Script
 * 
 * This script runs every 2 days to refresh expired AI analyses.
 * It should be run as a cron job or scheduled task.
 * 
 * Usage:
 * node scripts/refresh-ai-analysis.js
 * 
 * Cron job example (every 2 days at 2 AM):
 * 0 2 */2 * * cd / path / to / lance && node scripts / refresh - ai - analysis.js
    */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

// Initialize Supabase client with service role key
const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function refreshExpiredAnalyses() {
    console.log('🔄 Starting AI analysis refresh...');

    try {
        // Get all expired analyses
        const { data: expiredAnalyses, error: fetchError } = await supabase
            .from('ai_analyses')
            .select('competitor_id, analysis_type, user_id')
            .lt('expires_at', new Date().toISOString());

        if (fetchError) {
            throw new Error(`Failed to fetch expired analyses: ${fetchError.message}`);
        }

        if (!expiredAnalyses || expiredAnalyses.length === 0) {
            console.log('✅ No expired analyses found. All analyses are up to date.');
            return;
        }

        console.log(`📊 Found ${expiredAnalyses.length} expired analyses to refresh.`);

        // Import the AI analysis function
        const { getOrGenerateAnalysis } = require('../src/lib/ai-analysis.ts');

        let successCount = 0;
        let errorCount = 0;

        // Process each expired analysis
        for (const analysis of expiredAnalyses) {
            try {
                console.log(`🔄 Refreshing ${analysis.analysis_type} for competitor ${analysis.competitor_id}...`);

                await getOrGenerateAnalysis({
                    competitorId: analysis.competitor_id,
                    userId: analysis.user_id,
                    analysisType: analysis.analysis_type
                });

                successCount++;
                console.log(`✅ Successfully refreshed ${analysis.analysis_type}`);
            } catch (error) {
                errorCount++;
                console.error(`❌ Failed to refresh ${analysis.analysis_type}:`, error.message);
            }
        }

        console.log(`\n📈 Refresh Summary:`);
        console.log(`✅ Successfully refreshed: ${successCount}`);
        console.log(`❌ Failed to refresh: ${errorCount}`);
        console.log(`📊 Total processed: ${expiredAnalyses.length}`);

    } catch (error) {
        console.error('💥 Fatal error during refresh:', error);
        process.exit(1);
    }
}

// Run the refresh
if (require.main === module) {
    refreshExpiredAnalyses()
        .then(() => {
            console.log('🎉 AI analysis refresh completed successfully!');
            process.exit(0);
        })
        .catch((error) => {
            console.error('💥 AI analysis refresh failed:', error);
            process.exit(1);
        });
}

module.exports = { refreshExpiredAnalyses };

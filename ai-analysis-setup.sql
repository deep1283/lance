-- AI Analysis Database Setup
-- Step 1: Create tables for AI analysis system

-- 1. Create user_profiles table for niche/industry data
CREATE TABLE IF NOT EXISTS user_profiles (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    niche VARCHAR(100) NOT NULL, -- e.g., 'jewelry', 'fashion', 'tech'
    industry VARCHAR(100), -- e.g., 'gold-plated jewelry', 'fast fashion'
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id)
);

-- 2. Create ai_analyses table for storing AI analysis results
CREATE TABLE IF NOT EXISTS ai_analyses (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    competitor_id UUID REFERENCES competitors(id) ON DELETE CASCADE,
    analysis_type VARCHAR(50) NOT NULL, -- 'paid_ads_analysis', 'organic_content_analysis', 'competitive_intelligence', 'viral_reels_analysis'
    content TEXT NOT NULL, -- The AI analysis content
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    expires_at TIMESTAMP WITH TIME ZONE DEFAULT (NOW() + INTERVAL '2 days'),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE, -- For RLS
    UNIQUE(competitor_id, analysis_type, user_id) -- One analysis per type per competitor per user
);

-- 3. Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_user_profiles_user_id ON user_profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_ai_analyses_competitor_id ON ai_analyses(competitor_id);
CREATE INDEX IF NOT EXISTS idx_ai_analyses_type ON ai_analyses(analysis_type);
CREATE INDEX IF NOT EXISTS idx_ai_analyses_expires_at ON ai_analyses(expires_at);
CREATE INDEX IF NOT EXISTS idx_ai_analyses_user_id ON ai_analyses(user_id);

-- 4. Enable Row Level Security (RLS)
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_analyses ENABLE ROW LEVEL SECURITY;

-- 5. Create RLS policies for user_profiles
CREATE POLICY "Users can view their own profile" ON user_profiles
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own profile" ON user_profiles
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own profile" ON user_profiles
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- 6. Create RLS policies for ai_analyses
CREATE POLICY "Users can view their competitor analyses" ON ai_analyses
    FOR SELECT USING (
        user_id = auth.uid() AND 
        competitor_id IN (
            SELECT competitor_id FROM user_competitors WHERE user_id = auth.uid()
        )
    );

CREATE POLICY "Users can insert analyses for their competitors" ON ai_analyses
    FOR INSERT WITH CHECK (
        user_id = auth.uid() AND 
        competitor_id IN (
            SELECT competitor_id FROM user_competitors WHERE user_id = auth.uid()
        )
    );

CREATE POLICY "Users can update analyses for their competitors" ON ai_analyses
    FOR UPDATE USING (
        user_id = auth.uid() AND 
        competitor_id IN (
            SELECT competitor_id FROM user_competitors WHERE user_id = auth.uid()
        )
    );

-- 7. Create function to automatically create user profile when user signs up
CREATE OR REPLACE FUNCTION create_user_profile()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO user_profiles (user_id, niche, industry)
    VALUES (NEW.id, 'general', 'general'); -- Default values, to be updated manually
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 8. Create trigger to automatically create user profile
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION create_user_profile();

-- 9. Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 10. Create trigger for user_profiles updated_at
DROP TRIGGER IF EXISTS update_user_profiles_updated_at ON user_profiles;
CREATE TRIGGER update_user_profiles_updated_at
    BEFORE UPDATE ON user_profiles
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 11. Insert sample data for testing (optional - remove in production)
-- INSERT INTO user_profiles (user_id, niche, industry) 
-- VALUES ('your-user-id-here', 'jewelry', 'gold-plated jewelry');

COMMENT ON TABLE user_profiles IS 'Stores user niche and industry information for AI analysis personalization';
COMMENT ON TABLE ai_analyses IS 'Stores AI-generated analysis results for competitors with 2-day expiration';
COMMENT ON COLUMN ai_analyses.analysis_type IS 'Type of analysis: paid_ads_analysis, organic_content_analysis, competitive_intelligence, viral_reels_analysis';
COMMENT ON COLUMN ai_analyses.expires_at IS 'Analysis expires after 2 days and will be regenerated';

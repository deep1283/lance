# AI Analysis System

## Overview

The AI Analysis System provides intelligent insights for competitor analysis using OpenAI's GPT-4o Mini. It analyzes paid ads, organic content, viral reels, and provides competitive intelligence.

## Architecture

### 🔒 Security & API Protection

- **No Direct API Calls**: Frontend never calls OpenAI directly
- **Server-Side Processing**: All AI analysis happens on the server
- **Authentication Required**: All API routes require valid user sessions
- **Access Control**: Users can only access their own competitor data

### 📊 Analysis Types

1. **Paid Ads Analysis** (`paid_ads_analysis`)

   - Analyzes competitor's paid advertising strategies
   - Identifies successful ad copy patterns and visual themes
   - Provides actionable insights for outperforming competitors

2. **Organic Content Analysis** (`organic_content_analysis`)

   - Analyzes last 7 days of organic social media posts
   - Identifies content patterns and engagement drivers
   - Suggests improvements for organic social media presence

3. **Viral Reels Analysis** (`viral_reels_analysis`)

   - Analyzes top-performing posts and reels
   - Identifies trends in viral content
   - Suggests strategies for creating viral content

4. **Competitive Intelligence** (`competitive_intelligence`)
   - Provides comprehensive market analysis
   - Identifies competitor strengths and weaknesses
   - Suggests strategic moves for market positioning

### 🗄️ Database Schema

#### `user_profiles` Table

```sql
- user_id (UUID, Primary Key)
- niche (TEXT) - User's business niche
- industry (TEXT) - User's industry
- created_at, updated_at (Timestamps)
```

#### `ai_analyses` Table

```sql
- id (UUID, Primary Key)
- competitor_id (UUID, Foreign Key)
- user_id (UUID, Foreign Key)
- analysis_type (TEXT) - Type of analysis
- content (TEXT) - AI-generated analysis
- created_at, expires_at, updated_at (Timestamps)
- UNIQUE(competitor_id, analysis_type, user_id)
```

### 🔄 Caching Strategy

- **2-Day Expiration**: Analyses expire after 2 days
- **Automatic Refresh**: Cron job refreshes expired analyses
- **Fallback Content**: Shows placeholder text if analysis unavailable
- **Incremental Updates**: Only analyzes new data when refreshing

## API Endpoints

### POST `/api/ai-analysis`

Generates or retrieves AI analysis for a competitor.

**Request Body:**

```json
{
  "competitorId": "uuid",
  "analysisType": "paid_ads_analysis" | "organic_content_analysis" | "competitive_intelligence" | "viral_reels_analysis"
}
```

**Response:**

```json
{
  "analysis": "AI-generated analysis text",
  "analysisType": "paid_ads_analysis",
  "competitorId": "uuid"
}
```

### GET `/api/ai-analysis?competitorId=uuid&analysisType=type`

Retrieves cached analysis (no generation).

**Response:**

```json
{
  "analysis": "Cached analysis text",
  "createdAt": "2024-01-01T00:00:00Z",
  "expiresAt": "2024-01-03T00:00:00Z"
}
```

## Frontend Integration

### React Hook: `useAIAnalysis`

```typescript
const { analysis, loading, error } = useAIAnalysis(
  competitorId,
  "paid_ads_analysis"
);
```

**Features:**

- Automatic session validation
- Cached analysis retrieval
- Fallback content on errors
- Loading states

### Client Wrapper: `ai-analysis-client.ts`

Provides secure client-side functions:

- `getAIAnalysis()` - Generate new analysis
- `getCachedAIAnalysis()` - Get cached analysis only

## Automation

### Cron Job Script

**File:** `scripts/refresh-ai-analysis.js`

**Usage:**

```bash
node scripts/refresh-ai-analysis.js
```

**Cron Job Example (every 2 days at 2 AM):**

```bash
0 2 */2 * * cd /path/to/lance && node scripts/refresh-ai-analysis.js
```

**Features:**

- Finds expired analyses
- Refreshes them automatically
- Provides detailed logging
- Error handling and reporting

## Environment Variables

Required in `.env.local`:

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# OpenAI
OPENAI_API_KEY=your_openai_api_key
```

## Cost Optimization

- **GPT-4o Mini**: Cost-effective model for analysis
- **2-Day Caching**: Reduces API calls by ~85%
- **Incremental Analysis**: Only processes new data
- **Estimated Cost**: < $10/month for 1000 competitors

## Error Handling

### Frontend

- Session validation before API calls
- Graceful fallback to placeholder content
- User-friendly error messages
- Loading states for better UX

### Backend

- Comprehensive error logging
- Fallback analysis content
- Retry mechanisms for failed requests
- Access control validation

## Security Features

1. **Authentication Required**: All API routes require valid sessions
2. **Access Control**: Users can only access their own data
3. **Service Role Key**: Server-side operations use elevated permissions
4. **No Direct OpenAI Access**: Frontend never has OpenAI API keys
5. **Input Validation**: All inputs are validated and sanitized

## Monitoring & Logging

- **API Call Logging**: All AI analysis requests are logged
- **Error Tracking**: Failed analyses are tracked and reported
- **Performance Metrics**: Analysis generation times are monitored
- **Usage Statistics**: Track which analysis types are most used

## Future Enhancements

1. **Real-time Updates**: WebSocket integration for live analysis updates
2. **Custom Prompts**: Allow users to customize analysis prompts
3. **Analysis History**: Track analysis changes over time
4. **Export Features**: Allow users to export analysis reports
5. **Multi-language Support**: Support for multiple languages
6. **Advanced Caching**: Redis integration for better performance

## Troubleshooting

### Common Issues

1. **403 Forbidden**: Check user authentication and access permissions
2. **404 Not Found**: Analysis not found, will generate new one
3. **500 Server Error**: Check OpenAI API key and service role key
4. **Slow Loading**: Check network connection and OpenAI API status

### Debug Steps

1. Check browser console for client-side errors
2. Check server logs for API errors
3. Verify environment variables are set correctly
4. Test API endpoints directly with valid authentication
5. Check Supabase RLS policies are configured correctly

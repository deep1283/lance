/**
 * AI Analysis Fallback Content
 *
 * Provides useful insights and analysis when AI is not available
 * or when there's no data to analyze.
 */

export interface FallbackContent {
  title: string;
  content: string;
  type: "info" | "warning" | "success" | "tip";
}

/**
 * Get fallback content for competitive intelligence
 */
export function getCompetitiveIntelligenceFallback(): FallbackContent {
  return {
    title: "📊 Market Intelligence Dashboard",
    type: "info",
    content: `
## 🎯 **JEWELRY MARKET INSIGHTS**

### **Current Market Status**
Your competitive intelligence dashboard is being prepared with real-time market analysis. Here's what we're tracking:

### **📈 Key Metrics We Monitor**
- **Paid Advertising Trends**: Campaign strategies, ad spend patterns, and creative performance
- **Organic Social Media**: Content themes, engagement rates, and viral content analysis  
- **Competitor Activity**: New launches, promotional campaigns, and market positioning
- **Industry Benchmarks**: Performance comparisons and growth opportunities

### **🔍 What You'll Get**
- **Strategic Recommendations**: Data-driven insights for your jewelry business
- **Competitive Analysis**: How you stack up against key competitors
- **Growth Opportunities**: Untapped markets and content strategies
- **Trend Predictions**: Upcoming jewelry industry trends

### **⚡ Next Steps**
1. **Check back in 24 hours** for your first comprehensive market analysis
2. **Review competitor data** in the charts above for immediate insights
3. **Monitor trends** as we continuously update your competitive intelligence

*Analysis updates automatically every 2 days with fresh market data.*
    `,
  };
}

/**
 * Get fallback content for paid ads analysis
 */
export function getPaidAdsFallback(
  competitorName: string,
  hasAds: boolean
): FallbackContent {
  if (!hasAds) {
    return {
      title: "📢 No Active Paid Ads",
      type: "warning",
      content: `
## **${competitorName} - Paid Advertising Status**

### **Current Status: No Active Campaigns**

${competitorName} currently has no paid advertising campaigns running. This presents both opportunities and insights:

### **🎯 Strategic Implications**
- **Market Gap**: Less competition in paid advertising space
- **Opportunity**: Room to capture market share with strategic campaigns
- **Budget Allocation**: Competitor may be focusing on organic growth

### **📊 Recommended Actions**
1. **Launch Test Campaigns**: Start with small budget tests
2. **Monitor Competitor**: Watch for when they resume advertising
3. **Content Strategy**: Focus on organic content while they're quiet
4. **Market Research**: Study their past campaigns for insights

### **🔍 What to Watch For**
- New ad launches in the next 30 days
- Seasonal campaign patterns
- Platform preferences (Meta, Google, etc.)
- Creative themes and messaging

*We'll notify you immediately when ${competitorName} launches new campaigns.*
      `,
    };
  }

  return {
    title: "📊 Paid Ads Analysis",
    type: "info",
    content: `
## **${competitorName} - Paid Advertising Analysis**

### **Campaign Intelligence Being Prepared**

We're analyzing ${competitorName}'s paid advertising strategy to provide you with actionable insights.

### **📈 What We're Tracking**
- **Campaign Performance**: Ad spend, reach, and engagement metrics
- **Creative Analysis**: Visual themes, messaging, and call-to-actions
- **Platform Strategy**: Which platforms they're using and why
- **Targeting Insights**: Audience demographics and interests
- **Seasonal Patterns**: Campaign timing and promotional cycles

### **🎯 Coming Insights**
- **Competitive Advantages**: What's working for them
- **Market Opportunities**: Gaps you can exploit
- **Creative Inspiration**: Successful ad formats and themes
- **Budget Benchmarks**: Industry spending patterns

### **⚡ Next Update**
Your comprehensive paid ads analysis will be ready within 24 hours.

*Analysis refreshes every 2 days with the latest campaign data.*
    `,
  };
}

/**
 * Get fallback content for organic content analysis
 */
export function getOrganicContentFallback(
  competitorName: string,
  hasContent: boolean
): FallbackContent {
  if (!hasContent) {
    return {
      title: "📱 No Organic Content",
      type: "warning",
      content: `
## **${competitorName} - Social Media Status**

### **Current Status: No Recent Posts**

${competitorName} hasn't posted any organic content recently. This reveals important market insights:

### **🎯 Strategic Analysis**
- **Content Strategy Gap**: Opportunity to dominate organic reach
- **Engagement Opportunity**: Less competition for audience attention
- **Brand Visibility**: Chance to become the go-to jewelry brand
- **Market Timing**: Perfect time to launch content campaigns

### **📊 Recommended Strategy**
1. **Content Calendar**: Launch consistent posting schedule
2. **Engagement Focus**: Build community while competitors are quiet
3. **Trend Monitoring**: Watch for when they resume posting
4. **Content Themes**: Study their historical content for insights

### **🔍 What to Monitor**
- Return to posting patterns
- Content themes and styles
- Engagement rates when they post
- Platform preferences and timing

*We'll track their content strategy and notify you of any changes.*
      `,
    };
  }

  return {
    title: "📱 Organic Content Analysis",
    type: "info",
    content: `
## **${competitorName} - Social Media Strategy**

### **Content Intelligence Being Analyzed**

We're studying ${competitorName}'s organic content strategy to provide you with growth insights.

### **📈 What We're Analyzing**
- **Content Themes**: What topics and styles resonate with their audience
- **Engagement Patterns**: Best performing posts and optimal timing
- **Visual Strategy**: Photo styles, video formats, and aesthetic choices
- **Caption Analysis**: Writing style, hashtag usage, and storytelling
- **Growth Tactics**: How they're building their following

### **🎯 Coming Insights**
- **Content Inspiration**: Successful post formats and themes
- **Engagement Strategies**: What drives likes, comments, and shares
- **Growth Opportunities**: Content gaps you can fill
- **Audience Insights**: Who's engaging and why

### **⚡ Next Update**
Your comprehensive organic content analysis will be ready within 24 hours.

*Analysis refreshes every 2 days with the latest content data.*
    `,
  };
}

/**
 * Get fallback content for viral reels analysis
 */
export function getViralReelsFallback(
  competitorName: string,
  hasViralContent: boolean
): FallbackContent {
  if (!hasViralContent) {
    return {
      title: "🔥 No Viral Content",
      type: "warning",
      content: `
## **${competitorName} - Viral Content Status**

### **Current Status: No Viral Posts**

${competitorName} doesn't have any viral content in our database. This presents a unique opportunity:

### **🎯 Market Opportunity**
- **Viral Content Gap**: Room to create the first viral jewelry content
- **Audience Attention**: Less competition for viral moments
- **Brand Recognition**: Chance to become the viral jewelry brand
- **Content Innovation**: Opportunity to set new trends

### **📊 Viral Content Strategy**
1. **Trend Research**: Study viral content in related niches
2. **Creative Testing**: Experiment with different video formats
3. **Timing Strategy**: Post when audience is most active
4. **Engagement Focus**: Create content that encourages sharing

### **🔍 What to Watch For**
- First viral post from this competitor
- Content themes that gain traction
- Video formats that work
- Engagement patterns and timing

*We'll monitor their content and alert you to any viral breakthroughs.*
      `,
    };
  }

  return {
    title: "🔥 Viral Content Analysis",
    type: "info",
    content: `
## **${competitorName} - Viral Content Strategy**

### **Viral Intelligence Being Analyzed**

We're studying ${competitorName}'s most successful content to reveal what makes jewelry content go viral.

### **📈 What We're Analyzing**
- **Viral Triggers**: What elements make their content shareable
- **Content Formats**: Video styles, lengths, and structures that work
- **Engagement Drivers**: What makes people like, comment, and share
- **Timing Patterns**: When their viral content performs best
- **Audience Response**: How people react to their top content

### **🎯 Coming Insights**
- **Viral Formula**: Replicable elements for your content
- **Content Inspiration**: Successful video ideas and formats
- **Engagement Tactics**: Strategies to boost your reach
- **Trend Predictions**: What's likely to go viral next

### **⚡ Next Update**
Your comprehensive viral content analysis will be ready within 24 hours.

*Analysis refreshes every 2 days with the latest viral content data.*
    `,
  };
}

/**
 * Get fallback content for rate limit errors
 */
export function getRateLimitFallback(): FallbackContent {
  return {
    title: "⏳ AI Analysis Temporarily Unavailable",
    type: "warning",
    content: `
## **Rate Limit Reached**

Our AI analysis system has temporarily hit rate limits. This is normal and expected.

### **📊 What's Happening**
- **High Demand**: Many users are requesting analysis simultaneously
- **Rate Protection**: We limit calls to ensure system stability
- **Automatic Recovery**: Analysis will resume automatically

### **🎯 What You Can Do**
1. **Check Charts**: Use the data visualizations above for insights
2. **Review Competitors**: Browse competitor profiles for immediate insights
3. **Wait 15-30 Minutes**: Analysis will be available shortly
4. **Refresh Page**: Try again in a few minutes

### **⚡ Next Steps**
- **Analysis will resume automatically** within 15-30 minutes
- **No action needed** - we'll notify you when ready
- **All data is preserved** - nothing is lost

*This is a temporary delay. Your analysis will be ready soon.*
    `,
  };
}

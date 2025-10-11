export interface User {
  id: string;
  email?: string;
  phone?: string;
  is_approved: boolean;
  created_at: string;
  updated_at: string;
}

export interface Competitor {
  id: string;
  name: string;
  website_url?: string;
  logo_url?: string;
  industry?: string;
  status: string;
  created_at: string;
  updated_at: string;
}

export interface UserCompetitor {
  id: string;
  user_id: string;
  competitor_id: string;
  added_at: string;
}

export interface Ad {
  id: string;
  competitor_id: string;
  platform: string;
  ad_title?: string;
  ad_copy?: string;
  image_url?: string;
  cta_text?: string;
  start_date?: string;
  end_date?: string;
  status: string;
  library_id?: string;
  analyzed_at: string;
}

export interface Creative {
  id: string;
  competitor_id: string;
  platform?: string;
  post_url?: string;
  image_url?: string;
  caption?: string;
  engagement_count: number;
  posted_at: string;
}

export interface CompetitorWebsite {
  id: string;
  competitor_id: string;
  speed_score?: number;
  keywords?: any;
  meta_tags?: any;
  gpt_analysis?: string;
  analyzed_at: string;
}

export interface AnalyzedWebsite {
  id: string;
  user_id: string;
  website_url: string;
  speed_score?: number;
  keywords?: any;
  meta_tags?: any;
  gpt_analysis?: string;
  analyzed_at: string;
}

export interface CompetitorWithStats extends Competitor {
  ad_count: number;
  creative_count: number;
  total_engagement: number;
}

export interface ChartData {
  name: string;
  value: number;
  color?: string;
}

export interface TimeSeriesData {
  date: string;
  ads: number;
  creatives: number;
  engagement: number;
}

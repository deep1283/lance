export interface Competitor {
  id: string;
  name: string;
  website_url?: string;
  logo_url?: string;
  industry?: string;
  status: "active" | "inactive";
  created_at: string;
}

export interface UserCompetitor {
  id: string;
  user_id: string;
  competitor_id: string;
  added_at: string;
  competitors: Competitor;
}

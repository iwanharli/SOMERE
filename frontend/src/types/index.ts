export type Platform = "INSTAGRAM" | "TWITTER" | "FACEBOOK" | "TIKTOK" | "YOUTUBE" | "LINKEDIN";

export interface PanelinService {
  id: number;
  name: string;
  description: string | null;
  category: string;
  type: string;
  rate: number;
  min: number;
  max: number;
  dripfeed: boolean;
  refill: boolean;
  cancel: boolean;
  syncedAt: string;
}

export interface PanelinOrder {
  id: number;
  service_id: number;
  link: string | null;
  quantity: number;
  rate: number;
  charge: number;
  start_count: number | null;
  remains: number | null;
  status: string;
  comments: string | null;
  created_at: string;
  updated_at: string;
}

export interface PanelinTransaction {
  id: number;
  type: string | null;
  amount: number;
  balance_before: number | null;
  balance_after: number | null;
  description: string | null;
  created_at: string;
}

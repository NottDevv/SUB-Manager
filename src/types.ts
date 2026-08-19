export interface LinkItem {
  id: number;
  user_id: number;
  title: string;
  url: string;
  order_index?: number;
  traffic_used_gb?: number;
  traffic_limit_gb?: number;
  expire_date?: string;
}

export interface UserAccount {
  id: number;
  username: string;
  password?: string;
  role: 'admin' | 'user';
  status: 'active' | 'disabled';
  expire_date: string | null; // e.g. "2026-12-31" or null for unlimited
  order_index?: number;
  created_at: string;
  links: LinkItem[];
}

export type AdminTab = 'users' | 'add_user' | 'settings';

export type Lang = 'fa' | 'en';

export interface ToastMessage {
  id: string;
  type: 'success' | 'error' | 'info';
  message: string;
}

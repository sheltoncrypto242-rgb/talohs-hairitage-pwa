export interface Notification {
  id: number;
  created_at: string;
  user_id: string;
  order_id: number | null;
  order_number: string;
  title: string;
  message: string;
  type: 'order_update' | 'payment_update' | 'system';
  old_status: string | null;
  new_status: string | null;
  is_read: boolean;
  read_at: string | null;
  data: any;
  action_url: string | null;
}

export interface NotificationStats {
  total: number;
  unread: number;
}
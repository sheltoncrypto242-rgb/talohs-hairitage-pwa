import { supabase } from "@/lib/supabase";
import { type Notification, type NotificationStats } from "@/types/notification";

class NotificationService {
  private static instance: NotificationService;
  private listeners: ((notification: Notification) => void)[] = [];
  private unreadCountListeners: ((count: number) => void)[] = [];
  private channel: any = null;
  private currentUserId: string | null = null;

  static getInstance(): NotificationService {
    if (!NotificationService.instance) {
      NotificationService.instance = new NotificationService();
    }
    return NotificationService.instance;
  }

  async initialize(userId: string) {
    this.currentUserId = userId;
    
    // Request notification permission for push
    await this.requestNotificationPermission();
    
    // Set up real-time listener for new notifications
    this.setupRealtimeListener(userId);
    
    // Mark old notifications as read? (optional)
    // You might want to keep this commented out if you want to preserve unread state
    // await this.markOldNotificationsAsRead();
  }

  private async requestNotificationPermission() {
    if (!("Notification" in window)) {
      console.log("This browser does not support notifications");
      return;
    }

    if (Notification.permission === "default") {
      await Notification.requestPermission();
    }
  }

  private setupRealtimeListener(userId: string) {
    // Listen for new notifications via Supabase Realtime
    this.channel = supabase
      .channel('notifications-channel')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${userId}`
        },
        (payload) => {
          const notification = payload.new as Notification;
          
          // Notify listeners
          this.notifyListeners(notification);
          
          // Show push notification
          this.showPushNotification(notification);
          
          // Update unread count
          this.updateUnreadCount();
        }
      )
      .subscribe();

    // Initial unread count
    this.updateUnreadCount();
  }

  private async showPushNotification(notification: Notification) {
    if (Notification.permission !== "granted") return;

    // Check if service worker is ready
    if ("serviceWorker" in navigator) {
      const registration = await navigator.serviceWorker.ready;
      
      registration.showNotification(notification.title, {
        body: notification.message,
        icon: "/icons/icon-192x192.png",
        badge: "/icons/icon-192x192.png",
        data: {
          url: notification.action_url || '/notifications',
          notificationId: notification.id,
          timestamp: notification.created_at
        }
      });
    }
  }

  async getNotifications(options?: {
    limit?: number;
    offset?: number;
    unreadOnly?: boolean;
  }): Promise<Notification[]> {
    if (!this.currentUserId) return [];

    let query = supabase
      .from('notifications')
      .select('*')
      .eq('user_id', this.currentUserId)
      .order('created_at', { ascending: false });

    if (options?.unreadOnly) {
      query = query.eq('is_read', false);
    }

    if (options?.limit) {
      query = query.limit(options.limit);
    }

    if (options?.offset) {
      query = query.range(options.offset, options.offset + (options.limit || 10) - 1);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Error fetching notifications:', error);
      return [];
    }

    return data || [];
  }

  async getUnreadCount(): Promise<number> {
    if (!this.currentUserId) return 0;

    const { count, error } = await supabase
      .from('notifications')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', this.currentUserId)
      .eq('is_read', false);

    if (error) {
      console.error('Error getting unread count:', error);
      return 0;
    }

    return count || 0;
  }

  async markAsRead(notificationIds: number[]): Promise<void> {
    if (!this.currentUserId || notificationIds.length === 0) return;

    const { error } = await supabase
      .from('notifications')
      .update({ 
        is_read: true, 
        read_at: new Date().toISOString() 
      })
      .eq('user_id', this.currentUserId)
      .in('id', notificationIds);

    if (error) {
      console.error('Error marking notifications as read:', error);
    } else {
      this.updateUnreadCount();
    }
  }

  async markAllAsRead(): Promise<void> {
    if (!this.currentUserId) return;

    const { error } = await supabase
      .from('notifications')
      .update({ 
        is_read: true, 
        read_at: new Date().toISOString() 
      })
      .eq('user_id', this.currentUserId)
      .eq('is_read', false);

    if (error) {
      console.error('Error marking all notifications as read:', error);
    } else {
      this.updateUnreadCount();
    }
  }

  async deleteNotification(notificationId: number): Promise<void> {
    if (!this.currentUserId) return;

    const { error } = await supabase
      .from('notifications')
      .delete()
      .eq('id', notificationId)
      .eq('user_id', this.currentUserId);

    if (error) {
      console.error('Error deleting notification:', error);
    } else {
      this.updateUnreadCount();
    }
  }

  async clearAllNotifications(): Promise<void> {
    if (!this.currentUserId) return;

    const { error } = await supabase
      .from('notifications')
      .delete()
      .eq('user_id', this.currentUserId);

    if (error) {
      console.error('Error clearing notifications:', error);
    } else {
      this.updateUnreadCount();
    }
  }

  private async updateUnreadCount() {
    const count = await this.getUnreadCount();
    this.unreadCountListeners.forEach(listener => listener(count));
  }

  addListener(callback: (notification: Notification) => void) {
    this.listeners.push(callback);
    return () => {
      this.listeners = this.listeners.filter(cb => cb !== callback);
    };
  }

  addUnreadCountListener(callback: (count: number) => void) {
    this.unreadCountListeners.push(callback);
    // Immediately call with current count
    this.getUnreadCount().then(count => callback(count));
    return () => {
      this.unreadCountListeners = this.unreadCountListeners.filter(cb => cb !== callback);
    };
  }

  private notifyListeners(notification: Notification) {
    this.listeners.forEach(callback => callback(notification));
  }

  cleanup() {
    if (this.channel) {
      supabase.removeChannel(this.channel);
    }
    this.listeners = [];
    this.unreadCountListeners = [];
    this.currentUserId = null;
  }
}

export default NotificationService.getInstance();
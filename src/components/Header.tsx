import {
  ShoppingCart,
  User,
  LogOut,
  Bell,
  Check,
  Trash2,
  Image,
} from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { useCart } from "@/context/CartContext";
import { useAuth } from "@/context/AuthContext";
import { motion, AnimatePresence } from "framer-motion";
import { useState, useEffect, useRef, useCallback } from "react";
import notificationService from "@/services/notificationService";
import { type Notification } from "@/types/notification";
import { formatDistanceToNow } from "date-fns";

const Header = () => {
  const { itemCount, clearCart } = useCart();
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const menuRef = useRef<HTMLDivElement>(null);
  const notifRef = useRef<HTMLDivElement>(null);
  const notificationsContainerRef = useRef<HTMLDivElement>(null);

  const name = user?.user_metadata?.name || "User";
  const email = user?.email;

  // Initialize notification service when user logs in
  useEffect(() => {
    if (user?.id) {
      notificationService.initialize(user.id);

      // Load initial notifications
      loadNotifications();

      // Listen for new notifications
      const unsubscribe = notificationService.addListener((notification) => {
        setNotifications((prev) => [notification, ...prev]);
        // Show a toast or subtle indicator
        showNotificationToast(notification);
      });

      // Listen for unread count changes
      const unsubscribeCount = notificationService.addUnreadCountListener(
        (count) => {
          setUnreadCount(count);
        },
      );

      return () => {
        unsubscribe();
        unsubscribeCount();
        notificationService.cleanup();
      };
    } else {
      setNotifications([]);
      setUnreadCount(0);
    }
  }, [user]);

  const loadNotifications = async (reset = false) => {
    if (!user || loading) return;

    setLoading(true);
    try {
      const newPage = reset ? 1 : page;
      const notifs = await notificationService.getNotifications({
        limit: 20,
        offset: (newPage - 1) * 20,
      });

      if (reset) {
        setNotifications(notifs);
        setPage(2);
      } else {
        setNotifications((prev) => [...prev, ...notifs]);
        setPage((prev) => prev + 1);
      }

      setHasMore(notifs.length === 20);
    } catch (error) {
      console.error("Error loading notifications:", error);
    } finally {
      setLoading(false);
    }
  };

  // Handle scroll in notifications panel
  const handleNotificationsScroll = useCallback(
    (e: React.UIEvent<HTMLDivElement>) => {
      const { scrollTop, scrollHeight, clientHeight } = e.currentTarget;
      if (
        scrollHeight - scrollTop <= clientHeight * 1.5 &&
        hasMore &&
        !loading
      ) {
        loadNotifications();
      }
    },
    [hasMore, loading],
  );

  const showNotificationToast = (notification: Notification) => {
    // You can implement a toast notification here
    // For now, we'll rely on the push notification
    console.log("New notification:", notification);
  };

  const handleNotifOpen = () => {
    setNotifOpen(!notifOpen);
    if (!notifOpen) {
      // Reset and reload when opening
      setPage(1);
      loadNotifications(true);
    }
  };

  const handleMarkAsRead = async (
    notificationIds: number[],
    event?: React.MouseEvent,
  ) => {
    event?.stopPropagation();
    await notificationService.markAsRead(notificationIds);

    // Update local state
    setNotifications((prev) =>
      prev.map((notif) =>
        notificationIds.includes(notif.id)
          ? { ...notif, is_read: true, read_at: new Date().toISOString() }
          : notif,
      ),
    );
  };

  const handleMarkAllAsRead = async (event?: React.MouseEvent) => {
    event?.stopPropagation();
    await notificationService.markAllAsRead();

    // Update local state
    setNotifications((prev) =>
      prev.map((notif) => ({
        ...notif,
        is_read: true,
        read_at: new Date().toISOString(),
      })),
    );
  };

  const handleDeleteNotification = async (
    notificationId: number,
    event?: React.MouseEvent,
  ) => {
    event?.stopPropagation();
    await notificationService.deleteNotification(notificationId);

    // Update local state
    setNotifications((prev) =>
      prev.filter((notif) => notif.id !== notificationId),
    );
  };

  const handleClearAll = async (event?: React.MouseEvent) => {
    event?.stopPropagation();
    await notificationService.clearAllNotifications();
    setNotifications([]);
  };

  const handleNotificationClick = (notification: Notification) => {
    // Mark as read when clicked
    if (!notification.is_read) {
      handleMarkAsRead([notification.id]);
    }

    // Navigate to the action URL if exists
    if (notification.action_url) {
      navigate(notification.action_url);
      setNotifOpen(false);
    }
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case "order_update":
        return "📦";
      case "payment_update":
        return "💰";
      default:
        return "🔔";
    }
  };

  // Outside click for menus
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node))
        setMenuOpen(false);
      if (notifRef.current && !notifRef.current.contains(event.target as Node))
        setNotifOpen(false);
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Close on Escape
  useEffect(() => {
    const handleEscapeKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setMenuOpen(false);
        setNotifOpen(false);
      }
    };
    document.addEventListener("keydown", handleEscapeKey);
    return () => document.removeEventListener("keydown", handleEscapeKey);
  }, []);

  return (
    <header className="sticky top-0 z-50 border-b border-border bg-background/80 backdrop-blur-md">
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        <Link
          to="/"
          className="font-display text-xl font-bold tracking-tight text-foreground lg:w-1/12"
        >
          Hair Co.
        </Link>

        {/* Navigation Links - Visible on larger screens */}
        {user && (
          <nav className="hidden md:flex items-center gap-10">
            <Link
              to="/orders"
              className="px-3 py-2 text-sm font-medium rounded-md hover:bg-muted transition-colors"
            >
              Orders
            </Link>
            <Link
              to="/progress"
              className="px-3 py-2 text-sm font-medium rounded-md hover:bg-muted transition-colors flex items-center gap-1"
            >
              Progress
            </Link>
            <Link
              to="/reminders"
              className="px-3 py-2 text-sm font-medium rounded-md hover:bg-muted transition-colors"
            >
              Reminders
            </Link>
          </nav>
        )}

        <div className="flex items-center gap-2 sm:gap-4">
          {/* CART */}
          {email && (
            <Link
              to="/cart"
              className="relative flex items-center gap-2 rounded-full bg-primary px-3 sm:px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:opacity-90"
            >
              <ShoppingCart className="h-4 w-4" />
              <span className="hidden sm:inline">Cart</span>

              <AnimatePresence>
                {itemCount > 0 && (
                  <motion.span
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    exit={{ scale: 0 }}
                    className="absolute -right-2 -top-2 flex h-5 w-5 items-center justify-center rounded-full bg-destructive text-[10px] font-bold text-destructive-foreground"
                  >
                    {itemCount}
                  </motion.span>
                )}
              </AnimatePresence>
            </Link>
          )}

          {/* PROGRESS - Mobile Link */}
          {user && (
            <Link
              to="/progress"
              className="md:hidden relative flex h-9 w-9 items-center justify-center rounded-full bg-muted hover:bg-muted/80 transition-colors"
              aria-label="Progress"
            >
              <Image className="h-5 w-5" />
            </Link>
          )}

          {/* NOTIFICATIONS */}
          {user && (
            <div className="relative" ref={notifRef}>
              <button
                onClick={handleNotifOpen}
                className="relative flex h-9 w-9 items-center justify-center rounded-full bg-muted cursor-pointer hover:bg-muted/80 transition-colors"
                aria-label="Notifications"
              >
                <Bell className="h-5 w-5" />
                <AnimatePresence>
                  {unreadCount > 0 && (
                    <motion.span
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      exit={{ scale: 0 }}
                      className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white"
                    >
                      {unreadCount > 9 ? "9+" : unreadCount}
                    </motion.span>
                  )}
                </AnimatePresence>
              </button>

              <AnimatePresence>
                {notifOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.2 }}
                    className="fixed sm:absolute left-4 right-4 sm:left-auto sm:right-0 top-16 sm:top-auto sm:mt-2 w-auto sm:w-96 max-h-[calc(100vh-5rem)] sm:max-h-[32rem] rounded-md border bg-background shadow-lg overflow-hidden"
                  >
                    <div className="sticky top-0 flex items-center justify-between p-3 border-b bg-background/80 backdrop-blur-sm z-10">
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold">Notifications</h3>
                        {unreadCount > 0 && (
                          <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full">
                            {unreadCount} unread
                          </span>
                        )}
                      </div>
                      <div className="flex gap-1">
                        {unreadCount > 0 && (
                          <button
                            onClick={handleMarkAllAsRead}
                            className="p-1.5 hover:bg-muted rounded-md transition-colors"
                            title="Mark all as read"
                          >
                            <Check className="h-4 w-4" />
                          </button>
                        )}
                        {notifications.length > 0 && (
                          <button
                            onClick={handleClearAll}
                            className="p-1.5 hover:bg-muted rounded-md transition-colors"
                            title="Clear all"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        )}
                      </div>
                    </div>

                    <div
                      ref={notificationsContainerRef}
                      className="overflow-y-auto max-h-[calc(100vh-10rem)] sm:max-h-[calc(32rem-4rem)]"
                      onScroll={handleNotificationsScroll}
                    >
                      {notifications.length === 0 ? (
                        <div className="p-8 text-center text-sm text-muted-foreground">
                          <Bell className="h-8 w-8 mx-auto mb-2 opacity-50" />
                          No notifications
                        </div>
                      ) : (
                        <>
                          {notifications.map((notif) => (
                            <motion.div
                              key={notif.id}
                              initial={{ opacity: 0 }}
                              animate={{ opacity: 1 }}
                              className={`px-4 py-3 border-b hover:bg-muted/50 cursor-pointer transition-colors relative group ${
                                !notif.is_read ? "bg-primary/5" : ""
                              }`}
                              onClick={() => handleNotificationClick(notif)}
                            >
                              <div className="flex gap-3">
                                <div className="text-2xl flex-shrink-0">
                                  {getNotificationIcon(notif.type)}
                                </div>
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-start justify-between gap-2">
                                    <p className="font-medium text-sm truncate">
                                      {notif.title}
                                    </p>
                                    <span className="text-xs text-muted-foreground whitespace-nowrap flex-shrink-0">
                                      {formatDistanceToNow(
                                        new Date(notif.created_at),
                                        { addSuffix: true },
                                      )}
                                    </span>
                                  </div>
                                  <p className="text-sm mt-1 line-clamp-2 break-words">
                                    {notif.message}
                                  </p>
                                  {notif.order_number && (
                                    <p className="text-xs text-muted-foreground mt-1">
                                      Order #{notif.order_number}
                                    </p>
                                  )}
                                </div>
                              </div>

                              {/* Action buttons - Hidden on mobile, shown on hover on desktop */}
                              <div className="hidden sm:flex absolute right-2 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity gap-1 bg-background/80 backdrop-blur-sm rounded-md p-1">
                                {!notif.is_read && (
                                  <button
                                    onClick={(e) =>
                                      handleMarkAsRead([notif.id], e)
                                    }
                                    className="p-1 hover:bg-muted rounded-md"
                                    title="Mark as read"
                                  >
                                    <Check className="h-3 w-3" />
                                  </button>
                                )}
                                <button
                                  onClick={(e) =>
                                    handleDeleteNotification(notif.id, e)
                                  }
                                  className="p-1 hover:bg-muted rounded-md text-destructive"
                                  title="Delete"
                                >
                                  <Trash2 className="h-3 w-3" />
                                </button>
                              </div>

                              {/* Mobile action buttons - Always visible */}
                              <div className="flex sm:hidden justify-end gap-2 mt-2 pt-2 border-t border-border/50">
                                {!notif.is_read && (
                                  <button
                                    onClick={(e) =>
                                      handleMarkAsRead([notif.id], e)
                                    }
                                    className="flex items-center gap-1 px-2 py-1 text-xs bg-primary/10 text-primary rounded-md"
                                  >
                                    <Check className="h-3 w-3" />
                                    Mark read
                                  </button>
                                )}
                                <button
                                  onClick={(e) =>
                                    handleDeleteNotification(notif.id, e)
                                  }
                                  className="flex items-center gap-1 px-2 py-1 text-xs bg-destructive/10 text-destructive rounded-md"
                                >
                                  <Trash2 className="h-3 w-3" />
                                  Delete
                                </button>
                              </div>

                              {/* Unread indicator */}
                              {!notif.is_read && (
                                <span className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-primary rounded-r-full" />
                              )}
                            </motion.div>
                          ))}

                          {loading && (
                            <div className="p-4 text-center">
                              <div className="inline-block h-5 w-5 animate-spin rounded-full border-2 border-primary border-t-transparent"></div>
                            </div>
                          )}

                          {!hasMore && notifications.length > 0 && (
                            <div className="p-4 text-center text-xs text-muted-foreground">
                              No more notifications
                            </div>
                          )}
                        </>
                      )}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          )}

          {/* AUTH SECTION */}
          {!user ? (
            <div className="flex gap-2 sm:gap-3 text-sm">
              <Link
                to="/login"
                className="px-3 sm:px-4 py-2 rounded-md bg-[#AB672B] text-white hover:bg-[#944F1F] transition whitespace-nowrap"
              >
                Login
              </Link>
              <Link
                to="/register"
                className="px-3 sm:px-4 py-2 rounded-md border border-[#AB672B] text-[#AB672B] hover:bg-[#AB672B] hover:text-white transition whitespace-nowrap"
              >
                Register
              </Link>
            </div>
          ) : (
            <div className="relative" ref={menuRef}>
              <button
                onClick={() => setMenuOpen(!menuOpen)}
                className="flex h-9 w-9 items-center justify-center rounded-full bg-muted cursor-pointer hover:bg-muted/80 transition-colors"
                aria-expanded={menuOpen}
                aria-haspopup="true"
              >
                <User className="h-5 w-5" />
              </button>

              <AnimatePresence>
                {menuOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.2 }}
                    className="fixed sm:absolute left-4 right-4 sm:left-auto sm:right-0 top-16 sm:top-auto sm:mt-2 w-auto sm:w-56 rounded-md border bg-background shadow-md overflow-hidden"
                  >
                    <div className="px-4 py-3 border-b">
                      <p className="text-sm font-medium">{name}</p>
                      <p className="text-xs text-muted-foreground truncate">
                        {email}
                      </p>
                    </div>

                    <Link
                      to="/profile"
                      className="flex items-center gap-2 px-4 py-2 text-sm hover:bg-muted transition-colors"
                      onClick={() => setMenuOpen(false)}
                    >
                      <User className="h-4 w-4" /> Profile
                    </Link>

                    <Link
                      to="/orders"
                      className="flex items-center gap-2 px-4 py-2 text-sm hover:bg-muted transition-colors"
                      onClick={() => setMenuOpen(false)}
                    >
                      <ShoppingCart className="h-4 w-4" /> My Orders
                    </Link>

                    <Link
                      to="/progress"
                      className="flex items-center gap-2 px-4 py-2 text-sm hover:bg-muted transition-colors md:hidden"
                      onClick={() => setMenuOpen(false)}
                    >
                      <Image className="h-4 w-4" /> Progress
                    </Link>

                    <Link
                      to="/reminders"
                      className="flex items-center gap-2 px-4 py-2 text-sm hover:bg-muted transition-colors md:hidden"
                      onClick={() => setMenuOpen(false)}
                    >
                      <Bell className="h-4 w-4" /> Reminders
                    </Link>

                    <button
                      onClick={() => {
                        signOut();
                        setMenuOpen(false);
                        clearCart();
                      }}
                      className="flex w-full items-center gap-2 px-4 py-2 text-sm hover:bg-muted transition-colors cursor-pointer text-destructive"
                    >
                      <LogOut className="h-4 w-4" /> Sign Out
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

export default Header;

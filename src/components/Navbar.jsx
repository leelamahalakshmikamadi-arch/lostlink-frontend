import { useEffect, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { MapPin, Bell, LogOut, Menu, X, CheckCheck } from "lucide-react";
import { SHOW_ACCOUNT_FEATURES } from "../config";
import { useAuth } from "../context/useAuth";
import { getApiErrorMessage, notificationsApi } from "../api";

function Navbar() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, isAuthenticated, logout } = useAuth();

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [notificationError, setNotificationError] = useState("");

  useEffect(() => {
    if (!SHOW_ACCOUNT_FEATURES) return undefined;

    const loadNotifications = async () => {
      try {
        const res = await notificationsApi.getNotifications();
        const list = res.data || [];
        setNotifications(list);
        setUnreadCount(list.filter((notification) => !notification.read && notification.userId).length);
        setNotificationError("");
      } catch (requestError) {
        setNotificationError(getApiErrorMessage(requestError, "Unable to load notifications."));
      }
    };

    const initialLoad = setTimeout(loadNotifications, 0);
    const interval = setInterval(loadNotifications, 15000);
    return () => {
      clearTimeout(initialLoad);
      clearInterval(interval);
    };
  }, [user?.id]);

  const handleMarkAllRead = async () => {
    try {
      await notificationsApi.markAllRead();
      setNotifications((prev) => prev.map((n) => n.userId ? ({ ...n, read: true }) : n));
      setUnreadCount(0);
    } catch (requestError) {
      setNotificationError(getApiErrorMessage(requestError, "Unable to mark notifications as read."));
    }
  };

  const handleMarkOneRead = async (notif) => {
    if (!notif || notif.read || !notif.userId) return;
    const targetId = notif.id || notif.notificationId;
    if (!targetId) return;
    try {
      await notificationsApi.markRead(targetId);
      setNotifications((prev) =>
        prev.map((n) => ((n.id || n.notificationId) === targetId ? { ...n, read: true } : n))
      );
      setUnreadCount((c) => Math.max(0, c - 1));
    } catch (requestError) {
      setNotificationError(getApiErrorMessage(requestError, "Unable to mark this notification as read."));
    }
  };

  const handleLogout = () => {
    logout();
    setMobileMenuOpen(false);
    navigate("/");
  };

  const navLinks = [
    { to: "/", label: "Home" },
    { to: "/lost-item", label: "Lost Item" },
    { to: "/found-item", label: "Found Item" },
    { to: "/search", label: "Search" },
    { to: "/about", label: "About" },
    { to: "/contact", label: "Contact" },
  ];

  return (
    <nav className="navbar">
      {/* Brand / Logo */}
      <Link to="/" className="logo" onClick={() => setMobileMenuOpen(false)}>
        <div className="logo-icon">
          <MapPin size={20} />
        </div>
        <span>LostLink</span>
      </Link>

      {/* Desktop Navigation Links */}
      <div className={`nav-links ${mobileMenuOpen ? "open" : ""}`}>
        {navLinks.map((link) => (
          <Link
            key={link.to}
            to={link.to}
            className={location.pathname === link.to ? "active" : ""}
            onClick={() => setMobileMenuOpen(false)}
          >
            {link.label}
          </Link>
        ))}
      </div>

      {/* Navbar Right Actions */}
      <div className="nav-right">
        {/* Notifications Button */}
        {SHOW_ACCOUNT_FEATURES && (
        <div className="notifications-wrapper">
          <button
            className="theme-btn notif-btn"
            title="Notifications"
            onClick={() => setNotificationsOpen(!notificationsOpen)}
          >
            <Bell size={18} />
            {unreadCount > 0 && <span className="notif-badge">{unreadCount}</span>}
          </button>

          {/* Notifications Dropdown Drawer */}
          {notificationsOpen && (
            <div className="notifications-drawer">
              <div className="notif-header">
                <h3>Campus Alerts & Claims</h3>
                {unreadCount > 0 && (
                  <button className="mark-read-btn" onClick={handleMarkAllRead}>
                    <CheckCheck size={14} /> Mark all read
                  </button>
                )}
              </div>

              <div className="notif-list">
                {notificationError && <p role="alert">{notificationError}</p>}
                {notifications.length === 0 ? (
                  <p className="no-notifs">No notifications yet.</p>
                ) : (
                  notifications.map((n, index) => {
                    const notifKey = n.id || n.notificationId || index;
                    return (
                      <div
                        key={notifKey}
                        className={`notif-item ${n.read ? "read" : "unread"}`}
                        onClick={() => handleMarkOneRead(n)}
                        style={{ cursor: "pointer" }}
                        title={n.read ? undefined : "Click to mark as read"}
                      >
                        <div className="notif-item-title">{n.title || "Notification"}</div>
                        <div className="notif-item-msg">{n.message}</div>
                        {n.matchPercentage != null && (
                          <div
                            className="notif-item-meta"
                            style={{
                              marginTop: "4px",
                              fontSize: "0.75rem",
                              color: "#059669",
                              fontWeight: "600",
                            }}
                          >
                            AI Similarity: {n.matchPercentage}%
                          </div>
                        )}
                        <div className="notif-item-time">
                          {n.createdAt ? new Date(n.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : "Recent"}
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          )}
        </div>
        )}

        {/* User Authentication Status */}
        {SHOW_ACCOUNT_FEATURES && (isAuthenticated && user ? (
          <div className="user-menu">
            <span className="user-name">Hello, {user.name || user.email}!</span>
            <button className="logout-btn" onClick={handleLogout} title="Logout">
              <LogOut size={16} />
            </button>
          </div>
        ) : (
          <Link to="/login" className="login-btn" onClick={() => setMobileMenuOpen(false)}>
            Login
          </Link>
        ))}

        {/* Mobile Hamburger Toggle */}
        <button
          className="mobile-menu-toggle"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          aria-label="Toggle menu"
        >
          {mobileMenuOpen ? <X size={22} /> : <Menu size={22} />}
        </button>
      </div>
    </nav>
  );
}

export default Navbar;

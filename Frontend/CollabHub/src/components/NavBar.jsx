import { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../Context/AuthContext';
import { notificationAPI } from '../services/api';

export default function Navbar() {
  const { isLoggedIn, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [loadingNotifications, setLoadingNotifications] = useState(false);
  const dropdownRef = useRef(null);

  const unreadCount = useMemo(
    () => notifications.reduce((count, item) => (item.isRead ? count : count + 1), 0),
    [notifications]
  );

  const formatNotificationTime = (value) => {
    if (!value) return '';
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return '';
    return date.toLocaleString();
  };

  const fetchNotifications = async () => {
    if (!isLoggedIn) {
      setNotifications([]);
      return;
    }

    try {
      setLoadingNotifications(true);
      const res = await notificationAPI.getAll();
      const list = res?.data?.notifications || [];
      setNotifications(list);
    } catch {
      setNotifications([]);
    } finally {
      setLoadingNotifications(false);
    }
  };

  useEffect(() => {
    fetchNotifications();
  }, [isLoggedIn]);

  useEffect(() => {
    if (!isLoggedIn) return;
    const timer = setInterval(() => {
      fetchNotifications();
    }, 15000);
    return () => clearInterval(timer);
  }, [isLoggedIn]);

  useEffect(() => {
    const onClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setNotificationsOpen(false);
      }
    };

    document.addEventListener('mousedown', onClickOutside);
    return () => document.removeEventListener('mousedown', onClickOutside);
  }, []);

  const markOneAsRead = async (notificationId) => {
    try {
      await notificationAPI.markAsRead(notificationId);
      setNotifications((prev) => prev.map((item) => (item._id === notificationId ? { ...item, isRead: true } : item)));
    } catch {
      // keep current UI state if mark request fails
    }
  };

  const markAllAsRead = async () => {
    try {
      await notificationAPI.markAllAsRead();
      setNotifications((prev) => prev.map((item) => ({ ...item, isRead: true })));
    } catch {
      // keep current UI state if mark request fails
    }
  };

  const scrollToSection = (id) => {
    setMenuOpen(false);
    if (location.pathname !== '/') {
      navigate(`/#${id}`);
      return;
    }
    
    const element = document.getElementById(id);
    if (element) {
      const headerOffset = 90;
      const elementPosition = element.getBoundingClientRect().top;
      const offsetPosition = elementPosition + window.pageYOffset - headerOffset;

      window.scrollTo({
        top: offsetPosition,
        behavior: 'smooth'
      });
      // also update hash without jump
      window.history.pushState(null, null, `#${id}`);
    }
  };

  const navLinks = [
    { name: 'Home', id: 'home' },
    { name: 'Explore', id: 'explore' },
    { name: 'About', id: 'about' },
    { name: 'FAQ', id: 'faq' },
  ];

  return (
    <nav className="navbar">
      <div className="navbar-inner">
        <Link to="/" className="navbar-brand" onClick={() => window.scrollTo({top: 0, behavior: 'smooth'})}>
          <img src='/logo.jpg' height='50' alt="CollabHub Logo" />
          <span className="brand-text" style={{fontSize:'2em'}}>CollabHub</span>
        </Link>

        {/* Desktop Links */}
        <div className={`navbar-links ${menuOpen ? 'open' : ''}`} >
          {navLinks.map((link) => (
            <button 
              key={link.id}
              onClick={() => scrollToSection(link.id)} 
              className="nav-link" 
              style={{ background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'inherit', fontSize: 'inherit' }}
            >
              {link.name}
            </button>
          ))}
          
          <div style={{ width: '1px', height: '20px', background: 'var(--border)', margin: '0 10px' }} className="nav-divider"></div>
          
          {isLoggedIn ? (
            <>
              <div className="notification-root" ref={dropdownRef}>
                <button
                  type="button"
                  className="notification-btn"
                  onClick={() => {
                    setNotificationsOpen((open) => !open);
                    if (!notificationsOpen) {
                      fetchNotifications();
                    }
                  }}
                  aria-label="Open notifications"
                >
                  <svg className="notification-icon" viewBox="0 0 24 24" aria-hidden="true" width="16" height="16">
                    <path
                      d="M12 22a2.5 2.5 0 0 0 2.45-2h-4.9A2.5 2.5 0 0 0 12 22Zm7-6.5c-1.5-1.5-2-3.2-2-5.5 0-3.1-1.9-5.8-4.8-6.6V2.5a1.2 1.2 0 1 0-2.4 0v.9C6.9 4.2 5 6.9 5 10c0 2.3-.5 4-2 5.5-.3.3-.4.7-.2 1.1.2.4.5.6 1 .6h16.4c.4 0 .8-.2 1-.6.2-.4.1-.8-.2-1.1Z"
                      fill="currentColor"
                    />
                  </svg>
                  {unreadCount > 0 && <span className="notification-badge">{unreadCount > 99 ? '99+' : unreadCount}</span>}
                </button>

                {notificationsOpen && (
                  <div className="notification-panel">
                    <div className="notification-header-row">
                      <h4>Notifications</h4>
                      <button
                        type="button"
                        className="notification-mark-all"
                        onClick={markAllAsRead}
                        disabled={unreadCount === 0}
                      >
                        Mark all as read
                      </button>
                    </div>

                    {loadingNotifications ? (
                      <p className="notification-empty">Loading...</p>
                    ) : notifications.length === 0 ? (
                      <p className="notification-empty">No notifications yet.</p>
                    ) : (
                      <ul className="notification-list">
                        {notifications.map((item) => (
                          <li key={item._id} className={`notification-item ${item.isRead ? 'read' : 'unread'}`}>
                            <button
                              type="button"
                              className="notification-item-btn"
                              onClick={() => markOneAsRead(item._id)}
                            >
                              <p className="notification-title">{item.title || 'Notification'}</p>
                              <p className="notification-message">{item.message || ''}</p>
                              <span className="notification-time">{formatNotificationTime(item.createdAt)}</span>
                            </button>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                )}
              </div>

              <Link to="/my-projects" className="nav-link" onClick={() => setMenuOpen(false)}>My Projects</Link>
              <Link to="/profile" className="nav-link" onClick={() => setMenuOpen(false)}>Profile</Link>
              <button onClick={() => { logout(); setMenuOpen(false); }} className="btn btn-outline btn-sm">Logout</button>
            </>
          ) : (
            <>
              <Link to="/login" className="nav-link" onClick={() => setMenuOpen(false)}>Login</Link>
              <Link to="/register" className="btn btn-primary btn-sm" onClick={() => setMenuOpen(false)}>Sign Up</Link>
            </>
          )}
        </div>

        <button className="menu-toggle" onClick={() => setMenuOpen(!menuOpen)}>
          <span></span>
        </button>
      </div>
    </nav>
  );
}
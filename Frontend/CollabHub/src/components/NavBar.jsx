import { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../Context/AuthContext';

export default function Navbar() {
  const { isLoggedIn, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);

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
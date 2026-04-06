import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { projectAPI } from '../services/api';
import { useAuth } from '../Context/AuthContext';
import AdvancedFilter from '../components/AdvancedFilter';

export default function Home() {
  const [projects, setProjects] = useState([]);
  const [search, setSearch] = useState('');
  const [activeFilters, setActiveFilters] = useState({ tech_stack: [], roles: [] });
  const [showFilter, setShowFilter] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const { isLoggedIn } = useAuth();
  const [activeFaq, setActiveFaq] = useState(null);
  const [visibleCount, setVisibleCount] = useState(6);
  const [hackathonSearch, setHackathonSearch] = useState('');
  const [hackathonLocation, setHackathonLocation] = useState('all');
  const [hackathonMode, setHackathonMode] = useState('all');
  const [showHackathonFilter, setShowHackathonFilter] = useState(false);

  const fetchProjects = async (params = {}) => {
    setLoading(true);
    setError('');
    try {
      const hasQuery = params.q && params.q.trim() !== '';
      const hasFilters = (params.tech_stack && params.tech_stack.length > 0) || 
                         (params.roles && params.roles.length > 0);

      const res = (hasQuery || hasFilters)
        ? await projectAPI.search(params)
        : await projectAPI.getAll();
        
      setProjects(res.data.projects || []);
    } catch (err) {
      if (err.response?.status === 404 || err.response?.status === 400) {
        setProjects([]);
      } else {
        setError(err.response?.data?.message || 'Failed to load projects');
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Scroll to hash on mount
    if (window.location.hash) {
      const id = window.location.hash.replace('#', '');
      const timer = setTimeout(() => {
        const element = document.getElementById(id);
        if (element) {
          const headerOffset = 90;
          const elementPosition = element.getBoundingClientRect().top;
          const offsetPosition = elementPosition + window.pageYOffset - headerOffset;
          window.scrollTo({ top: offsetPosition, behavior: 'smooth' });
        }
      }, 300);
      return () => clearTimeout(timer);
    }
  }, []);

  // Combined search and filter effect
  useEffect(() => {
    const timer = setTimeout(() => {
      const params = { q: search };
      if (activeFilters.tech_stack.length > 0) params.tech_stack = activeFilters.tech_stack;
      if (activeFilters.roles.length > 0) params.roles = activeFilters.roles;
      
      fetchProjects(params);
    }, 300);
    return () => clearTimeout(timer);
  }, [search, activeFilters]);

  const handleSearch = (e) => {
    e.preventDefault();
  };

  const handleApplyFilter = (filters) => {
    setActiveFilters(filters);
    setShowFilter(false);
  };

  const handleHackathonSearch = (e) => {
    e.preventDefault();
  };

  const hasHackathonFilters = hackathonLocation !== 'all' || hackathonMode !== 'all';

  const faqs = [
    {
      q: "How do I start a collaboration?",
      a: "Simply browse the projects in the Explore section. If you find one you like, click on it and use the 'Join Project' button to send a request to the project owner."
    },
    {
      q: "Can I list my own project here?",
      a: "Yes! Once you have registered and logged in, you can click the 'New Project' button in the Explore section or navigation bar to share your project with the community."
    },
    {
      q: "Is CollabHub free to use?",
      a: "Absolutely. CollabHub is a platform built for creators, developers, and designers to find each other and build projects together without any fees."
    },
    {
      q: "What kind of projects are here?",
      a: "You'll find everything from open-source software and mobile apps to creative writing collaborations and design portfolios."
    }
  ];

  const aboutHighlights = [
    {
      title: 'Build Professional Networks',
      description: 'Work with skilled developers, designers, and product thinkers. Build meaningful long-term collaborations around outcomes, not just ideas.',
      icon: (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="var(--accent)" strokeWidth="2">
          <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
          <circle cx="9" cy="7" r="4"/>
          <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
          <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
        </svg>
      )
    },
    {
      title: 'Accelerate Learning And Growth',
      description: 'Gain practical, portfolio-ready experience through real execution. Learn modern workflows by shipping with focused teams.',
      icon: (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="var(--accent)" strokeWidth="2">
          <polyline points="16 18 22 12 16 6"/>
          <polyline points="8 6 2 12 8 18"/>
        </svg>
      )
    },
    {
      title: 'Deliver Better Results Faster',
      description: 'Align roles, reduce coordination friction, and move from concept to delivery with clear ownership and collaboration.',
      icon: (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="var(--accent)" strokeWidth="2">
          <path d="M12 19l7-7 3 3-7 7-3-3z"/>
          <path d="M18 13l-1.5-7.5L2 2l3.5 14.5L13 18l5-5z"/>
          <path d="M2 2l7.586 7.586"/>
          <circle cx="11" cy="11" r="2"/>
        </svg>
      )
    }
  ];

  const aboutStats = [
    { label: 'Collaboration Focus', value: 'Project-Driven' },
    { label: 'Community', value: 'Multi-Disciplinary' },
    { label: 'Workflow', value: 'Structured And Transparent' }
  ];

  const hackathons = [
    {
      id: 'hack-1',
      title: 'Build for Bharat Hackathon 2026',
      organizer: 'India Tech Collective',
      description: 'Create scalable civic-tech solutions for education, health, and public service workflows.',
      tracks: ['Civic Tech', 'AI', 'Web Platform'],
      mode: 'Online',
      location: 'Bangalore',
      duration: '48 Hours',
      link: 'https://devpost.com/hackathons'
    },
    {
      id: 'hack-2',
      title: 'GenAI Product Sprint',
      organizer: 'Innovators Guild',
      description: 'Design and ship an AI-first product prototype solving real business or community pain points.',
      tracks: ['GenAI', 'Product Design', 'Full Stack'],
      mode: 'Offline',
      location: 'Delhi',
      duration: '72 Hours',
      link: 'https://mlh.io/seasons/2026/events'
    },
    {
      id: 'hack-3',
      title: 'Green Code Challenge',
      organizer: 'Sustainability Labs',
      description: 'Build tools that reduce environmental impact using data, automation, and user-first interfaces.',
      tracks: ['Climate', 'Data', 'Automation'],
      mode: 'Online',
      location: 'Mumbai',
      duration: '36 Hours',
      link: 'https://www.hackerearth.com/challenges/'
    }
  ];

  const filteredHackathons = hackathons.filter((hackathon) => {
    const query = hackathonSearch.trim().toLowerCase();
    const location = hackathonLocation.toLowerCase();
    const mode = hackathonMode.toLowerCase();

    const textTarget = `${hackathon.title} ${hackathon.organizer} ${hackathon.description} ${hackathon.tracks.join(' ')}`.toLowerCase();
    const matchesSearch = !query || textTarget.includes(query);
    const matchesLocation = location === 'all' || String(hackathon.location || '').toLowerCase() === location;
    const matchesMode = mode === 'all' || String(hackathon.mode || '').toLowerCase() === mode;

    return matchesSearch && matchesLocation && matchesMode;
  });

  return (
    <div className="page">
      {/* Hero */}
      <section id="home" className="hero fade-up" style={{ position: 'relative', zIndex: 10, textAlign: 'center', minHeight: '10vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div className="hero-content" style={{ margin: '0 auto' }}>
          <h1 className="hero-title">
            Find Your Next <span className="gradient-text">Collaboration</span>
          </h1>
          <p className="hero-subtitle" style={{ margin: '0 auto 30px' }}>
            A professional collaboration space to discover teams, launch ambitious projects, and build meaningful outcomes.
          </p>
          
          <div className="search-container scale-in" style={{ width: '100%', maxWidth: '600px', margin: '0 auto', position: 'relative' }}>
            <form onSubmit={handleSearch} className="search-bar" style={{ display: 'flex', gap: '8px' }}>
              <div style={{ position: 'relative', flex: 1, display: 'flex', alignItems: 'center' }}>
                <svg className="search-icon" style={{ left: '16px' }} width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
                </svg>
                <input
                  type="text"
                  placeholder="Search projects..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  id="search-input"
                  style={{ paddingLeft: '48px' }}
                />
              </div>
              <button 
                type="button" 
                className={`btn ${showFilter || activeFilters.tech_stack.length > 0 || activeFilters.roles.length > 0 ? 'btn-primary' : 'btn-outline'}`}
                onClick={() => setShowFilter(!showFilter)}
                style={{ minWidth: '100px' }}
              >
                {showFilter ? 'Hide' : 'Filter'}
              </button>
              <button type="submit" className="btn btn-primary">Search</button>
            </form>

            {showFilter && (
              <AdvancedFilter 
                onFilter={handleApplyFilter} 
                onClose={() => setShowFilter(false)} 
              />
            )}

            {(activeFilters.tech_stack.length > 0 || activeFilters.roles.length > 0) && (
              <div className="fade-in" style={{ marginTop: '14px', fontSize: '0.9rem', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"/>
                </svg>
                <span>{activeFilters.tech_stack.length + activeFilters.roles.length} filters applied</span>
                <button 
                  onClick={() => setActiveFilters({ tech_stack: [], roles: [] })}
                  style={{ background: 'var(--accent-light)', border: 'none', color: 'var(--accent)', cursor: 'pointer', fontSize: '0.75rem', fontWeight: 600, padding: '2px 8px', borderRadius: '4px', marginLeft: '4px' }}
                >
                  Clear
                </button>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Explore Section */}
      <section id="explore" className="section" style={{ padding: '40px 50px 100px 50px', background: '#fff', borderTop: '1px solid var(--border)' }}>
        <div className="section-header" style={{ marginBottom: '60px' }}>
          <div>
            <h2 style={{ fontSize: '2rem',margin:'5px' }}>Explore Projects</h2>
          </div>
          {isLoggedIn && (
            <Link to="/create-project" className="btn btn-primary">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
              New Project
            </Link>
          )}
        </div>

        {loading && (
          <div className="loading-screen">
            <div className="spinner"></div>
          </div>
        )}

        {error && <div className="alert alert-error">{error}</div>}

        {!loading && projects.length === 0 && (
          <div className="empty-state">
            <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M13 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z"/>
              <polyline points="13 2 13 9 20 9"/>
            </svg>
            <h3>No Projects Found</h3>
            <p>Try a different keyword or filter.</p>
          </div>
        )}

        <div className="projects-grid stagger-children">
          {projects.slice(0, visibleCount).map((project) => (
            <Link
              key={project._id}
              to={`/project/${project._id}`}
              state={{ project }}
              className="project-card fade-in"
              style={{ textDecoration: 'none', color: 'inherit' }}
            >
              <div className="project-card-header">
                <h3 className="project-title">{project.title}</h3>
                <span className="project-author">
                  by {project.created_by?.name || 'Unknown'}
                </span>
              </div>
              {project.description && (
                <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', lineHeight: '1.6' }}>
                  {project.description.length > 120
                    ? project.description.substring(0, 120) + '...'
                    : project.description}
                </p>
              )}
              
              <div style={{ marginTop: 'auto', paddingTop: '16px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {project.tech_stack?.length > 0 && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', minWidth: '45px' }}>Skills</span>
                    <div className="project-tags">
                      {project.tech_stack.slice(0, 3).map((t, i) => (
                        <span key={`tech-${i}`} className="tag tag-tech">{t}</span>
                      ))}
                      {project.tech_stack.length > 3 && (
                        <span className="tag" style={{ background: 'var(--bg-warm)', color: 'var(--text-muted)' }}>
                          +{project.tech_stack.length - 3}
                        </span>
                      )}
                    </div>
                  </div>
                )}
                
                {project.roles_needed?.length > 0 && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', minWidth: '45px' }}>Roles</span>
                    <div className="project-tags">
                      {project.roles_needed.slice(0, 2).map((role, i) => (
                        <span key={`role-${i}`} className="tag tag-role">{role}</span>
                      ))}
                      {project.roles_needed.length > 2 && (
                        <span className="tag" style={{ background: 'var(--bg-warm)', color: 'var(--text-muted)' }}>
                          +{project.roles_needed.length - 2}
                        </span>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </Link>
          ))}
        </div>

        {projects.length > 6 && (
          <div style={{ marginTop: '48px', display: 'flex', justifyContent: 'center', gap: '16px' }}>
            {visibleCount < projects.length ? (
              <button 
                className="btn btn-primary" 
                onClick={() => setVisibleCount(prev => prev + 6)}
                style={{ padding: '12px 32px' }}
              >
                Load More Projects
              </button>
            ) : (
              <button 
                className="btn btn-outline" 
                onClick={() => setVisibleCount(6)}
                style={{ padding: '12px 32px' }}
              >
                Show Less
              </button>
            )}
          </div>
        )}

      </section>
  
        <br/>
      <section id="hackathons" className="section" style={{ padding: '40px 50px 100px 50px', background: '#fff', borderTop: '1px solid var(--border)' }}>
        <div className="section-header" style={{ marginBottom: '28px' }}>
          <div>
            <h2 style={{ fontSize: '2rem', margin: '5px' }}>Explore Hackathons</h2>
            <p style={{ color: 'var(--text-secondary)', margin: '6px 5px 0', fontSize: '0.95rem' }}>
              Discover upcoming events and browse trusted websites containing hackathon info.
            </p>
          </div>
        </div>

        <div className="projects-grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', marginBottom: '26px' }}>
          <a href="https://devpost.com/hackathons" target="_blank" rel="noreferrer" className="project-card" style={{ textDecoration: 'none', color: 'inherit', padding: '18px' }}>
            <h4 style={{ margin: 0, fontSize: '1rem' }}>Devpost</h4>
            <p style={{ margin: '8px 0 0', color: 'var(--text-secondary)', fontSize: '0.88rem' }}>Global student and professional hackathons.</p>
          </a>
          <a href="https://mlh.io/seasons/2026/events" target="_blank" rel="noreferrer" className="project-card" style={{ textDecoration: 'none', color: 'inherit', padding: '18px' }}>
            <h4 style={{ margin: 0, fontSize: '1rem' }}>MLH Events</h4>
            <p style={{ margin: '8px 0 0', color: 'var(--text-secondary)', fontSize: '0.88rem' }}>Major League Hacking official event listings.</p>
          </a>
          <a href="https://www.hackerearth.com/challenges/" target="_blank" rel="noreferrer" className="project-card" style={{ textDecoration: 'none', color: 'inherit', padding: '18px' }}>
            <h4 style={{ margin: 0, fontSize: '1rem' }}>HackerEarth</h4>
            <p style={{ margin: '8px 0 0', color: 'var(--text-secondary)', fontSize: '0.88rem' }}>Hackathons and coding challenges in one place.</p>
          </a>
        </div>
      
        <div className="search-container" style={{ width: '100%', maxWidth: '760px', margin: '0 auto 26px', position: 'relative' }}>
          <form onSubmit={handleHackathonSearch} className="search-bar" style={{ display: 'flex', gap: '8px' }}>
            <div style={{ position: 'relative', flex: 1, display: 'flex', alignItems: 'center' }}>
              <svg className="search-icon" style={{ left: '16px' }} width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
              </svg>
              <input
                type="text"
                placeholder="Search hackathons..."
                value={hackathonSearch}
                onChange={(e) => setHackathonSearch(e.target.value)}
                style={{ paddingLeft: '48px' }}
              />
            </div>
            <button
              type="button"
              className={`btn ${showHackathonFilter || hasHackathonFilters ? 'btn-primary' : 'btn-outline'}`}
              onClick={() => setShowHackathonFilter(!showHackathonFilter)}
              style={{ minWidth: '100px' }}
            >
              {showHackathonFilter ? 'Hide' : 'Filter'}
            </button>
            <button type="submit" className="btn btn-primary">Search</button>
          </form>

          {showHackathonFilter && (
            <div className="fade-in" style={{ marginTop: '12px', border: '1.5px solid var(--border)', borderRadius: 'var(--radius-md)', padding: '12px', background: 'var(--bg-card)', display: 'flex', gap: '10px', flexWrap: 'wrap', alignItems: 'center' }}>
              <select
                value={hackathonLocation}
                onChange={(e) => setHackathonLocation(e.target.value)}
                style={{ minWidth: '220px', border: '1.5px solid var(--border-input)', borderRadius: 'var(--radius-sm)', padding: '10px 12px', fontFamily: 'inherit', background: '#fff', color: 'var(--text)' }}
              >
                <option value="all">All Locations</option>
                <option value="bangalore">Bangalore</option>
                <option value="delhi">Delhi</option>
                <option value="mumbai">Mumbai</option>
              </select>
              <select
                value={hackathonMode}
                onChange={(e) => setHackathonMode(e.target.value)}
                style={{ minWidth: '170px', border: '1.5px solid var(--border-input)', borderRadius: 'var(--radius-sm)', padding: '10px 12px', fontFamily: 'inherit', background: '#fff', color: 'var(--text)' }}
              >
                <option value="all">All Modes</option>
                <option value="online">Online</option>
                <option value="offline">Offline</option>
              </select>
              <button
                type="button"
                className="btn btn-outline"
                onClick={() => {
                  setHackathonLocation('all');
                  setHackathonMode('all');
                }}
              >
                Clear
              </button>
            </div>
          )}

          {hasHackathonFilters && (
            <div className="fade-in" style={{ marginTop: '14px', fontSize: '0.9rem', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"/>
              </svg>
              <span>{(hackathonLocation !== 'all' ? 1 : 0) + (hackathonMode !== 'all' ? 1 : 0)} filters applied</span>
              <button
                onClick={() => {
                  setHackathonLocation('all');
                  setHackathonMode('all');
                }}
                style={{ background: 'var(--accent-light)', border: 'none', color: 'var(--accent)', cursor: 'pointer', fontSize: '0.75rem', fontWeight: 600, padding: '2px 8px', borderRadius: '4px', marginLeft: '4px' }}
              >
                Clear
              </button>
            </div>
          )}
        </div>

        {filteredHackathons.length === 0 ? (
          <div className="empty-state">
            <h3>No Hackathons Found</h3>
            <p>Try a different location, keyword, or mode.</p>
          </div>
        ) : (
          <div className="projects-grid stagger-children">
            {filteredHackathons.map((hackathon) => (
              <article key={hackathon.id} className="project-card fade-in">
                <div className="project-card-header">
                  <h3 className="project-title">{hackathon.title}</h3>
                  <span className="project-author">by {hackathon.organizer}</span>
                </div>

                <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', lineHeight: '1.6' }}>
                  {hackathon.description}
                </p>

                <div style={{ marginTop: 'auto', paddingTop: '16px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', minWidth: '45px' }}>
                      Tracks
                    </span>
                    <div className="project-tags">
                      {hackathon.tracks.map((track, i) => (
                        <span key={`${hackathon.id}_track_${i}`} className="tag tag-tech">{track}</span>
                      ))}
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '10px', flexWrap: 'wrap' }}>
                    <div className="project-tags">
                      <span className="tag tag-role">{hackathon.mode}</span>
                      <span className="tag">{hackathon.location}</span>
                      <span className="tag">{hackathon.duration}</span>
                    </div>

                    <a
                      href={hackathon.link}
                      target="_blank"
                      rel="noreferrer"
                      className="btn btn-outline btn-sm"
                    >
                      Explore
                    </a>
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>
      <br/>
      {/* About Section */}
      <section id="about" className="section" style={{ background: 'var(--bg-warm)', padding: '100px 20px', borderTop: '1.5px solid var(--border)', borderBottom: '1.5px solid var(--border)', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        <div style={{ maxWidth: '1080px', margin: '0 auto', width: '100%' }}>
          <div className="section-header" style={{ justifyContent: 'center', alignItems: 'center', flexDirection: 'column', textAlign: 'center', marginBottom: '38px', gap: '14px' }}>
            <h2 style={{ fontSize: '2.5rem', marginBottom: 0 }}>Why Teams Choose CollabHub</h2>
            <p style={{ fontSize: '1.05rem', color: 'var(--text-secondary)', marginTop: 0, maxWidth: '760px', lineHeight: 1.7 }}>
              CollabHub helps teams discover aligned collaborators, reduce execution friction, and ship stronger projects with confidence.
            </p>
          </div>

          <div className="projects-grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', marginBottom: '26px' }}>
            {aboutStats.map((stat) => (
              <div key={stat.label} className="project-card" style={{ padding: '20px 22px', textAlign: 'center' }}>
                <p style={{ margin: 0, fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text-muted)', fontWeight: 700 }}>
                  {stat.label}
                </p>
                <h4 style={{ margin: '8px 0 0', fontSize: '1.15rem', fontFamily: 'Lora' }}>{stat.value}</h4>
              </div>
            ))}
          </div>

          <div className="projects-grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', alignItems: 'stretch' }}>
            {aboutHighlights.map((item) => (
              <article key={item.title} className="project-card" style={{ textAlign: 'center', padding: '36px' }}>
                <div style={{ background: 'var(--accent-light)', width: '60px', height: '60px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px' }}>
                  {item.icon}
                </div>
                <h3 style={{ fontSize: '1.22rem', marginBottom: '12px', fontFamily: 'Lora' }}>{item.title}</h3>
                <p style={{ color: 'var(--text-secondary)', lineHeight: 1.75, marginBottom: 0 }}>{item.description}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section id="faq" className="section" style={{ maxWidth: '800px', margin: '0 auto', padding: '120px 20px' }}>
        <div className="section-header" style={{ marginBottom: '60px', justifyContent: 'center', textAlign: 'center' }}>
          <h2 style={{ fontSize: '2.5rem' }}>Frequently Asked Questions</h2>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {faqs.map((faq, index) => (
            <div key={index} 
                 className="project-card" 
                 style={{ padding: '24px', cursor: 'pointer', border: activeFaq === index ? '1.5px solid var(--accent)' : '1.5px solid var(--border)' }}
                 onClick={() => setActiveFaq(activeFaq === index ? null : index)}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h4 style={{ margin: 0, fontFamily: 'DM Sans', fontSize: '1rem' }}>{faq.q}</h4>
                <span style={{ transform: activeFaq === index ? 'rotate(180deg)' : 'none', transition: 'transform 0.3s ease' }}>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="6 9 12 15 18 9"/></svg>
                </span>
              </div>
              {activeFaq === index && (
                <div className="fade-in" style={{ marginTop: '16px', color: 'var(--text-secondary)', lineHeight: '1.6' }}>
                  {faq.a}
                </div>
              )}
            </div>
          ))}
        </div>
      </section>

      {/* Join/CTA Section */}
      {!isLoggedIn && (
        <section style={{ padding: '110px 20px', background: 'var(--bg-warm)', borderTop: '1.5px solid var(--border)' }}>
          <div style={{ maxWidth: '760px', margin: '0 auto', textAlign: 'center', background: 'var(--bg-card)', border: '1.5px solid var(--border)', borderRadius: 'var(--radius-lg)', boxShadow: 'var(--shadow-md)', padding: '56px 28px' }}>
            <h2 style={{ fontSize: '2.3rem', marginBottom: '16px', fontFamily: 'Outfit, sans-serif', color: 'var(--text)', letterSpacing: '-0.02em' }}>Ready to build something?</h2>
            <p style={{ marginBottom: '34px', color: 'var(--text-secondary)', fontSize: '1.05rem', lineHeight: 1.7 }}>Join a community of 5,000+ creators sharing their projects and finding teams.</p>
            <div style={{ display: 'flex', gap: '16px', justifyContent: 'center', flexWrap: 'wrap' }}>
              <Link to="/register" className="btn btn-primary" style={{ padding: '14px 38px', fontSize: '1rem' }}>Join the Hub Today</Link>
            </div>
          </div>
        </section>
      )}
    </div>
  );
}
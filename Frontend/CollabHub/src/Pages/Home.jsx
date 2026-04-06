import { useState } from 'react'
import { Link } from 'react-router-dom'
import AdvancedFilter from '../components/AdvancedFilter'


export default function Home () {
  const [search, setSearch] = useState('')
  const [showFilter, setShowFilter] = useState(false)
  const [activeFilters, setActiveFilters] = useState({
    tech_stack: [],
    roles: []
  })
  const [isLoggedIn] = useState(false) // TODO: Replace with actual auth state
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [projects, setProjects] = useState([])
  const [visibleCount, setVisibleCount] = useState(6)
  const [activeFaq, setActiveFaq] = useState(null)


  const faqs = [
    {
      q: "What is CollabHub?",
      a: "CollabHub is a collaborative platform connecting developers, designers, and creators worldwide. We help you find qualified team members, collaborate on meaningful projects, and accelerate professional growth."
    },
    {
      q: "How do I join a project?",
      a: "Browse available projects using our advanced filters to find opportunities matching your skills and interests. Click on a project to review details, then use the join button or contact the project owner directly."
    },
    {
      q: "How do I create and publish a project?",
      a: "Log in to your account and click 'New Project' to get started. Provide a clear project description, specify required skills and roles, then publish to make it visible to the community."
    },
    {
      q: "Is DevMatch free?",
      a: "Yes, DevMatch is completely free for all users. Create, join, and collaborate on unlimited projects without any subscription fees."
    },
    {
      q: "How do I find collaborators with specific skills?",
      a: "Use our advanced filtering system to search by technology stack, professional roles, experience level, and more. This ensures you connect with the right talent for your project needs."
    },
    {
      q: "How is my data protected?",
      a: "We implement industry-standard security protocols to protect your information. Your data is never shared without your explicit consent and is handled in compliance with privacy regulations."
    }
  ];

  const handleSearch = e => {
    e.preventDefault()
    console.log('Search:', search, 'Filters:', activeFilters)
    // TODO: Implement search logic
  }

  const handleApplyFilter = filters => {
    setActiveFilters(filters)
    setShowFilter(false)
  }

  return (
    <>
      <div className='page'>
        {/* Hero */}
        <section
          id='home'
          className='hero fade-up'
          style={{
            position: 'relative',
            zIndex: 10,
            textAlign: 'center',
            minHeight: '10vh',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}
        >
          <div className='hero-content' style={{ margin: '0 auto' }}>
            <h1 className='hero-title'>
              Find Your Next{' '}
              <span className='gradient-text'>Collaboration</span>
            </h1>
            <p className='hero-subtitle' style={{ margin: '0 auto 30px' }}>
              A space for creators to connect, build teams, and bring ideas to
              life.
            </p>
            <div
              className='search-container scale-in'
              style={{
                width: '100%',
                maxWidth: '600px',
                margin: '0 auto',
                position: 'relative'
              }}
            >
              <form
                onSubmit={handleSearch}
                className='search-bar'
                style={{ display: 'flex', gap: '8px' }}
              >
                <div
                  style={{
                    position: 'relative',
                    flex: 1,
                    display: 'flex',
                    alignItems: 'center'
                  }}
                >
                  <svg
                    className='search-icon'
                    style={{ left: '16px' }}
                    width='20'
                    height='20'
                    viewBox='0 0 24 24'
                    fill='none'
                    stroke='currentColor'
                    strokeWidth='2'
                    strokeLinecap='round'
                    strokeLinejoin='round'
                  >
                    <circle cx='11' cy='11' r='8' />
                    <line x1='21' y1='21' x2='16.65' y2='16.65' />
                  </svg>
                  <input
                    type='text'
                    placeholder='Search projects...'
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                    id='search-input'
                    style={{ paddingLeft: '48px' }}
                  />
                </div>
                <button
                  type='button'
                  className={`btn ${
                    showFilter ||
                    activeFilters.tech_stack.length > 0 ||
                    activeFilters.roles.length > 0
                      ? 'btn-primary'
                      : 'btn-outline'
                  }`}
                  onClick={() => setShowFilter(!showFilter)}
                  style={{ minWidth: '100px' }}
                >
                  {showFilter ? 'Hide' : 'Filter'}
                </button>
                <button type='submit' className='btn btn-primary'>
                  Search
                </button>
              </form>

              {showFilter && (
                <AdvancedFilter
                  onFilter={handleApplyFilter}
                  onClose={() => setShowFilter(false)}
                />
              )}

              {(activeFilters.tech_stack.length > 0 ||
                activeFilters.roles.length > 0) && (
                <div
                  className='fade-in'
                  style={{
                    marginTop: '14px',
                    fontSize: '0.9rem',
                    color: 'var(--text-secondary)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px'
                  }}
                >
                  <svg
                    width='14'
                    height='14'
                    viewBox='0 0 24 24'
                    fill='none'
                    stroke='currentColor'
                    strokeWidth='2.5'
                    strokeLinecap='round'
                    strokeLinejoin='round'
                  >
                    <polygon points='22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3' />
                  </svg>
                  <span>
                    {activeFilters.tech_stack.length +
                      activeFilters.roles.length}{' '}
                    filters applied
                  </span>
                  <button
                    onClick={() =>
                      setActiveFilters({ tech_stack: [], roles: [] })
                    }
                    style={{
                      background: 'var(--accent-light)',
                      border: 'none',
                      color: 'var(--accent)',
                      cursor: 'pointer',
                      fontSize: '0.75rem',
                      fontWeight: 600,
                      padding: '2px 8px',
                      borderRadius: '4px',
                      marginLeft: '4px'
                    }}
                  >
                    Clear
                  </button>
                </div>
              )}
            </div>
          </div>
        </section>
        {/* Explore Section */}
        <section
          id='explore'
          className='section'
          style={{
            padding: '40px 50px 100px 50px',
            background: '#fff',
            borderTop: '1px solid var(--border)'
          }}
        >
          <div className='section-header' style={{ marginBottom: '60px' }}>
            <div>
              <h2 style={{ fontSize: '2rem', margin: '5px' }}>
                Explore Projects
              </h2>
            </div>
            {isLoggedIn && (
              <Link to='/create-project' className='btn btn-primary'>
                <svg
                  width='18'
                  height='18'
                  viewBox='0 0 24 24'
                  fill='none'
                  stroke='currentColor'
                  strokeWidth='2'
                >
                  <line x1='12' y1='5' x2='12' y2='19' />
                  <line x1='5' y1='12' x2='19' y2='12' />
                </svg>
                New Project
              </Link>
            )}
          </div>
          {loading && (
            <div className='loading-screen'>
              <div className='spinner'></div>
            </div>
          )}

          {error && <div className='alert alert-error'>{error}</div>}
          {!loading && projects.length === 0 && (
            <div className='empty-state'>
              <svg
                width='64'
                height='64'
                viewBox='0 0 24 24'
                fill='none'
                stroke='currentColor'
                strokeWidth='1.5'
                strokeLinecap='round'
                strokeLinejoin='round'
              >
                <path d='M13 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z' />
                <polyline points='13 2 13 9 20 9' />
              </svg>
              <h3>No Projects Found</h3>
              <p>Try a different keyword or filter.</p>
            </div>
          )}
          <div className='projects-grid stagger-children'>
            {projects.slice(0, visibleCount).map(project => (
              <Link
                key={project._id}
                to={`/project/${project._id}`}
                state={{ project }}
                className='project-card fade-in'
                style={{ textDecoration: 'none', color: 'inherit' }}
              >
                <div className='project-card-header'>
                  <h3 className='project-title'>{project.title}</h3>
                  <span className='project-author'>
                    by {project.created_by?.name || 'Unknown'}
                  </span>
                </div>
                {project.description && (
                  <p
                    style={{
                      fontSize: '0.875rem',
                      color: 'var(--text-secondary)',
                      lineHeight: '1.6'
                    }}
                  >
                    {project.description.length > 120
                      ? project.description.substring(0, 120) + '...'
                      : project.description}
                  </p>
                )}

                <div
                  style={{
                    marginTop: 'auto',
                    paddingTop: '16px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '12px'
                  }}
                >
                  {project.tech_stack?.length > 0 && (
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '12px'
                      }}
                    >
                      <span
                        style={{
                          fontSize: '0.7rem',
                          color: 'var(--text-muted)',
                          fontWeight: 700,
                          textTransform: 'uppercase',
                          letterSpacing: '0.05em',
                          minWidth: '45px'
                        }}
                      >
                        Skills
                      </span>
                      <div className='project-tags'>
                        {project.tech_stack.slice(0, 3).map((t, i) => (
                          <span key={`tech-${i}`} className='tag tag-tech'>
                            {t}
                          </span>
                        ))}
                        {project.tech_stack.length > 3 && (
                          <span
                            className='tag'
                            style={{
                              background: 'var(--bg-warm)',
                              color: 'var(--text-muted)'
                            }}
                          >
                            +{project.tech_stack.length - 3}
                          </span>
                        )}
                      </div>
                    </div>
                  )}

                  {project.roles_needed?.length > 0 && (
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '12px'
                      }}
                    >
                      <span
                        style={{
                          fontSize: '0.7rem',
                          color: 'var(--text-muted)',
                          fontWeight: 700,
                          textTransform: 'uppercase',
                          letterSpacing: '0.05em',
                          minWidth: '45px'
                        }}
                      >
                        Roles
                      </span>
                      <div className='project-tags'>
                        {project.roles_needed.slice(0, 2).map((role, i) => (
                          <span key={`role-${i}`} className='tag tag-role'>
                            {role}
                          </span>
                        ))}
                        {project.roles_needed.length > 2 && (
                          <span
                            className='tag'
                            style={{
                              background: 'var(--bg-warm)',
                              color: 'var(--text-muted)'
                            }}
                          >
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
            <div
              style={{
                marginTop: '48px',
                display: 'flex',
                justifyContent: 'center',
                gap: '16px'
              }}
            >
              {visibleCount < projects.length ? (
                <button
                  className='btn btn-primary'
                  onClick={() => setVisibleCount(prev => prev + 6)}
                  style={{ padding: '12px 32px' }}
                >
                  Load More Projects
                </button>
              ) : (
                <button
                  className='btn btn-outline'
                  onClick={() => setVisibleCount(6)}
                  style={{ padding: '12px 32px' }}
                >
                  Show Less
                </button>
              )}
            </div>
          )}
        </section>
        <br />
        {/* About Section */}
        <section
          id='about'
          className='section'
          style={{
            background: 'var(--bg-warm)',
            padding: '100px 20px',
            borderTop: '1.5px solid var(--border)',
            borderBottom: '1.5px solid var(--border)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center'
          }}
        >
          <div style={{ maxWidth: '1000px', margin: '0 auto', width: '100%' }}>
            <div
              className='section-header'
              style={{
                justifyContent: 'center',
                textAlign: 'center',
                marginBottom: '60px'
              }}
            >
              <h2 style={{ fontSize: '2.5rem' }}>Why CollabHub?</h2>
            </div>
            <div
              className='projects-grid'
              style={{
                gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))'
              }}
            >
              <div
                className='project-card'
                style={{ textAlign: 'center', padding: '40px' }}
              >
                <div
                  style={{
                    background: 'var(--accent-light)',
                    width: '60px',
                    height: '60px',
                    borderRadius: '50%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    margin: '0 auto 24px'
                  }}
                >
                  <svg
                    width='24'
                    height='24'
                    viewBox='0 0 24 24'
                    fill='none'
                    stroke='var(--accent)'
                    strokeWidth='2'
                  >
                    <path d='M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2' />
                    <circle cx='9' cy='7' r='4' />
                    <path d='M23 21v-2a4 4 0 0 0-3-3.87' />
                    <path d='M16 3.13a4 4 0 0 1 0 7.75' />
                  </svg>
                </div>
                <h3
                  style={{
                    fontSize: '1.25rem',
                    marginBottom: '16px',
                    fontFamily: 'Lora'
                  }}
                >
                  Connect Freely
                </h3>
                <p style={{ color: 'var(--text-secondary)' }}>
                  Find passionate people who share your vision and interests
                  across various domains.
                </p>
              </div>
              <div
                className='project-card'
                style={{ textAlign: 'center', padding: '40px' }}
              >
                <div
                  style={{
                    background: 'var(--accent-light)',
                    width: '60px',
                    height: '60px',
                    borderRadius: '50%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    margin: '0 auto 24px'
                  }}
                >
                  <svg
                    width='24'
                    height='24'
                    viewBox='0 0 24 24'
                    fill='none'
                    stroke='var(--accent)'
                    strokeWidth='2'
                  >
                    <polyline points='16 18 22 12 16 6' />
                    <polyline points='8 6 2 12 8 18' />
                  </svg>
                </div>
                <h3
                  style={{
                    fontSize: '1.25rem',
                    marginBottom: '16px',
                    fontFamily: 'Lora'
                  }}
                >
                  Learn by Doing
                </h3>
                <p style={{ color: 'var(--text-secondary)' }}>
                  The best way to grow is by working on real-world projects with
                  meaningful outcomes.
                </p>
              </div>
              <div
                className='project-card'
                style={{ textAlign: 'center', padding: '40px' }}
              >
                <div
                  style={{
                    background: 'var(--accent-light)',
                    width: '60px',
                    height: '60px',
                    borderRadius: '50%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    margin: '0 auto 24px'
                  }}
                >
                  <svg
                    width='24'
                    height='24'
                    viewBox='0 0 24 24'
                    fill='none'
                    stroke='var(--accent)'
                    strokeWidth='2'
                  >
                    <path d='M12 19l7-7 3 3-7 7-3-3z' />
                    <path d='M18 13l-1.5-7.5L2 2l3.5 14.5L13 18l5-5z' />
                    <path d='M2 2l7.586 7.586' />
                    <circle cx='11' cy='11' r='2' />
                  </svg>
                </div>
                <h3
                  style={{
                    fontSize: '1.25rem',
                    marginBottom: '16px',
                    fontFamily: 'Lora'
                  }}
                >
                  Ship Faster
                </h3>
                <p style={{ color: 'var(--text-secondary)' }}>
                  Collaborate on architecture, code, and design to bring your
                  ideas to market quickly.
                </p>
              </div>
            </div>
          </div>
        </section>
        {/* FAQ Section */}
        <section
          id='faq'
          className='section'
          style={{ maxWidth: '800px', margin: '0 auto', padding: '120px 20px' }}
        >
          <div
            className='section-header'
            style={{
              marginBottom: '60px',
              justifyContent: 'center',
              textAlign: 'center'
            }}
          >
            <h2 style={{ fontSize: '2.5rem' }}>Frequently Asked Questions</h2>
          </div>
          <div
            style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}
          >
            {faqs.map((faq, index) => (
              <div
                key={index}
                className='project-card'
                style={{
                  padding: '24px',
                  cursor: 'pointer',
                  border:
                    activeFaq === index
                      ? '1.5px solid var(--accent)'
                      : '1.5px solid var(--border)'
                }}
                onClick={() => setActiveFaq(activeFaq === index ? null : index)}
              >
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center'
                  }}
                >
                  <h4
                    style={{
                      margin: 0,
                      fontFamily: 'DM Sans',
                      fontSize: '1rem'
                    }}
                  >
                    {faq.q}
                  </h4>
                  <span
                    style={{
                      transform:
                        activeFaq === index ? 'rotate(180deg)' : 'none',
                      transition: 'transform 0.3s ease'
                    }}
                  >
                    <svg
                      width='20'
                      height='20'
                      viewBox='0 0 24 24'
                      fill='none'
                      stroke='currentColor'
                      strokeWidth='2'
                    >
                      <polyline points='6 9 12 15 18 9' />
                    </svg>
                  </span>
                </div>
                {activeFaq === index && (
                  <div
                    className='fade-in'
                    style={{
                      marginTop: '16px',
                      color: 'var(--text-secondary)',
                      lineHeight: '1.6'
                    }}
                  >
                    {faq.a}
                  </div>
                )}
              </div>
            ))}
          </div>
        </section>
      </div>
    </>
  )
}

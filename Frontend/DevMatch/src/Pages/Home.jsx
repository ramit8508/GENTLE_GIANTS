import { useState } from 'react'
import { Link } from 'react-router-dom'
import AdvancedFilter from '../components/AdvancedFilter'

export default function Home () {
  const [search, setSearch] = useState('')
  const [showFilter, setShowFilter] = useState(false)
  const [activeFilters, setActiveFilters] = useState({ tech_stack: [], roles: [] })
  const [isLoggedIn] = useState(false) // TODO: Replace with actual auth state

  const handleSearch = (e) => {
    e.preventDefault()
    console.log('Search:', search, 'Filters:', activeFilters)
    // TODO: Implement search logic
  }

  const handleApplyFilter = (filters) => {
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
        </section>
        
      </div>
    </>
  )
}

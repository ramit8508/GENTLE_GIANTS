

export default function Home() {
  
  return (
    <>
    <div className="page">
      {/* Hero */}
      <section id="home" className="hero fade-up" style={{ position: 'relative', zIndex: 10, textAlign: 'center', minHeight: '10vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div className="hero-content" style={{ margin: '0 auto' }}>
          <h1 className="hero-title">
            Find Your Next <span className="gradient-text">Collaboration</span>
          </h1>
          <p className="hero-subtitle" style={{ margin: '0 auto 30px' }}>
            A space for creators to connect, build teams, and bring ideas to life.
          </p>
        </div>
      </section>
    </div>
    </>
  )
}


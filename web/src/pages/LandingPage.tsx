import { Link } from 'react-router-dom'
import { useAuth } from '../auth/useAuth'
import { Icon } from './LandingIcons'
import { categories, footerColumns, nomads, steps } from './landingContent'
import './LandingPage.css'

function Brand() {
  return (
    <span className="landing-brand">
      <Icon name="pin" className="landing-brand__mark" />
      <span className="landing-brand__name">Skillomat</span>
    </span>
  )
}

function TopBar() {
  const { user, logout } = useAuth()

  return (
    <header className="landing-topbar">
      <nav className="landing-topbar__inner">
        <Brand />
        <div className="landing-topbar__links">
          <a href="#categories" className="landing-navlink landing-navlink--active">
            Search
          </a>
          <a href="#nomads" className="landing-navlink">
            My Offers
          </a>
          <a href="#journey" className="landing-navlink">
            Messages
          </a>
          <a href="#footer" className="landing-navlink">
            Profile
          </a>
          {user ? (
            <span className="landing-topbar__account">
              <span className="landing-topbar__greeting">
                Signed in as <strong>{user.name}</strong>
              </span>
              <button type="button" className="landing-btn landing-btn--ghost" onClick={() => logout()}>
                Sign out
              </button>
            </span>
          ) : (
            <span className="landing-topbar__account">
              <Link to="/login" className="landing-navlink">
                Sign in
              </Link>
              <Link to="/register" className="landing-btn landing-btn--primary">
                Get Started
              </Link>
            </span>
          )}
        </div>
      </nav>
    </header>
  )
}

function Hero() {
  return (
    <section className="landing-hero">
      <div className="landing-hero__media" role="img" aria-label="A digital nomad working on a laptop in a sunlit tropical café." />
      <div className="landing-hero__inner">
        <div className="landing-hero__copy">
          <h1 className="landing-hero__title">Exchange Skills, Explore the World.</h1>
          <p className="landing-hero__lede">
            The premium marketplace connecting global nomadic talent with local skill-sharing
            opportunities. Trust, community, and adventure in every swap.
          </p>
          <form className="landing-search" role="search" onSubmit={(event) => event.preventDefault()}>
            <label className="landing-search__field">
              <Icon name="search" className="landing-search__icon" />
              <input type="text" name="skill" placeholder="What skill do you need?" aria-label="What skill do you need?" />
            </label>
            <label className="landing-search__field">
              <Icon name="map" className="landing-search__icon" />
              <input type="text" name="location" placeholder="Location" aria-label="Location" />
            </label>
            <button type="submit" className="landing-btn landing-btn--primary">
              Explore
            </button>
          </form>
        </div>
      </div>
    </section>
  )
}

function Categories() {
  return (
    <section id="categories" className="landing-section landing-categories">
      <div className="landing-section__inner">
        <div className="landing-section__head">
          <div>
            <h2 className="landing-section__title">Top Skill Categories</h2>
            <p className="landing-section__lede">
              Find the perfect match for your needs from our curated network of experts.
            </p>
          </div>
          <a href="#nomads" className="landing-section__more">
            View all <Icon name="arrow" />
          </a>
        </div>
        <div className="landing-bento">
          {categories.map((category) => (
            <article
              key={category.title}
              className={`landing-cat landing-cat--${category.size} landing-cat--${category.tone}`}
            >
              <span className="landing-cat__icon">
                <Icon name={category.icon} />
              </span>
              <div className="landing-cat__body">
                <h3 className="landing-cat__title">{category.title}</h3>
                {category.blurb && <p className="landing-cat__blurb">{category.blurb}</p>}
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  )
}

function HowItWorks() {
  return (
    <section id="journey" className="landing-section landing-journey">
      <div className="landing-section__inner">
        <div className="landing-section__head landing-section__head--center">
          <div>
            <h2 className="landing-section__title">Experience the Journey</h2>
            <p className="landing-section__lede">Three steps to your next meaningful skill exchange.</p>
          </div>
        </div>
        <ol className="landing-steps">
          {steps.map((step) => (
            <li key={step.title} className="landing-step">
              <span className={`landing-step__icon landing-step__icon--${step.tone}`}>
                <Icon name={step.icon} />
              </span>
              <h3 className="landing-step__title">{step.title}</h3>
              <p className="landing-step__body">{step.body}</p>
            </li>
          ))}
        </ol>
      </div>
    </section>
  )
}

function TrendingNomads() {
  return (
    <section id="nomads" className="landing-section">
      <div className="landing-section__inner">
        <div className="landing-section__head">
          <div>
            <h2 className="landing-section__title">Trending Nomads</h2>
            <p className="landing-section__lede">Highly-rated experts currently open for collaborations.</p>
          </div>
        </div>
        <div className="landing-nomads">
          {nomads.map((nomad) => (
            <article key={nomad.name} className="landing-nomad">
              <div className="landing-nomad__media" role="img" aria-label={`Portrait of ${nomad.name}`}>
                <span className="landing-nomad__rating">
                  <Icon name="star" /> {nomad.rating}
                </span>
                {nomad.verified && <span className="landing-nomad__badge">Verified</span>}
              </div>
              <div className="landing-nomad__body">
                <h3 className="landing-nomad__name">{nomad.name}</h3>
                <p className="landing-nomad__location">
                  <Icon name="pin" /> {nomad.location}
                </p>
                <ul className="landing-chips">
                  {nomad.skills.map((skill) => (
                    <li key={skill} className="landing-chip">
                      {skill}
                    </li>
                  ))}
                </ul>
                <div className="landing-nomad__foot">
                  <span className="landing-nomad__seeking">Looking for: {nomad.lookingFor}</span>
                  <button type="button" className="landing-nomad__link">
                    View Profile <Icon name="chevron" />
                  </button>
                </div>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  )
}

function CtaBanner() {
  return (
    <section className="landing-section">
      <div className="landing-section__inner">
        <div className="landing-cta">
          <h2 className="landing-cta__title">Ready to start your next adventure?</h2>
          <p className="landing-cta__lede">
            Join a global community of skill-sharers and turn your travels into transformative
            experiences.
          </p>
          <div className="landing-cta__actions">
            <Link to="/register" className="landing-btn landing-btn--primary">
              Become a Nomad
            </Link>
            <Link to="/register" className="landing-btn landing-btn--outline">
              List an Opportunity
            </Link>
          </div>
        </div>
      </div>
    </section>
  )
}

function SiteFooter() {
  return (
    <footer id="footer" className="landing-footer">
      <div className="landing-footer__inner">
        <div className="landing-footer__brand">
          <Brand />
          <p>The world's premier skill-sharing marketplace for the nomadic professional.</p>
          <div className="landing-footer__social">
            <a href="#footer" aria-label="Website">
              <Icon name="globe" />
            </a>
            <a href="#footer" aria-label="Photos">
              <Icon name="camera" />
            </a>
            <a href="#footer" aria-label="Email">
              <Icon name="mail" />
            </a>
          </div>
        </div>
        {footerColumns.map((column) => (
          <div key={column.heading} className="landing-footer__col">
            <h4>{column.heading}</h4>
            <ul>
              {column.links.map((link) => (
                <li key={link}>
                  <a href="#footer">{link}</a>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
      <div className="landing-footer__base">
        <p>© 2026 Skillomat. All rights reserved.</p>
        <p>Built with heart for the global community.</p>
      </div>
    </footer>
  )
}

function BottomNav() {
  return (
    <nav className="landing-bottomnav" aria-label="Primary">
      <a href="#categories" className="landing-bottomnav__item landing-bottomnav__item--active">
        <Icon name="search" />
        <span>Search</span>
      </a>
      <a href="#nomads" className="landing-bottomnav__item">
        <Icon name="handyman" />
        <span>My Offers</span>
      </a>
      <a href="#journey" className="landing-bottomnav__item">
        <Icon name="chat" />
        <span>Messages</span>
      </a>
      <a href="#footer" className="landing-bottomnav__item">
        <Icon name="person" />
        <span>Profile</span>
      </a>
    </nav>
  )
}

export function LandingPage() {
  return (
    <div className="landing">
      <TopBar />
      <main>
        <Hero />
        <Categories />
        <HowItWorks />
        <TrendingNomads />
        <CtaBanner />
      </main>
      <SiteFooter />
      <BottomNav />
    </div>
  )
}

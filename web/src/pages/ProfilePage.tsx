import { Link } from 'react-router-dom'
import { Icon } from './LandingIcons'
import { offers, profile, skills, stats } from './profileContent'
import './ProfilePage.css'

function TopBar() {
  return (
    <header className="profile-topbar">
      <div className="profile-topbar__inner">
        <span className="profile-brand">
          <Icon name="pin" className="profile-brand__mark" />
          <span className="profile-brand__name">Skillomat</span>
        </span>
        <div className="profile-topbar__actions">
          <button type="button" className="profile-iconbtn" aria-label="Settings">
            <Icon name="settings" />
          </button>
          <button type="button" className="profile-iconbtn" aria-label="Notifications">
            <Icon name="bell" />
          </button>
        </div>
      </div>
    </header>
  )
}

function ProfileHero() {
  return (
    <section className="profile-hero">
      <div className="profile-hero__media" role="img" aria-label={profile.coverLabel}>
        <div className="profile-hero__scrim" />
        <div className="profile-hero__identity">
          <h1 className="profile-hero__name">{profile.name}</h1>
          <p className="profile-hero__tagline">{profile.tagline}</p>
        </div>
      </div>
      <div className="profile-hero__bar">
        <div className="profile-stats">
          <div className="profile-stat">
            <p className="profile-stat__label">Trades</p>
            <p className="profile-stat__value profile-stat__value--primary">{profile.trades}</p>
          </div>
          <div className="profile-stat">
            <p className="profile-stat__label">Rating</p>
            <p className="profile-stat__value profile-stat__value--tertiary">
              <Icon name="star" className="profile-stat__star" /> {profile.rating}
            </p>
          </div>
        </div>
        <button type="button" className="profile-btn profile-btn--primary">
          Edit Profile
        </button>
      </div>
    </section>
  )
}

function VerifiedSkills() {
  return (
    <section className="profile-section profile-section--skills">
      <div className="profile-section__head">
        <h2 className="profile-section__title">Verified Skills</h2>
        <Icon name="verified" className="profile-section__badge" />
      </div>
      <ul className="profile-chips">
        {skills.map((skill) => (
          <li key={skill.label} className="profile-chip">
            <Icon name={skill.icon} className="profile-chip__icon" />
            {skill.label}
          </li>
        ))}
      </ul>
    </section>
  )
}

function ActiveOffers() {
  return (
    <section className="profile-section profile-section--offers">
      <div className="profile-section__head">
        <h2 className="profile-section__title">Active Offers</h2>
        <button type="button" className="profile-section__more">
          View all
        </button>
      </div>
      <div className="profile-offers">
        {offers.map((offer) => (
          <article key={offer.title} className="profile-offer">
            <div className="profile-offer__media" role="img" aria-label={offer.mediaLabel} />
            <div className="profile-offer__body">
              <h3 className="profile-offer__title">{offer.title}</h3>
              <p className="profile-offer__location">
                <Icon name="pin" className="profile-offer__pin" /> {offer.location}
              </p>
              <div className="profile-offer__foot">
                <span className="profile-offer__tag">{offer.status}</span>
                {offer.active && <span className="profile-offer__status">Active</span>}
              </div>
            </div>
          </article>
        ))}
      </div>
    </section>
  )
}

function StatsGrid() {
  return (
    <section className="profile-section profile-section--stats">
      <div className="profile-bento">
        {stats.map((stat) => (
          <div key={stat.label} className={`profile-tile profile-tile--${stat.tone}`}>
            <Icon name={stat.icon} className="profile-tile__icon" />
            <div>
              <p className="profile-tile__value">{stat.value}</p>
              <p className="profile-tile__label">{stat.label}</p>
            </div>
          </div>
        ))}
      </div>
    </section>
  )
}

function BottomNav() {
  return (
    <nav className="profile-bottomnav" aria-label="Primary">
      <Link to="/" className="profile-bottomnav__item">
        <Icon name="search" />
        <span>Search</span>
      </Link>
      <Link to="/" className="profile-bottomnav__item">
        <Icon name="handyman" />
        <span>My Offers</span>
      </Link>
      <Link to="/" className="profile-bottomnav__item">
        <Icon name="chat" />
        <span>Messages</span>
      </Link>
      <Link
        to="/profile"
        className="profile-bottomnav__item profile-bottomnav__item--active"
        aria-current="page"
      >
        <Icon name="person" />
        <span>Profile</span>
      </Link>
    </nav>
  )
}

export function ProfilePage() {
  return (
    <div className="profile">
      <TopBar />
      <main className="profile-main">
        <ProfileHero />
        <VerifiedSkills />
        <ActiveOffers />
        <StatsGrid />
      </main>
      <BottomNav />
    </div>
  )
}

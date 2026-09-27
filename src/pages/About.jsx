import { Search, ShieldCheck, Bell, Heart, Users, Target } from "lucide-react";

function About() {
  return (
    <div className="page">

      <section className="page-hero">
        <p>Home / About</p>
        <h1>About LostLink</h1>
        <span>
          A simple and secure way for our campus community to reconnect
          <br />
          with lost belongings.
        </span>
      </section>

      <section className="about-content">

        <div className="about-card">
          <div className="about-icon">
            <Target />
          </div>
          <h2>Our Mission</h2>
          <p>
            LostLink helps students and staff report, search and recover
            lost items on campus quickly and easily.
          </p>
        </div>

        <div className="about-card">
          <div className="about-icon">
            <Users />
          </div>
          <h2>Campus Community</h2>
          <p>
            We connect people who lose items with people who find them,
            creating a helpful and responsible campus community.
          </p>
        </div>

      </section>

      <section className="why-section">
        <h2>Why Choose LostLink?</h2>

        <div className="about-features">

          <div className="feature-card">
            <Search />
            <h3>Easy Search</h3>
            <p>Find lost and found items using keywords, category and location.</p>
          </div>

          <div className="feature-card">
            <ShieldCheck />
            <h3>Secure & Reliable</h3>
            <p>Your reports and contact details are handled securely.</p>
          </div>

          <div className="feature-card">
            <Bell />
            <h3>Quick Notifications</h3>
            <p>Get updates when a possible match is found.</p>
          </div>

          <div className="feature-card">
            <Heart />
            <h3>Help Each Other</h3>
            <p>Make it easier for our campus community to return belongings.</p>
          </div>

        </div>
      </section>

    </div>
  );
}

export default About;
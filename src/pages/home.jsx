import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  Search,
  Camera,
  Sparkles,
  ShieldCheck,
  WalletCards,
} from "lucide-react";

function Home() {
  const navigate = useNavigate();
  const [heroSearch, setHeroSearch] = useState("");

  const categories = [
    "All",
    "Electronics",
    "Wallet",
    "Keys",
    "Books",
    "Accessories",
    "ID Card",
  ];

  const handleHeroSearch = (e) => {
    e.preventDefault();
    if (heroSearch.trim()) {
      navigate(`/search?q=${encodeURIComponent(heroSearch.trim())}`);
    } else {
      navigate("/search");
    }
  };

  const handleCategoryClick = (category) => {
    if (category === "All") {
      navigate("/search");
    } else {
      navigate(`/search?category=${encodeURIComponent(category)}`);
    }
  };

  const features = [
    {
      icon: <Camera size={18} />,
      title: "Easy Reporting",
      text: "Report lost or found items in just a few clicks with all the details.",
      className: "purple",
    },
    {
      icon: <Search size={18} />,
      title: "Quick Search",
      text: "Search by category, location, or keywords and find items instantly.",
      className: "green",
    },
    {
      icon: <Sparkles size={18} />,
      title: "AI Photo Matching",
      text: "Add a photo and get possible matches suggested by AI.",
      className: "blue",
    },
    {
      icon: <ShieldCheck size={18} />,
      title: "Privacy Friendly",
      text: "Phone numbers and emails are not shown on public pages.",
      className: "yellow",
    },
  ];

  return (
    <div className="home">
      {/* ================= HERO ================= */}
      <section className="hero">
        {/* Hero Image / Wallet Illustration */}
        <div className="hero-image">
          <div className="hero-circle">
            <WalletCards size={62} />
          </div>
        </div>

        <div className="hero-content">
          <div className="hero-tag">COMMUNITY LOST & FOUND</div>

          <h1>
            Lost Something?
            <br />
            Find It <span>Faster.</span>
          </h1>

          <p className="hero-description">
            A smart platform to report lost items, find found items, and
            reconnect with the rightful owner — in just a few clicks.
          </p>

          <div className="hero-buttons">
            <Link to="/lost-item" className="primary-btn">
              Report Lost Item
            </Link>

            <Link to="/found-item" className="secondary-btn">
              Report Found Item
            </Link>
          </div>

          {/* ================= SEARCH ================= */}
          <div className="search-section">
            <form className="search-box" onSubmit={handleHeroSearch}>
              <input
                type="text"
                placeholder="Search for lost items by name or location..."
                value={heroSearch}
                onChange={(e) => setHeroSearch(e.target.value)}
              />

              <button type="submit" className="search-btn">
                Search
              </button>
            </form>

            <div className="categories">
              {categories.map((category) => (
                <button
                  key={category}
                  type="button"
                  className="category"
                  onClick={() => handleCategoryClick(category)}
                >
                  {category}
                </button>
              ))}
            </div>
          </div>
        </div>

      </section>


      {/* ================= WHY CHOOSE ================= */}
      <section className="features-section">

        <h2 className="section-title">
          Why Choose <span>LostLink?</span>
        </h2>

        <p className="section-subtitle">
          Everything you need to report, search, and reunite belongings
          with their owners.
        </p>


        <div className="features-grid">

          {features.map((feature) => (
            <div
              className="feature-card"
              key={feature.title}
            >

              <div
                className={`feature-icon ${feature.className}`}
              >
                {feature.icon}
              </div>

              <h3>{feature.title}</h3>

              <p>{feature.text}</p>

            </div>
          ))}

        </div>

      </section>

    </div>
  );
}

export default Home;
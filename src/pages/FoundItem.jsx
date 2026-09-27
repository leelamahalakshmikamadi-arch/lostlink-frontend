import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { API_BASE_URL, getApiErrorMessage, itemsApi, matchItemImage } from "../api";
import { useAuth } from "../context/AuthContext";
import { MapPin, Calendar, Wallet } from "lucide-react";

function FoundItem() {
  const { user } = useAuth();
  const [items, setItems] = useState([]);
  const [filterQuery, setFilterQuery] = useState("");
  const [image, setImage] = useState(null);
  const [formData, setFormData] = useState({
    itemName: "",
    category: "",
    location: "",
    dateFound: "",
    description: "",
    reporterName: "",
    contact: "",
  });
  const [error, setError] = useState("");
  const [matches, setMatches] = useState([]);
  const [matching, setMatching] = useState(false);

  useEffect(() => {
    const loadFoundItems = async () => {
      try {
        const response = await itemsApi.get("");
        setItems(response.data.filter((item) => item.itemType === "found"));
      } catch {
        setError("Unable to load found items.");
      }
    };

    loadFoundItems();
  }, []);

  const handleChange = (event) => {
    setFormData({ ...formData, [event.target.name]: event.target.value });
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");

    try {
      const payload = image ? new FormData() : { ...formData };
      if (image) {
        Object.entries(formData).forEach(([key, value]) => payload.append(key, value));
        payload.append("image", image);
        if (user?.id) payload.append("userId", user.id);
        if (user?.email) payload.append("userEmail", user.email);
      } else {
        if (user?.id) payload.userId = user.id;
        if (user?.email) payload.userEmail = user.email;
      }

      await itemsApi.post("/found", payload);
      if (image) {
        setMatching(true);
        try {
          const matchResponse = await matchItemImage(image, "found", user?.id, user?.email);
          setMatches(matchResponse.data.matches || []);
        } catch (matchError) {
          setMatches([]);
          setError(getApiErrorMessage(matchError, "Item submitted, but AI matching is unavailable."));
        } finally {
          setMatching(false);
        }
      } else {
        setMatches([]);
      }
      alert("Found Item Report Submitted Successfully!");
      setFormData({
        itemName: "",
        category: "",
        location: "",
        dateFound: "",
        description: "",
        reporterName: "",
        contact: "",
      });
      setImage(null);
    } catch (requestError) {
      setMatching(false);
      setError(getApiErrorMessage(requestError, "Failed to submit. Please check if the backend is running."));
    }
  };

  return (
    <div className="page">
      <section className="page-hero">
        <p>Home / Found Item</p>
        <h1>Report a Found Item</h1>
        <span>Found something that isn't yours? Report it here so we can help<br />reunite it with its owner.</span>
      </section>

      <form className="form-card" onSubmit={handleSubmit}>
        <h2>Item details</h2>
        <p>Fields marked * are required. Please hand physical items to the nearest help desk after reporting.</p>

        <label>Item name *</label>
        <input name="itemName" value={formData.itemName} onChange={handleChange} placeholder="e.g. Set of bike keys" required />

        <div className="two-col">
          <div>
            <label>Category *</label>
            <select name="category" value={formData.category} onChange={handleChange} required><option value="">Select category</option><option>Electronics</option><option>Wallet</option><option>Keys</option><option>Books</option></select>
          </div>

          <div>
            <label>Found location *</label>
            <input name="location" value={formData.location} onChange={handleChange} placeholder="e.g. Parking Area" required />
          </div>
        </div>

        <label>Date found *</label>
        <input name="dateFound" type="date" value={formData.dateFound} onChange={handleChange} required />

        <label>Description <small>(color, brand, distinguishing marks...)</small></label>
        <textarea name="description" value={formData.description} onChange={handleChange} placeholder="Add any details that could help the owner identify it..." />

        <label>Photo <small>(optional, kept on this device only)</small></label>
        <label className="upload-box" htmlFor="found-item-image">Click to choose an image, or drag it here</label>
        <input
          id="found-item-image"
          type="file"
          name="image"
          accept="image/*"
          onChange={(event) => setImage(event.target.files[0] || null)}
        />

        <div className="two-col">
          <div>
            <label>Your name *</label>
            <input name="reporterName" value={formData.reporterName} onChange={handleChange} placeholder="Full name" required />
          </div>
          <div>
            <label>Email or phone *</label>
            <input name="contact" value={formData.contact} onChange={handleChange} placeholder="you@example.com" required />
          </div>
        </div>

        <div className="info-box">
          All reports are stored securely on this device for this demo.
          In production, LostLink syncs reports to our team so they can match and verify claims.
        </div>

        {error && <p role="alert">{error}</p>}
        <button type="submit">Submit Found Item Report</button>
      </form>

      {image && matching && <p>Finding possible lost-item matches...</p>}

      {matches.length > 0 && (
        <section className="items-section">
          <div className="section-title">
            <h2>Possible Lost Item Matches</h2>
            <span>{matches.length} match{matches.length === 1 ? "" : "es"} found</span>
          </div>
          <div className="items-grid">
            {matches.map((match) => {
              const item = match.item;
              return (
                <div className="item-card" key={item.id}>
                  <span className="status lost">{match.similarityPercentage}% match</span>
                  <div className="item-image">
                    {item.imageUrl && <img src={`${API_BASE_URL}${item.imageUrl}`} alt={item.itemName || "Possible match"} />}
                  </div>
                  <div className="item-info">
                    <h3>{item.itemName || item.name || "Unnamed item"}</h3>
                    <p>{item.location || "Location not provided"}</p>
                    <p>{item.dateLost || item.date || "Date not provided"}</p>
                    <p>{match.result || "MATCH"}</p>
                    {match.reason && <p>{match.reason}</p>}
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      )}

      <section className="items-section">
        <div className="section-title">
          <h2>All Reported Found Items</h2>
          <input
            placeholder="Filter by keyword or location..."
            value={filterQuery}
            onChange={(e) => setFilterQuery(e.target.value)}
          />
        </div>

        <div className="items-grid">
          {items
            .filter((item) => {
              if (!filterQuery) return true;
              const text = JSON.stringify(item).toLowerCase();
              return text.includes(filterQuery.toLowerCase());
            })
            .map((item) => (
              <div className="item-card" key={item.id}>
                <span className="status found">Found</span>

                <div className="item-image">
                  {item.imageUrl ? (
                    <img src={`${API_BASE_URL}${item.imageUrl}`} alt={item.itemName || item.name || "Found item"} />
                  ) : (
                    <Wallet />
                  )}
                </div>

                <div className="item-info">
                  <h3>{item.itemName || item.name || "Unnamed item"}</h3>
                  <p><MapPin size={12} /> {item.location || "Location not provided"}</p>
                  <p><Calendar size={12} /> {item.dateFound || item.date || "Date not provided"}</p>
                  {item.id && (
                    <Link className="item-details-button" to={`/search/items/${encodeURIComponent(item.id)}`}>
                      View Details
                    </Link>
                  )}
                </div>
              </div>
            ))}
        </div>
      </section>
    </div>
  );
}

export default FoundItem;
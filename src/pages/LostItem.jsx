import { useState } from "react";
import { Link } from "react-router-dom";
import { API_BASE_URL, getApiErrorMessage, itemsApi, matchItemImage } from "../api";
import { useAuth } from "../context/AuthContext";

function LostItem() {
  const { user } = useAuth();
  const [image, setImage] = useState(null);
  const [matches, setMatches] = useState([]);
  const [matching, setMatching] = useState(false);
  const [formData, setFormData] = useState({
    itemName: "",
    category: "",
    description: "",
    dateLost: "",
    location: "",
    contactNumber: "",
    reward: "",
  });

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

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

      await itemsApi.post("/lost", payload);

      if (image) {
        setMatching(true);
        try {
          const matchResponse = await matchItemImage(image, "lost", user?.id, user?.email);
          setMatches(matchResponse.data.matches || []);
        } catch (matchError) {
          setMatches([]);
          alert(getApiErrorMessage(matchError, "Item submitted, but AI matching is unavailable."));
        } finally {
          setMatching(false);
        }
      } else {
        setMatches([]);
      }

      alert("Lost Item Report Submitted Successfully!");

      setFormData({
        itemName: "",
        category: "",
        description: "",
        dateLost: "",
        location: "",
        contactNumber: "",
        reward: "",
      });
      setImage(null);
    } catch (error) {
      setMatching(false);
      alert(getApiErrorMessage(error, "Failed to submit. Please check if backend is running."));
    }
  };

  return (
    <div className="page">

      <section className="page-hero">
        <p>Home / Lost Item</p>
        <h1>Report a Lost Item</h1>
        <span>
          Lost something on campus? Tell us the details.
        </span>
      </section>

      <form className="form-card" onSubmit={handleSubmit}>

        <h2>Item Details</h2>

        <label>Item Name *</label>
        <input
          type="text"
          name="itemName"
          placeholder="e.g. Black wallet"
          value={formData.itemName}
          onChange={handleChange}
          required
        />

        <label>Category *</label>
        <select
          name="category"
          value={formData.category}
          onChange={handleChange}
          required
        >
          <option value="">Select Category</option>
          <option value="Electronics">Electronics</option>
          <option value="Wallet">Wallet</option>
          <option value="Keys">Keys</option>
          <option value="Books">Books</option>
          <option value="Accessories">Accessories</option>
          <option value="ID Card">ID Card</option>
          <option value="Other">Other</option>
        </select>

        <label>Location *</label>
        <input
          type="text"
          name="location"
          placeholder="e.g. Library Block A"
          value={formData.location}
          onChange={handleChange}
          required
        />

        <label>Date Lost *</label>
        <input
          type="date"
          name="dateLost"
          value={formData.dateLost}
          onChange={handleChange}
          required
        />

        <label>Description</label>
        <textarea
          name="description"
          placeholder="Describe the item..."
          value={formData.description}
          onChange={handleChange}
        />

        <label>Contact Number *</label>
        <input
          type="text"
          name="contactNumber"
          placeholder="Enter phone number"
          value={formData.contactNumber}
          onChange={handleChange}
          required
        />

        <label>Reward (Optional)</label>
        <input
          type="text"
          name="reward"
          placeholder="e.g. ₹500"
          value={formData.reward}
          onChange={handleChange}
        />

        <label>Photo (Optional)</label>
        <input
          type="file"
          name="image"
          accept="image/*"
          onChange={(e) => setImage(e.target.files[0] || null)}
        />

        <button type="submit">
          Submit Lost Item Report
        </button>

      </form>

      {image && matching && <p>Finding possible matches...</p>}

      {matches.length > 0 && (
        <section className="items-section">
          <div className="section-title">
            <h2>Possible Found Item Matches</h2>
            <span>{matches.length} match{matches.length === 1 ? "" : "es"} found</span>
          </div>

          <div className="items-grid">
            {matches.map((match) => {
              const item = match.item;
              return (
                <div className="item-card" key={item.id}>
                  <span className="status found">{match.similarityPercentage}% match</span>

                  <div className="item-image">
                    {item.imageUrl ? (
                      <img src={`${API_BASE_URL}${item.imageUrl}`} alt={item.itemName || "Possible match"} />
                    ) : (
                      ""
                    )}
                  </div>

                  <div className="item-info">
                    <h3>{item.itemName || item.name || "Unnamed item"}</h3>
                    <p>{item.location || "Location not provided"}</p>
                    <p>{item.dateFound || item.date || "Date not provided"}</p>
                    <p>{match.result || "MATCH"}</p>
                    {match.reason && <p>{match.reason}</p>}
                    {item.id && (
                      <Link className="item-details-button" to={`/search/items/${encodeURIComponent(item.id)}`}>
                        View Details
                      </Link>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      )}

    </div>
  );
}

export default LostItem;
import { useState } from "react";
import { Link } from "react-router-dom";
import { API_BASE_URL, MAX_REPORT_DATE, getApiErrorMessage, itemsApi, matchItemImage, validateReportImage } from "../api";
import { useAuth } from "../context/useAuth";
import TurnstileWidget from "../components/TurnstileWidget";
import ReportTracking from "../components/ReportTracking";

function LostItem() {
  const { isAuthenticated } = useAuth();
  const [image, setImage] = useState(null);
  const [matches, setMatches] = useState([]);
  const [matchNote, setMatchNote] = useState("");
  const [matching, setMatching] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [captchaToken, setCaptchaToken] = useState("");
  const [captchaReset, setCaptchaReset] = useState(0);
  const [companyWebsite, setCompanyWebsite] = useState("");
  const [receipt, setReceipt] = useState(null);
  const [error, setError] = useState("");
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

  const handleImageChange = (event) => {
    const file = event.target.files[0] || null;
    const imageError = validateReportImage(file);
    if (imageError) {
      setImage(null);
      event.target.value = "";
      setError(imageError);
      return;
    }
    setError("");
    setImage(file);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (submitting) return;
    setError("");
    setReceipt(null);
    setMatchNote("");
    setSubmitting(true);

    try {
      const payload = image ? new FormData() : { ...formData };
      if (image) {
        Object.entries(formData).forEach(([key, value]) => payload.append(key, value));
        payload.append("image", image);
        payload.append("captchaToken", captchaToken);
        payload.append("companyWebsite", companyWebsite);
      } else {
        payload.captchaToken = captchaToken;
        payload.companyWebsite = companyWebsite;
      }

      const response = await itemsApi.post("/lost", payload);
      let matchingMessage = "";

      if (image) {
        setMatching(true);
        try {
          const matchResponse = await matchItemImage(image, "lost");
          const foundMatches = matchResponse.data.matches || [];
          setMatches(foundMatches);
          if (foundMatches.length > 0) {
            setMatchNote("");
          } else {
            setMatchNote("No likely match found yet among reports that have photos. Please check again later.");
          }
        } catch (matchError) {
          setMatches([]);
          matchingMessage = getApiErrorMessage(matchError, "Report saved, but AI matching is unavailable.");
        } finally {
          setMatching(false);
        }
      } else {
        setMatches([]);
        setMatchNote("Your report was saved without a photo, so AI matching was skipped. Add a photo next time to get possible matches.");
      }

      setReceipt({
        ...response.data,
        matchingMessage,
      });

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
      setError(getApiErrorMessage(error, "Failed to submit. Please check if the backend is running."));
    } finally {
      setSubmitting(false);
      setCaptchaToken("");
      setCaptchaReset((current) => current + 1);
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
          minLength={2}
          maxLength={100}
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
          minLength={2}
          maxLength={160}
          required
        />

        <label>Date Lost *</label>
        <input
          type="date"
          name="dateLost"
          max={MAX_REPORT_DATE}
          value={formData.dateLost}
          onChange={handleChange}
          required
        />

        <label>Description</label>
        <textarea
          name="description"
          placeholder="Describe the item..."
          value={formData.description}
          maxLength={2000}
          onChange={handleChange}
        />

        <label>Contact Number *</label>
        <input
          type="text"
          name="contactNumber"
          minLength={7}
          maxLength={120}
          pattern="(?:[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+[.][A-Za-z]{2,}|[+()0-9 .-]{7,25})"
          placeholder="Enter phone number"
          value={formData.contactNumber}
          onChange={handleChange}
          required
        />

        <label>Reward (Optional)</label>
        <input
          type="text"
          name="reward"
          maxLength={80}
          placeholder="e.g. ₹500"
          value={formData.reward}
          onChange={handleChange}
        />

        <label>Photo (Optional) <small>(JPG or PNG)</small></label>
        <input
          type="file"
          name="image"
          accept="image/jpeg,image/png"
          onChange={handleImageChange}
        />

        <label
          htmlFor="lost-item-company-website"
          style={{ position: "absolute", left: "-10000px", width: "1px", height: "1px", overflow: "hidden" }}
          aria-hidden="true"
        >
          Leave this field empty
        </label>
        <input
          id="lost-item-company-website"
          type="text"
          value={companyWebsite}
          onChange={(event) => setCompanyWebsite(event.target.value)}
          tabIndex={-1}
          autoComplete="off"
          style={{ position: "absolute", left: "-10000px", width: "1px", height: "1px" }}
          aria-hidden="true"
        />
        {!isAuthenticated && <TurnstileWidget key={captchaReset} onToken={setCaptchaToken} />}
        {error && <p role="alert">{error}</p>}
        <button type="submit" disabled={submitting || (!isAuthenticated && !captchaToken)}>
          {submitting ? "Submitting..." : "Submit Lost Item Report"}
        </button>

      </form>

      <ReportTracking receipt={receipt} guest={!isAuthenticated} />

      {matchNote && <div className="info-box">{matchNote}</div>}

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
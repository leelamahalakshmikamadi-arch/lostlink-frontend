import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { API_BASE_URL, MAX_REPORT_DATE, getApiErrorMessage, itemsApi, matchItemImage, validateReportImage } from "../api";
import { useAuth } from "../context/useAuth";
import { MapPin, Calendar, Wallet } from "lucide-react";
import TurnstileWidget from "../components/TurnstileWidget";
import ReportTracking from "../components/ReportTracking";

function FoundItem() {
  const { isAuthenticated } = useAuth();
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
  const [matchNote, setMatchNote] = useState("");
  const [matching, setMatching] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [captchaToken, setCaptchaToken] = useState("");
  const [captchaReset, setCaptchaReset] = useState(0);
  const [companyWebsite, setCompanyWebsite] = useState("");
  const [receipt, setReceipt] = useState(null);

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

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");
    if (submitting) return;
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

      const response = await itemsApi.post("/found", payload);
      let matchingMessage = "";
      if (image) {
        setMatching(true);
        try {
          const matchResponse = await matchItemImage(image, "found");
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
    } finally {
      setSubmitting(false);
      setCaptchaToken("");
      setCaptchaReset((current) => current + 1);
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
        <input name="itemName" value={formData.itemName} onChange={handleChange} placeholder="e.g. Set of bike keys" minLength={2} maxLength={100} required />

        <div className="two-col">
          <div>
            <label>Category *</label>
            <select name="category" value={formData.category} onChange={handleChange} required><option value="">Select category</option><option>Electronics</option><option>Wallet</option><option>Keys</option><option>Books</option><option>Accessories</option><option>ID Card</option><option>Other</option></select>
          </div>

          <div>
            <label>Found location *</label>
            <input name="location" value={formData.location} onChange={handleChange} placeholder="e.g. Parking Area" minLength={2} maxLength={160} required />
          </div>
        </div>

        <label>Date found *</label>
        <input name="dateFound" type="date" max={MAX_REPORT_DATE} value={formData.dateFound} onChange={handleChange} required />

        <label>Description <small>(color, brand, distinguishing marks...)</small></label>
        <textarea name="description" value={formData.description} onChange={handleChange} maxLength={2000} placeholder="Add any details that could help the owner identify it..." />

        <label>Photo <small>(optional, JPG or PNG)</small></label>
        <label className="upload-box" htmlFor="found-item-image">Click to choose an image, or drag it here</label>
        <input
          id="found-item-image"
          type="file"
          name="image"
          accept="image/jpeg,image/png"
          onChange={handleImageChange}
        />

        <div className="two-col">
          <div>
            <label>Your name *</label>
            <input name="reporterName" value={formData.reporterName} onChange={handleChange} minLength={2} maxLength={100} placeholder="Full name" required />
          </div>
          <div>
            <label>Email or phone *</label>
            <input name="contact" value={formData.contact} onChange={handleChange} minLength={5} maxLength={120} pattern="(?:[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+[.][A-Za-z]{2,}|[+()0-9 .-]{7,25})" placeholder="you@example.com or phone" required />
          </div>
        </div>

        <div className="info-box">
          Reports are saved in the LostLink database. Adding a photo lets AI suggest possible matches. Please hand the physical item to the Campus Help Desk.
        </div>

        <label
          htmlFor="found-item-company-website"
          style={{ position: "absolute", left: "-10000px", width: "1px", height: "1px", overflow: "hidden" }}
          aria-hidden="true"
        >
          Leave this field empty
        </label>
        <input
          id="found-item-company-website"
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
          {submitting ? "Submitting..." : "Submit Found Item Report"}
        </button>
      </form>

      <ReportTracking receipt={receipt} guest={!isAuthenticated} />

      {matchNote && <div className="info-box">{matchNote}</div>}

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
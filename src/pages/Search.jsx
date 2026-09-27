import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { API_BASE_URL, getApiErrorMessage, getItemImage, itemsApi, matchItemImage } from "../api";
import { useAuth } from "../context/AuthContext";
import { Smartphone, ShoppingBag, Wallet, KeyRound, BookOpen, MapPin, Award } from "lucide-react";

function Search() {
  const { user } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const [items, setItems] = useState([]);
  const [search, setSearch] = useState(searchParams.get("q") || "");
  const [category, setCategory] = useState(searchParams.get("category") || "");
  const [location, setLocation] = useState(searchParams.get("location") || "");
  const [type, setType] = useState("");
  const [error, setError] = useState("");
  const [matchingItemId, setMatchingItemId] = useState(null);
  const [matchResults, setMatchResults] = useState({});

  useEffect(() => {
    const qParam = searchParams.get("q");
    const catParam = searchParams.get("category");
    const locParam = searchParams.get("location");
    if (qParam !== null) setSearch(qParam);
    if (catParam !== null) setCategory(catParam);
    if (locParam !== null) setLocation(locParam);
  }, [searchParams]);

  useEffect(() => {
    const loadItems = async () => {
      try {
        const response = await itemsApi.get("");
        setItems(response.data);
      } catch {
        setError("Unable to load reported items.");
      }
    };

    loadItems();
  }, []);

  const campusLocations = [
    "All Locations",
    "Library Block A",
    "Cafeteria",
    "Parking Area",
    "Science Block",
    "Auditorium",
    "Sports Complex",
    "Main Gate",
    "Computer Lab",
    "Hostels",
  ];

  const filteredItems = items.filter((item) => {
    const searchableText = JSON.stringify(item).toLowerCase();
    const matchesSearch = !search || searchableText.includes(search.toLowerCase());
    const matchesCategory = !category || item.category === category;
    const matchesType = !type || item.itemType === type;
    const matchesLocation =
      !location ||
      location === "All Locations" ||
      (item.location && item.location.toLowerCase().includes(location.toLowerCase()));
    return matchesSearch && matchesCategory && matchesType && matchesLocation;
  });

  const iconForItem = (item) => {
    const value = `${item.category || ""} ${item.itemName || item.name || ""}`.toLowerCase();
    if (value.includes("phone") || value.includes("electronic")) return <Smartphone />;
    if (value.includes("key")) return <KeyRound />;
    if (value.includes("book") || value.includes("notebook")) return <BookOpen />;
    if (value.includes("bag") || value.includes("backpack")) return <ShoppingBag />;
    return <Wallet />;
  };

  const hasMatchCandidates = (item) =>
    items.some((candidate) => candidate.itemType !== item.itemType && candidate.imageUrl);

  const compareWithAi = async (item) => {
    setMatchingItemId(item.id);
    setMatchResults((current) => ({ ...current, [item.id]: { loading: true } }));

    try {
      const imageResponse = await getItemImage(item.id);
      const response = await matchItemImage(
        imageResponse.data,
        item.itemType || "lost",
        user?.id || item.userId,
        user?.email || item.userEmail
      );
      setMatchResults((current) => ({
        ...current,
        [item.id]: { matches: response.data.matches || [] },
      }));
    } catch (requestError) {
      setMatchResults((current) => ({
        ...current,
        [item.id]: {
          error: getApiErrorMessage(requestError, "AI matching is unavailable right now."),
        },
      }));
    } finally {
      setMatchingItemId(null);
    }
  };

  const clearAllFilters = () => {
    setSearch("");
    setCategory("");
    setLocation("");
    setType("");
    setSearchParams({});
  };

  return (
    <div className="page">
      <section className="page-hero">
        <p>Home / Search</p>
        <h1>Search Lost & Found Items</h1>
        <span>Browse every report on LostLink, or narrow it down by keyword,<br />category, location, and status.</span>
      </section>

      <div className="search-box">
        <input
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Search by name, location, or description..."
        />

        <select value={category} onChange={(event) => setCategory(event.target.value)}>
          <option value="">All categories</option>
          <option>Electronics</option>
          <option>Wallet</option>
          <option>Keys</option>
          <option>Books</option>
          <option>Accessories</option>
          <option>ID Cards</option>
          <option>Other</option>
        </select>

        {/* Dedicated Campus Location Filter */}
        <select value={location} onChange={(event) => setLocation(event.target.value)}>
          {campusLocations.map((loc) => (
            <option key={loc} value={loc === "All Locations" ? "" : loc}>
              {loc === "All Locations" ? "📍 All Locations" : `📍 ${loc}`}
            </option>
          ))}
        </select>

        <select value={type} onChange={(event) => setType(event.target.value)}>
          <option value="">Lost & Found</option>
          <option value="lost">Lost</option>
          <option value="found">Found</option>
        </select>

        <button type="button" onClick={() => {}}>Filter</button>
      </div>

      <div className="search-result">
        <span>Showing {filteredItems.length} items</span>
        {(search || category || location || type) && (
          <button type="button" onClick={clearAllFilters}>Clear all filters</button>
        )}
      </div>

      {error && <p role="alert">{error}</p>}

      <div className="items-grid">
        {filteredItems.map((item) => (
          <div className="item-card" key={item.id}>
            <div className="item-card-header">
              <span className={`status ${item.itemType || "lost"}`}>
                {item.itemType || "Lost"}
              </span>
              {item.reward && (
                <span className="reward-tag" title="Owner reward offered">
                  <Award size={12} /> {item.reward}
                </span>
              )}
            </div>

            <div className="item-image">
              {item.imageUrl ? <img src={`${API_BASE_URL}${item.imageUrl}`} alt={item.itemName || item.name || "Reported item"} /> : iconForItem(item)}
            </div>

            <div className="item-info">
              <h3>{item.itemName || item.name || "Unnamed item"}</h3>
              <p><MapPin size={13} style={{ display: "inline", verticalAlign: "middle" }} /> {item.location || "Location not provided"}</p>
              <p>▣ {item.dateLost || item.dateFound || item.date || "Date not provided"}</p>
              
              {item.status && item.status.includes("Claimed") && (
                <div className="claim-badge-verified">✓ {item.status}</div>
              )}

              {item.id && (
                <Link className="item-details-button" to={`/search/items/${encodeURIComponent(item.id)}`}>View Details</Link>
              )}
              {item.imageUrl && hasMatchCandidates(item) && (
                <button
                  className="ai-match-button"
                  type="button"
                  onClick={() => compareWithAi(item)}
                  disabled={matchingItemId === item.id}
                >
                  {matchingItemId === item.id ? "Comparing..." : "Compare with AI"}
                </button>
              )}
              {matchResults[item.id]?.loading && <p className="ai-match-status">Comparing with {item.itemType === "found" ? "lost" : "found"} items...</p>}
              {matchResults[item.id]?.error && <p className="ai-match-error" role="alert">{matchResults[item.id].error}</p>}
              {matchResults[item.id] && !matchResults[item.id].loading && !matchResults[item.id].error && (
                matchResults[item.id].matches.length > 0 ? (
                  <div className="ai-match-results">
                    <strong>AI matches</strong>
                    {matchResults[item.id].matches.slice(0, 3).map((match) => (
                      <p key={match.item.id}>
                        {match.similarityPercentage}% match: {match.result || "MATCH"}
                        {match.reason ? ` - ${match.reason}` : ""}
                      </p>
                    ))}
                  </div>
                ) : <p className="ai-match-status">No likely AI match found.</p>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default Search;
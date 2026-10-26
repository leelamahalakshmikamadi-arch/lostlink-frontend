import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { ArrowLeft, Calendar, MapPin, User, Award, ShieldCheck, CheckCircle2, X } from "lucide-react";
import { API_BASE_URL, getItemById, claimsApi, getApiErrorMessage } from "../api";
import { useAuth } from "../context/useAuth";
import { SHOW_ACCOUNT_FEATURES } from "../config";

function DetailRow({ label, value, icon }) {
  if (!value) return null;
  return (
    <div className="detail-row">
      <span className="detail-label">{icon}{label}</span>
      <span>{value}</span>
    </div>
  );
}

const fetchItemDetails = async (id) => {
  if (!id) {
    throw new Error("This item has no valid ID.");
  }
  const response = await getItemById(id);
  return response.data.item || response.data;
};

function ItemDetails() {
  const { id } = useParams();
  const { isAuthenticated } = useAuth();
  const [item, setItem] = useState(null);
  const [error, setError] = useState("");

  // Claim modal state
  const [claimModalOpen, setClaimModalOpen] = useState(false);
  const [claimName, setClaimName] = useState("");
  const [claimContact, setClaimContact] = useState("");
  const [proofDetails, setProofDetails] = useState("");
  const [claimSubmitting, setClaimSubmitting] = useState(false);
  const [claimError, setClaimError] = useState("");

  // Claim submission and owner review state
  const [activeClaim, setActiveClaim] = useState(null);
  const [ownerClaims, setOwnerClaims] = useState([]);
  const [ownerClaimsItemId, setOwnerClaimsItemId] = useState("");
  const [ownerClaimMessage, setOwnerClaimMessage] = useState("");
  const [ownerClaimError, setOwnerClaimError] = useState("");

  useEffect(() => {
    let cancelled = false;
    fetchItemDetails(id)
      .then((itemDetails) => {
        if (!cancelled) setItem(itemDetails);
      })
      .catch((requestError) => {
        if (!cancelled) {
          setError(
            requestError.response?.status === 404
              ? "This item could not be found."
              : requestError.message === "This item has no valid ID."
                ? requestError.message
                : "Unable to load this item."
          );
        }
      });
    return () => {
      cancelled = true;
    };
  }, [id]);

  useEffect(() => {
    let cancelled = false;
    if (!isAuthenticated || !id) {
      return undefined;
    }
    claimsApi.getClaims(id)
      .then((response) => {
        if (!cancelled) {
          setOwnerClaims(response.data);
          setOwnerClaimsItemId(id);
        }
      })
      .catch((requestError) => {
        if (!cancelled && requestError.response?.status !== 403 && requestError.response?.status !== 404) {
          setOwnerClaimError(getApiErrorMessage(requestError, "Unable to load claim reviews."));
        }
      });
    return () => {
      cancelled = true;
    };
  }, [id, isAuthenticated]);

  const handleClaimSubmit = async (e) => {
    e.preventDefault();
    setClaimError("");
    setClaimSubmitting(true);

    try {
      const res = await claimsApi.submitClaim(id, {
        claimantName: claimName,
        claimantContact: claimContact,
        proofDetails: proofDetails,
      });
      setActiveClaim(res.data);
    } catch (err) {
      setClaimError(getApiErrorMessage(err, "Failed to submit claim."));
    } finally {
      setClaimSubmitting(false);
    }
  };

  const verifyOwnerClaim = async (claim) => {
    setOwnerClaimError("");
    setOwnerClaimMessage("");
    try {
      const response = await claimsApi.verifyClaim(id, { claimId: claim.id });
      setOwnerClaimMessage(response.data.message || "Claim verified.");
      setOwnerClaims((current) => current.map((entry) =>
        entry.id === claim.id ? { ...entry, status: "VERIFIED" } : entry
      ));
      setItem(await fetchItemDetails(id));
    } catch (requestError) {
      setOwnerClaimError(getApiErrorMessage(requestError, "Unable to verify this claim."));
    }
  };

  if (error) {
    return (
      <div className="page details-page">
        <Link className="back-link" to="/search"><ArrowLeft size={15} /> Back to Search</Link>
        <p role="alert">{error}</p>
      </div>
    );
  }

  if (!item) {
    return <div className="page details-page"><p>Loading item details...</p></div>;
  }

  const status = item.itemType || "lost";
  const date = item.dateLost || item.dateFound || item.date;
  const contact = item.contactNumber || item.contact;
  const reporter = item.reporterName || item.reporter;
  const isClaimed = item.status && item.status.toLowerCase().includes("claimed");

  return (
    <div className="page details-page">
      <Link className="back-link" to="/search"><ArrowLeft size={15} /> Back to Search</Link>

      <section className="details-card">
        <div className="details-image">
          {item.imageUrl ? (
            <img src={`${API_BASE_URL}${item.imageUrl}`} alt={item.itemName || "Reported item"} />
          ) : (
            <span>No image uploaded</span>
          )}
        </div>

        <div className="details-content">
          <div className="details-top-badges">
            <span className={`status ${status}`}>{status}</span>
            {item.reward && (
              <span className="reward-badge">
                <Award size={14} /> Reward: {item.reward}
              </span>
            )}
            {isClaimed && (
              <span className="claimed-badge">
                <CheckCircle2 size={14} /> {item.status}
              </span>
            )}
          </div>

          <h1>{item.itemName || item.name || "Unnamed item"}</h1>
          <p className="details-description">{item.description || "No description provided."}</p>

          <div className="details-list">
            <DetailRow label="Category" value={item.category} />
            <DetailRow label="Location" value={item.location} icon={<MapPin size={14} />} />
            <DetailRow label="Date" value={date} icon={<Calendar size={14} />} />
            {item.reward && <DetailRow label="Reward Offered" value={item.reward} icon={<Award size={14} />} />}
            <DetailRow label="Reporter" value={reporter} icon={<User size={14} />} />
            <DetailRow label="Contact" value={contact} />
            {item.claimedBy && <DetailRow label="Claimed By" value={item.claimedBy} icon={<ShieldCheck size={14} />} />}
          </div>

          {/* Claim Action Button */}
          {!isClaimed && SHOW_ACCOUNT_FEATURES && (
            <div className="claim-action-box">
              <button className="claim-btn" onClick={() => setClaimModalOpen(true)}>
                <ShieldCheck size={18} /> Claim This Item
              </button>
            </div>
          )}
          {!contact && (
            <div className="info-box">
              To claim this item, please visit the Campus Help Desk, Main Block, and bring proof of ownership.
            </div>
          )}
        </div>
      </section>

      {ownerClaimsItemId === id && ownerClaims.length > 0 && (
        <section className="items-section" aria-labelledby="owner-claims-heading">
          <div className="section-title">
            <h2 id="owner-claims-heading">Claims for this item</h2>
            <span>Only the item owner or a configured administrator can verify a handover.</span>
          </div>
          {ownerClaimMessage && <p role="status">{ownerClaimMessage}</p>}
          {ownerClaimError && <p role="alert">{ownerClaimError}</p>}
          <div className="items-grid">
            {ownerClaims.map((claim) => (
              <article className="item-card" key={claim.id}>
                <div className="item-info">
                  <h3>{claim.claimantName}</h3>
                  <p>{claim.claimantContact}</p>
                  <p>{claim.proofDetails}</p>
                  <p>Status: {claim.status}</p>
                  {claim.status !== "VERIFIED" && (
                    <button type="button" onClick={() => verifyOwnerClaim(claim)}>
                      Confirm handover
                    </button>
                  )}
                </div>
              </article>
            ))}
          </div>
        </section>
      )}

      {/* Claim submission modal */}
      {claimModalOpen && (
        <div className="modal-overlay">
          <div className="claim-modal">
            <button className="modal-close" onClick={() => setClaimModalOpen(false)}>
              <X size={20} />
            </button>

            {!activeClaim ? (
              // Step 1: Submit Claim
              <form onSubmit={handleClaimSubmit}>
                <h2>Claim Verification for "{item.itemName || "Item"}"</h2>
                <p className="modal-sub">
                  Provide your details and ownership proof. The item owner or an administrator must verify the handover.
                </p>

                {claimError && <div className="auth-message error">{claimError}</div>}

                <label>Your Name *</label>
                <input
                  type="text"
                  placeholder="Full name"
                  value={claimName}
                  onChange={(e) => setClaimName(e.target.value)}
                  required
                />

                <label>Contact Email or Phone *</label>
                <input
                  type="text"
                  placeholder="Email or phone"
                  value={claimContact}
                  onChange={(e) => setClaimContact(e.target.value)}
                  required
                />

                <label>Proof of Ownership *</label>
                <textarea
                  placeholder="Describe unique marks, serial numbers, wallpapers, or contents that prove this is yours..."
                  value={proofDetails}
                  onChange={(e) => setProofDetails(e.target.value)}
                  required
                />

                <button type="submit" className="login-button" disabled={claimSubmitting}>
                  {claimSubmitting ? "Submitting..." : "Submit Claim"}
                </button>
              </form>
            ) : (
              // Step 2: Claim receipt
              <div className="claim-result-view">
                <h2>Claim submitted</h2>
                <p className="modal-sub">
                  Your claim was recorded. The item owner or an administrator must review your proof and confirm the handover.
                </p>
                <p><strong>Claim reference:</strong> {activeClaim.claimId}</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default ItemDetails;

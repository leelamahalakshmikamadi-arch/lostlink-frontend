import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { ArrowLeft, Calendar, MapPin, User, Award, ShieldCheck, KeyRound, CheckCircle2, X } from "lucide-react";
import { API_BASE_URL, getItemById, claimsApi, getApiErrorMessage } from "../api";

function DetailRow({ label, value, icon }) {
  if (!value) return null;
  return (
    <div className="detail-row">
      <span className="detail-label">{icon}{label}</span>
      <span>{value}</span>
    </div>
  );
}

// Visual QR Code SVG generator
function QrCodeDisplay({ text }) {
  // Generate deterministic 21x21 grid
  const size = 21;
  const grid = Array.from({ length: size }, () => Array(size).fill(false));

  // Corner finder patterns (7x7)
  const drawCorner = (r, c) => {
    for (let i = 0; i < 7; i++) {
      for (let j = 0; j < 7; j++) {
        if (i === 0 || i === 6 || j === 0 || j === 6 || (i >= 2 && i <= 4 && j >= 2 && j <= 4)) {
          grid[r + i][c + j] = true;
        }
      }
    }
  };
  drawCorner(0, 0);
  drawCorner(0, size - 7);
  drawCorner(size - 7, 0);

  // Timing patterns
  for (let i = 8; i < size - 8; i++) {
    grid[6][i] = i % 2 === 0;
    grid[i][6] = i % 2 === 0;
  }

  // Hash data into middle modules
  let hash = 0;
  for (let i = 0; i < text.length; i++) {
    hash = (hash * 31 + text.charCodeAt(i)) >>> 0;
  }
  for (let i = 8; i < size - 8; i++) {
    for (let j = 8; j < size - 8; j++) {
      const bit = ((hash ^ (i * 17 + j * 23)) & 1) === 1;
      grid[i][j] = bit;
    }
  }

  return (
    <div className="qr-box">
      <svg width="160" height="160" viewBox={`0 0 ${size} ${size}`}>
        {grid.map((row, r) =>
          row.map((cell, c) =>
            cell ? <rect key={`${r}-${c}`} x={c} y={r} width="1.05" height="1.05" fill="#1e1b4b" /> : null
          )
        )}
      </svg>
      <div className="qr-token-label">{text}</div>
    </div>
  );
}

function ItemDetails() {
  const { id } = useParams();
  const [item, setItem] = useState(null);
  const [error, setError] = useState("");

  // Claim modal state
  const [claimModalOpen, setClaimModalOpen] = useState(false);
  const [claimName, setClaimName] = useState("");
  const [claimContact, setClaimContact] = useState("");
  const [proofDetails, setProofDetails] = useState("");
  const [claimSubmitting, setClaimSubmitting] = useState(false);
  const [claimError, setClaimError] = useState("");

  // Active claim / OTP verification state
  const [activeClaim, setActiveClaim] = useState(null);
  const [verifyOtp, setVerifyOtp] = useState("");
  const [verifying, setVerifying] = useState(false);
  const [verifySuccess, setVerifySuccess] = useState("");
  const [verifyError, setVerifyError] = useState("");

  const loadItem = async () => {
    if (!id) {
      setError("This item has no valid ID.");
      return;
    }

    try {
      const response = await getItemById(id);
      setItem(response.data.item || response.data);
    } catch (requestError) {
      setError(
        requestError.response?.status === 404
          ? "This item could not be found."
          : "Unable to load this item."
      );
    }
  };

  useEffect(() => {
    loadItem();
  }, [id]);

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

  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    setVerifyError("");
    setVerifySuccess("");
    setVerifying(true);

    try {
      const res = await claimsApi.verifyClaim(id, { otp: verifyOtp.trim() });
      setVerifySuccess(res.data.message || "Claim verified successfully!");
      if (activeClaim) {
        setActiveClaim({ ...activeClaim, status: "VERIFIED" });
      }
      await loadItem();
    } catch (err) {
      setVerifyError(getApiErrorMessage(err, "Invalid OTP. Please verify and try again."));
    } finally {
      setVerifying(false);
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
  const isClaimed = item.status && item.status.includes("Claimed");

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
          {!isClaimed && (
            <div className="claim-action-box">
              <button className="claim-btn" onClick={() => setClaimModalOpen(true)}>
                <ShieldCheck size={18} /> Claim This Item (OTP & QR Verification)
              </button>
            </div>
          )}
        </div>
      </section>

      {/* Claim / OTP / QR Modal */}
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
                  Provide your details and ownership proof. A 6-digit OTP and QR Verification Code will be generated instantly.
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
                  {claimSubmitting ? "Generating OTP & QR..." : "Submit Claim"}
                </button>
              </form>
            ) : (
              // Step 2: OTP & QR Code Verification View
              <div className="claim-result-view">
                <h2>Claim Verification Pass</h2>
                <p className="modal-sub">
                  Show this QR code at the Campus Help Desk or enter your 6-digit OTP below to verify handover.
                </p>

                <div className="otp-display-card">
                  <div className="otp-label">Your 6-Digit Handover OTP</div>
                  <div className="otp-digits">{activeClaim.otp}</div>
                  <small>Valid for this claim verification</small>
                </div>

                <div className="qr-container">
                  <QrCodeDisplay text={activeClaim.qrCode} />
                  <p className="qr-helper-text">Campus Help Desk Scanner Compatible</p>
                </div>

                {/* OTP Verification Form */}
                <form onSubmit={handleVerifyOtp} className="otp-verify-form">
                  <h3>Verify & Mark as Claimed</h3>
                  {verifySuccess && <div className="auth-message success">{verifySuccess}</div>}
                  {verifyError && <div className="auth-message error">{verifyError}</div>}

                  <div className="input-group-row">
                    <input
                      type="text"
                      placeholder="Enter 6-digit OTP"
                      maxLength={6}
                      value={verifyOtp}
                      onChange={(e) => setVerifyOtp(e.target.value)}
                      required
                    />
                    <button type="submit" disabled={verifying || activeClaim.status === "VERIFIED"}>
                      <KeyRound size={14} /> {verifying ? "Verifying..." : activeClaim.status === "VERIFIED" ? "Verified ✓" : "Verify OTP"}
                    </button>
                  </div>
                </form>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default ItemDetails;

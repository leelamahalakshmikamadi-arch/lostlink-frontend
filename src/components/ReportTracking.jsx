import { useState } from "react";
import { getApiErrorMessage, itemsApi } from "../api";

function ReportTracking({ receipt, guest }) {
  const [referenceId, setReferenceId] = useState("");
  const [accessToken, setAccessToken] = useState("");
  const [status, setStatus] = useState(null);
  const [error, setError] = useState("");
  const [checking, setChecking] = useState(false);

  const handleCheck = async (event) => {
    event.preventDefault();
    setError("");
    setStatus(null);
    setChecking(true);
    try {
      const response = await itemsApi.post("/guest-status", {
        reportId: referenceId.trim(),
        accessToken: accessToken.trim(),
      });
      setStatus(response.data);
    } catch (requestError) {
      setError(getApiErrorMessage(requestError, "Report could not be verified."));
    } finally {
      setChecking(false);
    }
  };

  return (
    <section className="form-card" aria-live="polite">
      {receipt && (
        <div className="auth-message success">
          <p>{receipt.message}</p>
          <p><strong>Report reference:</strong> {receipt.referenceId}</p>
          {guest && receipt.trackingToken && (
            <p>
              <strong>Private tracking key (shown once):</strong> {receipt.trackingToken}
              <br />
              Save this key. Anyone with both the reference and key can view the report status.
            </p>
          )}
          {receipt.matchingMessage && <p>{receipt.matchingMessage}</p>}
        </div>
      )}

      <h2>Check a guest report</h2>
      <p>Enter the reference and private tracking key you received when you submitted the report.</p>
      <form onSubmit={handleCheck}>
        <label htmlFor="guest-report-reference">Report reference</label>
        <input
          id="guest-report-reference"
          value={referenceId}
          onChange={(event) => setReferenceId(event.target.value)}
          autoComplete="off"
          required
        />
        <label htmlFor="guest-report-key">Private tracking key</label>
        <input
          id="guest-report-key"
          type="password"
          value={accessToken}
          onChange={(event) => setAccessToken(event.target.value)}
          autoComplete="off"
          required
        />
        {error && <p role="alert">{error}</p>}
        {status && (
          <div className="auth-message success">
            <p><strong>Report:</strong> {status.itemName}</p>
            <p><strong>Type:</strong> {status.itemType}</p>
            <p><strong>Status:</strong> {status.status}</p>
          </div>
        )}
        <button type="submit" disabled={checking}>{checking ? "Checking..." : "Check status"}</button>
      </form>
    </section>
  );
}

export default ReportTracking;

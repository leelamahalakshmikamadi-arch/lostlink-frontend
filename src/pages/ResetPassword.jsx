import { useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { LockKeyhole } from "lucide-react";
import { authApi, getApiErrorMessage } from "../api";

function ResetPassword() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token") || "";
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");
    setSuccess("");
    if (!token) {
      setError("This password reset link is invalid or expired.");
      return;
    }
    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }
    setIsSubmitting(true);
    try {
      const response = await authApi.resetPassword({ token, password });
      setSuccess(response.data.message || "Password reset successfully.");
    } catch (requestError) {
      setError(getApiErrorMessage(requestError, "Unable to reset the password."));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="page login-page">
      <section className="page-hero">
        <p>Home / Reset Password</p>
        <h1>Choose a new password</h1>
        <span>Reset links expire after 30 minutes and can be used once.</span>
      </section>
      <form className="login-card" onSubmit={handleSubmit}>
        <h2>New Password</h2>
        {error && <div className="auth-message error" role="alert">{error}</div>}
        {success && <div className="auth-message success" role="status">{success}</div>}
        <label htmlFor="new-password">New password</label>
        <div className="input-icon">
          <LockKeyhole size={16} />
          <input
            id="new-password"
            type="password"
            autoComplete="new-password"
            minLength={8}
            maxLength={128}
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            required
          />
        </div>
        <label htmlFor="confirm-new-password">Confirm new password</label>
        <div className="input-icon">
          <LockKeyhole size={16} />
          <input
            id="confirm-new-password"
            type="password"
            autoComplete="new-password"
            minLength={8}
            maxLength={128}
            value={confirmPassword}
            onChange={(event) => setConfirmPassword(event.target.value)}
            required
          />
        </div>
        <button className="login-button" type="submit" disabled={isSubmitting || Boolean(success)}>
          {isSubmitting ? "Updating..." : "Reset password"}
        </button>
        {success && <div className="register-text"><Link to="/login">Go to Login</Link></div>}
      </form>
    </div>
  );
}

export default ResetPassword;

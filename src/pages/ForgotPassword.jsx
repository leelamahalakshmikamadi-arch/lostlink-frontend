import { useState } from "react";
import { Link } from "react-router-dom";
import { Mail } from "lucide-react";
import { authApi, getApiErrorMessage } from "../api";

function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");
    setMessage("");
    setIsSubmitting(true);
    try {
      const response = await authApi.requestPasswordReset(email.trim());
      setMessage(response.data.message);
    } catch (requestError) {
      setError(getApiErrorMessage(requestError, "Unable to request a password reset."));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="page login-page">
      <section className="page-hero">
        <p>Home / Login / Forgot Password</p>
        <h1>Reset your password</h1>
        <span>We’ll email a one-time reset link if an account matches.</span>
      </section>
      <form className="login-card" onSubmit={handleSubmit}>
        <h2>Forgot Password?</h2>
        {error && <div className="auth-message error" role="alert">{error}</div>}
        {message && <div className="auth-message success" role="status">{message}</div>}
        <label htmlFor="reset-request-email">Email Address</label>
        <div className="input-icon">
          <Mail size={16} />
          <input
            id="reset-request-email"
            type="email"
            autoComplete="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            required
          />
        </div>
        <button className="login-button" type="submit" disabled={isSubmitting}>
          {isSubmitting ? "Sending..." : "Send reset link"}
        </button>
        <div className="register-text"><Link to="/login">Back to Login</Link></div>
      </form>
    </div>
  );
}

export default ForgotPassword;

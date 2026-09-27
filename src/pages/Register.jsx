import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { LockKeyhole, Mail, UserRound, UserPlus } from "lucide-react";
import { authApi, getApiErrorMessage } from "../api";
import { useAuth } from "../context/AuthContext";

function Register() {
  const navigate = useNavigate();
  const { login: authContextLogin } = useAuth();
  const [formData, setFormData] = useState({ name: "", email: "", password: "" });
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setFormData((previous) => ({ ...previous, [name]: value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (isSubmitting) return;

    setError("");
    setSuccess("");

    const name = formData.name.trim();
    const email = formData.email.trim();
    const password = formData.password.trim();

    if (!name || !email || !password) {
      setError("Please complete all fields to create your account.");
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await authApi.register({ name, email, password });
      setSuccess(response.data?.message || "Registration successful.");

      // Update global auth context and persist to localStorage
      authContextLogin(response.data?.user, response.data?.token);
      localStorage.setItem("lostlink_user", JSON.stringify(response.data?.user || { name, email }));
      localStorage.setItem("lostlink_token", response.data?.token || "");

      console.log("Registration successful, user persisted");
      setTimeout(() => navigate("/login"), 900);
    } catch (registerError) {
      const errorMsg = getApiErrorMessage(
        registerError,
        "Unable to register your account. Please try again."
      );
      setError(errorMsg);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="page login-page">
      <section className="page-hero">
        <p>Home / Register</p>
        <h1>Create an Account</h1>
        <span>Join LostLink to manage your lost and found reports.</span>
      </section>

      <form className="login-card" onSubmit={handleSubmit}>
        <div className="login-icon">
          <UserPlus size={25} />
        </div>

        <h2>Register for LostLink</h2>
        <p className="login-subtitle">Enter your details below</p>

        {error && (
          <div className="auth-message error">
            <div>{error}</div>
            {error.toLowerCase().includes("already exists") && (
              <div style={{ marginTop: "6px" }}>
                <Link to="/login" style={{ fontWeight: 600, textDecoration: "underline", color: "inherit" }}>
                  Go to Login &rarr;
                </Link>
              </div>
            )}
          </div>
        )}
        {success && <div className="auth-message success">{success}</div>}

        <label htmlFor="register-name">Name</label>
        <div className="input-icon">
          <UserRound size={16} />
          <input id="register-name" name="name" type="text" value={formData.name} onChange={handleChange} placeholder="Your name" required />
        </div>

        <label htmlFor="register-email">Email Address</label>
        <div className="input-icon">
          <Mail size={16} />
          <input id="register-email" name="email" type="email" value={formData.email} onChange={handleChange} placeholder="you@example.com" required />
        </div>

        <label htmlFor="register-password">Password</label>
        <div className="input-icon">
          <LockKeyhole size={16} />
          <input id="register-password" name="password" type="password" value={formData.password} onChange={handleChange} placeholder="Create a password" required />
        </div>

        <button className="login-button" type="submit" disabled={isSubmitting}>
          <UserPlus size={16} />
          {isSubmitting ? "Creating Account..." : "Create Account"}
        </button>

        <div className="register-text">
          Already have an account?
          <Link to="/login"> Log in</Link>
        </div>
      </form>
    </div>
  );
}

export default Register;
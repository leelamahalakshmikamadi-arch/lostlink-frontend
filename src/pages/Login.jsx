import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { LockKeyhole, Mail, LogIn } from "lucide-react";
import { authApi, getApiErrorMessage } from "../api";
import { useAuth } from "../context/AuthContext";

function Login() {
  const navigate = useNavigate();
  const { login: authContextLogin } = useAuth();
  const [formData, setFormData] = useState({ email: "", password: "", remember: true });
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleChange = (event) => {
    const { name, value, type, checked } = event.target;
    setFormData((previous) => ({
      ...previous,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");
    setSuccess("");

    const email = formData.email.trim();
    const password = formData.password.trim();

    console.log("Login attempt:", { email });

    if (!email || !password) {
      const msg = "Please enter both email and password.";
      console.log("Validation error:", msg);
      setError(msg);
      return;
    }

    setIsSubmitting(true);

    try {
      console.log("Sending login request...");
      const response = await authApi.login({ email, password });
      console.log("Login success:", response.data);
      setSuccess(response.data.message || "Login successful.");

        // Update global auth context
        authContextLogin(response.data.user, response.data.token);

        // Persist to localStorage only if Remember Me is checked
        // Password is NEVER stored, only user data and token
      if (formData.remember) {
        localStorage.setItem("lostlink_user", JSON.stringify(response.data.user));
        localStorage.setItem("lostlink_token", response.data.token || "");
        sessionStorage.removeItem("lostlink_user");
        sessionStorage.removeItem("lostlink_token");
          console.log("Session persisted to localStorage");
      } else {
        localStorage.removeItem("lostlink_user");
        localStorage.removeItem("lostlink_token");
        sessionStorage.setItem("lostlink_user", JSON.stringify(response.data.user));
        sessionStorage.setItem("lostlink_token", response.data.token || "");
          console.log("Session not persisted (Remember Me unchecked)");
      }

      setTimeout(() => navigate("/"), 700);
    } catch (loginError) {
      const errMsg = getApiErrorMessage(loginError, "Invalid email or password.");
      console.log("Login error:", loginError, errMsg);
      setError(errMsg);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="page login-page">
      <section className="page-hero">
        <p>Home / Login</p>
        <h1>Welcome Back</h1>
        <span>
          Login to your LostLink account to manage your lost and found reports.
        </span>
      </section>

      <form className="login-card" onSubmit={handleSubmit}>
        <div className="login-icon">
          <LockKeyhole size={25} />
        </div>

        <h2>Login to LostLink</h2>
        <p className="login-subtitle">Enter your account details below</p>

        {error && <div className="auth-message error">{error}</div>}
        {success && <div className="auth-message success">{success}</div>}

        <label htmlFor="login-email">Email Address</label>
        <div className="input-icon">
          <Mail size={16} />
          <input
            id="login-email"
            name="email"
            type="email"
            value={formData.email}
            onChange={handleChange}
            placeholder="you@example.com"
            autoComplete="email"
            required
          />
        </div>

        <label htmlFor="login-password">Password</label>
        <div className="input-icon">
          <LockKeyhole size={16} />
          <input
            id="login-password"
            name="password"
            type="password"
            value={formData.password}
            onChange={handleChange}
            placeholder="Enter your password"
            autoComplete="current-password"
            required
          />
        </div>

        <div className="login-options">
          <label className="remember">
            <input
              type="checkbox"
              name="remember"
              checked={formData.remember}
              onChange={handleChange}
            />
            Remember Me
          </label>

          <a href="#">Forgot Password?</a>
        </div>

        <button className="login-button" type="submit" disabled={isSubmitting}>
          <LogIn size={16} />
          {isSubmitting ? "Logging in..." : "Login"}
        </button>

        <div className="register-text">
          Don't have an account?
          <Link to="/register"> Create Account</Link>
        </div>
      </form>
    </div>
  );
}

export default Login;
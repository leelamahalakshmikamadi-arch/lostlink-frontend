import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { LockKeyhole, Mail, LogIn, Eye, EyeOff } from "lucide-react";
import { authApi, getApiErrorMessage } from "../api";
import { useAuth } from "../context/useAuth";

function Login() {
  const navigate = useNavigate();
  const { login: authContextLogin } = useAuth();
  const [formData, setFormData] = useState({ email: "", password: "", remember: true });
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

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

    if (!email || !password) {
      const msg = "Please enter both email and password.";
      setError(msg);
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await authApi.login({ email, password });
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
      } else {
        localStorage.removeItem("lostlink_user");
        localStorage.removeItem("lostlink_token");
        sessionStorage.setItem("lostlink_user", JSON.stringify(response.data.user));
        sessionStorage.setItem("lostlink_token", response.data.token || "");
      }

      setTimeout(() => navigate("/"), 700);
    } catch (loginError) {
      const errMsg = getApiErrorMessage(loginError, "Invalid email or password.");
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
            type={showPassword ? "text" : "password"}
            value={formData.password}
            onChange={handleChange}
            placeholder="Enter your password"
            autoComplete="current-password"
            required
          />
          <button
            type="button"
            className="password-visibility-toggle"
            aria-label={showPassword ? "Hide password" : "Show password"}
            aria-pressed={showPassword}
            onClick={() => setShowPassword((visible) => !visible)}
          >
            {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
          </button>
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

          <Link to="/forgot-password">Forgot Password?</Link>
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
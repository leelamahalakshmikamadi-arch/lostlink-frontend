import { useEffect, useState } from "react";
import AuthContext from "./auth-context";

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  // Initialize auth state from localStorage on mount
  useEffect(() => {
    const initializeAuth = () => {
      try {
        const storedUser = localStorage.getItem("lostlink_user") || sessionStorage.getItem("lostlink_user");
        const storedToken = localStorage.getItem("lostlink_token") || sessionStorage.getItem("lostlink_token");

        if (storedUser && storedToken) {
          setUser(JSON.parse(storedUser));
          setToken(storedToken);
        }
      } catch {
        // Clear corrupted data
        localStorage.removeItem("lostlink_user");
        localStorage.removeItem("lostlink_token");
        sessionStorage.removeItem("lostlink_user");
        sessionStorage.removeItem("lostlink_token");
      } finally {
        setIsLoading(false);
      }
    };

    initializeAuth();
  }, []);

  const login = (userData, authToken) => {
    setUser(userData);
    setToken(authToken);
    // Note: localStorage persistence is handled in Login.jsx based on Remember Me checkbox
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem("lostlink_user");
    localStorage.removeItem("lostlink_token");
    sessionStorage.removeItem("lostlink_user");
    sessionStorage.removeItem("lostlink_token");
  };

  const isAuthenticated = !!user && !!token;

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isLoading,
        isAuthenticated,
        login,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

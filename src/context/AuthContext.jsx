import { createContext, useContext, useEffect, useState } from "react";

const AuthContext = createContext();

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
          console.log("Auth restored from localStorage:", JSON.parse(storedUser));
        } else {
          console.log("No stored auth found, user is logged out");
        }
      } catch (error) {
        console.error("Error initializing auth from localStorage:", error);
        // Clear corrupted data
        localStorage.removeItem("lostlink_user");
        localStorage.removeItem("lostlink_token");
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
    console.log("User logged out");
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

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}

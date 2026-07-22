import { createContext, useContext, useEffect, useState } from "react";

const AuthContext = createContext(undefined);

const API_URL = "http://localhost:5000/api/auth";

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [isAuthReady, setIsAuthReady] = useState(false);

  useEffect(() => {
    const storedUser = sessionStorage.getItem("user");

    if (storedUser) {
      try {
        setUser(JSON.parse(storedUser));
      } catch (error) {
        sessionStorage.removeItem("user");
        sessionStorage.removeItem("token");
      }
    }

    setIsAuthReady(true);
  }, []);

  const mapBackendUserToFrontendUser = (backendUser) => {
    const authProvider = backendUser.authProvider || "local";
    const hasPassword = backendUser.hasPassword === true;

    return {
      id: backendUser.id || backendUser._id,
      email: backendUser.email,
      name:
        backendUser.userName ||
        backendUser.fullName ||
        backendUser.name ||
        backendUser.email,
      userName:
        backendUser.userName ||
        backendUser.fullName ||
        backendUser.name ||
        backendUser.email,
      avatar: backendUser.avatar || "",
      role: backendUser.role === "manager" ? "manager" : "user",
      rating: backendUser.rating || 5,
      totalReviews: backendUser.totalReviews || 0,
      joinedDate:
        backendUser.joinedDate ||
        backendUser.createdAt ||
        new Date().toISOString().split("T")[0],
      isEmailVerified: backendUser.isEmailVerified ?? true,
      status: backendUser.status || "active",
      locations: backendUser.locations || [],
      authProvider,
      hasPassword,
    };
  };

  const saveAuthData = (token, backendUser) => {
    const loggedInUser = mapBackendUserToFrontendUser(backendUser);

    sessionStorage.setItem("token", token);
    sessionStorage.setItem("user", JSON.stringify(loggedInUser));

    setUser(loggedInUser);
  };

  const login = async (email, password) => {
    const response = await fetch(`${API_URL}/login`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ email, password }),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || "Login failed");
    }

    saveAuthData(data.token, data.user);
  };

  const loginWithGoogle = async (credential) => {
    const response = await fetch(`${API_URL}/google-login`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ credential }),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || "Google login failed");
    }

    saveAuthData(data.token, data.user);
  };

  const register = async (email, password, name) => {
    console.log("Register is handled by OTP flow:", {
      email,
      password,
      name,
    });
  };

  const logout = () => {
    sessionStorage.removeItem("token");
    sessionStorage.removeItem("user");
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    setUser(null);
  };

  const updateProfile = (updates) => {
    if (!user) return;

    const updatedUser = {
      ...user,
      ...updates,
    };

    sessionStorage.setItem("user", JSON.stringify(updatedUser));
    setUser(updatedUser);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user && !!sessionStorage.getItem("token"),
        isAuthReady,
        isCustomer: user?.role === "user",
        isManager: user?.role === "manager",
        login,
        loginWithGoogle,
        register,
        logout,
        updateProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error("useAuth must be used within AuthProvider");
  }

  return context;
}

import {
  createContext,
  useContext,
  useEffect,
  useState,
  ReactNode,
} from "react";

export type UserRole = "user" | "manager";

export interface Location {
  _id?: string;
  phoneNumber: string;
  address: string;
}

export interface User {
  id: string;
  email: string;
  name: string;
  userName?: string;
  avatar?: string;
  role: UserRole;
  rating: number;
  totalReviews: number;
  joinedDate: string;
  isEmailVerified: boolean;
  status: "active" | "suspended" | "banned";
  locations: Location[];
  authProvider: "local" | "google";
  hasPassword: boolean;
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isAuthReady: boolean;
  isCustomer: boolean;
  isManager: boolean;
  login: (email: string, password: string) => Promise<void>;
  loginWithGoogle: (credential: string) => Promise<void>;
  register: (email: string, password: string, name: string) => Promise<void>;
  logout: () => void;
  updateProfile: (updates: Partial<User>) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const API_URL = "http://localhost:5000/api/auth";

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
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

  const mapBackendUserToFrontendUser = (backendUser: any): User => {
    const authProvider = backendUser.authProvider || "local";
    const hasPassword = backendUser.hasPassword === true;

    return {
      id: backendUser.id || backendUser._id,
      email: backendUser.email,
      name: backendUser.userName || backendUser.fullName || backendUser.name || backendUser.email,
      userName: backendUser.userName || backendUser.fullName || backendUser.name || backendUser.email,
      avatar: backendUser.avatar || "",
      role: backendUser.role === "admin" ? "manager" : backendUser.role || "user",
      rating: backendUser.rating || 0,
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

  const saveAuthData = (token: string, backendUser: any) => {
    const loggedInUser = mapBackendUserToFrontendUser(backendUser);

    sessionStorage.setItem("token", token);
    sessionStorage.setItem("user", JSON.stringify(loggedInUser));

    setUser(loggedInUser);
  };

  const login = async (email: string, password: string) => {
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

  const loginWithGoogle = async (credential: string) => {
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

  const register = async (email: string, password: string, name: string) => {
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

  const updateProfile = (updates: Partial<User>) => {
    if (!user) return;

    const updatedUser: User = {
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

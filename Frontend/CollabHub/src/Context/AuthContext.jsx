// context/AuthContext.js
import { createContext, useContext, useState, useEffect } from "react";
import { authAPI, default as API } from "../services/api";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [loading, setLoading] = useState(true);

  // restore session
  useEffect(() => {
    const restoreSession = async () => {
      try {
        const res = await authAPI.me();
        setUser(res.data.user);
        setIsLoggedIn(true);
      } catch {
        setUser(null);
        setIsLoggedIn(false);
      } finally {
        setLoading(false);
      }
    };
    restoreSession();
  }, []);

  // logout on 401
  useEffect(() => {
    const interceptor = API.interceptors.response.use(
      (res) => res,
      (err) => {
        const isAuthCheck = err.config?.url?.includes("/auth/me");
        if (err.response?.status === 401 && !isAuthCheck) {
          setUser(null);
          setIsLoggedIn(false);
        }
        return Promise.reject(err);
      }
    );
    return () => API.interceptors.response.eject(interceptor);
  }, []);

  const login = async (credentials) => {
    await authAPI.login(credentials); // cookie is set automatically
    const me = await authAPI.me();
    setUser(me.data.user);
    setIsLoggedIn(true);
  };

  const register = async (data) => {
    await authAPI.register(data);
    const me = await authAPI.me();
    setUser(me.data.user);
    setIsLoggedIn(true);
  };

  const logout = async () => {
    await authAPI.logout();
    setUser(null);
    setIsLoggedIn(false);
  };

  const updateProfile = async (data) => {
    const res = await authAPI.updateProfile(data);
    setUser(res.data.user);
    return res.data;
  };

  const getUsers = async () => {
    const res = await authAPI.getUsers();
    return res.data;
  };

  const enhanceBio = async (bio) => {
    const { aiAPI } = await import("../services/api");
    const res = await aiAPI.enhanceProfile({ bio });
    return res.result;
  };

  const improveIdea = async (idea) => {
    const { aiAPI } = await import("../services/api");
    const res = await aiAPI.improveIdea({ idea });
    return res;
  };

  return (
    <AuthContext.Provider value={{ user, isLoggedIn, loading, login, register, logout, updateProfile, getUsers, enhanceBio, improveIdea }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
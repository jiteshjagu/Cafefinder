import { createContext, useCallback, useContext, useEffect, useState } from "react";
import { api } from "@/lib/api";

const AuthCtx = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [favIds, setFavIds] = useState([]);

  const loadFavs = useCallback(async () => {
    try { const { data } = await api.get("/favorites"); setFavIds(data.ids); } catch { setFavIds([]); }
  }, []);

  useEffect(() => {
    if (!localStorage.getItem("bs_token")) { setUser(false); return; }
    api.get("/auth/me").then(({ data }) => { setUser(data); loadFavs(); })
      .catch(() => { localStorage.removeItem("bs_token"); setUser(false); });
  }, [loadFavs]);

  const authenticate = async (path, body) => {
    const { data } = await api.post(path, body);
    localStorage.setItem("bs_token", data.token);
    setUser(data.user);
    loadFavs();
    return data.user;
  };

  const logout = async () => {
    try { await api.post("/auth/logout"); } catch { /* ignore */ }
    localStorage.removeItem("bs_token");
    setUser(false);
    setFavIds([]);
  };

  const toggleFav = async (id) => {
    const { data } = await api.post(`/favorites/${id}`);
    setFavIds((f) => (data.saved ? [...f, id] : f.filter((x) => x !== id)));
    return data.saved;
  };

  return (
    <AuthCtx.Provider value={{ user, favIds, toggleFav, logout, login: (b) => authenticate("/auth/login", b), register: (b) => authenticate("/auth/register", b) }}>
      {children}
    </AuthCtx.Provider>
  );
}

export const useAuth = () => useContext(AuthCtx);

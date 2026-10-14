import axios from "axios";

export const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

export const api = axios.create({ baseURL: API });

api.interceptors.request.use((cfg) => {
  const t = localStorage.getItem("bs_token");
  if (t) cfg.headers.Authorization = `Bearer ${t}`;
  return cfg;
});

export function formatError(e) {
  const detail = e?.response?.data?.detail;
  if (detail == null) return e?.message || "Something went wrong. Please try again.";
  if (typeof detail === "string") return detail;
  if (Array.isArray(detail)) return detail.map((d) => d?.msg || JSON.stringify(d)).join(" ");
  return detail.msg || String(detail);
}

export const PRICE_LABELS = {
  1: "₹100–₹200",
  2: "₹200–₹400",
  3: "₹500–₹1000",
  4: "₹1000+",
};

export const priceLabel = (n) => PRICE_LABELS[n] || "₹200–₹400";

export function isOpenNow(open, close) {
  if (!open || !close) return false;
  const d = new Date();
  const cur = d.getHours() * 60 + d.getMinutes();
  const toMin = (s) => { const [h, m] = s.split(":").map(Number); return h * 60 + m; };
  const o = toMin(open), c = toMin(close);
  return c > o ? cur >= o && cur < c : cur >= o || cur < c;
}


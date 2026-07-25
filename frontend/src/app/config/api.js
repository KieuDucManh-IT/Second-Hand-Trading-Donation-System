const RAW_API_BASE =
  import.meta.env.VITE_API_URL || "http://localhost:5000";

const NORMALIZED_API_BASE = RAW_API_BASE.replace(/\/+$/, "");

export const API_BASE = NORMALIZED_API_BASE.endsWith("/api")
  ? NORMALIZED_API_BASE
  : `${NORMALIZED_API_BASE}/api`;
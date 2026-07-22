export const getRawApiBase = () => {
  const envUrl = import.meta.env.VITE_API_URL;
  const isLocalhost =
    typeof window !== "undefined" &&
    (window.location.hostname === "localhost" ||
      window.location.hostname === "127.0.0.1");

  if (isLocalhost) {
    return envUrl || "http://localhost:5000";
  }

  // Running on deployed site (e.g., Vercel)
  if (!envUrl || envUrl.includes("localhost")) {
    return "https://second-hand-trading-donation-system.onrender.com";
  }

  return envUrl;
};

export const getApiBase = () => {
  const raw = getRawApiBase();
  return raw.endsWith("/api") ? raw : `${raw}/api`;
};

export const getApiOrigin = () => {
  const raw = getRawApiBase();
  return raw.replace(/\/api\/?$/, "");
};

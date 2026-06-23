import { useEffect, useState } from "react";
import { API_BASE } from "@/lib/api";

/**
 * Renders an image protected by JWT auth via ?auth= query param.
 * Usage: <AuthImage path="/api/files/<storage_path>" className="..." />
 */
export default function AuthImage({ path, className = "", alt = "" }) {
  const [src, setSrc] = useState(null);
  const token = typeof window !== "undefined" ? localStorage.getItem("icsc_access_token") : null;

  useEffect(() => {
    if (!path) return;
    // path may already start with /api/files/...
    let url = path.startsWith("http") ? path : (path.startsWith("/api/") ? `${API_BASE.replace(/\/api$/, "")}${path}` : `${API_BASE}${path}`);
    if (token) {
      url += (url.includes("?") ? "&" : "?") + `auth=${encodeURIComponent(token)}`;
    }
    setSrc(url);
  }, [path, token]);

  if (!path) return null;
  return src ? <img src={src} alt={alt} className={className} /> : null;
}

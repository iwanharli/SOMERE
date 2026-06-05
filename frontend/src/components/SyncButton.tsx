import { useState } from "react";
import { api } from "../lib/api";
import { FA } from "./Icon";
import { faRotate } from "@fortawesome/free-solid-svg-icons";
import { swToast } from "../lib/swal";

interface SyncButtonProps {
  endpoint: string;
  label?: string;
  onDone?: () => void;
}

export default function SyncButton({ endpoint, label = "Sync", onDone }: SyncButtonProps) {
  const [loading, setLoading] = useState(false);

  async function handleSync() {
    setLoading(true);
    try {
      const { data } = await api.post(endpoint);
      swToast("success", `${label} berhasil — ${data.synced ?? 0} data diperbarui`);
      onDone?.();
    } catch {
      swToast("error", `${label} gagal, coba lagi.`);
    } finally {
      setLoading(false);
    }
  }

  return (
    <button
      onClick={handleSync}
      disabled={loading}
      style={{
        display: "inline-flex", alignItems: "center", gap: 6,
        padding: "7px 14px", borderRadius: "var(--radius-sm)",
        border: "1px solid var(--border)",
        background: "var(--bg-elevated)", color: "var(--text-secondary)",
        fontSize: 12, fontWeight: 500,
        cursor: loading ? "not-allowed" : "pointer",
        transition: "all 0.15s", opacity: loading ? 0.6 : 1,
      }}
      onMouseEnter={e => { if (!loading) { e.currentTarget.style.color = "var(--accent)"; e.currentTarget.style.borderColor = "var(--accent)"; }}}
      onMouseLeave={e => { if (!loading) { e.currentTarget.style.color = "var(--text-secondary)"; e.currentTarget.style.borderColor = "var(--border)"; }}}
    >
      <FA icon={faRotate} style={{ fontSize: 11, animation: loading ? "spin 0.7s linear infinite" : "none" }} />
      {loading ? "Syncing..." : label}
    </button>
  );
}

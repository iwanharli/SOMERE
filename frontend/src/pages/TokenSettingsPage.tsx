import { useEffect, useState } from "react";
import { api } from "../lib/api";
import { FA } from "../components/Icon";
import {
  faCoins, faPenToSquare, faToggleOn, faToggleOff,
  faGear, faList, faCircleCheck, faCircleXmark, faHashtag,
} from "@fortawesome/free-solid-svg-icons";
import { swSuccess, swError, swToast } from "../lib/swal";

interface ServicePrice {
  id: string; serviceId: number; tokenPrice: number; isActive: boolean;
}

interface Service {
  id: number; name: string; rate: number;
}

const SERVICE_HEADERS: { label: string; icon: any }[] = [
  { label: "ID",          icon: faHashtag      },
  { label: "Layanan",     icon: faList         },
  { label: "Harga Pasar", icon: faCoins        },
  { label: "Otomatis",    icon: faGear         },
  { label: "Harga Token", icon: faCoins        },
  { label: "Aktif",       icon: faCircleCheck  },
  { label: "",            icon: faPenToSquare  },
];

export default function TokenSettingsPage() {
  const [tokenValue,  setTokenValue]  = useState<number>(10000);
  const [inputValue,  setInputValue]  = useState("");
  const [savingValue, setSavingValue] = useState(false);

  const [services,    setServices]    = useState<Service[]>([]);
  const [prices,      setPrices]      = useState<ServicePrice[]>([]);
  const [editId,      setEditId]      = useState<number | null>(null);
  const [editPrice,   setEditPrice]   = useState("");
  const [savingPrice, setSavingPrice] = useState(false);
  const [loading,     setLoading]     = useState(true);

  useEffect(() => { loadAll(); }, []);

  async function loadAll() {
    setLoading(true);
    const [cfgRes, pricesRes, svcRes] = await Promise.allSettled([
      api.get<{ data: { tokenIdrValue: number } }>("/token/config"),
      api.get<{ data: ServicePrice[] }>("/token/prices"),
      api.get<{ data: Service[] }>("/panelin/services"),
    ]);
    if (cfgRes.status === "fulfilled") { setTokenValue(cfgRes.value.data.data.tokenIdrValue); setInputValue(String(cfgRes.value.data.data.tokenIdrValue)); }
    if (pricesRes.status === "fulfilled") setPrices(pricesRes.value.data.data);
    if (svcRes.status === "fulfilled") {
      const d = svcRes.value.data?.data;
      setServices(Array.isArray(d) ? d : typeof d === "string" ? JSON.parse(d) : []);
    }
    setLoading(false);
  }

  async function saveTokenValue() {
    setSavingValue(true);
    try {
      await api.put("/token/config", { value: parseInt(inputValue) });
      setTokenValue(parseInt(inputValue));
      swSuccess("Nilai Token Diperbarui", `1 token = ${new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(parseInt(inputValue))}`);
    } catch (err: any) {
      swError("Gagal", err?.response?.data?.error ?? "Gagal memperbarui nilai token");
    } finally { setSavingValue(false); }
  }

  async function savePrice(serviceId: number, tokenPrice: number) {
    setSavingPrice(true);
    try {
      await api.post("/token/prices", { serviceId, tokenPrice });
      await loadAll();
      setEditId(null); setEditPrice("");
      swToast("success", `Harga service #${serviceId} disimpan — ${tokenPrice} token`);
    } catch (err: any) {
      swError("Gagal", err?.response?.data?.error ?? "Gagal menyimpan harga");
    } finally { setSavingPrice(false); }
  }

  async function toggleActive(serviceId: number, current: boolean) {
    try {
      await api.patch(`/token/prices/${serviceId}`, { isActive: !current });
      await loadAll();
      swToast(!current ? "success" : "warning", `Service #${serviceId} ${!current ? "diaktifkan" : "dinonaktifkan"}`);
    } catch {
      swError("Gagal", "Gagal mengubah status layanan");
    }
  }

  const priceMap = Object.fromEntries(prices.map(p => [p.serviceId, p]));
  const formatIDR = (v: number) => new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(v);
  const autoTokenPrice = (rate: number) => Math.ceil(rate / tokenValue);

  return (
    <>
      <div>
        <div style={{ marginBottom: 24 }}>
          <h1 style={{ fontSize: 18, fontWeight: 600, marginBottom: 3, display: "flex", alignItems: "center", gap: 8 }}>
            <FA icon={faGear} style={{ color: "gold" }} />
            Token Settings
          </h1>
          <p style={{ fontSize: 13, color: "var(--text-secondary)" }}>Konfigurasi nilai token dan harga layanan</p>
        </div>

        {/* Nilai token */}
        <div style={{ background: "var(--bg-surface)", border: "1px solid var(--border)", borderRadius: "var(--radius)", padding: "20px 24px", marginBottom: 20 }}>
          <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 24 }}>
            <div style={{ flex: 1 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
                <FA icon={faCoins} style={{ fontSize: 15, color: "var(--accent)" }} />
                <span style={{ fontSize: 15, fontWeight: 600 }}>Nilai 1 Token</span>
              </div>
              <p style={{ fontSize: 13, color: "var(--text-secondary)", lineHeight: 1.6, marginBottom: 14 }}>
                Nilai rupiah dari 1 token. Digunakan untuk menghitung auto-harga layanan.<br />
                Saat ini: <strong style={{ color: "var(--accent)" }}>{formatIDR(tokenValue)}</strong> per token.
              </p>
              <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
                <div style={{ position: "relative" }}>
                  <span style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", fontSize: 13, color: "var(--text-secondary)" }}>Rp</span>
                  <input type="number" value={inputValue} onChange={e => setInputValue(e.target.value)} min={1}
                    style={{ ...inputStyle, width: 160, paddingLeft: 32 }}
                    onFocus={e => e.target.style.borderColor = "var(--accent)"}
                    onBlur={e => e.target.style.borderColor = "var(--border)"} />
                </div>
                <button onClick={saveTokenValue} disabled={savingValue || !inputValue}
                  style={{ padding: "9px 18px", borderRadius: "var(--radius-sm)", border: "none", background: "var(--accent)", color: "#fff", fontSize: 13, fontWeight: 600, cursor: "pointer" }}>
                  {savingValue ? "Menyimpan..." : "Simpan"}
                </button>
              </div>
            </div>

            {/* Preview */}
            <div style={{ background: "var(--bg-elevated)", border: "1px solid var(--border)", borderRadius: "var(--radius-sm)", padding: "14px 18px", minWidth: 180, textAlign: "center" }}>
              <div style={{ fontSize: 11, fontWeight: 600, color: "var(--text-secondary)", textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: 8 }}>Contoh</div>
              {[1, 5, 10, 50].map(t => (
                <div key={t} style={{ display: "flex", justifyContent: "space-between", gap: 16, marginBottom: 4, fontSize: 13 }}>
                  <span style={{ color: "var(--text-secondary)" }}>{t} token</span>
                  <span style={{ color: "var(--text-primary)", fontWeight: 500 }}>{formatIDR(t * (parseInt(inputValue) || tokenValue))}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Harga per layanan */}
        <div style={{ background: "var(--bg-surface)", border: "1px solid var(--border)", borderRadius: "var(--radius)", overflow: "hidden" }}>
          <div style={{ padding: "14px 20px", borderBottom: "1px solid var(--border)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span style={{ fontSize: 13, fontWeight: 600, display: "flex", alignItems: "center", gap: 6 }}>
              <FA icon={faList} style={{ fontSize: 12, color: "var(--text-secondary)" }} />
              Harga Token per Layanan
            </span>
            <span style={{ fontSize: 12, color: "var(--text-secondary)" }}>{services.length} layanan</span>
          </div>

          {loading ? (
            <div style={{ padding: 32, textAlign: "center", color: "var(--text-secondary)", fontSize: 13 }}>Memuat...</div>
          ) : (
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr style={{ borderBottom: "1px solid var(--border)", background: "var(--bg-elevated)" }}>
                  {SERVICE_HEADERS.map((h, idx) => (
                    <th key={idx} style={{ padding: "9px 16px", textAlign: "left", fontSize: 11, fontWeight: 600, color: "var(--text-secondary)", textTransform: "uppercase", letterSpacing: "0.07em", whiteSpace: "nowrap" }}>
                      {h.label ? (
                        <span style={{ display: "inline-flex", alignItems: "center", gap: 5 }}>
                          <FA icon={h.icon} style={{ fontSize: 9 }} />
                          {h.label}
                        </span>
                      ) : null}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {services.map((s, i) => {
                  const p = priceMap[s.id];
                  const isEditing = editId === s.id;
                  const auto = autoTokenPrice(s.rate);
                  return (
                    <tr key={s.id}
                      style={{ borderBottom: i < services.length - 1 ? "1px solid var(--border)" : "none" }}
                      onMouseEnter={e => (e.currentTarget as HTMLTableRowElement).style.background = "var(--bg-hover)"}
                      onMouseLeave={e => (e.currentTarget as HTMLTableRowElement).style.background = "transparent"}
                    >
                      <td style={{ padding: "11px 16px", fontSize: 12, fontFamily: "monospace", color: "var(--text-secondary)" }}>#{s.id}</td>
                      <td style={{ padding: "11px 16px", fontSize: 13, fontWeight: 500, maxWidth: 260 }}>
                        <div style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{s.name}</div>
                      </td>
                      <td style={{ padding: "11px 16px", fontSize: 13, color: "var(--text-secondary)", whiteSpace: "nowrap" }}>{formatIDR(s.rate)}</td>
                      <td style={{ padding: "11px 16px" }}>
                        <span style={{ fontSize: 12, fontWeight: 500, padding: "2px 7px", borderRadius: 4, background: "var(--accent-dim)", color: "var(--accent)" }}>
                          {auto} token
                        </span>
                      </td>
                      <td style={{ padding: "11px 16px" }}>
                        {isEditing ? (
                          <input type="number" value={editPrice} min={1} autoFocus
                            onChange={e => setEditPrice(e.target.value)}
                            style={{ ...inputStyle, width: 90, padding: "4px 8px" }}
                            onKeyDown={e => { if (e.key === "Enter" && editPrice) savePrice(s.id, parseInt(editPrice)); if (e.key === "Escape") { setEditId(null); setEditPrice(""); } }} />
                        ) : (
                          <span style={{ fontSize: 13, fontWeight: 600, color: p ? "var(--text-primary)" : "var(--text-secondary)" }}>
                            {p ? `${p.tokenPrice} token` : "—"}
                          </span>
                        )}
                      </td>
                      <td style={{ padding: "11px 16px" }}>
                        {p ? (
                          <button onClick={() => toggleActive(s.id, p.isActive)} title={p.isActive ? "Nonaktifkan" : "Aktifkan"}
                            style={{ background: "none", border: "none", cursor: "pointer", color: p.isActive ? "var(--green)" : "var(--text-secondary)", fontSize: 18 }}>
                            <FA icon={p.isActive ? faToggleOn : faToggleOff} />
                          </button>
                        ) : (
                          <span style={{ fontSize: 15, color: "var(--text-secondary)" }}>
                            <FA icon={faCircleXmark} style={{ opacity: 0.4 }} />
                          </span>
                        )}
                      </td>
                      <td style={{ padding: "11px 16px" }}>
                        {isEditing ? (
                          <div style={{ display: "flex", gap: 4 }}>
                            <button onClick={() => { if (editPrice) savePrice(s.id, parseInt(editPrice)); }} disabled={savingPrice || !editPrice}
                              style={{ padding: "4px 10px", borderRadius: "var(--radius-sm)", border: "none", background: "var(--accent)", color: "#fff", fontSize: 12, cursor: "pointer" }}>
                              {savingPrice ? "..." : "OK"}
                            </button>
                            <button onClick={() => { setEditId(null); setEditPrice(""); }}
                              style={{ padding: "4px 8px", borderRadius: "var(--radius-sm)", border: "1px solid var(--border)", background: "none", color: "var(--text-secondary)", fontSize: 12, cursor: "pointer" }}>
                              Batal
                            </button>
                          </div>
                        ) : (
                          <button onClick={() => { setEditId(s.id); setEditPrice(p ? String(p.tokenPrice) : String(auto)); }}
                            style={{ padding: "5px 10px", borderRadius: "var(--radius-sm)", border: "1px solid var(--border)", background: "var(--bg-elevated)", color: "var(--text-secondary)", fontSize: 12, cursor: "pointer", display: "flex", alignItems: "center", gap: 5 }}>
                            <FA icon={faPenToSquare} style={{ fontSize: 10 }} /> {p ? "Edit" : "Set Harga"}
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </>
  );

}

const inputStyle: React.CSSProperties = {
  width: "100%", padding: "9px 12px",
  background: "var(--bg-elevated)", border: "1px solid var(--border)",
  borderRadius: "var(--radius-sm)", color: "var(--text-primary)",
  fontSize: 13, outline: "none", transition: "border-color 0.15s",
};

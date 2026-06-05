import { FA } from "./Icon";
import { IconProp } from "@fortawesome/fontawesome-svg-core";

interface StatCardProps {
  label: string;
  value: string | number;
  sub?: string;
  color?: "accent" | "green" | "yellow" | "red" | "blue";
  icon?: IconProp;
  loading?: boolean;
}

const colorMap = {
  accent: { icon: "var(--accent)",  bg: "var(--accent-dim)",  border: "rgba(200,150,10,0.2)" },
  green:  { icon: "var(--green)",   bg: "var(--green-dim)",   border: "rgba(34,197,94,0.2)"  },
  yellow: { icon: "var(--yellow)",  bg: "var(--yellow-dim)",  border: "rgba(234,179,8,0.2)"  },
  red:    { icon: "var(--red)",     bg: "var(--red-dim)",     border: "rgba(239,68,68,0.2)"  },
  blue:   { icon: "var(--blue)",    bg: "var(--blue-dim)",    border: "rgba(59,130,246,0.2)" },
};

export default function StatCard({ label, value, sub, color = "accent", icon, loading }: StatCardProps) {
  const c = colorMap[color];
  return (
    <div style={{
      background: "var(--bg-surface)", border: "1px solid var(--border)",
      borderRadius: "var(--radius)", padding: "20px 22px",
      display: "flex", flexDirection: "column", gap: 12,
    }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
        <span style={{ fontSize: 12, fontWeight: 600, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.06em" }}>
          {label}
        </span>
        {icon && (
          <div style={{
            width: 32, height: 32, borderRadius: 8,
            background: c.bg, border: `1px solid ${c.border}`,
            display: "flex", alignItems: "center", justifyContent: "center", color: c.icon,
          }}>
            <FA icon={icon} style={{ fontSize: 13 }} />
          </div>
        )}
      </div>
      <div>
        {loading
          ? <div style={{ height: 30, width: 80, background: "var(--bg-elevated)", borderRadius: 4 }} />
          : <div style={{ fontSize: 28, fontWeight: 700, color: "var(--text-primary)", letterSpacing: "-0.8px", lineHeight: 1 }}>{value}</div>
        }
      </div>
      {sub && <div style={{ fontSize: 13, color: "var(--text-muted)" }}>{sub}</div>}
    </div>
  );
}

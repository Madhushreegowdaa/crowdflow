import type { CrowdLevel } from "@/lib/mock-data";

const config: Record<CrowdLevel, { cls: string; dot: string; label: string }> = {
  Low:    { cls: "cf-badge cf-badge-low",  dot: "#10b981", label: "Low" },
  Medium: { cls: "cf-badge cf-badge-mod",  dot: "#f59e0b", label: "Medium" },
  High:   { cls: "cf-badge cf-badge-high", dot: "#e8435a", label: "High" },
};

export default function CrowdLevelBadge({ level }: { level: CrowdLevel }) {
  const { cls, dot, label } = config[level];
  return (
    <span className={cls} aria-label={`Crowd level: ${label}`}>
      <span
        style={{
          display: "inline-block",
          width: 7,
          height: 7,
          borderRadius: "50%",
          background: dot,
          flexShrink: 0,
        }}
        aria-hidden="true"
      />
      {label}
    </span>
  );
}

import type { PassStatus } from "../../../../member4/types";

const labels: Record<PassStatus, string> = {
  active: "Active",
  expired: "Expired",
  pending: "Pending",
};

export function PassStatusBadge({ status }: { status: PassStatus }) {
  const statusClass = status === "expired" ? "statusExpired" : status === "pending" ? "statusPending" : "";

  return (
    <span className={`statusBadge ${statusClass}`}>
      <span aria-hidden="true" className={"statusDot"} />
      {labels[status]}
    </span>
  );
}

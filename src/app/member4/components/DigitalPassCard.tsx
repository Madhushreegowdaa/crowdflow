
import type { DigitalPass } from "../../../../member4/types";
import { PassStatusBadge } from "./PassStatusBadge";

function formatDate(value: string): string {
  const date = new Date(`${value}T00:00:00`);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(date);
}

export function getPassDisplayStatus(
  pass: DigitalPass,
  now: Date,
): DigitalPass["status"] {
  if (pass.status !== "active" || !/^\d{4}-\d{2}-\d{2}$/.test(pass.validUntil)) {
    return pass.status;
  }

  const today = [now.getFullYear(), String(now.getMonth() + 1).padStart(2, "0"), String(now.getDate()).padStart(2, "0")].join("-");
  return pass.validUntil < today ? "expired" : "active";
}

export function DigitalPassCard({
  pass,
  compact = false,
  now,
}: {
  pass: DigitalPass;
  compact?: boolean;
  now: Date;
}) {
  const displayStatus = getPassDisplayStatus(pass, now);

  return (
    <article
      className={`passCard ${compact ? "passCardCompact" : ""}`}
      aria-label={`${pass.type} digital pass`}
    >
      <div className="passTopline">
        <div>
          <p className="cardKicker">CROWDFLOW DIGITAL PASS</p>
          <h2>{pass.type}</h2>
        </div>

        <PassStatusBadge status={displayStatus} />
      </div>

      <div className="passIdentity">
        <div className="avatar" aria-hidden="true">
          {pass.passengerName.charAt(0).toUpperCase()}
        </div>

        <div>
          <strong>{pass.passengerName}</strong>
          <span>Pass ID · {pass.id}</span>
        </div>
      </div>

      <div className="passDetails">
        <div>
          <span>Valid from</span>
          <strong>{formatDate(pass.validFrom)}</strong>
        </div>

        <div>
          <span>Valid until</span>
          <strong>{formatDate(pass.validUntil)}</strong>
        </div>

        <div>
          <span>Travel category</span>
          <strong>{pass.routeCategory || "Not specified"}</strong>
        </div>

        <div>
          <span>Issued</span>
          <strong>{formatDate(pass.issuedAt)}</strong>
        </div>
      </div>

      {!compact && (
        <div
          className="qrPlaceholder"
          role="img"
          aria-label="QR code placeholder. This prototype pass cannot be used for travel verification."
        >
          <div className="qrPattern" aria-hidden="true">
            ▦
          </div>

          <span>QR verification</span>
          <small>Coming soon · Prototype only</small>
          <small>Not valid for travel verification</small>
        </div>
      )}
    </article>
  );
}


import type { DigitalPass } from "../../../../member4/types";
import { DigitalPassCard } from "./DigitalPassCard";

export function PassHistory({
  passes,
  now,
}: {
  passes: DigitalPass[];
  now: Date;
}) {
  if (passes.length === 0) {
    return (
      <div className="emptyState">
        <h3>No pass history yet</h3>
        <p>
          Your previously issued commuter passes will appear here.
        </p>
      </div>
    );
  }

  const sortedPasses = [...passes].sort(
    (a, b) =>
      new Date(b.issuedAt).getTime() -
      new Date(a.issuedAt).getTime()
  );

  return (
    <section className="historySection">
      <div className="sectionHeading">
        <h3>Previous passes</h3>
        <span className="hint">
          {passes.length} {passes.length === 1 ? "pass" : "passes"}
        </span>
      </div>

      <div className="historyList">
        {sortedPasses.map((pass) => (
          <DigitalPassCard
            key={pass.id}
            pass={pass}
            compact
            now={now}
          />
        ))}
      </div>
    </section>
  );
}

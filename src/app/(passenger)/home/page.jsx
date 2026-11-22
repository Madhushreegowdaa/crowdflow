"use client";

import { Suspense } from "react";
import { useEffect, useRef } from "react";
import { useSearchParams } from "next/navigation";
import App from "../../../App";

function AutoSearchFromParams() {
  const searchParams = useSearchParams();
  const triggered = useRef(false);

  useEffect(() => {
    if (triggered.current) return;
    const src = searchParams.get("src");
    const dst = searchParams.get("dst");
    const crowd = searchParams.get("crowd") || "all";
    if (src && dst) {
      triggered.current = true;
      setTimeout(() => {
        window.dispatchEvent(new CustomEvent("crowdflow:autosearch", {
          detail: { source: src, destination: dst, crowdFilter: crowd }
        }));
      }, 300);
    }
  }, [searchParams]);

  return null;
}

export default function HomePage() {
  return (
    <>
      <App />
      <Suspense fallback={null}>
        <AutoSearchFromParams />
      </Suspense>
    </>
  );
}

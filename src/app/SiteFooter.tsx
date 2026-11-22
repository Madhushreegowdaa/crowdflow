import Link from "next/link";

export function SiteFooter() {
  return (
    <footer className="mt-auto border-t border-white/10 bg-[#1c1c1c] px-5 py-6 text-white">
      <div className="mx-auto flex w-full max-w-[1280px] flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
        <Link href="/" className="inline-flex items-center gap-3 self-start no-underline">
          <span className="grid h-10 w-10 place-items-center rounded-[5px] bg-[#e04f67] text-white shadow-[0_3px_8px_rgba(224,79,103,0.35)]" aria-hidden="true">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="M3 11l19-9-9 19-2-8-8-2z" />
            </svg>
          </span>
          <span className="flex flex-col">
            <span className="text-base font-extrabold tracking-wide text-white">
              CROWD<span className="text-[#e04f67]">FLOW</span>
            </span>
            <span className="text-xs text-gray-400">Track your bus &amp; avoid the crowd</span>
          </span>
        </Link>

        <nav aria-label="Footer navigation" className="flex flex-wrap gap-x-5 gap-y-2 text-sm">
          <Link className="text-gray-300 no-underline transition hover:text-[#e04f67]" href="/">Home</Link>
          <Link className="text-gray-300 no-underline transition hover:text-[#e04f67]" href="/member4/login">Passenger sign in</Link>
          <Link className="text-gray-300 no-underline transition hover:text-[#e04f67]" href="/admin/login">Admin sign in</Link>
        </nav>

        <p className="m-0 text-xs text-gray-400">© CrowdFlow. All rights reserved.</p>
      </div>
    </footer>
  );
}


"use client";

import { useState } from "react";
import {
  BusFront,
  Search,
  Bell,
  ChevronDown,
  User,
  X,
} from "lucide-react";

export default function AdminHeader() {
  const [searchOpen, setSearchOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 flex h-[82px] w-full items-center justify-between border-b border-gray-200 bg-white px-5 sm:px-7">

      {/* LOGO — MOVED CLOSER TO LEFT EDGE */}
      <div className="flex shrink-0 items-center gap-3">
        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#E94F70] text-white">
          <BusFront size={27} />
        </div>

        <div>
          <h1 className="text-xl font-bold tracking-tight text-[#172A30]">
            CrowdFlow
          </h1>
          <p className="mt-0.5 text-[10px] font-bold tracking-[0.22em] text-gray-400">
            TRANSIT INTELLIGENCE
          </p>
        </div>
      </div>

      {/* SEARCH */}
      <div className="hidden w-full max-w-[495px] px-5 md:block">
        <div className="relative">
          <Search
            size={18}
            className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"
          />

          <input
            type="text"
            placeholder="Search buses, routes, stops..."
            className="w-full rounded-full border border-gray-200 bg-[#F8F8F7] py-3 pl-12 pr-4 text-sm text-[#172A30] outline-none transition focus:border-[#243F52]"
          />
        </div>
      </div>

      {/* RIGHT SIDE ACTIONS */}
      <div className="flex shrink-0 items-center gap-3">

        {/* MOBILE SEARCH */}
        <button
          onClick={() => setSearchOpen(!searchOpen)}
          className="rounded-full p-2 text-[#243F52] hover:bg-gray-100 md:hidden"
        >
          {searchOpen ? <X size={20} /> : <Search size={20} />}
        </button>

        {/* NOTIFICATIONS */}
        <div className="relative">
          <button
            onClick={() => {
              setNotificationsOpen(!notificationsOpen);
              setProfileOpen(false);
            }}
            className="relative flex h-11 w-11 items-center justify-center rounded-full border border-gray-200 text-[#172A30] hover:bg-gray-50"
          >
            <Bell size={19} />
            <span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-[#E94F70]" />
          </button>

          {notificationsOpen && (
            <div className="absolute right-0 top-14 z-50 w-64 rounded-xl border border-gray-200 bg-white p-4 shadow-xl">
              <h3 className="font-bold text-[#172A30]">Notifications</h3>
              <p className="mt-2 text-xs leading-5 text-gray-500">
                Your demonstration notification centre.
              </p>
              <p className="mt-3 text-xs text-[#243F52]">
                Check the Alerts page for fleet notifications.
              </p>
            </div>
          )}
        </div>

        {/* ADMIN PROFILE */}
        <div className="relative">
          <button
            onClick={() => {
              setProfileOpen(!profileOpen);
              setNotificationsOpen(false);
            }}
            className="flex items-center gap-2 rounded-full border border-gray-200 py-1.5 pl-2 pr-3 hover:bg-gray-50 sm:gap-3 sm:pl-2"
          >
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[#FCEBF0] font-bold text-[#E94F70]">
              A
            </div>

            <div className="hidden text-left sm:block">
              <p className="text-sm font-bold text-[#172A30]">
                Administrator
              </p>
              <p className="text-xs text-gray-400">
                Depot Manager
              </p>
            </div>

            <ChevronDown size={16} className="text-gray-400" />
          </button>

          {profileOpen && (
            <div className="absolute right-0 top-14 z-50 w-52 rounded-xl border border-gray-200 bg-white p-3 shadow-xl">
              <div className="flex items-center gap-2 px-2 py-2">
                <User size={17} className="text-[#243F52]" />
                <span className="text-sm font-semibold text-[#172A30]">
                  Administrator
                </span>
              </div>
              <p className="px-2 pb-2 text-xs text-gray-500">
                Depot Manager
              </p>
            </div>
          )}
        </div>
      </div>

      {/* MOBILE SEARCH FIELD */}
      {searchOpen && (
        <div className="absolute left-0 top-full w-full border-b border-gray-200 bg-white p-4 shadow-md md:hidden">
          <div className="relative">
            <Search
              size={17}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
            />
            <input
              type="text"
              placeholder="Search buses, routes, stops..."
              className="w-full rounded-lg border border-gray-200 bg-[#F8F8F7] py-3 pl-10 pr-4 text-sm outline-none focus:border-[#243F52]"
            />
          </div>
        </div>
      )}
    </header>
  );
}

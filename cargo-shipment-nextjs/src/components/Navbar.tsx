"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export function Navbar() {
  const pathname = usePathname();

  return (
    <nav>
      <span className="nav-left">
        <svg
          width="36"
          height="36"
          viewBox="0 0 48 48"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <rect width="48" height="48" rx="12" fill="var(--primary-color)" />
          <path
            d="M12 32V20.5C12 19.12 13.12 18 14.5 18H33.5C34.88 18 36 19.12 36 20.5V32"
            stroke="#fff"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <rect x="16" y="26" width="16" height="8" rx="2" fill="#fff" />
          <circle cx="18.5" cy="34.5" r="2.5" fill="var(--primary-color)" />
          <circle cx="29.5" cy="34.5" r="2.5" fill="var(--primary-color)" />
        </svg>
        <span className="text-2xl font-bold tracking-wider">
          Safe Haul
        </span>
      </span>
      <div className="hamburger">
        <div></div>
        <div></div>
        <div></div>
      </div>
      <span className="nav-center">
        <Link href="/" className={pathname === "/" ? "active" : ""}>
          Home
        </Link>
        <Link href="/auction" className={pathname === "/auction" ? "active" : ""}>
          Auctions
        </Link>
        <Link href="/listing" className={pathname === "/listing" ? "active" : ""}>
          List Cargo
        </Link>
        <Link href="/dashboard" className={pathname === "/dashboard" ? "active" : ""}>
          Dashboard
        </Link>
        <Link href="/profile" className={pathname === "/profile" ? "active" : ""}>
          Profile
        </Link>
        <Link href="/chat" className={pathname === "/chat" ? "active" : ""}>
          Chat
        </Link>
        <Link href="/history" className={pathname === "/history" ? "active" : ""}>
          History
        </Link>
      </span>
      <span className="nav-right">
        <Link href="/login" id="nav-login">
          Login
        </Link>
        <Link href="#" id="nav-logout" style={{ display: "none" }}>
          Logout
        </Link>
        <button id="darkModeToggle" className="ml-2">
          🌙
        </button>
      </span>
    </nav>
  );
}

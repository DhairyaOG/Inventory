import React, { useEffect, useState } from "react";
import sphinxLogo from "../assets/images/logo.png";

export default function NavBar() {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 10);
    onScroll();
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <nav
      className={
        "fixed top-0 left-0 w-full z-50 transition " +
        (scrolled
          ? "bg-black/30 backdrop-blur border-b border-white/10"
          : "bg-transparent")
      }
      aria-label="Primary"
    >
      <div className="flex items-center justify-between px-6 md:px-12 lg:px-20 py-4 relative">
        {/* Left Logo + Links */}
        <div className="flex items-center gap-6 text-sm">
          <a href="#">
            <img
              src={sphinxLogo}
              alt="Sphinx Logo"
              className="w-20 h-20 object-contain" // bigger size than before
            />
          </a>
        </div>

        {/* Center Title */}
        <div className="absolute left-1/2 transform -translate-x-1/2">
          <a href="#" className="text-xl font-sphinx tracking-widest">
            SPHINX
          </a>
        </div>

        {/* Right Links */}
        <div className="flex items-center gap-6 text-sm">
          <a href="#sponsors" className="hover:opacity-80">
            Campus Ambassador
          </a>
          <a href="#contact" className="hover:opacity-80">
            Login
          </a>
        </div>
      </div>
    </nav>
  );
}

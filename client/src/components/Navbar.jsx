import React, { useState, useRef, useEffect } from "react";
import { assets } from "../assets/assets";
import { NavLink, useNavigate } from "react-router-dom";
import { useUser } from "../context/UserContext";

const Navbar = () => {
  const { user } = useUser(); // don't assume isAdmin exists in context
  const isAdmin = user?.role === "admin";
  const navigate = useNavigate();

  // Debugging help — remove or comment out later
  useEffect(() => {
    console.log("[Navbar] user:", user);
    console.log("[Navbar] isAdmin:", isAdmin);
  }, [user, isAdmin]);

  // Build nav links at render-time (safe if user is null)
  const navLinks = isAdmin
    ? [
        { name: "Directory", path: "/directory" },
        { name: "Dashboard", path: "/dashboard" },
        { name: "Events", path: "/events" },
        { name: "Jobs", path: "/admin-jobs" },
      ]
    : [
        { name: "Home", path: "/home" },
        { name: "Posts", path: "/post" },
        user?.role === "alumni" && { name: "Donations", path: "/donations" },
        { name: "Event", path: "/events" },
        { name: "Messages", path: "/messages" },
        user?.role === "student" && { name: "Redeem", path: "/redeem" },
        { name: "Map", path: "/map" },
      ].filter(Boolean); // remove falsy entries

  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);

  // Close dropdown on outside click
  useEffect(() => {
    const handleOutsideClick = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleOutsideClick);
    return () => document.removeEventListener("mousedown", handleOutsideClick);
  }, []);

  return (
    <nav className="w-full bg-black/70 backdrop-blur-md shadow-md px-6 py-4 fixed top-0 left-0 z-50 flex items-center">
      {/* Left side: Logo */}
      <div
        onClick={() => navigate(isAdmin ? "/dashboard" : "/home")}
        className="flex items-center flex-shrink-0 cursor-pointer"
      >
        <span className="text-3xl font-bold text-white select-none">SETU</span>
        <img
          src={assets.logo}
          alt="App Logo"
          className="w-10 h-10 object-contain ml-3"
        />
      </div>

      {/* Centered navigation */}
      <div className="flex-grow flex justify-center">
        <ul className="flex space-x-8 text-gray-200 font-medium">
          {navLinks.map((link) => {
            // extra guard: skip if link or link.name missing
            if (!link || !link.name || !link.path) return null;
            return (
              <li key={link.name}>
                <NavLink
                  to={link.path}
                  className={({ isActive }) =>
                    isActive
                      ? "text-amber-400 border-b-2 border-amber-400 pb-1"
                      : "hover:text-amber-400 transition"
                  }
                >
                  {link.name}
                </NavLink>
              </li>
            );
          })}
        </ul>
      </div>

      {/* Right side: Profile dropdown */}
      <div className="relative ml-4" ref={dropdownRef}>
        <button
          onClick={() => setDropdownOpen((prev) => !prev)}
          className="focus:outline-none rounded-full"
          aria-haspopup="true"
          aria-expanded={dropdownOpen}
          aria-label="Account menu"
        >
          <img
            src={assets.profile}
            alt="Profile"
            className="w-10 h-10 rounded-full object-cover cursor-pointer hover:ring-2 hover:ring-amber-400 transition"
          />
        </button>

        {dropdownOpen && (
          <ul className="absolute right-0 mt-2 w-44 bg-black/90 rounded-md shadow-lg ring-1 ring-white ring-opacity-20 focus:outline-none text-white">
            {/* hide profile/settings for admin (as requested) */}
            {!isAdmin && (
              <>
                <li>
                  <a
                    href="/profile"
                    className="block px-4 py-2 hover:bg-amber-400 hover:text-black transition cursor-pointer"
                  >
                    Profile
                  </a>
                </li>
                <li>
                  <a
                    href="/settings"
                    className="block px-4 py-2 hover:bg-amber-400 hover:text-black transition cursor-pointer"
                  >
                    Settings
                  </a>
                </li>
              </>
            )}

            <li>
              <button
                onClick={() => {
                  // optional: clear localStorage and redirect
                  try {
                    localStorage.removeItem("user");
                  } catch (e) { /* ignore */ }
                  navigate("/");
                }}
                className="w-full text-left px-4 py-2 hover:bg-amber-400 hover:text-black transition cursor-pointer"
              >
                Logout
              </button>
            </li>
          </ul>
        )}
      </div>
    </nav>
  );
};

export default Navbar;

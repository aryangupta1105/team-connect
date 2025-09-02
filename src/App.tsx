import { Authenticated, Unauthenticated, useQuery } from "convex/react";
import { api } from "../convex/_generated/api";
import { SignInForm } from "./SignInForm";
import { SignOutButton } from "./SignOutButton";
import { Toaster } from "sonner";
import { BrowserRouter as Router, Routes, Route, Link, useLocation } from "react-router-dom";
import Home from "./pages/Home";
import { Dashboard } from "./pages/Dashboard";
import { Profile } from "./pages/Profile";
import { ProfileDetail } from "./pages/ProfileDetail";
import { Teams } from "./pages/Teams";
import { CreateTeam } from "./pages/CreateTeam";
import { TeamDetail } from "./pages/TeamDetail";
import { TeamManagement } from "./pages/TeamManagement";
import { Requests } from "./pages/Requests";
import { Admin } from "./pages/Admin";
import Profiles from "./pages/Profiles";
import {motion} from "framer-motion"
import { UserCircle, Menu } from "lucide-react";
import { useEffect, useRef, useState } from "react";

export default function App() {

  const fadeIn = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 },
  };

  return (
    <Router>
      <div className="min-h-screen flex flex-col bg-gray-50">
        <Toaster />
        <Authenticated>
          <Navigation />
          <main className="flex-1">
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/profile" element={<Profile />} />
              <Route path="/profiles/:userId" element={<ProfileDetail />} />
              <Route path="/profile/:userId" element={<ProfileDetail />} />
              <Route path="/teams" element={<Teams />} />
              <Route path="/teams/create" element={<CreateTeam />} />
              <Route path="/teams/:id" element={<TeamDetail />} />
              <Route path="/teams/:id/manage" element={<TeamManagement />} />
              <Route path="/profiles" element={<Profiles />} />
              <Route path="/requests" element={<Requests />} />
              <Route path="/admin" element={<Admin />} />
            </Routes>
          </main>
          <footer className="w-full py-2 bg-gray-100 border-t border-gray-200 flex items-center justify-center ">
            <span className="text-lg text-gray-700 font-semibold flex items-center gap-2">
              Made with
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="red" className="w-6 h-6 inline-block animate-pulse">
                <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41 0.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
              </svg>
              by Aryan
            </span>
          </footer>
        </Authenticated>
        <Unauthenticated>
          <div className="min-h-screen bg-gradient-to-br from-blue-900 via-purple-900 to-orange-700 pb-16 font-sans">
            <motion.section
                  variants={fadeIn}
                  initial="hidden"
                  animate="visible"
                  transition={{ duration: 0.7 }}
                  className="relative flex flex-col items-center justify-center py-4 px-4 mb-12 bg-gradient-to-br from-blue-100 via-white to-gray-100 rounded-b-3xl shadow-lg"
                >
                  {/* Abstract SVG waves background */}
                  <svg className="absolute left-0 bottom-0 w-full h-32" viewBox="0 0 1440 320" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path fill="#e0e7ff" fillOpacity="1" d="M0,160L48,170.7C96,181,192,203,288,202.7C384,203,480,181,576,154.7C672,128,768,96,864,117.3C960,139,1056,213,1152,229.3C1248,245,1344,203,1392,181.3L1440,160L1440,320L1392,320C1344,320,1248,320,1152,320C1056,320,960,320,864,320C768,320,672,320,576,320C480,320,384,320,288,320C192,320,96,320,48,320L0,320Z"></path>
                  </svg>
                  <div className="relative z-10 text-center">
                    <h1 className="text-4xl md:text-5xl font-extrabold text-blue-900 mb-4 tracking-tight font-display">Build Your Dream Hackathon Team</h1>
                    <p className="text-lg md:text-xl text-gray-700 mb-6 font-medium">Connect, collaborate, and compete with the best minds. Find your perfect team or teammate now!</p>
                    
                  </div>
                </motion.section>
              
            <div className="w-full max-w-md mx-auto flex-1">

              <SignInForm />
              
            </div>
          </div>
          <footer className="w-full py-6 bg-white border-t border-gray-200 flex items-center justify-center mt-8">
            <span className="text-lg text-gray-700 font-semibold flex items-center gap-2">
              Made with
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="red" className="w-6 h-6 inline-block animate-pulse">
                <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41 0.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
              </svg>
              by Aryan
            </span>
          </footer>
        </Unauthenticated>
      </div>
    </Router>
  );
}

function Navigation() {
  const location = useLocation();
  const user = useQuery(api.auth.loggedInUser);
  const dashboardStats = useQuery(api.admin.getUserDashboardStats);
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const profileMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (profileMenuOpen && profileMenuRef.current && !profileMenuRef.current.contains(event.target as Node)) {
        setProfileMenuOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [profileMenuOpen]);

  const navItems = [
    { path: "/", label: "Home" },
    { path: "/dashboard", label: "Dashboard" },
    { path: "/teams", label: "Teams" },
    { path: "/profiles", label: "Profiles" },
    { 
      path: "/requests", 
      label: "Requests",
      badge: dashboardStats ? dashboardStats.incomingRequestsCount + dashboardStats.myInvitesCount : undefined
    },
    { path: "/admin", label: "Admin" },
  ];

  return (
    <header className="bg-gradient-to-br from-orange-500 via-white to-green-500 border-b border-gray-200 sticky top-0 z-50 shadow-lg">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <Link to="/" className="flex items-center gap-2 text-2xl font-extrabold text-blue-900 tracking-tight">
            {/* Indian Flag Icon */}
            <span className="flex items-center">
              <span className="w-5 h-5 rounded-sm mr-1 flex flex-col overflow-hidden border border-gray-300 shadow">
                <span className="block w-full h-[33%] bg-orange-500 animate-pulse"></span>
                <span className=" w-full h-[33%] bg-white flex items-center justify-center">
                  <div className="bg-blue-800 w-2 rounded-full h-2 mx-auto"></div>
                </span>
                <span className="block w-full h-[33%] bg-green-600"></span>
              </span>
              <span className="ml-1">Team Connect</span>
            </span>
          </Link>
          <div className="flex items-center space-x-8 justify-between">
            <nav className="hidden md:flex space-x-2 gap-2">
              {navItems.map((item) => (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`group px-4 py-2 rounded-xl text-base font-semibold transition-all relative shadow-sm flex items-center gap-2
                    ${location.pathname === item.path
                      ? " bg-orange-600 text-white border border-blue-400 scale-105 shadow-lg"
                      : "text-gray-800 hover:text-orange-700 hover:bg-orange-50  hover:shadow-md"}
                  `}
                >
                  <span className="transition-transform group-hover:scale-110">
                    {item.label}
                  </span>
                  {typeof item.badge === "number" && item.badge > 0 && (
                    <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center border border-white shadow">
                      {item.badge}
                    </span>
                  )}
                </Link>
              ))}
            </nav>
            {/* Burger icon for mobile */}
            <button
              className="md:hidden flex items-center justify-center w-10 h-10 rounded-full bg-blue-100 hover:bg-blue-200 border border-blue-300 focus:outline-none"
              onClick={() => setMobileNavOpen((open) => !open)}
              aria-label="Open navigation menu"
            >
              <Menu className="w-7 h-7 text-blue-700" />
            </button>
          </div>
          <div className="flex items-center space-x-4 relative">
            <div className="relative" ref={profileMenuRef}>
              <button
                className="flex items-center justify-center w-10 h-10 rounded-full bg-blue-100 hover:bg-blue-200 border border-blue-300 focus:outline-none"
                onClick={() => setProfileMenuOpen((open) => !open)}
                aria-label="Profile menu"
              >
                <UserCircle className="w-7 h-7 text-blue-700" />
              </button>
              {profileMenuOpen && (
                <div className="absolute right-0 mt-2 w-40 bg-white rounded-xl shadow-lg border border-gray-200 z-50">
                  <Link
                    to="/profile"
                    className="block px-4 py-3 text-gray-700 hover:bg-blue-50 font-semibold rounded-t-xl"
                    onClick={() => setProfileMenuOpen(false)}
                  >
                    My Profile
                  </Link>
                  <div className="border-t border-gray-100"></div>
                  <button
                    className="w-full text-left px-4 py-3 text-red-600 hover:bg-red-50 font-semibold rounded-b-xl"
                    onClick={() => {
                      setProfileMenuOpen(false);
                    }}
                  >
                    <SignOutButton/>
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
        {/* Mobile nav menu */}
        {mobileNavOpen && (
          <nav className="md:hidden flex flex-col gap-2 py-4 px-2 bg-white rounded-xl shadow-lg border border-gray-200 absolute top-16 left-4 right-4 z-40">
            {navItems.map((item) => (
              <Link
                key={item.path}
                to={item.path}
                className={`group px-4 py-3 rounded-xl text-base font-semibold transition-all relative shadow-sm flex items-center gap-2
                  ${location.pathname === item.path
                    ? "bg-gradient-to-r from-blue-500 via-blue-300 to-blue-100 text-white border border-blue-400 scale-105 shadow-lg"
                    : "text-gray-800 hover:text-orange-700 hover:bg-orange-50 hover:scale-105 hover:shadow-md"}
                `}
                onClick={() => setMobileNavOpen(false)}
              >
                <span className="transition-transform group-hover:scale-110">
                  {item.label}
                </span>
                {typeof item.badge === "number" && item.badge > 0 && (
                  <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center border border-white shadow">
                    {item.badge}
                  </span>
                )}
              </Link>
            ))}
          </nav>
        )}
      </div>
    </header>
  );
}

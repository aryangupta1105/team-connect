
import React, { useEffect } from "react";
import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Link, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  Users,
  BarChart2,
  PieChart,
  UserPlus,
  ClipboardCheck,
  LayoutDashboard,
  PlusCircle,
  UserCircle,
  Send,
} from "lucide-react";
import {
  LineChart,
  Line,
  PieChart as RePieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  CartesianGrid,
  Legend,
} from "recharts";

export function Dashboard() {
  const dashboardStats = useQuery(api.admin.getUserDashboardStats);
  const profile = useQuery(api.profiles.getCurrentProfile);
  const navigate = useNavigate();

  // Animation variants (normalized)
  const fadeInUp = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 },
  };

  // Chart Data (always fallback/mock data for missing metrics)
  const activityData = [
    { date: "2025-08-01", activity: 2 },
    { date: "2025-08-10", activity: 5 },
    { date: "2025-08-20", activity: 3 },
    { date: "2025-08-30", activity: 7 },
  ];
  const pieData = [
    { name: "Requests", value: dashboardStats?.myRequestsCount || 0 },
    { name: "Invites", value: dashboardStats?.myInvitesCount || 0 },
  ];
  const teamGrowthData = [
    { date: "2025-08-01", members: 2 },
    { date: "2025-08-10", members: 4 },
    { date: "2025-08-20", members: 6 },
    { date: "2025-08-30", members: 8 },
  ];

  // Profile completeness
  const profileFields = ["name", "branch", "year", "gender", "skills", "bio", "links", "avatar"];
  const completedFields = profileFields.filter((field) => {
    if (!profile) return false;
    switch (field) {
      case "skills":
      case "links":
        return Array.isArray(profile[field]) && profile[field].length > 0;
      case "avatar":
        return Boolean(profile.avatarUrl);
      default:
        return Boolean((profile as any)[field]);
    }
  });
  const profileCompletion = Math.round((completedFields.length / profileFields.length) * 100);

  // Team filling percentage (average)
  const avgTeamFill = dashboardStats?.teams?.length
    ? Math.round(
        dashboardStats.teams.reduce((acc, t) => acc + t.memberCount / t.maxSize, 0) /
          dashboardStats.teams.length * 100
      )
    : 0;

  // Colors for charts
  const chartColors = ["#6366F1", "#F59E42", "#A855F7", "#F43F5E", "#22D3EE", "#FBBF24"];

  // Navigation tile config
  const navTiles = [
    {
      label: "Teams",
      icon: <Users size={32} />,
      to: "/teams",
      color: "from-blue-500 to-purple-500",
    },
    {
      label: "Profiles",
      icon: <UserCircle size={32} />,
      to: "/profiles",
      color: "from-orange-500 to-pink-500",
    },
    {
      label: "Requests",
      icon: <Send size={32} />,
      to: "/requests",
      color: "from-purple-500 to-blue-500",
    },
    {
      label: "Create Team",
      icon: <PlusCircle size={32} />,
      to: "/teams/create",
      color: "from-green-500 to-blue-500",
    },
  ];

  // Page transition
  const handleNav = (to: string) => {
    navigate(to);
  };

  if (dashboardStats === undefined || profile === undefined) {
    return (
      <div className="flex justify-center items-center min-h-96">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!dashboardStats) {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Dashboard</h1>
          <p className="text-gray-600">Please log in to view your dashboard.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-900 via-purple-900 to-orange-700 pb-16 font-sans">
      {/* Top Section: Profile Data */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col md:flex-row gap-8 items-center justify-between mb-8">
          <div className="flex items-center gap-6">
            {profile?.avatarUrl && (
              <img src={profile.avatarUrl} alt={profile.name} className="w-20 h-20 rounded-full shadow-lg border-4 border-white" />
            )}
            <div>
              <h1 className="text-3xl font-extrabold text-white mb-2 tracking-tight font-display">{profile?.name || "Welcome!"}</h1>
              <p className="text-lg text-blue-100 font-medium">{profile?.branch} {profile?.year ? `• Year ${profile.year}` : ""}</p>
              <div className="flex gap-2 mt-2">
                <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-xs font-semibold">{profile?.gender === "f" ? "Female" : profile?.gender === "m" ? "Male" : "Other"}</span>
                {profile?.isLooking && <span className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-xs font-semibold">Looking for team</span>}
              </div>
            </div>
          </div>
          <div className="flex flex-col gap-2 items-end">
            <button
              onClick={() => navigate("/profile")}
              className="px-4 py-2 bg-gradient-to-br from-blue-500 to-purple-500 text-white rounded-2xl font-semibold shadow hover:shadow-lg transition-all text-sm"
            >
              <UserPlus size={18} className="inline-block mr-2" /> Edit Profile
            </button>
            <div className="w-48">
              <span className="block text-xs text-blue-100 mb-1">Profile Completion</span>
              <div className="w-full bg-blue-100 rounded-2xl h-3">
                <div
                  style={{ width: `${profileCompletion}%` }}
                  className="h-3 rounded-2xl bg-gradient-to-r from-blue-500 to-purple-500 transition-all duration-500"
                />
              </div>
              <span className="block text-xs text-blue-100 mt-1">{profileCompletion}%</span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Grid: My Teams, Quick Actions, Find Members, Find Teams */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
        {/* My Teams */}
        <div className="bg-white/90 rounded-2xl shadow-xl p-6 flex flex-col">
          <h2 className="text-xl font-bold text-blue-900 mb-4 font-display">My Teams</h2>
          {dashboardStats.teams.length > 0 ? (
            <div className="space-y-4">
              {dashboardStats.teams.map((team) => (
                <div key={team._id} className="border border-gray-200 rounded-xl p-3 bg-white/95 shadow hover:shadow-lg transition-all">
                  <div className="flex justify-between items-center mb-1">
                    <span className="font-semibold text-blue-900">{team.name}</span>
                    <span className={`px-2 py-1 text-xs rounded-full ${team.myRole === "leader" ? "bg-blue-100 text-blue-800" : "bg-gray-100 text-gray-800"}`}>{team.myRole}</span>
                  </div>
                  <p className="text-xs text-gray-600 mb-1">{team.domain}</p>
                  <div className="flex justify-between items-center">
                    <span className="text-xs text-gray-500">{team.memberCount}/{team.maxSize} members</span>
                    <div className="flex gap-2">
                      <button
                        onClick={() => navigate(`/teams/${team._id}`)}
                        className="text-blue-600 hover:text-blue-800 text-xs font-medium"
                      >View</button>
                      {team.myRole === "leader" && (
                        <button
                          onClick={() => navigate(`/teams/${team._id}/manage`)}
                          className="text-green-600 hover:text-green-800 text-xs font-medium"
                        >Manage</button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <p className="text-gray-500 mb-4">You're not part of any teams yet</p>
              <button
                onClick={() => navigate("/teams")}
                className="inline-flex items-center px-4 py-2 bg-gradient-to-br from-blue-500 to-purple-500 text-white rounded-2xl shadow hover:shadow-lg transition-all"
              >
                <Users size={18} className="inline-block mr-1" /> Browse Teams
              </button>
            </div>
          )}
        </div>

        {/* Quick Actions */}
        <div className="bg-white/90 rounded-2xl shadow-xl p-6 flex flex-col gap-4">
          <h2 className="text-xl font-bold text-purple-900 mb-4 font-display">Quick Actions</h2>
          <button
            onClick={() => navigate("/teams/create")}
            className="flex items-center justify-center px-4 py-3 bg-gradient-to-br from-blue-500 to-purple-500 text-white rounded-2xl shadow hover:shadow-lg transition-all font-medium"
          >
            <PlusCircle size={24} className="mr-2" /> Create New Team
          </button>
          <button
            onClick={() => navigate("/teams")}
            className="flex items-center justify-center px-4 py-3 bg-gradient-to-br from-orange-500 to-pink-500 text-white rounded-2xl shadow hover:shadow-lg transition-all font-medium"
          >
            <Users size={24} className="mr-2" /> Find Teams
          </button>
          <button
            onClick={() => navigate("/profiles")}
            className="flex items-center justify-center px-4 py-3 bg-gradient-to-br from-green-500 to-blue-500 text-white rounded-2xl shadow hover:shadow-lg transition-all font-medium"
          >
            <UserCircle size={24} className="mr-2" /> Find Members
          </button>
          <button
            onClick={() => navigate("/requests")}
            className="flex items-center justify-center px-4 py-3 bg-gradient-to-br from-purple-500 to-blue-500 text-white rounded-2xl shadow hover:shadow-lg transition-all font-medium relative"
          >
            <Send size={24} className="mr-2" /> Manage Requests & Invites
            {(dashboardStats.incomingRequestsCount + dashboardStats.myInvitesCount) > 0 && (
              <span className="absolute top-2 right-2 px-2 py-1 bg-red-500 text-white text-xs rounded-full">
                {dashboardStats.incomingRequestsCount + dashboardStats.myInvitesCount}
              </span>
            )}
          </button>
        </div>

        {/* Find Members */}
        <div className="bg-gradient-to-br from-green-100 via-blue-100 to-purple-100 rounded-2xl shadow-xl p-6 flex flex-col items-center justify-center">
          <h2 className="text-xl font-bold text-blue-900 mb-4 font-display">Find Members</h2>
          <p className="text-sm text-gray-700 mb-4 text-center">Discover talented students and invite them to your team. Filter by skills, branch, and more!</p>
          <button
            onClick={() => navigate("/profiles")}
            className="inline-flex items-center px-4 py-2 bg-gradient-to-br from-green-500 to-blue-500 text-white rounded-2xl shadow hover:shadow-lg transition-all font-semibold"
          >
            <UserCircle size={20} className="mr-2" /> Go to Profiles
          </button>
        </div>

        {/* Find Teams */}
        <div className="bg-gradient-to-br from-orange-100 via-pink-100 to-blue-100 rounded-2xl shadow-xl p-6 flex flex-col items-center justify-center">
          <h2 className="text-xl font-bold text-orange-900 mb-4 font-display">Find Teams</h2>
          <p className="text-sm text-gray-700 mb-4 text-center">Browse open teams, view details, and request to join. Find your perfect match!</p>
          <button
            onClick={() => navigate("/teams")}
            className="inline-flex items-center px-4 py-2 bg-gradient-to-br from-orange-500 to-pink-500 text-white rounded-2xl shadow hover:shadow-lg transition-all font-semibold"
          >
            <Users size={20} className="mr-2" /> Go to Teams
          </button>
        </div>
      </div>
    </div>
  );
}

// Animated Metric Widget Component
function MetricWidget({ icon, label, value, color }: { icon: React.ReactNode; label: string; value: number; color: string }) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.7 }}
      whileHover={{ scale: 1.04, boxShadow: "0 8px 32px 0 rgba(99,102,241,0.2)" }}
      className={`relative rounded-2xl p-6 bg-gradient-to-br ${color} shadow-xl text-white flex flex-col items-center justify-center gap-2`}
    >
      <span className="mb-2">{icon}</span>
      <motion.span
        initial={{ scale: 0.8 }}
        animate={{ scale: 1 }}
        transition={{ duration: 0.7 }}
        className="text-4xl font-extrabold tracking-tight drop-shadow-lg"
      >
        <CountUpNumber value={value} />
      </motion.span>
      <span className="text-lg font-bold drop-shadow-lg">{label}</span>
    </motion.div>
  );
}

// Count-up animation for numbers
function CountUpNumber({ value }: { value: number }) {
  const [display, setDisplay] = React.useState(0);
  useEffect(() => {
    let start = 0;
    const end = value;
    if (start === end) return;
    let duration = 900;
    let increment = end / (duration / 16);
    let current = start;
    const timer = setInterval(() => {
      current += increment;
      if ((increment > 0 && current >= end) || (increment < 0 && current <= end)) {
        current = end;
        clearInterval(timer);
      }
      setDisplay(Math.round(current));
    }, 16);
    return () => clearInterval(timer);
  }, [value]);
  return <span>{display}</span>;
}

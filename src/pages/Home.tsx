import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import React from "react";
import {
  Users,
  UserCircle,
  Send,
  PlusCircle,
  ClipboardCheck,
  BarChart2,
} from "lucide-react";

export default function Home() {
  const [showNote, setShowNote] = React.useState(true);
  const [progress, setProgress] = React.useState(100);
  const profile = useQuery(api.profiles.getCurrentProfile);
  const myTeams = useQuery(api.teams.getMyTeams);
  const stats = useQuery(api.admin.getAdminStats);
  const navigate = useNavigate();
  // Guidance note for users
  const showProfileNote = !profile?.name || !profile?.avatar || !profile?.skills || profile?.skills.length === 0;
  const completion = Math.round(((profile?.skills?.length || 0) + (profile?.avatar ? 1 : 0) + (profile?.name ? 1 : 0)) / 3 * 100);
  React.useEffect(() => {
    if (showProfileNote && showNote) {
      let start = 100;
      setProgress(100);
      const interval = setInterval(() => {
        start -= 2;
        setProgress(start);
        if (start <= 0) {
          setShowNote(false);
          clearInterval(interval);
        }
      }, 100);
      return () => clearInterval(interval);
    }
  }, [showProfileNote, showNote]);
  // Minimal fade-in for sections
  

  if (profile === undefined || myTeams === undefined || stats === undefined) {
    return (
      <div className="flex justify-center items-center min-h-96">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  // Feature highlights
  const features = [
    {
      icon: <Users size={32} className="text-blue-600" />,
      title: "Find Teams",
      desc: "Browse open teams, view details, and request to join your perfect match.",
    },
    {
      icon: <UserCircle size={32} className="text-purple-600" />,
      title: "Discover Teammates",
      desc: "Search for talented students by skills, branch, and more.",
    },
    {
      icon: <Send size={32} className="text-orange-500" />,
      title: "Track Requests",
      desc: "Manage your join requests and invites in one place.",
    },
    {
      icon: <ClipboardCheck size={32} className="text-green-600" />,
      title: "Manage Your Profile",
      desc: "Showcase your skills and interests to attract the best teams.",
    },
  ];

  // Stats cards config
  const statsCards = [
    { label: "Total Users", value: stats?.totalUsers || 0, color: "text-blue-600" },
    { label: "Active Teams", value: stats?.totalTeams || 0, color: "text-green-600" },
    { label: "Open Teams", value: stats?.openTeams || 0, color: "text-purple-600" },
    { label: "Open Slots", value: stats?.totalOpenSlots || 0, color: "text-orange-600" },
  ];

  // Quick actions config
  const quickActions = [
    {
      label: "Create Team",
      icon: <PlusCircle size={28} className="mr-2" />,
      to: "/teams/create",
      color: "bg-blue-600 text-white hover:bg-blue-700",
    },
    {
      label: "Browse Teams",
      icon: <Users size={28} className="mr-2" />,
      to: "/teams",
      color: "bg-gray-100 text-gray-700 hover:bg-gray-200",
    },
    {
      label: "Find Teammates",
      icon: <UserCircle size={28} className="mr-2" />,
      to: "/profiles",
      color: "bg-gray-100 text-gray-700 hover:bg-gray-200",
    },
    {
      label: "Manage Requests",
      icon: <Send size={28} className="mr-2" />,
      to: "/requests",
      color: "bg-gray-100 text-gray-700 hover:bg-gray-200",
    },
  ];

  // Count-up animation for stats
  function CountUp({ value }: { value: number }) {
    const [display, setDisplay] = React.useState(0);
    React.useEffect(() => {
      let start = 0;
      const end = value;
      if (start === end) return;
      let duration = 600;
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

  const fadeIn = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 },
  };

  return (
    <div className="min-h-screen px-5 bg-gradient-to-br from-blue-900 via-purple-900 to-orange-700 pb-16 font-sans relative">
      {showProfileNote && showNote && completion < 50 && (
        <div className="absolute top-4 left-4 z-50 w-[320px] px-4 py-3 bg-yellow-100 border-l-4 border-yellow-500 rounded shadow text-yellow-900 text-base font-semibold">
          <span className="font-bold">Note:</span> Complete your profile to get viewed by teams. Requests will not be sent until your profile is complete.
          <div className="mt-2 h-2 w-full bg-yellow-300 rounded overflow-hidden">
            <div
              className="h-2 bg-yellow-500 transition-all duration-100"
              style={{ width: `${progress}%` }}
            ></div>
          </div>
        </div>
      )}
      {/* Hero Section */}
      <motion.section
        variants={fadeIn}
        initial="hidden"
        animate="visible"
        transition={{ duration: 0.7 }}
        className="relative flex flex-col items-center justify-center py-16 px-4 mb-12 bg-gradient-to-br from-blue-100 via-white to-gray-100 rounded-b-3xl shadow-lg"
      >
        {/* Abstract SVG waves background */}
        <svg className="absolute left-0 bottom-0 w-full h-32" viewBox="0 0 1440 320" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path fill="#e0e7ff" fillOpacity="1" d="M0,160L48,170.7C96,181,192,203,288,202.7C384,203,480,181,576,154.7C672,128,768,96,864,117.3C960,139,1056,213,1152,229.3C1248,245,1344,203,1392,181.3L1440,160L1440,320L1392,320C1344,320,1248,320,1152,320C1056,320,960,320,864,320C768,320,672,320,576,320C480,320,384,320,288,320C192,320,96,320,48,320L0,320Z"></path>
        </svg>
        <div className="relative z-10 text-center">
          <h1 className="text-4xl md:text-5xl font-extrabold text-blue-900 mb-4 tracking-tight font-display">Build Your Dream Hackathon Team</h1>
          <p className="text-lg md:text-xl text-gray-700 mb-6 font-medium">Connect, collaborate, and compete with the best minds. Find your perfect team or teammate now!</p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button
              onClick={() => navigate(profile ? "/teams" : "/profile")}
              className={`px-6 py-3 rounded-2xl font-semibold shadow transition-all text-lg ${profile ? "bg-blue-600 text-white hover:bg-blue-700" : "bg-orange-100 text-orange-700 border border-orange-300 hover:bg-orange-200"}`}
            >
              {profile ? "Browse Teams" : "Create Profile"}
            </button>
            <button
              onClick={() => navigate("/profiles")}
              className="px-6 py-3 bg-gray-100 text-blue-900 rounded-2xl font-semibold shadow hover:bg-blue-200 transition-all text-lg"
            >
              Find Teammates
            </button>
          </div>
        </div>
      </motion.section>

      {/* Feature Highlights */}
      <motion.section
        variants={fadeIn}
        initial="hidden"
        animate="visible"
        transition={{ duration: 0.7, delay: 0.2 }}
        className="max-w-5xl mx-auto grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6 py-8"
      >
        {features.map((f, idx) => (
          <motion.div
            key={f.title}
            whileHover={{ scale: 1.04, y: -2 }}
            className="bg-white rounded-2xl shadow p-6 flex flex-col items-center text-center transition-all cursor-pointer"
          >
            <span className="mb-3">{f.icon}</span>
            <h3 className="text-lg font-bold text-blue-900 mb-2 font-display">{f.title}</h3>
            <p className="text-sm text-gray-600">{f.desc}</p>
          </motion.div>
        ))}
      </motion.section>

      {/* Stats Section */}
      <motion.section
        variants={fadeIn}
        initial="hidden"
        animate="visible"
        transition={{ duration: 0.7, delay: 0.3 }}
        className="max-w-5xl mx-auto grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6 py-8"
      >
        {statsCards.map((card) => (
          <div key={card.label} className="bg-white rounded-2xl shadow p-6 flex flex-col items-center justify-center">
            <span className={`text-2xl font-bold mb-2 ${card.color}`}><CountUp value={card.value} /></span>
            <span className="text-sm text-gray-700 font-medium">{card.label}</span>
          </div>
        ))}
      </motion.section>

      {/* My Teams Section */}
      <motion.section
        variants={fadeIn}
        initial="hidden"
        animate="visible"
        transition={{ duration: 0.7, delay: 0.4 }}
        className="max-w-5xl mx-auto py-8"
      >
        <h2 className="text-2xl font-bold text-gray-200 mb-4  font-display">My Teams</h2>
        {myTeams && myTeams.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {myTeams.map((team) => (
              <div key={team._id} className="bg-white rounded-2xl shadow p-5 flex flex-col gap-2 hover:shadow-lg transition-all">
                <div className="flex justify-between items-center mb-1">
                  <span className="font-semibold text-blue-900">{team.name}</span>
                  <span className={`px-2 py-1 text-xs rounded-full ${team.myRole === "leader" ? "bg-blue-100 text-blue-800" : "bg-gray-100 text-gray-800"}`}>{team.myRole}</span>
                </div>
                <p className="text-xs text-gray-600 mb-1">{team.domain}</p>
                <div className="flex justify-between items-center">
                  <span className="text-xs text-gray-500">{team.memberCount}/{team.maxSize} members</span>
                  <button
                    onClick={() => navigate(`/teams/${team._id}`)}
                    className="text-blue-600 hover:text-blue-800 text-xs font-medium"
                  >View Team</button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8">
            <p className="text-gray-500 mb-4">You're not part of any teams yet</p>
            <button
              onClick={() => navigate("/teams")}
              className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-2xl shadow hover:bg-blue-700 transition-all"
            >
              <Users size={18} className="inline-block mr-1" /> Browse Teams
            </button>
          </div>
        )}
      </motion.section>

      {/* Quick Actions Section */}
      <motion.section
        variants={fadeIn}
        initial="hidden"
        animate="visible"
        transition={{ duration: 0.7, delay: 0.5 }}
        className="max-w-5xl mx-auto py-8"
      >
        <h2 className="text-xl font-bold text-purple-900 mb-4 font-display">Quick Actions</h2>
        <div className="grid grid-cols-2 gap-6">
          {quickActions.map((action) => (
            <button
              key={action.label}
              onClick={() => navigate(action.to)}
              className={`flex items-center justify-center px-4 py-5 rounded-2xl shadow font-semibold text-lg transition-all ${action.color}`}
            >
              {action.icon}
              {action.label}
            </button>
          ))}
        </div>
      </motion.section>
    </div>
  );
}

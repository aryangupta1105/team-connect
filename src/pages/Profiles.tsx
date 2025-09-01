import { useState, useMemo, useRef, useEffect } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { toast } from "sonner";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { Send } from "lucide-react";

// Helper to calculate profile completion
function getProfileCompletion(profile: any) {
  let filled = 0;
  if (profile.name) filled++;
  if (profile.branch) filled++;
  if (profile.year) filled++;
  if (profile.gender) filled++;
  if (profile.skills && profile.skills.length > 0) filled++;
  if (profile.bio) filled++;
  if (profile.links && profile.links.length > 0) filled++;
  if (profile.avatarUrl) filled++;
  return Math.round((filled / 8) * 100);
}

// Use a random avatar if not available
function getAvatarUrl(user: any) {
  return user.avatarUrl || `https://randomuser.me/api/portraits/lego/${user._id % 10}.jpg`;
}

const yearOptions = [
  { value: "", label: "Any" },
  { value: "1", label: "1st Year" },
  { value: "2", label: "2nd Year" },
  { value: "3", label: "3rd Year" },
  { value: "4", label: "4th Year" },
  { value: "Others", label: "Others" },
];

const genderOptions = [
  { value: "", label: "Any" },
  { value: "m", label: "Male" },
  { value: "f", label: "Female" },
  { value: "o", label: "Other" },
];

export default function Profiles() {
  // Filters
  const [skillFilter, setSkillFilter] = useState<string[]>([]);
  const [yearFilter, setYearFilter] = useState<string>("");
  const [genderFilter, setGenderFilter] = useState<"m" | "f" | "o" | "">("");
  const [lookingFilter, setLookingFilter] = useState<boolean | "">("");
  // Track loading state per team per user
  const [loadingInvite, setLoadingInvite] = useState<{[key: string]: string | null}>({});
  const [loadingJoin, setLoadingJoin] = useState<string | null>(null);
  const [selectedTeams, setSelectedTeams] = useState<{[key: string]: string[]}>({});
  const dropdownRefs = useRef<{[key: string]: HTMLDivElement | null}>({});
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);

  // Queries & mutations
  const profiles = useQuery(api.profiles.listAvailableProfiles, {
    skillFilter: skillFilter.join(","),
    genderFilter: genderFilter ? genderFilter : undefined,
    lookingOnly: lookingFilter === true ? true : undefined,
  });
  const currentUserProfile = useQuery(api.profiles.getCurrentProfile);
  const currentUserTeams = useQuery(api.teams.getMyTeams, {});
  const sendInvite = useMutation(api.requests.sendInvite);
  const sendJoinRequest = useMutation(api.requests.sendJoinRequest);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (openDropdown) {
        const ref = dropdownRefs.current[openDropdown];
        if (ref && !ref.contains(event.target as Node)) {
          setOpenDropdown(null);
        }
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [openDropdown]);

  // Filtering logic
  const filteredProfiles = useMemo(() => {
    let filtered = profiles ?? [];
    if (skillFilter.length > 0) {
      filtered = filtered.filter((p: any) =>
        skillFilter.some(f =>
          p.skills.map((s: string) => s.trim().toLowerCase()).includes(f.trim().toLowerCase())
        )
      );
    }
    if (yearFilter) {
      filtered = filtered.filter((p: any) =>
        yearFilter === "Others"
          ? !["1", "2", "3", "4"].includes(String(p.year))
          : String(p.year) === yearFilter
      );
    }
    if (genderFilter) {
      filtered = filtered.filter((p: any) => p.gender === genderFilter);
    }
    if (lookingFilter !== "") {
      filtered = filtered.filter((p: any) => p.isLooking === lookingFilter);
    }
    return filtered;
  }, [profiles, skillFilter, yearFilter, genderFilter, lookingFilter]);

  // Sorting logic: prioritize fewer teams, more complete profiles
  const sortedProfiles = useMemo(() => {
    return [...filteredProfiles].sort((a: any, b: any) => {
      // Use teamsJoinedCount if available, else fallback to teamsJoined?.length
      const aTeams = a.teamsJoinedCount ?? (a.teamsJoined?.length ?? 0);
      const bTeams = b.teamsJoinedCount ?? (b.teamsJoined?.length ?? 0);
      if (aTeams !== bTeams) return aTeams - bTeams;
      // More complete profile first
      return getProfileCompletion(b) - getProfileCompletion(a);
    });
  }, [filteredProfiles]);

  // Helper: Is current user in a team?
  const hasTeam = currentUserTeams && currentUserTeams.length > 0;
  // Helper: Is profile in same team as current user?
  const isInSameTeam = (profile: any) =>
    hasTeam &&
    profile.teamsJoined &&
    profile.teamsJoined.some((tid: any) =>
      currentUserTeams.some((team: any) => team._id === tid)
    );

  // Invite/Join handlers
  const handleInvite = async (profile: any, teamId: any) => {
    setLoadingInvite(prev => ({ ...prev, [profile._id]: teamId }));
    try {
      await sendInvite({
        teamId: teamId as any,
        toUserId: profile.userId as any,
        message: "We'd love to have you join our team!",
      });
      toast.success("Invite sent!");
    } catch (error: any) {
      toast.error(error?.message || "Failed to send invite");
    } finally {
      setLoadingInvite(prev => ({ ...prev, [profile._id]: null }));
    }
  };

  const handleJoinRequest = async (profile: any) => {
    setLoadingJoin(profile._id);
    try {
      await sendJoinRequest({
        teamId: profile.teamsJoined?.[0] as any,
        message: "I'd love to join your team!",
      });
      toast.success("Join request sent!");
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to send request"
      );
    } finally {
      setLoadingJoin(null);
    }
  };

  const handleTeamSelect = (profileId: string, teamId: string) => {
    setSelectedTeams(prev => {
      const current = prev[profileId] || [];
      return {
        ...prev,
        [profileId]: current.includes(teamId)
          ? current.filter(id => id !== teamId)
          : [...current, teamId],
      };
    });
  };

  const handleInviteMultiple = async (profile: any) => {
    const teamsToInvite = selectedTeams[profile._id] || [];
    if (teamsToInvite.length === 0) return toast.error("Select at least one team.");
    setLoadingInvite(prev => ({ ...prev, [profile._id]: teamsToInvite[0] }));
    try {
      for (const teamId of teamsToInvite) {
        await sendInvite({
          teamId: teamId as any,
          toUserId: profile.userId as any,
          message: "We'd love to have you join our team!",
        });
      }
      toast.success("Invites sent!");
    } catch (error: any) {
      toast.error(error?.message || "Failed to send invite");
    } finally {
      setLoadingInvite(prev => ({ ...prev, [profile._id]: null }));
    }
  };

  // Fix dropdown ref assignment
  const setDropdownRef = (profileId: string) => (el: HTMLDivElement | null) => {
    dropdownRefs.current[profileId] = el;
  };

  // Only show teams where current user is leader and the INVITED profile is not already a member
  const getEligibleTeams = (profile: any) => {
    if (!currentUserTeams) {
      console.log('currentUserTeams is undefined');
      return [];
    }
    console.log('currentUserTeams:', currentUserTeams);
    return currentUserTeams.filter((team: any) => {
      const isLeader = team.leaderId === currentUserProfile?.userId;
      const isMember = team.memberIds?.includes(profile.userId);
      return isLeader && !isMember;
    });
  };

  // UI helpers
  const gradient =
    "bg-gradient-to-r from-blue-600 via-orange-400 to-yellow-400";

  return (
    <div className="min-h-screen  py-8 px-2 bg-gradient-to-br from-blue-900 via-purple-900 to-orange-700 pb-16">
      
      {/* Filters */}
      <div className="max-w-7xl mx-auto mb-6 px-4  ">
    
        <div className="flex flex-wrap justify-between shadow-md items-center  px-10 gap-10  rounded-xl p-4 ">
          <h1 className="font-bold text-3xl  text-center text-wrap text-gray-300">Find Your Teammates</h1>

          <div className="flex gap-5 items-center text-gray-300">
            {/* Skill Filter */}
            <div className="flex flex-col items-center min-w-[200px]">
              <label className="text-sm font-semibold text-gray-300 mb-1">Skill</label>
              <input
                type="text"
                placeholder="Type skill & press Enter..."
                className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none text-gray-500
                 bg-gray-200 placeholder:text-gray-500   focus:ring-1 focus:ring-blue-500"
                onKeyDown={e => {
                  if (e.key === "Enter" && e.currentTarget.value.trim()) {
                    setSkillFilter([...skillFilter, e.currentTarget.value.trim()]);
                    e.currentTarget.value = "";
                  }
                }}
              />
              {skillFilter.length > 0 && (
                <div className="flex gap-2 flex-wrap mt-2">
                  {skillFilter.map(skill => (
                    <span
                      key={skill}
                      className="px-2 py-1 bg-gray-200 placeholder:text-gray-500   text-blue-800 rounded-full text-xs flex items-center"
                    >
                      {skill}
                      <button
                        className="ml-1 text-blue-600 hover:text-blue-900"
                        onClick={() => setSkillFilter(skillFilter.filter(s => s !== skill))}
                      >
                        &times;
                      </button>
                    </span>
                  ))}
                </div>
              )}
            </div>

            {/* Year Filter */}
            <div className="flex flex-col items-center min-w-[150px]">
              <label className="text-sm font-semibold text-gray-300 mb-1">Year</label>
              <select
                value={yearFilter}
                onChange={e => setYearFilter(e.target.value)}
                className="px-3 py-2 border text-gray-500 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-400"
              >
                {yearOptions.map(opt => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Gender Filter */}
            <div className="flex flex-col items-center min-w-[150px] text-gray-500">
              <label className="text-sm font-semibold text-gray-300 mb-1">Gender</label>
              <select
                value={genderFilter}
                onChange={e => setGenderFilter(e.target.value as "" | "m" | "f" | "o")}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-400"
              >
                {genderOptions.map(opt => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Looking Filter */}
          <div className="flex items-center gap-2 min-w-[160px]">
            <input
              type="checkbox"
              id="lookingFilter"
              checked={lookingFilter === true}
              onChange={e => setLookingFilter(e.target.checked ? true : "")}
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            />
            <label htmlFor="lookingFilter" className="text-sm font-semibold text-gray-300">
              Looking for Team
            </label>
          </div>
        </div>
      </div>


      {/* Profiles Grid */}
      <div className="max-w-7xl mx-auto grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-8">
        {sortedProfiles.length === 0 ? (
          <div className="col-span-full text-center text-gray-500 py-10">
            <span>No profiles found. Try adjusting your filters.</span>
          </div>
        ) : (
          sortedProfiles.map((user: any, idx: number) => (
            <motion.div
              key={user._id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: idx * 0.05 }}
              className={`bg-white rounded-xl shadow-md hover:shadow-lg transition-all border ${isInSameTeam(user) ? "border-green-400" : "border-gray-200"} flex flex-col p-0 overflow-hidden h-full`}
            >
              <div className="flex flex-col items-center p-6 pb-4 h-full justify-between">
                
                <img
                  src={getAvatarUrl(user)}
                  alt={user.name}
                  className="w-20 h-20 rounded-full object-cover border-4 border-blue-200 mb-3 shadow-lg hover:scale-[150%] transition-all duration-300"
                  onError={e => {
                    (e.currentTarget as HTMLImageElement).src =
                      user.gender === 'm'
                        ? "https://png.pngtree.com/png-clipart/20230927/original/pngtree-man-avatar-image-for-profile-png-image_13001882.png"
                        : "https://img.freepik.com/premium-vector/cute-woman-avatar-profile-vector-illustration_1058532-14592.jpg?w=2000";
                  }}
                />
                <h3 className="text-lg font-bold text-blue-900 mb-1">{user.name}</h3>
                {/* Teams Joined Badge */}
                <span
                  className={`px-3 py-1 rounded-full text-xs font-semibold mb-2 ${((user.teamsJoinedCount ?? user.teamsJoined?.length ?? 0) > 2)
                    ? "bg-red-100 text-red-800 border border-red-300"
                    : "bg-blue-100 text-blue-800 border border-blue-200"}`}
                >
                  Teams Joined: {user.teamsJoinedCount ?? user.teamsJoined?.length ?? 0}
                </span>
                <div className="flex gap-2 mt-1 flex-wrap justify-center">
                  <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs">{user.branch}</span>
                  <span className="px-2 py-1 bg-orange-100 text-orange-800 rounded-full text-xs">{user.year} Year</span>
                  <span className={`px-2 py-1 rounded-full text-xs ${user.gender === "f" ? "bg-pink-100 text-pink-800" : user.gender === "m" ? "bg-blue-100 text-blue-800" : "bg-gray-200 text-gray-700"}`}>{user.gender === "f" ? "Female" : user.gender === "m" ? "Male" : "Other"}</span>
                  {user.isLooking && <span className="px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs">Looking for Team</span>}
                </div>
                <div className="flex flex-wrap gap-1 mt-2 justify-center">
                  {user.skills.map((skill: string) => (
                    <span key={skill} className="px-2 py-1 bg-blue-50 text-blue-800 text-xs rounded">{skill}</span>
                  ))}
                </div>
                <p className="text-sm text-gray-600 mt-2 line-clamp-3 text-center min-h-[48px] flex items-center justify-center">{user.bio}</p>
                <div className="flex gap-2 mt-2 justify-center min-h-[24px] items-center">
                  {user.links && user.links.length > 0 ? (
                    user.links.map((link: string) => (
                      <a key={link} href={link} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:text-blue-900 text-xs underline">{link}</a>
                    ))
                  ) : (
                    <span className="text-xs text-gray-400 italic">Socials not provided</span>
                  )}
                </div>
              </div>
              <div className="flex flex-col gap-2 px-6 pb-6 bg-gray-50 border-t border-gray-200">
                {hasTeam ? (
                  <div className="flex flex-col gap-2">
                    <label className="text-xs font-semibold text-blue-900 mb-1">Invite to Team(s)</label>
                    <div className="relative">
                      <button
                        type="button"
                        className="w-full px-4 py-2 bg-gray-100 text-blue-900 rounded-lg font-semibold border border-gray-300 text-left"
                        onClick={() => setOpenDropdown(openDropdown === user._id ? null : user._id)}
                        style={{ zIndex: 20 }}
                      >
                        {selectedTeams[user._id] && selectedTeams[user._id].length > 0
                          ? `${selectedTeams[user._id].length} team(s) selected`
                          : "Select team(s)"}
                      </button>
                      <div
                        ref={setDropdownRef(user._id)}
                        className="absolute z-30 w-full bg-white border border-gray-200 rounded-lg shadow-lg mt-1"
                        style={{ display: openDropdown === user._id ? "block" : "none", zIndex: 30 }}
                      >
                        {getEligibleTeams(user).length === 0 ? (
                          <div className="px-4 py-3 text-gray-500 text-sm text-center">No eligible teams to invite</div>
                        ) : (
                          getEligibleTeams(user).map((team: any) => (
                            <label key={team._id} className="flex items-center px-4 py-2 cursor-pointer hover:bg-blue-50">
                              <input
                                type="checkbox"
                                checked={selectedTeams[user._id]?.includes(team._id) || false}
                                onChange={() => handleTeamSelect(user._id, team._id)}
                                className="mr-2"
                              />
                              <span className="text-sm">{team.name}</span>
                            </label>
                          ))
                        )}
                      </div>
                    </div>
                    <button
                      onClick={() => handleInviteMultiple(user)}
                      disabled={!!loadingInvite[user._id]}
                      className="w-full px-4 py-2 bg-blue-600 text-gray-300 rounded-lg font-semibold transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow hover:bg-blue-700 flex items-center justify-center gap-2 mt-2"
                    >
                      {loadingInvite[user._id] ? "Sending..." : <><Send className="inline-block mr-1 w-4 h-4" /> Send Invite</>}
                    </button>
                  </div>
                ) : (
                  <>
                    <Link
                      to="/teams/create"
                      className="w-full px-4 py-2 bg-blue-600 text-gray-300 rounded-lg font-semibold hover:bg-blue-700 transition-colors text-center shadow hover:scale-105 hover:shadow-xl"
                    >
                      Create Team
                    </Link>
                    <button
                      onClick={() => handleJoinRequest(user)}
                      disabled={loadingJoin === user._id}
                      className="w-full px-4 py-2 bg-orange-400 text-gray-300 rounded-lg font-semibold hover:bg-orange-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed mt-2 shadow hover:scale-105 hover:shadow-xl"
                    >
                      {loadingJoin === user._id ? "Requesting..." : "Request to Join Team"}
                    </button>
                  </>
                )}
                <Link
                  to={`/profile/${user.userId}`}
                  className="w-full px-4 py-2 bg-gray-100 text-blue-900 rounded-lg font-semibold hover:bg-gray-200 transition-colors text-center shadow hover:scale-105 hover:shadow-xl"
                >
                  View Profile
                </Link>
              </div>
            </motion.div>
          ))
        )}
      </div>
    </div>
  );
}

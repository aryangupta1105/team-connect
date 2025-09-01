import { useState, useEffect } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Link } from "react-router-dom";
import { toast } from "sonner";
import Select from "react-select";
import CreatableSelect from "react-select/creatable";
import { motion } from "framer-motion";
import { problemStatements } from "../lib/problemStatements";
import { PlusIcon } from "lucide-react";

export function Teams() {
  const currentUserTeams = useQuery(api.teams.getMyTeams, {});
  // Get current user's id
  const currentUserProfile = useQuery(api.profiles.getCurrentProfile);
  const currentUserId = currentUserProfile?.userId;

  // Immediate filter state for inputs
  const [inputFilters, setInputFilters] = useState({
    domain: "",
    skills: [] as string[],
    year: "",
    femaleMember: "",
    problems: [] as string[],
  });
  // Filters used for querying
  const [filters, setFilters] = useState(inputFilters);

  // Prepare react-select options
  const yearOptions = [
    { value: "", label: "Any" },
    { value: "1st Year", label: "1st Year" },
    { value: "2nd Year", label: "2nd Year" },
    { value: "3rd Year", label: "3rd Year" },
    { value: "4th Year", label: "4th Year" },
    { value: "Others", label: "Others" },
  ];
  const femaleOptions = [
    { value: "", label: "Any" },
    { value: "requires", label: "Requires Female" },
    { value: "has", label: "Already Has Female" },
  ];
  const problemOptions = problemStatements.map(ps => ({ value: ps.id, label: `${ps.id} - ${ps.title}` }));

  const teams = useQuery(api.teams.listOpenTeams, {
  domainFilter: filters.domain || undefined,
  skillFilter: filters.skills.length > 0 ? filters.skills.join(",") : undefined,
  yearFilter: filters.year || undefined,
  femaleMemberFilter: filters.femaleMember || undefined,
  problemFilter:
    filters.problems.length > 0
      ? filters.problems.join(",") // ✅ just send IDs directly
      : undefined,
});

  const sendJoinRequest = useMutation(api.requests.sendJoinRequest);
  const [requestingTeam, setRequestingTeam] = useState<string | null>(null);

  const handleJoinRequest = async (teamId: string) => {
    setRequestingTeam(teamId);
    try {
      await sendJoinRequest({
        teamId: teamId as any,
        message: "I'd love to join your team!",
      });
      toast.success("Join request sent!");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to send request");
    } finally {
      setRequestingTeam(null);
    }
  };

  // Reset filters handler
  const handleResetFilters = () => {
    setInputFilters({
      domain: "",
      skills: [],
      year: "",
      femaleMember: "",
      problems: [],
    });
    setFilters({
      domain: "",
      skills: [],
      year: "",
      femaleMember: "",
      problems: [],
    });
  };

  // Filter out teams where the current user is the leader
  const filteredTeams = (teams ?? []).filter(team => team.leaderId !== currentUserId);

  const fadeIn = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 },
  };

  if (teams === undefined) {
    return (
      <div className="flex justify-center items-center min-h-screen bg-gradient-to-tr from-blue-50 via-white to-orange-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-4 border-blue-600 border-r-4 border-orange-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-900 via-purple-900 to-orange-700 pb-16">
      <div className="max-w-7xl mx-auto px-4 py-10">
        
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Teams Grid */}
          <div className="lg:w-[70%] w-full">
            <div className="flex justify-between items-center mb-8">
              <motion.section
                variants={fadeIn}
                initial="hidden"
                animate="visible"
                transition={{ duration: 0.7 }}
                className="w-full max-w-3xl mx-auto flex flex-col items-center justify-center py-10 px-6 mb-10 bg-gradient-to-br from-blue-100 via-white to-yellow-100 rounded-3xl shadow-2xl border border-blue-200"
              >
                <h1 className="text-4xl md:text-5xl font-extrabold text-blue-900 mb-3 tracking-tight font-display text-center drop-shadow-lg">Browse Open Teams</h1>
                <p className="text-lg md:text-xl text-gray-700 mb-6 font-medium text-center max-w-2xl">Find and join teams that match your skills and interests. Use filters to narrow down your search!</p>
                <div className="flex gap-4 mt-2">
                  <a href="/dashboard" className="px-5 py-2 bg-blue-600 text-white rounded-lg font-semibold shadow hover:bg-blue-700 transition-colors">Your Teams</a>
                  <a href="/teams/create" className="px-5 py-2 bg-orange-500 text-white rounded-lg font-semibold shadow hover:bg-orange-600 flex gap-2 items-center transition-colors">Create Team <PlusIcon/></a>
                </div>
              </motion.section>
            </div>
            {filteredTeams.length === 0 ? (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white/90 backdrop-blur-md rounded-2xl shadow-lg p-10 flex flex-col items-center"
              >
                <p className="text-xl font-semibold text-gray-700 mb-4">No teams found</p>
                <Link
                  to="/teams/create"
                  className="bg-gradient-to-r from-blue-600 via-orange-400 to-yellow-400 text-white font-semibold rounded-lg px-6 py-2 transition"
                >
                  Create the First Team
                </Link>
              </motion.div>
            ) : (
              <div className="flex flex-col gap-8">
                {filteredTeams.map((team) => (
                  <motion.div
                    key={team._id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    whileHover={{ scale: 1.03, boxShadow: "0 8px 32px rgba(37,99,235,0.15)" }}
                    transition={{ duration: 0.4 }}
                    className="bg-white/90 backdrop-blur-md rounded-2xl shadow-lg p-7 flex flex-col gap-3 border border-gray-100 text-[1.15rem] md:text-[1.25rem]"
                  >
                    <div className="flex justify-between items-center mb-2">
                      <h3 className="text-2xl font-bold text-blue-900">{team.name}</h3>
                      <span className="px-3 py-1 bg-blue-100 text-blue-800 text-base rounded-full font-semibold">
                        {team.memberCount}/{team.maxSize}
                      </span>
                    </div>
                    <div className="space-y-1 mb-2">
                      <p className="text-sm text-gray-600">
                        <span className="font-medium">Domain:</span> {team.domain}
                      </p>
                      <p className="text-sm text-gray-600">
                        <span className="font-medium">Problem:</span> {team.problem}
                      </p>
                      {team.leader && (
                        <p className="text-sm text-gray-600">
                          <span className="font-medium">Leader:</span> {team.leader.name}
                        </p>
                      )}
                    </div>
                    <div className="mb-2">
                      <p className="text-sm text-gray-700 line-clamp-3">{team.description}</p>
                    </div>
                    {team.requiredSkills.length > 0 && (
                      <div className="mb-2">
                        <p className="text-base font-medium text-gray-700 mb-1">Required Skills:</p>
                        <div className="flex flex-wrap gap-1">
                          {team.requiredSkills.map((skill) => (
                            <span
                              key={skill}
                              className="px-2 py-1 bg-blue-50 text-blue-800 text-sm rounded"
                            >
                              {skill}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                    <div className="flex justify-between items-center mt-2">
                      <div className="flex items-center space-x-2">
                        {team.requiresFemale && (
                          <span className="px-2 py-1 bg-pink-100 text-pink-800 text-base rounded">
                            Requires Female
                          </span>
                        )}
                      </div>
                      <div className="flex space-x-2">
                        <Link
                          to={`/teams/${team._id}`}
                          className="border border-blue-600 text-blue-600 hover:bg-blue-50 font-semibold rounded-lg px-4 py-1 transition"
                        >
                          View
                        </Link>
                        {currentUserTeams && currentUserTeams.some(t => t._id === team._id) ? (
                          <span className="px-4 py-1 bg-gray-300 text-gray-700 rounded items-center text-base font-semibold py-2">Already Joined</span>
                        ) : (
                          <button
                            onClick={() => handleJoinRequest(team._id)}
                            disabled={requestingTeam === team._id}
                            className="bg-gradient-to-r from-blue-600 via-orange-400 to-yellow-400 text-white font-semibold rounded-lg px-4 py-1 transition disabled:opacity-50"
                          >
                            {requestingTeam === team._id ? "Sending..." : "Request to Join"}
                          </button>
                        )}
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </div>
          {/* Filters Panel */}
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5 }}
            className="lg:w-[30%] w-full bg-white/90 backdrop-blur-md rounded-2xl shadow-lg p-6 sticky top-10 self-start"
          >
            <h2 className="text-xl font-bold text-orange-600 mb-6">Filters</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Technical Skills</label>
                <CreatableSelect
                  isMulti
                  name="skills"
                  options={inputFilters.skills.map(s => ({ value: s, label: s }))}
                  placeholder="Type and add skills..."
                  className="react-select-container"
                  classNamePrefix="react-select"
                  value={inputFilters.skills.map(s => ({ value: s, label: s }))}
                  onChange={(selected) => setInputFilters(prev => ({ ...prev, skills: selected ? selected.map((opt: any) => opt.value) : [] }))}
                  isClearable
                  styles={{
                    control: (base) => ({ ...base, borderRadius: '0.75rem', borderColor: '#d1d5db', minHeight: '2.5rem' }),
                  }}
                  formatCreateLabel={(inputValue) => `Add "${inputValue}"`} />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Year of Study</label>
                <Select
                  name="year"
                  options={yearOptions}
                  value={yearOptions.find(opt => opt.value === inputFilters.year)}
                  onChange={(selected) => setInputFilters(prev => ({ ...prev, year: selected?.value || "" }))}
                  classNamePrefix="react-select"
                  styles={{ control: (base) => ({ ...base, borderRadius: '0.75rem', borderColor: '#d1d5db', minHeight: '2.5rem' }) }}
                  isClearable
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Female Member</label>
                <Select
                  name="femaleMember"
                  options={femaleOptions}
                  value={femaleOptions.find(opt => opt.value === inputFilters.femaleMember)}
                  onChange={(selected) => setInputFilters(prev => ({ ...prev, femaleMember: selected?.value || "" }))}
                  classNamePrefix="react-select"
                  styles={{ control: (base) => ({ ...base, borderRadius: '0.75rem', borderColor: '#d1d5db', minHeight: '2.5rem' }) }}
                  isClearable
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Problem Statements</label>
                <Select
                  isMulti
                  name="problems"
                  options={problemOptions}
                  value={problemOptions.filter(opt => inputFilters.problems.includes(opt.value))}
                  onChange={(selected) => setInputFilters(prev => ({ ...prev, problems: selected ? selected.map((opt: any) => opt.value) : [] }))}
                  classNamePrefix="react-select"
                  styles={{ control: (base) => ({ ...base, borderRadius: '0.75rem', borderColor: '#d1d5db', minHeight: '2.5rem' }) }}
                  isClearable
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Domain</label>
                <input
                  type="text"
                  value={inputFilters.domain}
                  onChange={(e) => setInputFilters(prev => ({ ...prev, domain: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="e.g., Web Development"
                />
              </div>
            </div>
            {/* Selected filter chips/tags */}
            <div className="flex flex-wrap gap-2 mt-4">
              {inputFilters.skills.map(skill => (
                <span key={skill} className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs flex items-center">
                  {skill}
                  <button className="ml-1 text-blue-600 hover:text-blue-900" onClick={() => setInputFilters(prev => ({ ...prev, skills: prev.skills.filter(s => s !== skill) }))}>&times;</button>
                </span>
              ))}
              {inputFilters.year && (
                <span className="px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs flex items-center">
                  {inputFilters.year}
                  <button className="ml-1 text-green-600 hover:text-green-900" onClick={() => setInputFilters(prev => ({ ...prev, year: "" }))}>&times;</button>
                </span>
              )}
              {inputFilters.femaleMember && (
                <span className="px-2 py-1 bg-pink-100 text-pink-800 rounded-full text-xs flex items-center">
                  {femaleOptions.find(opt => opt.value === inputFilters.femaleMember)?.label}
                  <button className="ml-1 text-pink-600 hover:text-pink-900" onClick={() => setInputFilters(prev => ({ ...prev, femaleMember: "" }))}>&times;</button>
                </span>
              )}
              {inputFilters.problems.map(pid => {
                const ps = problemOptions.find(opt => opt.value === pid);
                return ps ? (
                  <span key={pid} className="px-2 py-1 bg-purple-100 text-purple-800 rounded-full text-xs flex items-center">
                    {ps.label}
                    <button className="ml-1 text-purple-600 hover:text-purple-900" onClick={() => setInputFilters(prev => ({ ...prev, problems: prev.problems.filter(p => p !== pid) }))}>&times;</button>
                  </span>
                ) : null;
              })}
              {inputFilters.domain && (
                <span className="px-2 py-1 bg-gray-100 text-gray-800 rounded-full text-xs flex items-center">
                  {inputFilters.domain}
                  <button className="ml-1 text-gray-600 hover:text-gray-900" onClick={() => setInputFilters(prev => ({ ...prev, domain: "" }))}>&times;</button>
                </span>
              )}
            </div>
            <button
              className="mt-4 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-semibold w-full"
              onClick={() => setFilters(inputFilters)}
            >
              Apply Filters
            </button>
            <button
              className="mt-2 px-6 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition font-semibold w-full"
              onClick={handleResetFilters}
            >
              Reset Filters
            </button>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
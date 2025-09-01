import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";

export function Admin() {
  const stats = useQuery(api.admin.getAdminStats);

  if (stats === undefined) {
    return (
      <div className="flex justify-center items-center min-h-96">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50  bg-gradient-to-br from-blue-900 via-purple-900 to-orange-700 pb-16 font-sans">
      {/* Gradient Header */}
      <section className="relative flex flex-col items-center justify-center py-12 px-4 mb-8 bg-gradient-to-br from-orange-100 via-white to-green-100 rounded-b-3xl shadow-lg">
        <h1 className="text-4xl md:text-5xl font-extrabold text-blue-900 mb-2 tracking-tight font-display">Admin Dashboard</h1>
        <p className="text-lg md:text-xl text-gray-700 font-medium">Monitor platform stats and manage teams.</p>
      </section>

      <div className="max-w-7xl mx-auto grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-6 mb-12 px-4">
        <div className="bg-white rounded-2xl shadow-lg p-8 border border-blue-100 flex flex-col items-center">
          <h3 className="text-lg font-bold text-blue-900 mb-2">Total Users</h3>
          <span className="text-3xl font-extrabold text-blue-600">{stats.totalUsers}</span>
        </div>
        <div className="bg-white rounded-2xl shadow-lg p-8 border border-green-100 flex flex-col items-center">
          <h3 className="text-lg font-bold text-green-900 mb-2">Total Teams</h3>
          <span className="text-3xl font-extrabold text-green-600">{stats.totalTeams}</span>
        </div>
        <div className="bg-white rounded-2xl shadow-lg p-8 border border-purple-100 flex flex-col items-center">
          <h3 className="text-lg font-bold text-purple-900 mb-2">Open Teams</h3>
          <span className="text-3xl font-extrabold text-purple-600">{stats.openTeams}</span>
        </div>
        <div className="bg-white rounded-2xl shadow-lg p-8 border border-red-100 flex flex-col items-center">
          <h3 className="text-lg font-bold text-red-900 mb-2">Missing Female</h3>
          <span className="text-3xl font-extrabold text-red-600">{stats.teamsMissingFemale}</span>
        </div>
        <div className="bg-white rounded-2xl shadow-lg p-8 border border-orange-100 flex flex-col items-center">
          <h3 className="text-lg font-bold text-orange-900 mb-2">Open Slots</h3>
          <span className="text-3xl font-extrabold text-orange-600">{stats.totalOpenSlots}</span>
        </div>
        <div className="bg-white rounded-2xl shadow-lg p-8 border border-yellow-100 flex flex-col items-center">
          <h3 className="text-lg font-bold text-yellow-900 mb-2">Pending Requests</h3>
          <span className="text-3xl font-extrabold text-yellow-600">{stats.pendingRequests}</span>
        </div>
        <div className="bg-white rounded-2xl shadow-lg p-8 border border-indigo-100 flex flex-col items-center">
          <h3 className="text-lg font-bold text-indigo-900 mb-2">Pending Invites</h3>
          <span className="text-3xl font-extrabold text-indigo-600">{stats.pendingInvites}</span>
        </div>
      </div>

      {stats.teamsMissingFemaleDetails.length > 0 && (
        <div className="bg-white rounded-2xl shadow-lg p-8 border border-red-200 max-w-3xl mx-auto">
          <h2 className="text-2xl font-bold text-red-900 mb-4 font-display flex items-center gap-2">
            Teams Missing Female Members
            <span className="px-3 py-1 rounded-full bg-red-100 text-red-800 text-sm font-semibold">{stats.teamsMissingFemaleDetails.length}</span>
          </h2>
          <div className="space-y-4">
            {stats.teamsMissingFemaleDetails.map((team) => (
              <div key={team._id} className="border border-gray-200 rounded-xl p-5 bg-gray-50 flex justify-between items-center">
                <div>
                  <h3 className="font-bold text-blue-900 text-lg mb-1">{team.name}</h3>
                  <p className="text-sm text-gray-600">{team.domain}</p>
                  <p className="text-sm text-gray-500">
                    {team.memberCount}/{team.maxSize} members
                  </p>
                </div>
                <div className="flex flex-col items-end gap-2">
                  <span className="px-3 py-1 bg-red-100 text-red-800 text-xs rounded-full font-semibold mb-1">Needs Female</span>
                  <a
                    href={`/teams/${team._id}`}
                    className="px-4 py-2 bg-blue-600 text-white rounded-xl text-sm font-semibold shadow hover:bg-blue-700 transition-all"
                  >
                    View
                  </a>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

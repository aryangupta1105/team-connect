import { useParams } from "react-router-dom";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { toast } from "sonner";
import { useState } from "react";

export function TeamManagement() {
  const { id } = useParams<{ id: string }>();
  const [selectedUserId, setSelectedUserId] = useState<string>("");
  const [inviteMessage, setInviteMessage] = useState("We'd love to have you join our team!");
  
  const managementData = useQuery(api.admin.getTeamManagementData, id ? { teamId: id as any } : "skip");
  const availableProfiles = useQuery(api.profiles.listAvailableProfiles, { lookingOnly: true });
  
  const respondToRequest = useMutation(api.requests.respondToJoinRequest);
  const sendInvite = useMutation(api.requests.sendInvite);
  const cancelInvite = useMutation(api.requests.cancelInvite);
  const removeMember = useMutation(api.requests.removeMember);

  const handleRequestResponse = async (requestId: string, response: "accepted" | "rejected") => {
    try {
      await respondToRequest({ requestId: requestId as any, response });
      toast.success(`Request ${response}`);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to respond");
    }
  };

  const handleSendInvite = async () => {
    if (!id || !selectedUserId) return;
    try {
      await sendInvite({
        teamId: id as any,
        toUserId: selectedUserId as any,
        message: inviteMessage,
      });
      toast.success("Invite sent!");
      setSelectedUserId("");
      setInviteMessage("We'd love to have you join our team!");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to send invite");
    }
  };

  const handleCancelInvite = async (inviteId: string) => {
    try {
      await cancelInvite({ inviteId: inviteId as any });
      toast.success("Invite cancelled");
    } catch (error) {
      toast.error("Failed to cancel invite");
    }
  };

  const handleRemoveMember = async (userId: string, userName: string) => {
    if (!id || !confirm(`Are you sure you want to remove ${userName} from the team?`)) return;
    try {
      await removeMember({ teamId: id as any, userId: userId as any });
      toast.success("Member removed");
    } catch (error) {
      toast.error("Failed to remove member");
    }
  };

  if (managementData === undefined || availableProfiles === undefined) {
    return (
      <div className="flex justify-center items-center min-h-96">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!managementData) {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Team Not Found</h1>
          <p className="text-gray-600">The team you're looking for doesn't exist or you don't have permission to manage it.</p>
        </div>
      </div>
    );
  }

  const { team, members, joinRequests, sentInvites } = managementData;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Manage Team: {team.name}</h1>
        <p className="text-lg text-gray-600">{team.domain}</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Team Members */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">
            Team Members ({members.length}/{team.maxSize})
          </h2>
          <div className="space-y-4">
            {members.map((member) => (
              <div key={member.userId} className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  {member.profile?.avatarUrl && (
                    <img
                      src={member.profile.avatarUrl}
                      alt={member.profile.name}
                      className="w-10 h-10 rounded-full"
                    />
                  )}
                  <div>
                    <h3 className="font-medium text-gray-900">
                      {member.profile?.name || "Unknown User"}
                    </h3>
                    <p className="text-sm text-gray-600">
                      {member.role} • {member.profile?.branch}
                    </p>
                  </div>
                </div>
                {member.role !== "leader" && (
                  <button
                    onClick={() => handleRemoveMember(member.userId, member.profile?.name || "Unknown User")}
                    className="px-3 py-1 bg-red-600 text-white rounded text-sm hover:bg-red-700 transition-colors"
                  >
                    Remove
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Send Invites */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Invite Members</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Select User
              </label>
              <select
                value={selectedUserId}
                onChange={(e) => setSelectedUserId(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Choose a user to invite...</option>
                {availableProfiles
                  ?.filter(profile => 
                    !members.some(member => member.userId === profile.userId) &&
                    !sentInvites.some(invite => invite.toUserId === profile.userId && invite.status === "pending")
                  )
                  .map((profile) => (
                    <option key={profile.userId} value={profile.userId}>
                      {profile.name} - {profile.branch}
                    </option>
                  ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Message
              </label>
              <textarea
                value={inviteMessage}
                onChange={(e) => setInviteMessage(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                rows={3}
              />
            </div>
            <button
              onClick={handleSendInvite}
              disabled={!selectedUserId}
              className="w-full px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Send Invite
            </button>
          </div>
        </div>

        {/* Join Requests */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">
            Join Requests ({joinRequests.length})
          </h2>
          {joinRequests.length === 0 ? (
            <p className="text-gray-500">No pending requests</p>
          ) : (
            <div className="space-y-4">
              {joinRequests.map((request) => (
                <div key={request._id} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="flex items-center space-x-4 mb-2">
                        {request.profile?.avatarUrl && (
                          <img
                            src={request.profile.avatarUrl}
                            alt={request.profile.name}
                            className="w-10 h-10 rounded-full"
                          />
                        )}
                        <div>
                          <h3 className="font-medium text-gray-900">
                            {request.profile?.name || "Unknown User"}
                          </h3>
                          <p className="text-sm text-gray-600">
                            {request.profile?.branch} • Year {request.profile?.year}
                          </p>
                        </div>
                      </div>
                      <p className="text-gray-700 mb-2">{request.message}</p>
                      {request.profile?.skills && (
                        <div className="flex flex-wrap gap-1">
                          {request.profile.skills.map((skill: string) => (
                            <span
                              key={skill}
                              className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded"
                            >
                              {skill}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                    <div className="flex space-x-2 ml-4">
                      <button
                        onClick={() => handleRequestResponse(request._id, "accepted")}
                        className="px-3 py-1 bg-green-600 text-white rounded text-sm hover:bg-green-700 transition-colors"
                      >
                        Accept
                      </button>
                      <button
                        onClick={() => handleRequestResponse(request._id, "rejected")}
                        className="px-3 py-1 bg-red-600 text-white rounded text-sm hover:bg-red-700 transition-colors"
                      >
                        Reject
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Sent Invites */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">
            Sent Invites ({sentInvites.length})
          </h2>
          {sentInvites.length === 0 ? (
            <p className="text-gray-500">No sent invites</p>
          ) : (
            <div className="space-y-4">
              {sentInvites.map((invite) => (
                <div key={invite._id} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="flex items-center space-x-4 mb-2">
                        {invite.profile?.avatarUrl && (
                          <img
                            src={invite.profile.avatarUrl}
                            alt={invite.profile.name}
                            className="w-10 h-10 rounded-full"
                          />
                        )}
                        <div>
                          <h3 className="font-medium text-gray-900">
                            {invite.profile?.name || "Unknown User"}
                          </h3>
                          <p className="text-sm text-gray-600">
                            {invite.profile?.branch}
                          </p>
                        </div>
                      </div>
                      <p className="text-gray-700 mb-2">{invite.message}</p>
                      <span className={`inline-block px-2 py-1 text-xs rounded-full ${
                        invite.status === "pending" 
                          ? "bg-yellow-100 text-yellow-800"
                          : invite.status === "accepted"
                          ? "bg-green-100 text-green-800"
                          : "bg-red-100 text-red-800"
                      }`}>
                        {invite.status}
                      </span>
                    </div>
                    {invite.status === "pending" && (
                      <button
                        onClick={() => handleCancelInvite(invite._id)}
                        className="px-3 py-1 bg-gray-600 text-white rounded text-sm hover:bg-gray-700 transition-colors"
                      >
                        Cancel
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

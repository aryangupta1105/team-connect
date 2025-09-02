import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { toast } from "sonner";
import { motion } from "framer-motion";

export function Requests() {
  const incomingRequests = useQuery(api.requests.getIncomingRequests);
  const myRequests = useQuery(api.requests.getMyRequests);
  const myInvites = useQuery(api.requests.getMyInvites);
  const sentInvites = useQuery(api.requests.getSentInvites);

  const respondToRequest = useMutation(api.requests.respondToJoinRequest);
  const respondToInvite = useMutation(api.requests.respondToInvite);
  const withdrawRequest = useMutation(api.requests.withdrawRequest);
  const cancelInvite = useMutation(api.requests.cancelInvite);

  const handleRequestResponse = async (requestId: string, response: "accepted" | "rejected") => {
    try {
      await respondToRequest({ requestId: requestId as any, response });
      toast.success(`Request ${response}`);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to respond");
    }
  };

  const handleInviteResponse = async (inviteId: string, response: "accepted" | "rejected") => {
    try {
      await respondToInvite({ inviteId: inviteId as any, response });
      toast.success(`Invite ${response}`);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to respond");
    }
  };

  const handleWithdrawRequest = async (requestId: string) => {
    try {
      await withdrawRequest({ requestId: requestId as any });
      toast.success("Request withdrawn");
    } catch (error) {
      toast.error("Failed to withdraw request");
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

  if (
    incomingRequests === undefined ||
    myRequests === undefined ||
    myInvites === undefined ||
    sentInvites === undefined
  ) {
    return (
      <div className="flex justify-center items-center min-h-96">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  // Minimal fade-in for sections
  const fadeIn = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 },
  };


  return (
    <div className="min-h-screen bg-gray-50 font-sans lg:px-0 px-1 bg-gradient-to-br from-blue-900 via-purple-900 to-orange-700 pb-16">
      
      {/* Gradient Header */}
      <motion.section
        variants={fadeIn}
        initial="hidden"
        animate="visible"
        transition={{ duration: 0.7 }}
        className="relative flex flex-col items-center justify-center lg:py-12 py-8 px-4 mb-12 bg-gradient-to-br from-blue-100 via-white to-gray-100 rounded-b-3xl shadow-lg"
      >
        <h1 className="text-4xl md:text-5xl font-extrabold text-blue-900 mb-2 tracking-tight font-display">Requests & Invites</h1>
        <p className="text-lg md:text-xl text-gray-700 font-medium">Manage all your team requests and invites in one place.</p>
      </motion.section>



      <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-8 px-4">
        {/* Left Column: Requests */}
        <div className="flex flex-col gap-8">
          {/* Incoming Requests */}
          <div className="bg-white rounded-2xl shadow-lg p-8 border border-blue-100">
            <h2 className="text-2xl font-bold text-blue-900 mb-4 font-display flex items-center gap-2">
              Incoming Join Requests
              <span className="px-3 py-1 rounded-full bg-blue-100 text-blue-800 text-sm font-semibold">{incomingRequests.length}</span>
            </h2>
            {incomingRequests.length === 0 ? (
              <p className="text-gray-500">No incoming requests</p>
            ) : (
              <div className="space-y-4">
                {incomingRequests.map((request) => (
                  <div key={request._id} className="border border-gray-200 rounded-xl p-5 bg-gray-50">
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <div className="flex items-center space-x-4 mb-2">
                          {request.profile?.avatarUrl && (
                            <img
                              src={request.profile.avatarUrl}
                              alt={request.profile.name}
                              className="w-12 h-12 rounded-full border-2 border-blue-200 shadow"
                            />
                          )}
                          <div>
                            <h3 className="font-medium text-gray-900">
                              {request.profile?.name || "Unknown User"}
                            </h3>
                            <p className="text-sm text-gray-600">
                              wants to join <strong>{request.team.name}</strong>
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
                          className="px-4 py-2 bg-green-600 text-white rounded-xl text-sm font-semibold shadow hover:bg-green-700 transition-all"
                        >
                          Accept
                        </button>
                        <button
                          onClick={() => handleRequestResponse(request._id, "rejected")}
                          className="px-4 py-2 bg-red-600 text-white rounded-xl text-sm font-semibold shadow hover:bg-red-700 transition-all"
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

          {/* My Join Requests */}
          <div className="bg-white rounded-2xl shadow-lg p-8 border border-purple-100">
            <h2 className="text-2xl font-bold text-purple-900 mb-4 font-display flex items-center gap-2">
              My Join Requests
              <span className="px-3 py-1 rounded-full bg-purple-100 text-purple-800 text-sm font-semibold">{myRequests.length}</span>
            </h2>
            {myRequests.length === 0 ? (
              <p className="text-gray-500">No pending requests</p>
            ) : (
              <div className="space-y-4">
                {myRequests.map((request) => (
                  <div key={request._id} className="border border-gray-200 rounded-xl p-5 bg-gray-50">
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <h3 className="font-medium text-gray-900 mb-2">
                          Request to join <strong>{request.team?.name}</strong>
                        </h3>
                        <p className="text-gray-700 mb-2">{request.message}</p>
                        <span className={`inline-block px-2 py-1 text-xs rounded-full ${
                          request.status === "pending" 
                            ? "bg-yellow-100 text-yellow-800"
                            : request.status === "accepted"
                            ? "bg-green-100 text-green-800"
                            : "bg-red-100 text-red-800"
                        }`}>
                          {request.status}
                        </span>
                      </div>
                      {request.status === "pending" && (
                        <button
                          onClick={() => handleWithdrawRequest(request._id)}
                          className="px-4 py-2 bg-gray-600 text-white rounded-xl text-sm font-semibold shadow hover:bg-gray-700 transition-all"
                        >
                          Withdraw
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Invites */}
        <div className="flex flex-col gap-8">
          {/* My Invites */}
          <div className="bg-white rounded-2xl shadow-lg p-8 border border-orange-100">
            <h2 className="text-2xl font-bold text-orange-900 mb-4 font-display flex items-center gap-2">
              Team Invites
              <span className="px-3 py-1 rounded-full bg-orange-100 text-orange-800 text-sm font-semibold">{myInvites.length}</span>
            </h2>
            {myInvites.length === 0 ? (
              <p className="text-gray-500">No pending invites</p>
            ) : (
              <div className="space-y-4">
                {myInvites.map((invite) => (
                  <div key={invite._id} className="border border-gray-200 rounded-xl p-5 bg-gray-50">
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <h3 className="font-medium text-gray-900 mb-2">
                          Invited to join <strong>{invite.team?.name}</strong>
                        </h3>
                        <p className="text-sm text-gray-600 mb-2">
                          From: {invite.fromProfile?.name}
                        </p>
                        <p className="text-gray-700">{invite.message}</p>
                      </div>
                      <div className="flex space-x-2 ml-4">
                        <button
                          onClick={() => handleInviteResponse(invite._id, "accepted")}
                          className="px-4 py-2 bg-green-600 text-white rounded-xl text-sm font-semibold shadow hover:bg-green-700 transition-all"
                        >
                          Accept
                        </button>
                        <button
                          onClick={() => handleInviteResponse(invite._id, "rejected")}
                          className="px-4 py-2 bg-red-600 text-white rounded-xl text-sm font-semibold shadow hover:bg-red-700 transition-all"
                        >
                          Decline
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Sent Invites */}
          <div className="bg-white rounded-2xl shadow-lg p-8 border border-gray-200">
            <h2 className="text-2xl font-bold text-gray-900 mb-4 font-display flex items-center gap-2">
              Sent Invites
              <span className="px-3 py-1 rounded-full bg-gray-100 text-gray-800 text-sm font-semibold">{sentInvites.length}</span>
            </h2>
            {sentInvites.length === 0 ? (
              <p className="text-gray-500">No sent invites</p>
            ) : (
              <div className="space-y-4">
                {sentInvites.map((invite) => (
                  <div key={invite._id} className="border border-gray-200 rounded-xl p-5 bg-gray-50">
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <h3 className="font-medium text-gray-900 mb-2">
                          Invited <strong>{invite.toProfile?.name}</strong> to join <strong>{invite.team?.name}</strong>
                        </h3>
                        <p className="text-gray-700 mb-2">{invite.message}</p>
                        <span className={`inline-block px-2 py-1 text-xs rounded-full ${
                          invite.status === "pending" 
                            ? "bg-yellow-100 text-yellow-800"
                            : invite.status === "accepted"
                            ? "bg-green-100 text-green-800"
                            : invite.status === "rejected"
                            ? "bg-red-100 text-red-800"
                            : "bg-gray-100 text-gray-800"
                        }`}>
                          {invite.status}
                        </span>
                      </div>
                      {invite.status === "pending" && (
                        <button
                          onClick={() => handleCancelInvite(invite._id)}
                          className="px-4 py-2 bg-gray-600 text-white rounded-xl text-sm font-semibold shadow hover:bg-gray-700 transition-all"
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
    </div>
  );
}

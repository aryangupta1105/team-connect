// src/components/teams/TeamDetail.tsx
import React, { useMemo, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { toast } from "sonner";

export function TeamDetail() {
  // contact-related server calls
  const requestContactInfo = useMutation(api.contactRequests.requestContactInfo);
  const respondContactInfoRequest = useMutation(api.contactRequests.respondContactInfoRequest);
  const revokeContactShare = useMutation(api.contactRequests.revokeContactShare);

  // - pending requests TO me (enriched with viewerProfile)
  const contactRequests = useQuery(api.contactRequests.getContactInfoRequests, {}); // requests where current user is recipient

  // - pending requests I have SENT (so we can show "Already sent")
  const mySentRequests = useQuery(api.contactRequests.getMySentContactRequests, {});

  // - the contactShares where I'm the viewer (authorized): used to check who I can view
  const myAuthorizedShares = useQuery(api.contactRequests.getContactSharesForViewer, {});

  // team & profiles
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const team = useQuery(api.teams.getTeam, id ? { teamId: id as any } : "skip");
  const recommendations = useQuery(api.recommendations.getRecommendedProfiles, id ? { teamId: id as any } : "skip");
  const currentUserProfile = useQuery(api.profiles.getCurrentProfile);
  const sendInvite = useMutation(api.requests.sendInvite);
  const deleteTeam = useMutation(api.teams.deleteTeam);
  const leaveTeam = useMutation(api.requests.leaveTeam);

  // UI state
  const [requesting, setRequesting] = useState<Record<string, boolean>>({});
  const [accepting, setAccepting] = useState<Record<string, boolean>>({});

  // Compute a fast lookup map for which owners the current user can already view
  const canViewContactMap = useMemo(() => {
    const map: Record<string, boolean> = {};
    (myAuthorizedShares ?? []).forEach((s: any) => {
      // s.ownerUserId -> the owner whose contact info I (viewer) can see
      map[s.ownerUserId] = true;
    });
    return map;
  }, [myAuthorizedShares]);

  // helper: whether current user has a pending sent request to member
  const hasSentRequestTo = (memberUserId: string) =>
    (mySentRequests ?? []).some((r: any) => r.toUserId === memberUserId);

  // request contact info (viewer asks owner)
  const handleRequestContact = async (userId: string) => {
    setRequesting((p) => ({ ...p, [userId]: true }));
    try {
      await requestContactInfo({ toUserId: userId as any });
      toast.success("Contact info request sent!");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to request contact info");
    } finally {
      setRequesting((p) => ({ ...p, [userId]: false }));
    }
  };

  const handleInvite = async (userId: string) => {
    if (!id) return;
    try {
      await sendInvite({
        teamId: id as any,
        toUserId: userId as any,
        message: "We'd love to have you join our team!",
      });
      toast.success("Invite sent!");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to send invite");
    }
  };

  const handleDeleteTeam = async () => {
    if (!id || !confirm("Are you sure you want to delete this team?")) return;
    try {
      await deleteTeam({ teamId: id as any });
      toast.success("Team deleted");
      navigate("/teams");
    } catch (error) {
      toast.error("Failed to delete team");
    }
  };

  const handleLeaveTeam = async () => {
    if (!id || !confirm("Are you sure you want to leave this team?")) return;
    try {
      await leaveTeam({ teamId: id as any });
      toast.success("Left team");
      navigate("/teams");
    } catch (error) {
      toast.error("Failed to leave team");
    }
  };

  if (team === undefined) {
    return (
      <div className="flex justify-center items-center min-h-96">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!team) {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Team Not Found</h1>
          <p className="text-gray-600">The team you're looking for doesn't exist.</p>
        </div>
      </div>
    );
  }

  const currentUser = team.members.find((m: any) => m.userId === currentUserProfile?.userId);
  const isLeader = currentUser?.role === "leader";
  const isMember = !!currentUser;

  return (
    <div className="w-full flex items-center bg-gradient-to-br from-blue-900 via-purple-900 to-orange-700 pb-16 justify-center mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="rounded-2xl bg-white shadow-lg p-8 mb-8 w-full max-w-5xl">
        <div className="flex justify-between items-start mb-6">
          <div>
            <h1 className="text-3xl font-bold text-blue-900 mb-2 font-display">{team.name}</h1>
            <p className="text-lg text-gray-700 font-medium mb-2">{team.domain}</p>
            {team.description && (
              <p className="text-base text-gray-600 mb-2 italic">{team.description}</p>
            )}
          </div>
          <div className="flex items-end gap-2">
            {isLeader && (
              <>
                <Link
                  to={`/teams/${id}/manage`}
                  className="px-4 py-2 bg-green-600 text-white rounded-xl font-semibold shadow hover:bg-green-700 transition-all"
                >
                  Manage Team
                </Link>
                <button
                  onClick={handleDeleteTeam}
                  className="px-4 py-2 bg-red-600 text-white rounded-xl font-semibold shadow hover:bg-red-700 transition-all"
                >
                  Delete Team
                </button>
              </>
            )}
            {isMember && !isLeader && (
              <button
                onClick={handleLeaveTeam}
                className="px-4 py-2 bg-orange-500 text-white rounded-xl font-semibold shadow hover:bg-orange-600 transition-all"
              >
                Leave Team
              </button>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Members list */}
          <div className="bg-gradient-to-br from-blue-50 via-white to-orange-50 rounded-xl shadow p-6">
            <h2 className="text-xl font-bold text-blue-900 mb-4 font-display flex items-center gap-2">
              Team Members <span className="px-3 py-1 rounded-full bg-blue-100 text-blue-800 text-sm font-semibold">{team.members.length}</span>
            </h2>

            <div className="space-y-4">
              {team.members.map((member: any) => {
                const isCurrentUser = member.userId === currentUserProfile?.userId;
                const canViewContact = canViewContactMap[member.userId] ?? false;
                const alreadySent = hasSentRequestTo(member.userId);

                // show contact button if:
                // - viewer is a member of this team
                // - not looking at yourself
                // - you cannot already view their contact
                // - you haven't already sent a pending request to them
                const showContactButton = isMember && !isCurrentUser && !canViewContact && !alreadySent;

                return (
                  <div key={member.userId} className="flex items-center gap-4 bg-white rounded-xl shadow p-4 border border-blue-100">
                    <img
                      src={member.profile?.avatarUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(member.profile?.name || "User")}`}
                      alt={member.profile?.name}
                      className="w-14 h-14 rounded-full border-2 border-blue-200 shadow"
                    />
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-blue-900 text-lg">{member.profile?.name || "Unknown"}</span>
                        {isCurrentUser && <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded">You</span>}
                        {member.role === "leader" && <span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded">Leader</span>}
                      </div>
                      <div className="text-sm text-gray-600 mb-1">{member.profile?.branch}</div>
                      {member.profile?.skills && member.profile.skills.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-1">
                          {member.profile.skills.map((skill: string) => (
                            <span key={skill} className="px-2 py-1 bg-blue-50 text-blue-800 text-xs rounded">{skill}</span>
                          ))}
                        </div>
                      )}

                      {showContactButton && (
                        <button
                          onClick={() => handleRequestContact(member.userId)}
                          className="mt-2 px-3 py-1 bg-blue-600 text-white rounded text-xs font-semibold hover:bg-blue-700 transition-colors shadow"
                          disabled={requesting[member.userId]}
                        >
                          {requesting[member.userId] ? "Requesting..." : "Ask to Share Contact Info"}
                        </button>
                      )}

                      {alreadySent && (
                        <span className="mt-2 px-3 py-1 bg-yellow-100 text-yellow-800 rounded text-xs font-semibold">Already Sent</span>
                      )}

                      {canViewContact && (
                        <div className="mt-2 bg-blue-50 border p-2 rounded text-blue-800 text-xs">
                          <span className="font-semibold">Contact Info:</span>{" "}
                          {member.profile?.contactInfo ? member.profile.contactInfo : "No contact info available"}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Contact Info Requests for the current user (people who asked this user to share) */}
          <div className="bg-gradient-to-br from-orange-50 via-white to-blue-50 rounded-2xl shadow p-6">
            <h2 className="text-xl font-bold text-orange-900 mb-4 font-display flex items-center gap-2">
              Contact Info Requests
              <span className="px-3 py-1 rounded-full bg-orange-100 text-orange-800 text-sm font-semibold">{(contactRequests ?? []).length}</span>
            </h2>

            {(contactRequests ?? []).length === 0 ? (
              <p className="text-gray-500">No one has requested your contact info.</p>
            ) : (
              <div className="space-y-4">
                {(contactRequests ?? []).map((req: any) => {
                  const avatarUrl = req.viewerProfile?.avatarUrl || "/default-avatar.png";
                  const name = req.viewerProfile?.name || "Unknown";
                  return (
                    <div key={req._id} className="flex items-center gap-4 bg-white rounded-xl shadow p-4 border border-orange-100">
                      <img src={avatarUrl} alt={name} className="w-14 h-14 rounded-full border-2 border-orange-200 shadow" />
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-orange-900 text-lg">{name}</span>
                        </div>
                        <div className="text-sm text-gray-600 mb-1">wants your contact info</div>
                        <div className="flex gap-2 mt-2">
                          <button
                            onClick={async () => {
                              setAccepting((p) => ({ ...p, [req._id]: true }));
                              try {
                                await respondContactInfoRequest({ requestId: req._id, accept: true });
                                toast.success("Request accepted");
                              } catch (error) {
                                toast.error("Failed to accept request");
                              } finally {
                                setAccepting((p) => ({ ...p, [req._id]: false }));
                              }
                            }}
                            className="px-4 py-2 bg-green-600 text-white rounded-xl text-sm font-semibold shadow hover:bg-green-700 transition-all"
                            disabled={!!accepting[req._id]}
                          >
                            Accept
                          </button>

                          <button
                            onClick={async () => {
                              setAccepting((p) => ({ ...p, [req._id]: true }));
                              try {
                                await respondContactInfoRequest({ requestId: req._id, accept: false });
                                toast.success("Request rejected");
                              } catch (error) {
                                toast.error("Failed to reject request");
                              } finally {
                                setAccepting((p) => ({ ...p, [req._id]: false }));
                              }
                            }}
                            className="px-4 py-2 bg-red-600 text-white rounded-xl text-sm font-semibold shadow hover:bg-red-700 transition-all"
                            disabled={!!accepting[req._id]}
                          >
                            Reject
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Recommendations */}
        {isLeader && recommendations && recommendations.length > 0 && (
          <div className="bg-gradient-to-br from-orange-50 via-white to-blue-50 rounded-xl shadow p-6 mt-8">
            <h2 className="text-xl font-bold text-orange-900 mb-4 font-display flex items-center gap-2">
              Recommended Members <span className="px-3 py-1 rounded-full bg-orange-100 text-orange-800 text-sm font-semibold">{recommendations.length}</span>
            </h2>
            <div className="space-y-4">
              {recommendations.slice(0, 5).map((profile) => (
                <div key={profile.userId} className="flex items-center justify-between bg-white rounded-xl shadow p-4 border border-orange-100">
                  <div className="flex items-center space-x-4">
                    <img
                      src={profile.avatarUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(profile.name || "User")}`}
                      alt={profile.name}
                      className="w-12 h-12 rounded-full border-2 border-blue-200 shadow"
                    />
                    <div>
                      <Link to={`/profiles/${profile.userId}`} className="font-semibold text-gray-900 hover:text-blue-600 transition-colors text-lg">
                        {profile.name}
                      </Link>
                      <p className="text-sm text-gray-600 mb-1">{profile.branch}</p>
                      {profile.skillMatches.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-1">
                          {profile.skillMatches?.map((skill: string) => (
                            <span key={skill} className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded">{skill}</span>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                  <button onClick={() => handleInvite(profile.userId)} className="px-3 py-1 bg-blue-600 text-white rounded text-sm font-semibold hover:bg-blue-700 transition-colors shadow">
                    Invite
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

      </div>
    </div>
  );
}

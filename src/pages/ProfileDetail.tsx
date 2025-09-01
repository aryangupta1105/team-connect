import { useParams } from "react-router-dom";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import React, { useState } from "react";

export function ProfileDetail() {
  const { userId } = useParams<{ userId: string }>();
  const profile = useQuery(api.profiles.getProfile, userId ? { userId: userId as any } : "skip");
  const currentUserProfile = useQuery(api.profiles.getCurrentProfile);
  const requestContactInfo = useMutation(api.contactRequests.requestContactInfo);
  const respondContactInfoRequest = useMutation(api.contactRequests.respondContactInfoRequest);
  const revokeContactShare = useMutation(api.contactRequests.revokeContactShare);
  const contactRequests = useQuery(api.contactRequests.getContactInfoRequests, {});
  const canViewContact = useQuery(api.contactRequests.canViewContact, userId && currentUserProfile?.userId ? { ownerUserId: userId as any, viewerUserId: currentUserProfile.userId as any } : "skip");
  const [requesting, setRequesting] = useState(false);
  const [requestSent, setRequestSent] = useState(false);
  const handleRequestContact = async () => {
    setRequesting(true);
    try {
  await requestContactInfo({ toUserId: userId as any });
      setRequestSent(true);
    } catch (e) {
      // handle error, e.g. toast
    } finally {
      setRequesting(false);
    }
  };

  if (profile === undefined) {
    return (
      <div className="flex justify-center items-center min-h-96">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Profile Not Found</h1>
          <p className="text-gray-600">The profile you're looking for doesn't exist.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="bg-white rounded-lg shadow p-8">
        <div className="flex items-center space-x-6 mb-8">
          <img
            src={
              profile.avatarUrl
                ? profile.avatarUrl
                : profile.gender === 'm'
                ? "https://png.pngtree.com/png-clipart/20230927/original/pngtree-man-avatar-image-for-profile-png-image_13001882.png"
                : "https://img.freepik.com/premium-vector/cute-woman-avatar-profile-vector-illustration_1058532-14592.jpg?w=2000"
            }
            alt={profile.name}
            className="w-24 h-24 rounded-full"
          />
          <div className="flex-1">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">{profile.name}</h1>
            <p className="text-lg text-gray-600 mb-2">
              {profile.branch} • Year {profile.year}
            </p>
            <div className="flex items-center space-x-4">
              <span className={`px-3 py-1 text-sm rounded-full ${
                profile.gender === "f" 
                  ? "bg-pink-100 text-pink-800"
                  : profile.gender === "m"
                  ? "bg-blue-100 text-blue-800"
                  : "bg-gray-100 text-gray-800"
              }`}>
                {profile.gender === "f" ? "Female" : profile.gender === "m" ? "Male" : "Other"}
              </span>
              {profile.isLooking && (
                <span className="px-3 py-1 bg-green-100 text-green-800 text-sm rounded-full">
                  Looking for team
                </span>
              )}
            </div>
            {/* Contact Info Section */}
            {userId && currentUserProfile?.userId && userId !== currentUserProfile.userId && (
              <div className="mt-4">
                {profile.contactInfo && canViewContact ? (
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-2">
                    <span className="font-semibold text-blue-900">Contact Info:</span>
                    <span className="ml-2 text-blue-800">{profile.contactInfo}</span>
                  </div>
                ) : (
                  <button
                    className="px-4 py-2 bg-orange-400 text-white rounded-lg font-semibold hover:bg-orange-500 transition-colors shadow"
                    onClick={handleRequestContact}
                    disabled={requesting || requestSent}
                  >
                    {requestSent ? "Request Sent" : requesting ? "Requesting..." : "Ask to Share Contact Info"}
                  </button>
                )}
              </div>
            )}
          </div>
        </div>

        {profile.bio && (
          <div className="mb-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">About</h2>
            <p className="text-gray-700 leading-relaxed">{profile.bio}</p>
          </div>
        )}

        {profile.skills.length > 0 && (
          <div className="mb-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Skills</h2>
            <div className="flex flex-wrap gap-2">
              {profile.skills.map((skill: string) => (
                <span
                  key={skill}
                  className="px-3 py-2 bg-blue-100 text-blue-800 rounded-lg text-sm font-medium"
                >
                  {skill}
                </span>
              ))}
            </div>
          </div>
        )}

        {profile.links.length > 0 && (
          <div className="mb-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Links</h2>
            <div className="space-y-2">
              {profile.links.map((link: string) => (
                <a
                  key={link}
                  href={link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block text-blue-600 hover:text-blue-800 hover:underline"
                >
                  {link}
                </a>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

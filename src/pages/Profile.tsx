import { useState, useEffect } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { toast } from "sonner";
import { motion } from "framer-motion";

export function Profile() {
  const [linkError, setLinkError] = useState("");
  function isValidUrl(url: string) {
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  }
  const profile = useQuery(api.profiles.getCurrentProfile);
  const generateUploadUrl = useMutation(api.profiles.generateUploadUrl);
  const updateProfile = useMutation(api.profiles.createOrUpdateProfile);

  type ProfileForm = {
    name: string;
    branch: string;
    year: number;
    gender: "m" | "f" | "o";
    skills: string[];
    bio: string;
    links: string[];
    isLooking: boolean;
    avatar?: string;
    contactInfo?: string;
  };

  const [formData, setFormData] = useState<ProfileForm>({
    name: "",
    branch: "",
    year: 1,
    gender: "m",
    skills: [],
    bio: "",
    links: [],
    isLooking: true,
    avatar: undefined,
    contactInfo: "",
  });

  const [previewPic, setPreviewPic] = useState("");
  const [skillInput, setSkillInput] = useState("");
  const [linkInput, setLinkInput] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // ✅ Initialize form data only when profile changes
  useEffect(() => {
    if (profile) {
      setFormData(prev => ({
        ...prev,
        name: profile.name,
        branch: profile.branch,
        year: profile.year,
        gender: profile.gender,
        skills: profile.skills,
        bio: profile.bio,
        links: profile.links,
        isLooking: profile.isLooking,
        contactInfo: profile.contactInfo || "",
        // ⚡ Don’t overwrite avatar if user already picked a new one
        avatar: prev.avatar ?? profile.avatar ?? undefined,
      }));

      // ⚡ Don’t overwrite previewPic if user already uploaded a new one
      setPreviewPic(prev => prev || profile.avatarUrl || "");
    }
  }, [profile]);

  // Profile completion calculation
  function getProfileCompletion(data: typeof formData) {
    let filled = 0;
    if (data.name) filled++;
    if (data.branch) filled++;
    if (data.year) filled++;
    if (data.gender) filled++;
    if (data.skills.length > 0) filled++;
    if (data.bio) filled++;
    if (data.links.length > 0) filled++;
    if (data.avatar) filled++;
    if (data.contactInfo) filled++;
    return Math.round((filled / 9) * 100); // 9 fields
  }
  const completion = getProfileCompletion(formData);

  // Profile picture upload handler
  const handlePicChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
  const file = e.target.files?.[0];
  if (!file) return;

  // Show instant local preview
  const localUrl = URL.createObjectURL(file);
  setPreviewPic(localUrl);

  try {
    // 1. Get upload URL from Convex
    const uploadUrl = await generateUploadUrl({});

    // 2. Upload file to storage
    const res = await fetch(uploadUrl, {
      method: "POST",
      headers: { "Content-Type": file.type },
      body: file,
    });
    if (!res.ok) throw new Error("Upload failed");

    // 3. Convex responds with { storageId }
    const { storageId } = await res.json();

    // 4. Save storageId to formData
    setFormData(prev => ({ ...prev, avatar: storageId }));

    // 5. ✅ Fetch the permanent URL from Convex so we don’t lose preview on reload
    const fileUrl = uploadUrl.split("?")[0]; // quick hack, storage URL is before the "?"
    setPreviewPic(fileUrl);

    toast.success("Profile picture uploaded!");
  } catch (err) {
    console.error(err);
    toast.error("Failed to upload profile picture");
  }
};


  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      await updateProfile({
        name: formData.name,
        branch: formData.branch,
        year: formData.year,
        gender: formData.gender,
        skills: formData.skills,
        bio: formData.bio,
        links: formData.links,
        isLooking: formData.isLooking,
        avatar: formData.avatar as any,
        contactInfo: formData.contactInfo,
      });
      toast.success("Profile updated successfully!");
    } catch {
      toast.error("Failed to update profile");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Skill handlers
  const addSkill = () => {
    if (skillInput.trim() && !formData.skills.includes(skillInput.trim())) {
      setFormData(prev => ({ ...prev, skills: [...prev.skills, skillInput.trim()] }));
      setSkillInput("");
    }
  };
  const removeSkill = (skill: string) => {
    setFormData(prev => ({ ...prev, skills: prev.skills.filter(s => s !== skill) }));
  };

  // Link handlers
  const addLink = () => {
    if (!linkInput.trim()) return;
    if (!isValidUrl(linkInput.trim())) {
      setLinkError("Please enter a valid URL.");
      return;
    }
    if (formData.links.includes(linkInput.trim())) {
      setLinkError("");
      return;
    }
    setFormData(prev => ({ ...prev, links: [...prev.links, linkInput.trim()] }));
    setLinkInput("");
    setLinkError("");
  };
  const removeLink = (link: string) => {
    setFormData(prev => ({ ...prev, links: prev.links.filter(l => l !== link) }));
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-900 via-purple-900 to-orange-700 pb-16 flex items-center justify-center py-10">
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-2xl w-full mx-auto px-4"
      >
        <div className="bg-gray-200/90 backdrop-blur-md rounded-2xl shadow-lg p-8 border border-gray-100">
          {/* Avatar */}
          <div className="flex flex-col items-center mb-6">
            <div className="relative">
              <img
                src={previewPic || "/default-avatar.png"}
                alt="Profile"
                className="w-28 h-28 rounded-full object-cover border-4 border-blue-200"
              />
              <label className="absolute bottom-0 right-0 bg-blue-600 text-white rounded-full p-2 cursor-pointer shadow-lg hover:bg-blue-700 transition-colors">
                <input type="file" accept="image/*" onChange={handlePicChange} className="hidden" />
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15.232 5.232l3.536 3.536M9 13l6-6m2 2a2.828 2.828 0 11-4-4 2.828 2.828 0 014 4z" />
                </svg>
              </label>
            </div>
            <div className="w-full mt-4">
              <span className="text-xs text-gray-500">{completion}% Complete</span>
            </div>
          </div>

          <h1 className="text-2xl font-bold text-blue-900 mb-6 text-center">
            {profile ? "Edit Profile" : "Create Profile"}
          </h1>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Name */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Name</label>
              <input
                type="text"
                value={formData.name}
                onChange={e => setFormData(prev => ({ ...prev, name: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
              <p className="text-xs text-yellow-700 mt-1"><span className="font-bold">Note:</span> Enter your full name as it will be visible to teams.</p>
            </div>

            {/* Branch & Year */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Branch</label>
                <input
                  type="text"
                  value={formData.branch}
                  onChange={e => setFormData(prev => ({ ...prev, branch: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Year</label>
                 <select
                  value={formData.year}
                  onChange={e => setFormData(prev => ({ ...prev, year: parseInt(e.target.value) }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                >
                  <option value={1}>1st Year</option>
                  <option value={2}>2nd Year</option>
                  <option value={3}>3rd Year</option>
                  <option value={4}>4th Year</option>
                </select>
              </div>
            </div>

            {/* Gender */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Gender</label>
              <select
                value={formData.gender}
                onChange={e => setFormData(prev => ({ ...prev, gender: e.target.value as "m" | "f" | "o" }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              >
                <option value="m">Male</option>
                <option value="f">Female</option>
                <option value="o">Other</option>
              </select>
            </div>

            {/* Contact Info */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Phone / WhatsApp</label>
              <input
                type="tel"
                value={formData.contactInfo}
                onChange={e => setFormData(prev => ({ ...prev, contactInfo: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Your phone number (hidden until shared)"
              />
              <p className="text-xs text-yellow-700 mt-1"><span className="font-bold">Note:</span> Your contact info is hidden until you share it with a team.</p>
            </div>

            {/* Skills */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Skills</label>
              <div className="flex gap-2 mb-2">
                <input
                  type="text"
                  value={skillInput}
                  onChange={e => setSkillInput(e.target.value)}
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Add a skill and press Enter (no hashtags)"
                  onKeyPress={e => e.key === "Enter" && (e.preventDefault(), addSkill())}
                />
              </div>
              <p className="text-xs text-yellow-700 mb-2"><span className="font-bold">Note:</span> Add skills as plain words (no hashtags), press Enter to add each skill.</p>
              <div className="flex flex-wrap gap-2">
                {formData.skills.map(skill => (
                  <span key={skill} className="inline-flex items-center px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm">
                    {skill}
                    <button type="button" onClick={() => removeSkill(skill)} className="ml-2 text-blue-600 hover:text-blue-800">×</button>
                  </span>
                ))}
              </div>
            </div>

            {/* Bio */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Bio</label>
              <textarea
                value={formData.bio}
                onChange={e => setFormData(prev => ({ ...prev, bio: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                rows={4}
                placeholder="Tell us about yourself..."
              />
            </div>

            {/* Links */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Links <span className="text-gray-500">(add LinkedIn, github, portfolio, LeetCode, project links, etc. to get your profile noticed)</span></label>
              <div className="flex gap-2 mb-2">
                <input
                  type="url"
                  value={linkInput}
                  onChange={e => {
                    setLinkInput(e.target.value);
                    setLinkError("");
                  }}
                  className={`flex-1 px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${linkError ? 'border-red-400' : 'border-gray-300'}`}
                  placeholder="e.g. https://linkedin.com/in/username"
                  onKeyPress={e => e.key === "Enter" && (e.preventDefault(), addLink())}
                />
                <button type="button" onClick={addLink} className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
                  Add
                </button>
              </div>
              {linkError && <p className="text-xs text-red-600 mb-2"><span className="font-bold">Error:</span> {linkError}</p>}
              <p className="text-xs text-yellow-700 mb-2"><span className="font-bold">Note:</span> Add more socials and project links to get your profile noticed (LinkedIn, portfolio, LeetCode, GitHub, etc.).</p>
              <div className="space-y-2">
                {formData.links.map(link => (
                  <div key={link} className="flex items-center justify-between bg-gray-50 px-3 py-2 rounded-lg">
                    <a href={link} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:text-blue-800 text-sm">
                      {link}
                    </a>
                    <button type="button" onClick={() => removeLink(link)} className="text-red-600 hover:text-red-800">×</button>
                  </div>
                ))}
              </div>
            </div>

            {/* Looking for Team */}
            <div className="flex items-center">
              <input
                type="checkbox"
                id="isLooking"
                checked={formData.isLooking}
                onChange={e => setFormData(prev => ({ ...prev, isLooking: e.target.checked }))}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <label htmlFor="isLooking" className="ml-2 block text-sm text-gray-700">
                I'm looking for a team
              </label>
            </div>

            {/* Save */}
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full px-4 py-2 bg-gradient-to-r from-blue-600 via-orange-400 to-yellow-400 text-white rounded-lg hover:from-blue-700 hover:via-orange-500 hover:to-yellow-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-semibold"
            >
              {isSubmitting ? "Saving..." : "Save Profile"}
            </button>
          </form>
        </div>
      </motion.div>
    </div>
  );
}

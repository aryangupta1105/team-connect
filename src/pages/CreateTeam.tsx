import Select from "react-select";
import { problemStatements } from "../lib/problemStatements";
  const problemOptions = problemStatements.map(ps => ({ value: ps.id, label: `${ps.title} (${ps.id})` }));
import { useState } from "react";
import { useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";

export function CreateTeam() {
  const navigate = useNavigate();
  const createTeam = useMutation(api.teams.createTeam);

  const [formData, setFormData] = useState({
    name: "",
    domain: "",
    problem: "",
    description: "",
    maxSize: 6,
    requiresFemale: true,
    requiredSkills: [] as string[],
  });

  const [skillInput, setSkillInput] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const teamId = await createTeam(formData);
      toast.success("Team created successfully!");
      navigate(`/teams/${teamId}`);
    } catch (error) {
      toast.error("Failed to create team");
    } finally {
      setIsSubmitting(false);
    }
  };

  const addSkill = () => {
    if (skillInput.trim() && !formData.requiredSkills.includes(skillInput.trim())) {
      setFormData(prev => ({
        ...prev,
        requiredSkills: [...prev.requiredSkills, skillInput.trim()]
      }));
      setSkillInput("");
    }
  };

  const removeSkill = (skill: string) => {
    setFormData(prev => ({
      ...prev,
      requiredSkills: prev.requiredSkills.filter(s => s !== skill)
    }));
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-900 via-purple-900 to-orange-700 pb-16 flex items-center justify-center">
      <div className="w-full max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-2xl shadow-xl p-6 sm:p-8 border border-blue-100">
          <h1 className="text-3xl md:text-4xl font-extrabold text-blue-900 mb-6 font-display text-center bg-gradient-to-r from-orange-800 via-green-800 to-blue-900 bg-clip-text text-transparent">
            Create New Team
          </h1>
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Team Name */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Team Name</label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 text-base font-medium bg-gray-50"
                required
              />
            </div>
            {/* Domain */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Domain</label>
              <input
                type="text"
                value={formData.domain}
                onChange={(e) => setFormData(prev => ({ ...prev, domain: e.target.value }))}
                className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 text-base font-medium bg-gray-50"
                placeholder="e.g., Web Development, AI/ML, Mobile Apps"
                required
              />
            </div>
            {/* Problem Statement */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Problem Statements</label>
              <Select
                isMulti
                name="problems"
                options={problemOptions}
                value={problemOptions.filter(opt => formData.problem.split(", ").includes(opt.value))}
                onChange={(selected) =>
                  setFormData(prev => ({
                    ...prev,
                    problem: selected && selected.length > 0 ? selected.map((opt) => opt.value).join(", ") : ""
                  }))
                }
                classNamePrefix="react-select"
                styles={{ control: (base) => ({ ...base, borderRadius: "0.75rem", borderColor: "#d1d5db", minHeight: "2.5rem" }) }}
                isClearable
              />
            </div>
            {/* Description */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 text-base font-medium bg-gray-50"
                rows={4}
                placeholder="Describe your project idea..."
                required
              />
            </div>
            {/* Maximum Team Size */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Maximum Team Size</label>
              <input
                type="number"
                min={2}
                max={10}
                value={formData.maxSize}
                onChange={(e) => setFormData(prev => ({ ...prev, maxSize: Number(e.target.value) }))}
                className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 text-base font-medium bg-gray-50"
                required
              />
            </div>
            {/* Requires Female Member */}
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={formData.requiresFemale}
                onChange={(e) => setFormData(prev => ({ ...prev, requiresFemale: e.target.checked }))}
                className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                id="requiresFemale"
              />
              <label htmlFor="requiresFemale" className="text-sm text-gray-700">Requires Female Member</label>
            </div>
            {/* Required Skills */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Required Skills</label>
              <div className="flex flex-wrap gap-2 mb-2">
                {formData.requiredSkills.map((skill) => (
                  <span key={skill} className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-xs font-semibold flex items-center gap-1">
                    {skill}
                    <button type="button" className="ml-1 text-red-500 hover:text-red-700" onClick={() => removeSkill(skill)}>&times;</button>
                  </span>
                ))}
              </div>
              <input
                type="text"
                value={skillInput}
                onChange={(e) => setSkillInput(e.target.value)}
                onKeyDown={e => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    if (skillInput.trim() && !formData.requiredSkills.includes(skillInput.trim())) {
                      addSkill();
                    }
                  }
                }}
                className="flex-1 px-4 py-2 rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 text-base font-medium bg-gray-50"
                placeholder="Add a skill and press Enter..."
              />
            </div>
            {/* Submit Button */}
            <div className="pt-4">
              <button
                type="submit"
                className={`w-full px-6 py-3 rounded-xl font-bold text-lg shadow transition-all bg-gradient-to-r from-orange-400 via-blue-500 to-green-500 text-white hover:scale-105 hover:shadow-xl ${isSubmitting ? "opacity-60 cursor-not-allowed" : ""}`}
                disabled={isSubmitting}
              >
                {isSubmitting ? "Creating..." : "Create Team"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

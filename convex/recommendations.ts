import { v } from "convex/values";
import { query } from "./_generated/server";
import { getAuthUserId } from "@convex-dev/auth/server";

export const getRecommendedProfiles = query({
  args: { teamId: v.id("teams") },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return [];

    const team = await ctx.db.get(args.teamId);
    if (!team) return [];
    if (team.leaderId !== userId) return [];

    // Get current team members
    const currentMembers = await ctx.db
      .query("teamMembers")
      .withIndex("by_team", (q) => q.eq("teamId", args.teamId))
      .collect();

    const memberUserIds = currentMembers.map(m => m.userId);

    // Get all available profiles
    const allProfiles = await ctx.db
      .query("profiles")
      .withIndex("by_looking", (q) => q.eq("isLooking", true))
      .collect();

    // Filter out current members
    const availableProfiles = allProfiles.filter(
      profile => !memberUserIds.includes(profile.userId)
    );

    // Check if team needs a female member
    const needsFemale = team.requiresFemale && currentMembers.length > 0;
    let hasFemale = false;

    if (needsFemale) {
      for (const member of currentMembers) {
        const memberProfile = await ctx.db
          .query("profiles")
          .withIndex("by_user", (q) => q.eq("userId", member.userId))
          .unique();
        if (memberProfile?.gender === "f") {
          hasFemale = true;
          break;
        }
      }
    }

    // Score profiles based on skill overlap and female requirement
    const scoredProfiles = availableProfiles.map(profile => {
      let score = 0;

      // Skill overlap scoring
      const skillOverlap = profile.skills.filter(skill =>
        team.requiredSkills.some(reqSkill =>
          reqSkill.toLowerCase().includes(skill.toLowerCase()) ||
          skill.toLowerCase().includes(reqSkill.toLowerCase())
        )
      );
      score += skillOverlap.length * 10;

      // Female requirement bonus
      if (needsFemale && !hasFemale && profile.gender === "f") {
        score += 50;
      }

      return {
        ...profile,
        score,
        skillMatches: skillOverlap,
      };
    });

    // Sort by score and return top 10
    const recommendations = scoredProfiles
      .sort((a, b) => b.score - a.score)
      .slice(0, 10);

    return Promise.all(
      recommendations.map(async (profile) => ({
        ...profile,
        avatarUrl: profile.avatar ? await ctx.storage.getUrl(profile.avatar) : null,
      }))
    );
  },
});

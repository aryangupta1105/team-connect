import { v } from "convex/values";
import { query, mutation } from "./_generated/server";
import { getAuthUserId } from "@convex-dev/auth/server";

export const createTeam = mutation({
  args: {
    name: v.string(),
    domain: v.string(),
    problem: v.string(),
    description: v.string(),
    maxSize: v.number(),
    requiresFemale: v.boolean(),
    requiredSkills: v.array(v.string()),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    // Validate maxSize
    if (args.maxSize < 2 || args.maxSize > 6) {
      throw new Error("Team size must be between 2 and 6");
    }

    const teamId = await ctx.db.insert("teams", {
      name: args.name,
      domain: args.domain,
      problem: args.problem,
      description: args.description,
      leaderId: userId,
      maxSize: args.maxSize,
      requiresFemale: args.requiresFemale,
      isOpen: true,
      requiredSkills: args.requiredSkills,
    });

    // Add leader as team member
    await ctx.db.insert("teamMembers", {
      teamId,
      userId,
      role: "leader",
      joinedAt: Date.now(),
    });

    return teamId;
  },
});

export const updateTeam = mutation({
  args: {
    teamId: v.id("teams"),
    name: v.string(),
    domain: v.string(),
    problem: v.string(),
    description: v.string(),
    maxSize: v.number(),
    requiresFemale: v.boolean(),
    isOpen: v.boolean(),
    requiredSkills: v.array(v.string()),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const team = await ctx.db.get(args.teamId);
    if (!team) throw new Error("Team not found");
    if (team.leaderId !== userId) throw new Error("Only team leader can update team");

    await ctx.db.patch(args.teamId, {
      name: args.name,
      domain: args.domain,
      problem: args.problem,
      description: args.description,
      maxSize: args.maxSize,
      requiresFemale: args.requiresFemale,
      isOpen: args.isOpen,
      requiredSkills: args.requiredSkills,
    });
  },
});

export const getTeam = query({
  args: { teamId: v.id("teams") },
  handler: async (ctx, args) => {
    const team = await ctx.db.get(args.teamId);
    if (!team) return null;

    const members = await ctx.db
      .query("teamMembers")
      .withIndex("by_team", (q) => q.eq("teamId", args.teamId))
      .collect();

    const memberProfiles = await Promise.all(
      members.map(async (member) => {
        const profile = await ctx.db
          .query("profiles")
          .withIndex("by_user", (q) => q.eq("userId", member.userId))
          .unique();
        return {
          ...member,
          profile: profile ? {
            ...profile,
            avatarUrl: profile.avatar ? await ctx.storage.getUrl(profile.avatar) : null,
          } : null,
        };
      })
    );

    return {
      ...team,
      members: memberProfiles,
    };
  },
});

export const listOpenTeams = query({
  args: {
    domainFilter: v.optional(v.string()),
    skillFilter: v.optional(v.string()),
    yearFilter: v.optional(v.string()),            // ✅ added
    femaleMemberFilter: v.optional(v.string()),    // ✅ added
    problemFilter: v.optional(v.string()),         // ✅ also add since frontend uses it
  },
  handler: async (ctx, args) => {
    let query = ctx.db.query("teams").withIndex("by_open", (q) => q.eq("isOpen", true));

    const teams = await query.collect();
    let filteredTeams = teams;

    // --- Domain filter ---
    if (args.domainFilter) {
      filteredTeams = filteredTeams.filter(team =>
        team.domain.toLowerCase().includes(args.domainFilter!.toLowerCase())
      );
    }

    // --- Skill filter ---
    if (args.skillFilter) {
      const skills = args.skillFilter.split(",");
      filteredTeams = filteredTeams.filter(team =>
        skills.every(skill =>
          team.requiredSkills.some((ts) => ts.toLowerCase().includes(skill.toLowerCase()))
        )
      );
    }

    // --- Year filter (based on team members' profile.year) ---
    if (args.yearFilter) {
      const yearFilter = args.yearFilter.toLowerCase();
      filteredTeams = await Promise.all(
        filteredTeams.map(async (team) => {
          const members = await ctx.db
            .query("teamMembers")
            .withIndex("by_team", (q) => q.eq("teamId", team._id))
            .collect();

          const profiles = await Promise.all(
            members.map(async (m) =>
              ctx.db.query("profiles").withIndex("by_user", (q) => q.eq("userId", m.userId)).unique()
            )
          );

          const hasYear = profiles.some(
            (p) => p && String(p.year).toLowerCase().includes(yearFilter)
          );
          return hasYear ? team : null;
        })
      ).then((teams) => teams.filter((t): t is NonNullable<typeof t> => t !== null));
    }

    // --- Female member filter ---
    if (args.femaleMemberFilter) {
      if (args.femaleMemberFilter === "requires") {
        filteredTeams = filteredTeams.filter((team) => team.requiresFemale);
      } else if (args.femaleMemberFilter === "has") {
        filteredTeams = await Promise.all(
          filteredTeams.map(async (team) => {
            const members = await ctx.db
              .query("teamMembers")
              .withIndex("by_team", (q) => q.eq("teamId", team._id))
              .collect();

            const profiles = await Promise.all(
              members.map(async (m) =>
                ctx.db.query("profiles").withIndex("by_user", (q) => q.eq("userId", m.userId)).unique()
              )
            );

            const hasFemale = profiles.some((p) => p?.gender === "f");
            return hasFemale ? team : null;
          })
        ).then((teams) => teams.filter((t): t is NonNullable<typeof t> => t !== null));
      }
    }

    // --- Problem filter ---
    if (args.problemFilter) {
      const problems = args.problemFilter.split(",");
      filteredTeams = filteredTeams.filter((team) =>
        problems.some((pid) => team.problem === pid)
      );
    }

    // --- Attach extra info ---
    return Promise.all(
      filteredTeams.map(async (team) => {
        const members = await ctx.db
          .query("teamMembers")
          .withIndex("by_team", (q) => q.eq("teamId", team._id))
          .collect();

        const leader = await ctx.db
          .query("profiles")
          .withIndex("by_user", (q) => q.eq("userId", team.leaderId))
          .unique();

        return {
          ...team,
          memberCount: members.length,
          leader: leader
            ? {
                ...leader,
                avatarUrl: leader.avatar ? await ctx.storage.getUrl(leader.avatar) : null,
              }
            : null,
        };
      })
    );
  },
});


export const getMyTeams = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return [];

    const memberships = await ctx.db
      .query("teamMembers")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .collect();

    return Promise.all(
      memberships.map(async (membership) => {
        const team = await ctx.db.get(membership.teamId);
        if (!team) return null;

        const memberCount = await ctx.db
          .query("teamMembers")
          .withIndex("by_team", (q) => q.eq("teamId", team._id))
          .collect();

        return {
          ...team,
          memberCount: memberCount.length,
          myRole: membership.role,
        };
      })
    ).then(teams => teams.filter((team): team is NonNullable<typeof team> => team !== null));
  },
});

export const deleteTeam = mutation({
  args: { teamId: v.id("teams") },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const team = await ctx.db.get(args.teamId);
    if (!team) throw new Error("Team not found");
    if (team.leaderId !== userId) throw new Error("Only team leader can delete team");

    // Delete all team members
    const members = await ctx.db
      .query("teamMembers")
      .withIndex("by_team", (q) => q.eq("teamId", args.teamId))
      .collect();
    
    for (const member of members) {
      await ctx.db.delete(member._id);
    }

    // Delete all join requests
    const requests = await ctx.db
      .query("joinRequests")
      .withIndex("by_team", (q) => q.eq("teamId", args.teamId))
      .collect();
    
    for (const request of requests) {
      await ctx.db.delete(request._id);
    }

    // Delete all invites
    const invites = await ctx.db
      .query("invites")
      .withIndex("by_team", (q) => q.eq("teamId", args.teamId))
      .collect();
    
    for (const invite of invites) {
      await ctx.db.delete(invite._id);
    }

    // Delete the team
    await ctx.db.delete(args.teamId);
  },
});

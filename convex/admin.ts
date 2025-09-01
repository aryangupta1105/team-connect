import { query } from "./_generated/server";
import { getAuthUserId } from "@convex-dev/auth/server";
import { v } from "convex/values";

export const getAdminStats = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    // Get total counts
    const totalUsers = await ctx.db.query("profiles").collect();
    const totalTeams = await ctx.db.query("teams").collect();
    const openTeams = await ctx.db
      .query("teams")
      .withIndex("by_open", (q) => q.eq("isOpen", true))
      .collect();

    // Get teams missing female members
    const teamsMissingFemale = [];
    for (const team of totalTeams) {
      if (!team.requiresFemale) continue;

      const members = await ctx.db
        .query("teamMembers")
        .withIndex("by_team", (q) => q.eq("teamId", team._id))
        .collect();

      let hasFemale = false;
      for (const member of members) {
        const profile = await ctx.db
          .query("profiles")
          .withIndex("by_user", (q) => q.eq("userId", member.userId))
          .unique();
        if (profile?.gender === "f") {
          hasFemale = true;
          break;
        }
      }

      if (!hasFemale) {
        teamsMissingFemale.push({
          ...team,
          memberCount: members.length,
        });
      }
    }

    // Calculate open slots
    let totalOpenSlots = 0;
    for (const team of openTeams) {
      const members = await ctx.db
        .query("teamMembers")
        .withIndex("by_team", (q) => q.eq("teamId", team._id))
        .collect();
      totalOpenSlots += Math.max(0, team.maxSize - members.length);
    }

    // Get pending requests and invites counts
    const pendingRequests = await ctx.db
      .query("joinRequests")
      .withIndex("by_status", (q) => q.eq("status", "pending"))
      .collect();

    const pendingInvites = await ctx.db
      .query("invites")
      .withIndex("by_status", (q) => q.eq("status", "pending"))
      .collect();

    return {
      totalUsers: totalUsers.length,
      totalTeams: totalTeams.length,
      openTeams: openTeams.length,
      teamsMissingFemale: teamsMissingFemale.length,
      totalOpenSlots,
      pendingRequests: pendingRequests.length,
      pendingInvites: pendingInvites.length,
      teamsMissingFemaleDetails: teamsMissingFemale,
    };
  },
});

export const getUserDashboardStats = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return null;

    // Get user's teams
    const userMemberships = await ctx.db
      .query("teamMembers")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .collect();

    const userTeams = await Promise.all(
      userMemberships.map(async (membership) => {
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
    );

    const validTeams = userTeams.filter((team): team is NonNullable<typeof team> => team !== null);

    // Get pending requests for user's teams (if leader)
    const leaderTeams = validTeams.filter(team => team.myRole === "leader");
    let incomingRequestsCount = 0;
    
    for (const team of leaderTeams) {
      const requests = await ctx.db
        .query("joinRequests")
        .withIndex("by_team", (q) => q.eq("teamId", team._id))
        .filter((q) => q.eq(q.field("status"), "pending"))
        .collect();
      incomingRequestsCount += requests.length;
    }

    // Get user's pending requests
    const myRequests = await ctx.db
      .query("joinRequests")
      .withIndex("by_user", (q) => q.eq("fromUserId", userId))
      .filter((q) => q.eq(q.field("status"), "pending"))
      .collect();

    // Get user's pending invites
    const myInvites = await ctx.db
      .query("invites")
      .withIndex("by_to_user", (q) => q.eq("toUserId", userId))
      .filter((q) => q.eq(q.field("status"), "pending"))
      .collect();

    return {
      teamsCount: validTeams.length,
      leaderTeamsCount: leaderTeams.length,
      incomingRequestsCount,
      myRequestsCount: myRequests.length,
      myInvitesCount: myInvites.length,
      teams: validTeams,
    };
  },
});

export const getTeamManagementData = query({
  args: { teamId: v.id("teams") },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const team = await ctx.db.get(args.teamId);
    if (!team) throw new Error("Team not found");

    // Check if user is team leader
    if (team.leaderId !== userId) {
      throw new Error("Only team leader can access management data");
    }

    // Get team members
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

    // Get pending join requests
    const joinRequests = await ctx.db
      .query("joinRequests")
      .withIndex("by_team", (q) => q.eq("teamId", args.teamId))
      .filter((q) => q.eq(q.field("status"), "pending"))
      .collect();

    const requestsWithProfiles = await Promise.all(
      joinRequests.map(async (request) => {
        const profile = await ctx.db
          .query("profiles")
          .withIndex("by_user", (q) => q.eq("userId", request.fromUserId))
          .unique();
        return {
          ...request,
          profile: profile ? {
            ...profile,
            avatarUrl: profile.avatar ? await ctx.storage.getUrl(profile.avatar) : null,
          } : null,
        };
      })
    );

    // Get sent invites
    const sentInvites = await ctx.db
      .query("invites")
      .withIndex("by_team", (q) => q.eq("teamId", args.teamId))
      .collect();

    const invitesWithProfiles = await Promise.all(
      sentInvites.map(async (invite) => {
        const profile = await ctx.db
          .query("profiles")
          .withIndex("by_user", (q) => q.eq("userId", invite.toUserId))
          .unique();
        return {
          ...invite,
          profile: profile ? {
            ...profile,
            avatarUrl: profile.avatar ? await ctx.storage.getUrl(profile.avatar) : null,
          } : null,
        };
      })
    );

    return {
      team,
      members: memberProfiles,
      joinRequests: requestsWithProfiles,
      sentInvites: invitesWithProfiles,
    };
  },
});

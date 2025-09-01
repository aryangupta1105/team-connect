import { v } from "convex/values";
import { query, mutation } from "./_generated/server";
import { getAuthUserId } from "@convex-dev/auth/server";

export const sendJoinRequest = mutation({
  args: {
    teamId: v.id("teams"),
    message: v.string(),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const team = await ctx.db.get(args.teamId);
    if (!team) throw new Error("Team not found");
    if (!team.isOpen) throw new Error("Team is not accepting new members");

    // Check if user is already a member
    const existingMember = await ctx.db
      .query("teamMembers")
      .withIndex("by_team_and_user", (q) => q.eq("teamId", args.teamId).eq("userId", userId))
      .unique();
    
    if (existingMember) throw new Error("Already a member of this team");

    // Prevent duplicate pending or accepted requests for this team+user
    const existingRequests = await ctx.db
      .query("joinRequests")
      .withIndex("by_team_and_user", (q) => q.eq("teamId", args.teamId).eq("fromUserId", userId))
      .collect();
    if (existingRequests.some(r => r.status === "pending" || r.status === "accepted")) {
      throw new Error("Already have a pending or accepted request for this team");
    }

    return await ctx.db.insert("joinRequests", {
      teamId: args.teamId,
      fromUserId: userId,
      message: args.message,
      status: "pending",
    });
  },
});

export const respondToJoinRequest = mutation({
  args: {
    requestId: v.id("joinRequests"),
    response: v.union(v.literal("accepted"), v.literal("rejected")),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const request = await ctx.db.get(args.requestId);
    if (!request) throw new Error("Request not found");

    const team = await ctx.db.get(request.teamId);
    if (!team) throw new Error("Team not found");
    if (team.leaderId !== userId) throw new Error("Only team leader can respond to requests");

    await ctx.db.patch(args.requestId, { status: args.response });

    if (args.response === "accepted") {
      // Check team size constraint
      const currentMembers = await ctx.db
        .query("teamMembers")
        .withIndex("by_team", (q) => q.eq("teamId", request.teamId))
        .collect();

      if (currentMembers.length >= team.maxSize) {
        throw new Error("Team is already at maximum capacity");
      }

      // Enhanced female requirement check
      if (team.requiresFemale && currentMembers.length > 0) {
        const requestingUserProfile = await ctx.db
          .query("profiles")
          .withIndex("by_user", (q) => q.eq("userId", request.fromUserId))
          .unique();

        // Count current female members
        let femaleCount = 0;
        for (const member of currentMembers) {
          const memberProfile = await ctx.db
            .query("profiles")
            .withIndex("by_user", (q) => q.eq("userId", member.userId))
            .unique();
          if (memberProfile?.gender === "f") {
            femaleCount++;
          }
        }

        // If only one spot left and no female yet, only allow female to join
        const spotsLeft = team.maxSize - currentMembers.length;
        if (spotsLeft === 1 && femaleCount === 0 && requestingUserProfile?.gender !== "f") {
          throw new Error("The last spot must be filled by a female member");
        }

        // If more than one spot left, allow any gender, but ensure at least one female can join before maxSize
        if (spotsLeft > 1 && femaleCount === 0) {
          // If this is the last male and all future spots must be female, block
          // But since spotsLeft > 1, allow any gender for now
        }
      }

      // Add user to team
      await ctx.db.insert("teamMembers", {
        teamId: request.teamId,
        userId: request.fromUserId,
        role: "member",
        joinedAt: Date.now(),
      });

      // Close team if at max capacity
      if (currentMembers.length + 1 >= team.maxSize) {
        await ctx.db.patch(request.teamId, { isOpen: false });
      }
    }
  },
});

export const sendInvite = mutation({
  args: {
    teamId: v.id("teams"),
    toUserId: v.id("users"),
    message: v.string(),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const team = await ctx.db.get(args.teamId);
    if (!team) throw new Error("Team not found");
  // Allow leader for any team they lead
  if (team.leaderId !== userId) throw new Error("Only team leader can send invites");

    // Check if user is already a member
    const existingMember = await ctx.db
      .query("teamMembers")
      .withIndex("by_team_and_user", (q) => q.eq("teamId", args.teamId).eq("userId", args.toUserId))
      .unique();
    
    if (existingMember) throw new Error("User is already a member of this team");

    // Prevent duplicate pending or accepted invites for this team+user
    const existingInvites = await ctx.db
      .query("invites")
      .withIndex("by_team_and_user", (q) => q.eq("teamId", args.teamId).eq("toUserId", args.toUserId))
      .collect();
    if (existingInvites.some(inv => inv.status === "pending" || inv.status === "accepted")) {
      throw new Error("Already have a pending or accepted invite for this user");
    }

    // Check team capacity
    const currentMembers = await ctx.db
      .query("teamMembers")
      .withIndex("by_team", (q) => q.eq("teamId", args.teamId))
      .collect();

    if (currentMembers.length >= team.maxSize) {
      throw new Error("Team is already at maximum capacity");
    }

    return await ctx.db.insert("invites", {
      teamId: args.teamId,
      toUserId: args.toUserId,
      fromUserId: userId,
      message: args.message,
      status: "pending",
    });
  },
});

export const respondToInvite = mutation({
  args: {
    inviteId: v.id("invites"),
    response: v.union(v.literal("accepted"), v.literal("rejected")),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const invite = await ctx.db.get(args.inviteId);
    if (!invite) throw new Error("Invite not found");
    if (invite.toUserId !== userId) throw new Error("Can only respond to your own invites");

    await ctx.db.patch(args.inviteId, { status: args.response });

    if (args.response === "accepted") {
      const team = await ctx.db.get(invite.teamId);
      if (!team) throw new Error("Team not found");

      // Check team size constraint
      const currentMembers = await ctx.db
        .query("teamMembers")
        .withIndex("by_team", (q) => q.eq("teamId", invite.teamId))
        .collect();

      if (currentMembers.length >= team.maxSize) {
        throw new Error("Team is already at maximum capacity");
      }

      // Enhanced female requirement check for invites
      if (team.requiresFemale && currentMembers.length > 0) {
        const userProfile = await ctx.db
          .query("profiles")
          .withIndex("by_user", (q) => q.eq("userId", userId))
          .unique();

        // Check if team already has a female member
        let hasFemale = false;
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

        // If team doesn't have a female and the user is not female, reject
        if (!hasFemale && userProfile?.gender !== "f") {
          throw new Error("Team requires at least one female member");
        }
      }

      // Add user to team
      await ctx.db.insert("teamMembers", {
        teamId: invite.teamId,
        userId,
        role: "member",
        joinedAt: Date.now(),
      });

      // Close team if at max capacity
      if (currentMembers.length + 1 >= team.maxSize) {
        await ctx.db.patch(invite.teamId, { isOpen: false });
      }
    }
  },
});

export const getIncomingRequests = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return [];

    // Get teams where user is leader
    const leaderTeams = await ctx.db
      .query("teams")
      .withIndex("by_leader", (q) => q.eq("leaderId", userId))
      .collect();

    const requests = [];
    for (const team of leaderTeams) {
      const teamRequests = await ctx.db
        .query("joinRequests")
        .withIndex("by_team", (q) => q.eq("teamId", team._id))
        .filter((q) => q.eq(q.field("status"), "pending"))
        .collect();

      for (const request of teamRequests) {
        const profile = await ctx.db
          .query("profiles")
          .withIndex("by_user", (q) => q.eq("userId", request.fromUserId))
          .unique();

        requests.push({
          ...request,
          team,
          profile: profile ? {
            ...profile,
            avatarUrl: profile.avatar ? await ctx.storage.getUrl(profile.avatar) : null,
          } : null,
        });
      }
    }

    return requests;
  },
});

export const getMyRequests = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return [];

    const requests = await ctx.db
      .query("joinRequests")
      .withIndex("by_user", (q) => q.eq("fromUserId", userId))
      .collect();

    return Promise.all(
      requests.map(async (request) => {
        const team = await ctx.db.get(request.teamId);
        return {
          ...request,
          team,
        };
      })
    );
  },
});

export const getMyInvites = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return [];

    const invites = await ctx.db
      .query("invites")
      .withIndex("by_to_user", (q) => q.eq("toUserId", userId))
      .filter((q) => q.eq(q.field("status"), "pending"))
      .collect();

    return Promise.all(
      invites.map(async (invite) => {
        const team = await ctx.db.get(invite.teamId);
        const fromProfile = await ctx.db
          .query("profiles")
          .withIndex("by_user", (q) => q.eq("userId", invite.fromUserId))
          .unique();

        return {
          ...invite,
          team,
          fromProfile: fromProfile ? {
            ...fromProfile,
            avatarUrl: fromProfile.avatar ? await ctx.storage.getUrl(fromProfile.avatar) : null,
          } : null,
        };
      })
    );
  },
});

export const getSentInvites = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return [];

    const invites = await ctx.db
      .query("invites")
      .withIndex("by_from_user", (q) => q.eq("fromUserId", userId))
      .collect();

    return Promise.all(
      invites.map(async (invite) => {
        const team = await ctx.db.get(invite.teamId);
        const toProfile = await ctx.db
          .query("profiles")
          .withIndex("by_user", (q) => q.eq("userId", invite.toUserId))
          .unique();

        return {
          ...invite,
          team,
          toProfile: toProfile ? {
            ...toProfile,
            avatarUrl: toProfile.avatar ? await ctx.storage.getUrl(toProfile.avatar) : null,
          } : null,
        };
      })
    );
  },
});

export const withdrawRequest = mutation({
  args: { requestId: v.id("joinRequests") },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const request = await ctx.db.get(args.requestId);
    if (!request) throw new Error("Request not found");
    if (request.fromUserId !== userId) throw new Error("Can only withdraw your own requests");

    await ctx.db.patch(args.requestId, { status: "withdrawn" });
  },
});

export const cancelInvite = mutation({
  args: { inviteId: v.id("invites") },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const invite = await ctx.db.get(args.inviteId);
    if (!invite) throw new Error("Invite not found");
    if (invite.fromUserId !== userId) throw new Error("Can only cancel your own invites");

    await ctx.db.patch(args.inviteId, { status: "expired" });
  },
});

export const leaveTeam = mutation({
  args: { teamId: v.id("teams") },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const membership = await ctx.db
      .query("teamMembers")
      .withIndex("by_team_and_user", (q) => q.eq("teamId", args.teamId).eq("userId", userId))
      .unique();

    if (!membership) throw new Error("Not a member of this team");
    if (membership.role === "leader") throw new Error("Team leader cannot leave team");

    await ctx.db.delete(membership._id);

    // Reopen team if it was closed due to capacity
    const team = await ctx.db.get(args.teamId);
    if (team && !team.isOpen) {
      const currentMembers = await ctx.db
        .query("teamMembers")
        .withIndex("by_team", (q) => q.eq("teamId", args.teamId))
        .collect();
      
      if (currentMembers.length < team.maxSize) {
        await ctx.db.patch(args.teamId, { isOpen: true });
      }
    }
  },
});

export const removeMember = mutation({
  args: { 
    teamId: v.id("teams"),
    userId: v.id("users")
  },
  handler: async (ctx, args) => {
    const currentUserId = await getAuthUserId(ctx);
    if (!currentUserId) throw new Error("Not authenticated");

    const team = await ctx.db.get(args.teamId);
    if (!team) throw new Error("Team not found");
    if (team.leaderId !== currentUserId) throw new Error("Only team leader can remove members");

    const membership = await ctx.db
      .query("teamMembers")
      .withIndex("by_team_and_user", (q) => q.eq("teamId", args.teamId).eq("userId", args.userId))
      .unique();

    if (!membership) throw new Error("User is not a member of this team");
    if (membership.role === "leader") throw new Error("Cannot remove team leader");

    await ctx.db.delete(membership._id);

    // Reopen team if it was closed due to capacity
    if (!team.isOpen) {
      const currentMembers = await ctx.db
        .query("teamMembers")
        .withIndex("by_team", (q) => q.eq("teamId", args.teamId))
        .collect();
      
      if (currentMembers.length < team.maxSize) {
        await ctx.db.patch(args.teamId, { isOpen: true });
      }
    }
  },
});

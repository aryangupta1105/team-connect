// convex/contactRequests.ts
import { query, mutation } from "./_generated/server";
import { v } from "convex/values";
import { getAuthUserId } from "@convex-dev/auth/server";

//
// === MUTATIONS ===
//

// Request contact info
export const requestContactInfo = mutation({
  args: { toUserId: v.id("users"), teamId: v.optional(v.id("teams")) },
  handler: async (ctx, { toUserId, teamId }) => {
    const fromUserId = await getAuthUserId(ctx);
    if (!fromUserId) throw new Error("Not authenticated");
    if (fromUserId === toUserId) throw new Error("Cannot request your own contact");

    // Prevent duplicate pending requests from same requester -> same target (and same team if provided)
    const existing = await ctx.db
      .query("contactRequests")
      .withIndex("by_fromUserId", (q) => q.eq("fromUserId", fromUserId))
      .collect();

    if (
      existing.some(
        (r) =>
          r.toUserId === toUserId &&
          r.status === "pending" &&
          (teamId ? r.teamId === teamId : true)
      )
    ) {
      throw new Error("Request already sent");
    }

    const now = Date.now();
    return await ctx.db.insert("contactRequests", {
      fromUserId,
      toUserId,
      teamId,
      status: "pending",
      createdAt: now,
    });
  },
});

// Respond to a request (accept/reject)
export const respondContactInfoRequest = mutation({
  args: { requestId: v.id("contactRequests"), accept: v.boolean() },
  handler: async (ctx, { requestId, accept }) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const request = await ctx.db.get(requestId);
    if (!request) throw new Error("Request not found");
    if (request.toUserId !== userId) throw new Error("Not authorized");

    const now = Date.now();
    await ctx.db.patch(requestId, {
      status: accept ? "accepted" : "rejected",
      respondedAt: now,
    });

    if (accept) {
      // Look for existing contactShare for (owner=userId, viewer=request.fromUserId)
      const existingShares = await ctx.db
        .query("contactShares")
        .withIndex("by_owner_viewer", (q) =>
          q.eq("ownerUserId", userId).eq("viewerUserId", request.fromUserId)
        )
        .collect();

      if (existingShares.length > 0) {
        // Update first existing share record
        await ctx.db.patch(existingShares[0]._id, {
          authorized: true,
          status: "accepted",
          requestedAt: request.createdAt,
          respondedAt: now,
        });
      } else {
        await ctx.db.insert("contactShares", {
          ownerUserId: userId,
          viewerUserId: request.fromUserId,
          authorized: true,
          status: "accepted",
          requestedAt: request.createdAt,
          respondedAt: now,
        });
      }
    }
  },
});

// Revoke contact sharing
export const revokeContactShare = mutation({
  args: { shareId: v.id("contactShares") },
  handler: async (ctx, { shareId }) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const share = await ctx.db.get(shareId);
    if (!share) throw new Error("Share not found");
    if (share.ownerUserId !== userId) throw new Error("Not authorized");

    await ctx.db.patch(shareId, {
      authorized: false,
      status: "revoked",
      respondedAt: Date.now(),
    });
  },
});

//
// === QUERIES ===
//

// Get pending requests that were sent *to* the current user (i.e., people asking the current user to share contact).
// Enrich each request with `viewerProfile` (the requester's profile + avatarUrl).
export const getContactInfoRequests = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return [];

    const requests = await ctx.db
      .query("contactRequests")
      .withIndex("by_toUserId", (q) => q.eq("toUserId", userId))
      .collect();

    const pending = requests.filter((r) => r.status === "pending");

    return Promise.all(
      pending.map(async (req) => {
        const viewerProfile = await ctx.db
          .query("profiles")
          .withIndex("by_user", (q) => q.eq("userId", req.fromUserId))
          .unique();

        const viewerProfileWithAvatar = viewerProfile
          ? {
              ...viewerProfile,
              avatarUrl: viewerProfile.avatar ? await ctx.storage.getUrl(viewerProfile.avatar) : null,
            }
          : null;

        return {
          ...req,
          viewerProfile: viewerProfileWithAvatar,
        };
      })
    );
  },
});

// Return whether a viewer can view an owner's contact info
export const canViewContact = query({
  args: { ownerUserId: v.id("users"), viewerUserId: v.id("users") },
  handler: async (ctx, { ownerUserId, viewerUserId }) => {
    const shares = await ctx.db
      .query("contactShares")
      .withIndex("by_owner_viewer", (q) =>
        q.eq("ownerUserId", ownerUserId).eq("viewerUserId", viewerUserId)
      )
      .collect();
    return shares.some((share) => share.authorized);
  },
});

// Returns authorized contact shares where the current user is the VIEWER
export const getContactSharesForViewer = query({
  args: {},
  handler: async (ctx) => {
    const viewerUserId = await getAuthUserId(ctx);
    if (!viewerUserId) return [];

    const shares = await ctx.db
      .query("contactShares")
      .withIndex("by_viewer", (q) => q.eq("viewerUserId", viewerUserId))
      .collect();

    return shares.filter((s) => s.authorized);
  },
});

// Returns pending contact requests sent *by* the current user
export const getMySentContactRequests = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return [];

    const sent = await ctx.db
      .query("contactRequests")
      .withIndex("by_fromUserId", (q) => q.eq("fromUserId", userId))
      .collect();

    return sent.filter((r) => r.status === "pending");
  },
});

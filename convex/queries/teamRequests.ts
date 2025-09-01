// Convex query to get all pending invites for a user (to filter out teams)
import { query } from "../_generated/server";
import type { QueryCtx } from "../_generated/server";
import { getAuthUserId } from "@convex-dev/auth/server";

export const getPendingInvites = query({
  args: {},
  handler: async (ctx: QueryCtx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");
    // Get all invites sent by current user that are still pending
    const invites = await ctx.db
      .query("invites")
      .withIndex("by_from_user", (q: any) => q.eq("fromUserId", userId))
      .filter((q: any) => q.eq(q.field("status"), "pending"))
      .collect();
    return invites;
  },
});

// Convex query to get all pending join requests for a user (to filter out teams)
export const getPendingJoinRequests = query({
  args: {},
  handler: async (ctx: QueryCtx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");
    // Get all join requests sent by current user that are still pending
    const requests = await ctx.db
      .query("joinRequests")
      .withIndex("by_user", (q: any) => q.eq("fromUserId", userId))
      .filter((q: any) => q.eq(q.field("status"), "pending"))
      .collect();
    return requests;
  },
});


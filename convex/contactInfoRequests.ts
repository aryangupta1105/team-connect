import { query } from "./_generated/server";
import { getAuthUserId } from "@convex-dev/auth/server";

export const getContactInfoRequests = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return [];
    // Get all pending contact info requests for this user
    const requests = await ctx.db
      .query("contactShares")
      .withIndex("by_owner", (q) => q.eq("ownerUserId", userId))
      .collect();
    // Only pending requests
    const pending = requests.filter(r => r.status === "pending");
    // Get profiles for each viewer
    const viewerProfiles = await Promise.all(
      pending.map(async (req) => {
        const profile = await ctx.db
          .query("profiles")
          .withIndex("by_user", (q) => q.eq("userId", req.viewerUserId))
          .unique();
        return profile;
      })
    );
    // Attach profile to each request
    return pending.map((req, i) => ({ ...req, viewerProfile: viewerProfiles[i] }));
  },
});

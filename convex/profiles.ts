import { v } from "convex/values";
import { query, mutation } from "./_generated/server";
import { getAuthUserId } from "@convex-dev/auth/server";

// ✅ Get the current logged-in user's profile
export const getCurrentProfile = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return null;

    const profile = await ctx.db
      .query("profiles")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .unique();

    if (!profile) return null;

    return {
      ...profile,
      avatarUrl: profile.avatar ? await ctx.storage.getUrl(profile.avatar) : null,
    };
  },
});

// ✅ Get any user’s profile with contactInfo privacy
export const getProfile = query({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    const profile = await ctx.db
      .query("profiles")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .unique();

    if (!profile) return null;

    let contactInfo: string | undefined = undefined;
    const viewerId = await getAuthUserId(ctx);

    if (viewerId === args.userId) {
      contactInfo = profile.contactInfo; // owner can always see
    } else if (viewerId) {
      const shares = await ctx.db
        .query("contactShares")
        .withIndex("by_owner_viewer", (q) =>
          q.eq("ownerUserId", args.userId).eq("viewerUserId", viewerId)
        )
        .collect();

      if (shares.some((s) => s.authorized)) {
        contactInfo = profile.contactInfo;
      }
    }

    return {
      ...profile,
      avatarUrl: profile.avatar ? await ctx.storage.getUrl(profile.avatar) : null,
      contactInfo,
    };
  },
});

// ✅ Create or update profile (fixes avatar + contactInfo)
export const createOrUpdateProfile = mutation({
  args: {
    name: v.string(),
    branch: v.string(),
    year: v.number(),
    gender: v.union(v.literal("m"), v.literal("f"), v.literal("o")),
    skills: v.array(v.string()),
    bio: v.string(),
    links: v.array(v.string()),
    isLooking: v.boolean(),
    avatar: v.optional(v.id("_storage")),
    contactInfo: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const existingProfile = await ctx.db
      .query("profiles")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .unique();

    if (existingProfile) {
      // ✅ patch everything from args
      await ctx.db.patch(existingProfile._id, {
        ...args,
      });
      return existingProfile._id;
    } else {
      // ✅ insert everything from args + userId
      return await ctx.db.insert("profiles", {
        userId,
        ...args,
      });
    }
  },
});


// ✅ List profiles with optional filters
export const listAvailableProfiles = query({
  args: {
    skillFilter: v.optional(v.array(v.string())), // accept array of skills
    yearFilter: v.optional(v.union(
      v.literal("1"),
      v.literal("2"),
      v.literal("3"),
      v.literal("4"),
      v.literal("Others")
    )),
    genderFilter: v.optional(v.union(v.literal("m"), v.literal("f"), v.literal("o"))),
    lookingOnly: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    let profiles = await ctx.db.query("profiles").collect();

    // Apply filters one by one
    if (args.lookingOnly) {
      profiles = profiles.filter(p => p.isLooking);
    }

    if (args.genderFilter) {
      profiles = profiles.filter(p => p.gender === args.genderFilter);
    }

    if (args.yearFilter) {
      profiles = profiles.filter(p =>
        args.yearFilter === "Others"
          ? !["1", "2", "3", "4"].includes(String(p.year))
          : String(p.year) === args.yearFilter
      );
    }

    if (args.skillFilter && args.skillFilter.length > 0) {
      profiles = profiles.filter(p =>
        p.skills?.some((s: string) =>
          args.skillFilter!.some(f => s.toLowerCase().includes(f.toLowerCase()))
        )
      );
    }

    // Attach extra fields
    const viewerId = await getAuthUserId(ctx);
    return Promise.all(
      profiles.map(async (profile) => {
        const userTeams = await ctx.db
          .query("teamMembers")
          .withIndex("by_user", q => q.eq("userId", profile.userId))
          .collect();

        const teamsJoined = userTeams.map(tm => tm.teamId);

        let contactInfo: string | undefined = undefined;
        if (viewerId === profile.userId) {
          contactInfo = profile.contactInfo;
        } else if (viewerId) {
          const shares = await ctx.db
            .query("contactShares")
            .withIndex("by_owner_viewer", q =>
              q.eq("ownerUserId", profile.userId).eq("viewerUserId", viewerId)
            )
            .collect();
          if (shares.some(s => s.authorized)) {
            contactInfo = profile.contactInfo;
          }
        }

        return {
          ...profile,
          avatarUrl: profile.avatar
            ? await ctx.storage.getUrl(profile.avatar)
            : null,
          teamsJoined,
          teamsJoinedCount: teamsJoined.length,
          contactInfo,
        };
      })
    );
  },
});


// ✅ Upload URL for profile pictures
export const generateUploadUrl = mutation({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");
    return await ctx.storage.generateUploadUrl();
  },
});

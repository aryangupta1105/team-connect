import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";
import { authTables } from "@convex-dev/auth/server";

const applicationTables = {
  contactRequests: defineTable({
    fromUserId: v.id("users"),
    toUserId: v.id("users"),
    teamId: v.optional(v.id("teams")),
    status: v.union(
      v.literal("pending"),
      v.literal("accepted"),
      v.literal("rejected"),
      v.literal("revoked")
    ),
    createdAt: v.number(),
    respondedAt: v.optional(v.number()),
  })
    .index("by_fromUserId", ["fromUserId"])
    .index("by_toUserId", ["toUserId"]),

  // ✅ Cleaned-up single version of contactShares
  contactShares: defineTable({
    ownerUserId: v.id("users"),       // the person whose contact info is being shared
    viewerUserId: v.id("users"),      // the person requesting access
    authorized: v.boolean(),          // true if sharing is allowed
    status: v.union(
      v.literal("pending"),
      v.literal("accepted"),
      v.literal("rejected"), 
      v.literal("revoked")   // 👈 added
    ),
    requestedAt: v.number(),
    respondedAt: v.optional(v.number()),
  })
    .index("by_owner_viewer", ["ownerUserId", "viewerUserId"])
    .index("by_owner", ["ownerUserId"])
    .index("by_viewer", ["viewerUserId"]),

  profiles: defineTable({
    userId: v.id("users"),
    name: v.string(),
    branch: v.string(),
    year: v.number(), // 1-4
    gender: v.union(v.literal("m"), v.literal("f"), v.literal("o")),
    skills: v.array(v.string()),
    bio: v.string(),
    links: v.array(v.string()),
    isLooking: v.boolean(),
    avatar: v.optional(v.id("_storage")),
    contactInfo: v.optional(v.string()),
  })
    .index("by_user", ["userId"])
    .index("by_looking", ["isLooking"])
    .index("by_gender", ["gender"]),

  teams: defineTable({
    name: v.string(),
    domain: v.string(),
    problem: v.string(),
    description: v.string(),
    leaderId: v.id("users"),
    maxSize: v.number(), // 2-6, default 6
    requiresFemale: v.boolean(), // default true
    isOpen: v.boolean(),
    requiredSkills: v.array(v.string()),
  })
    .index("by_leader", ["leaderId"])
    .index("by_open", ["isOpen"])
    .index("by_domain", ["domain"]),

  teamMembers: defineTable({
    teamId: v.id("teams"),
    userId: v.id("users"),
    role: v.union(v.literal("leader"), v.literal("member")),
    joinedAt: v.number(),
  })
    .index("by_team", ["teamId"])
    .index("by_user", ["userId"])
    .index("by_team_and_user", ["teamId", "userId"]), // ✅ Needed for queries

  joinRequests: defineTable({
    teamId: v.id("teams"),
    fromUserId: v.id("users"),
    message: v.string(),
    status: v.union(
      v.literal("pending"),
      v.literal("accepted"),
      v.literal("rejected"),
      v.literal("withdrawn")
    ),
  })
    .index("by_team", ["teamId"])
    .index("by_user", ["fromUserId"])
    .index("by_status", ["status"])
    .index("by_team_and_user", ["teamId", "fromUserId"]), // ✅ Added

  invites: defineTable({
    teamId: v.id("teams"),
    toUserId: v.id("users"),
    fromUserId: v.id("users"),
    message: v.string(),
    status: v.union(
      v.literal("pending"),
      v.literal("accepted"),
      v.literal("rejected"),
      v.literal("expired")
    ),
  })
    .index("by_team", ["teamId"])
    .index("by_to_user", ["toUserId"])
    .index("by_from_user", ["fromUserId"])
    .index("by_status", ["status"])
    .index("by_team_and_user", ["teamId", "toUserId"]), // ✅ Added
};

export default defineSchema({
  ...authTables,
  ...applicationTables,
});

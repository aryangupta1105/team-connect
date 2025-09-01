/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";
import type * as admin from "../admin.js";
import type * as auth from "../auth.js";
import type * as contactInfoRequests from "../contactInfoRequests.js";
import type * as contactRequests from "../contactRequests.js";
import type * as contactShares from "../contactShares.js";
import type * as http from "../http.js";
import type * as profiles from "../profiles.js";
import type * as queries_teamRequests from "../queries/teamRequests.js";
import type * as recommendations from "../recommendations.js";
import type * as requests from "../requests.js";
import type * as router from "../router.js";
import type * as teams from "../teams.js";

/**
 * A utility for referencing Convex functions in your app's API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = api.myModule.myFunction;
 * ```
 */
declare const fullApi: ApiFromModules<{
  admin: typeof admin;
  auth: typeof auth;
  contactInfoRequests: typeof contactInfoRequests;
  contactRequests: typeof contactRequests;
  contactShares: typeof contactShares;
  http: typeof http;
  profiles: typeof profiles;
  "queries/teamRequests": typeof queries_teamRequests;
  recommendations: typeof recommendations;
  requests: typeof requests;
  router: typeof router;
  teams: typeof teams;
}>;
export declare const api: FilterApi<
  typeof fullApi,
  FunctionReference<any, "public">
>;
export declare const internal: FilterApi<
  typeof fullApi,
  FunctionReference<any, "internal">
>;

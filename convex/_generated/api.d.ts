/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type * as auth from "../auth.js";
import type * as http from "../http.js";
import type * as plaid from "../plaid.js";
import type * as plaidClient from "../plaidClient.js";
import type * as plaidPersistence from "../plaidPersistence.js";
import type * as plaidWebhookVerify from "../plaidWebhookVerify.js";
import type * as security from "../security.js";
import type * as syncRetry from "../syncRetry.js";
import type * as users from "../users.js";
import type * as webhooks from "../webhooks.js";
import type * as webhooksNode from "../webhooksNode.js";

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";

declare const fullApi: ApiFromModules<{
  auth: typeof auth;
  http: typeof http;
  plaid: typeof plaid;
  plaidClient: typeof plaidClient;
  plaidPersistence: typeof plaidPersistence;
  plaidWebhookVerify: typeof plaidWebhookVerify;
  security: typeof security;
  syncRetry: typeof syncRetry;
  users: typeof users;
  webhooks: typeof webhooks;
  webhooksNode: typeof webhooksNode;
}>;

/**
 * A utility for referencing Convex functions in your app's public API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = api.myModule.myFunction;
 * ```
 */
export declare const api: FilterApi<
  typeof fullApi,
  FunctionReference<any, "public">
>;

/**
 * A utility for referencing Convex functions in your app's internal API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = internal.myModule.myFunction;
 * ```
 */
export declare const internal: FilterApi<
  typeof fullApi,
  FunctionReference<any, "internal">
>;

export declare const components: {};

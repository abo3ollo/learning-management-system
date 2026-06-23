/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type * as classes_classes from "../classes/classes.js";
import type * as index from "../index.js";
import type * as media_mediaassignments from "../media/mediaassignments.js";
import type * as media_mediafiles from "../media/mediafiles.js";
import type * as questions_questions from "../questions/questions.js";
import type * as relationships_parentStudent from "../relationships/parentStudent.js";
import type * as schedules_schedules from "../schedules/schedules.js";
import type * as user_admin from "../user/admin.js";
import type * as user_auth from "../user/auth.js";
import type * as user_helpers from "../user/helpers.js";
import type * as user_parents from "../user/parents.js";
import type * as user_students from "../user/students.js";
import type * as user_teachers from "../user/teachers.js";

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";

declare const fullApi: ApiFromModules<{
  "classes/classes": typeof classes_classes;
  index: typeof index;
  "media/mediaassignments": typeof media_mediaassignments;
  "media/mediafiles": typeof media_mediafiles;
  "questions/questions": typeof questions_questions;
  "relationships/parentStudent": typeof relationships_parentStudent;
  "schedules/schedules": typeof schedules_schedules;
  "user/admin": typeof user_admin;
  "user/auth": typeof user_auth;
  "user/helpers": typeof user_helpers;
  "user/parents": typeof user_parents;
  "user/students": typeof user_students;
  "user/teachers": typeof user_teachers;
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

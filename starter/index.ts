import "dotenv/config";
import { drizzle } from "drizzle-orm/libsql";
import { createClient } from "@libsql/client";
import { users, posts, userPostsTable, comments, userSettings } from "./schema";
import * as schema from "./schema";
import {
  eq,
  asc,
  desc,
  type InferInsertModel,
  lt,
  gt,
  sql,
  sum,
  and,
} from "drizzle-orm";
import { union } from "drizzle-orm/sqlite-core";
// Not all imports may be used

//* Selects

//* Inserts and Updates

//* Delete

//* Joins

//* Queries

//* Aggregations

//* Transaction (Lecture 10)

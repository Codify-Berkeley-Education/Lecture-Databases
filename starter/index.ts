import "dotenv/config";
import { drizzle } from "drizzle-orm/libsql";
import { createClient } from "@libsql/client";
import * as schema from "./schema";
import { users, posts, userPostsTable, comments } from "./schema";
import { eq, gt, lt, or, and } from "drizzle-orm";

// Database connection
const client = createClient({ url: process.env.DB_FILE_NAME! });
export const db = drizzle(client, {
  schema,
  logger: true,
});

// TODO write queries here

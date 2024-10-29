import "dotenv/config";
import { drizzle } from "drizzle-orm/libsql";
import { createClient } from "@libsql/client";
import { users, posts, userPostsTable } from "./schema";
import * as schema from "./schema";
import { eq } from "drizzle-orm";

const client = createClient({ url: process.env.SOLUTION_DB_FILE_NAME! });
export const db = drizzle(client, {
  schema,
  logger: true,
});

// TODO write queries here

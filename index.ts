import "dotenv/config";
import { drizzle } from "drizzle-orm/libsql";
import { createClient } from "@libsql/client";
import { usersTable, postsTable, userPostsTable } from "./solution/schema";
import * as schema from "./solution/schema";
import { eq } from "drizzle-orm";

//* Change to SOLUTION_DB_FILE_NAME to use the solution database
const client = createClient({ url: process.env.DB_FILE_NAME! });
export const db = drizzle(client, { schema });

const createUser = async () => {
	return db
		.insert(usersTable)
		.values({
			age: 20,
			email: "test2@gmail.com",
			name: "Test User",
		})
		.returning();
};

const getUserPosts = async (userId: number) => {
	return db.query.usersTable.findFirst({
		where: (users) => eq(users.id, userId),
		with: {
			posts: {
				with: {
					post: true,
				},
			},
		},
	});
};

const getUserPostsJoin = async (userId: number) => {
	return db
		.select()
		.from(userPostsTable)
		.innerJoin(postsTable, eq(userPostsTable.postId, postsTable.id))
		.innerJoin(usersTable, eq(userPostsTable.userId, usersTable.id))
		.where(eq(usersTable.id, userId));
};

// console.dir(await getUserPosts(6), {
// 	depth: null,
// });

console.dir(await getUserPostsJoin(6), {
	depth: null,
});

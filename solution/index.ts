import "dotenv/config";
import { drizzle } from "drizzle-orm/libsql";
import { createClient } from "@libsql/client";
import { users, posts, userPostsTable, comments } from "./schema";
import * as schema from "./schema";
import { eq, asc, desc, type InferInsertModel } from "drizzle-orm";

const client = createClient({ url: process.env.SOLUTION_DB_FILE_NAME! });
export const db = drizzle(client, {
  schema,
  logger: true,
});

//* Selects

// Basic Select
const getUser = async (id: string) => {
  const [user] = await db.select().from(users).where(eq(users.id, id));
  return user;
};

// Partial Select
const getUserName = async (id: string) => {
  const [userName] = await db
    .select({
      name: users.name,
    })
    .from(users)
    .where(eq(users.id, id));
  return userName.name;
};

// Ordering and filtering
const getPostsAlphabetically = async () => {
  const sortedPosts = db.select().from(posts).orderBy(asc(posts.title));
  return sortedPosts;
};

// console.log(await getPostsAlphabetically());

//* Inserts and Updates

// Basic Insert with returning
const insertUser = async (newUser: InferInsertModel<typeof users>) => {
  const [insertedUser] = await db.insert(users).values(newUser).returning();
  return insertedUser;
};

// Update
const changeEmail = async (id: string, newEmail: string) => {
  const [updatedUser] = await db
    .update(users)
    .set({ email: newEmail })
    .where(eq(users.id, id))
    .returning();
  return updatedUser;
};

// Batch Insert
const insertUsers = async (newUsers: InferInsertModel<typeof users>[]) => {
  const insertedUsers = await db.insert(users).values(newUsers).returning();
  return insertedUsers;
};

//* Delete
const deleteUser = async (id: string) => {
  const [deletedUser] = await db
    .delete(users)
    .where(eq(users.id, id))
    .returning();
  return deletedUser;
};

//* Joins

// Left and Right Joins
const getPostWithComments = async (postId: string) => {
  const postWithComments = await db
    .select()
    .from(posts)
    .leftJoin(comments, eq(posts.id, comments.postId))
    .where(eq(posts.id, postId));
  return postWithComments;
};

// Full Join

// Many to many join
const getPostsByUser = async (userId: string) => {
  const postsByUser = await db
    .select()
    .from(userPostsTable)
    .leftJoin(posts, eq(userPostsTable.postId, posts.id))
    .leftJoin(users, eq(userPostsTable.userId, users.id))
    .where(eq(users.id, userId));

  return postsByUser;
};

//* Transaction Example

//* Aggregations

//* Queries
const getPostWithCommentsQuery = async (postId: string) => {
  const postsWithComments = await db.query.posts.findFirst({
    where: eq(posts.id, postId),
    with: {
      comments: true,
    },
  });
  return postsWithComments;
};

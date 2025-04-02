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

const client = createClient({ url: process.env.SOLUTION_DB_FILE_NAME! });
export const db = drizzle(client, {
  schema,
  logger: true,
});

//* Selects

// Basic Select
const getUser = async (id: string) => {
  // Select statements always return an array, so indexing the first element is a common pattern when only selecting one row
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

// Ordering
const getPostsAlphabetically = async () => {
  const sortedPosts = db
    .select()
    .from(posts)
    .orderBy(asc(posts.title), asc(posts.id)); // If two posts have the same title, order by id, ensuring a deterministic
  return sortedPosts;
};

// Limit and Offset
const getPostsPaginated = async (page: number, pageSize: number) => {
  const paginatedPosts = db
    .select()
    .from(posts)
    .orderBy(desc(posts.createdAt))
    .limit(pageSize)
    .offset(page * pageSize);
  return paginatedPosts;
};

// Optimized Limit and Offset by using Keyset Pagination
const getPostsPaginatedOptimized = async (
  pageSize: number,
  after: number | undefined,
) => {
  const paginatedPosts = db
    .select()
    .from(posts)
    .where(after ? lt(posts.createdAt, after) : undefined)
    .orderBy(desc(posts.createdAt))
    .limit(pageSize);
  return paginatedPosts;
};

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
    .set({ email: newEmail }) // Specify the columns to update
    .where(eq(users.id, id))
    .returning();
  return updatedUser;
};

// Upsert
// A user settings object may already exist, or may not depending on the application implementation
const setOrUpdateSettings = async (userId: string, theme: "light" | "dark") => {
  const [settings] = await db
    .insert(userSettings)
    .values({
      userId,
      theme,
    })
    .onConflictDoUpdate({ target: [userSettings.userId], set: { theme } })
    .returning();
  return settings;
};

// Batch Insert
// Simply pass in an array of users to insert instead of a single user
const insertUsers = async (newUsers: InferInsertModel<typeof users>[]) => {
  const insertedUsers = db.insert(users).values(newUsers).returning();
  return insertedUsers;
};

// Update without fetching the updated row
const recordPostView = async (postId: string) => {
  return db
    .update(posts)
    .set({ views: sql`${posts.views} + 1` }) // Increment the views by one
    .where(eq(posts.id, postId))
    .returning();
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
  const postWithComments = db
    .select()
    .from(posts)
    .leftJoin(comments, eq(posts.id, comments.postId))
    .where(eq(posts.id, postId));
  return postWithComments;
};

// Inner Join
// Select only the users that have settings associated with them
const usersWithSettings = async () => {
  const usersWithSettings = db
    .select()
    .from(users)
    .innerJoin(userSettings, eq(users.id, userSettings.userId));
  return usersWithSettings;
};

// Many to many join
const getPostsByUser = async (userId: string) => {
  const postsByUser = db
    .select()
    .from(userPostsTable)
    .innerJoin(posts, eq(userPostsTable.postId, posts.id))
    .innerJoin(users, eq(userPostsTable.userId, users.id))
    .where(eq(users.id, userId));

  return postsByUser;
};

//* Queries
// Basic example
const getPostWithCommentsQuery = async (postId: string) => {
  const postsWithComments = db.query.posts.findFirst({
    where: eq(posts.id, postId),
    with: {
      comments: true,
    },
  });
  return postsWithComments;
};

// Full Advanced Example
const getPostAuthors = async (postId: string) => {
  const postAuthors = db.query.posts.findFirst({
    where: eq(posts.id, postId),
    with: {
      authors: {
        // Sort returned authors
        orderBy: [desc(userPostsTable.userId)],

        // Exclude columns
        columns: {
          postId: false,
          userId: false,
        },
        with: {
          user: true,
        },
      },
    },
  });
  return postAuthors;
};

//* Aggregations
// Can either execute arbitrary SQL or use built in helpers: https://orm.drizzle.team/docs/select#aggregations-helpers

// Summing up the views of all posts created in the past day
const totalViewsPastDay = async () => {
  const [totalViews] = await db
    .select({ values: sum(posts.views) })
    .from(posts)
    .where(gt(posts.createdAt, Math.floor(Date.now() / 1000) - 24 * 60 * 60));

  if (!totalViews) {
    throw new Error("No posts found");
  }
  // Cast the result to a number
  return Number(totalViews.values);
};

// Getting a count of the total number of posts created in the past week, use drizzle $count operator: https://orm.drizzle.team/docs/select#count
const usersSignedUpPastWeek = async () => {
  const count = db.$count(
    posts,
    gt(posts.createdAt, Math.floor(Date.now() / 1000) - 7 * 24 * 60 * 60),
  );
  return count;
};

//* Unions (Not covered in lecture)
// https://orm.drizzle.team/docs/set-operations#union

// Get recent activity for a user (their posts and comments)
// Could power something like this: https://github.com/aidansunbury?tab=overview&from=2024-10-01&to=2024-10-31
// Where varying data types create a unified feed
const getUserActivity = async (userId: string) => {
  const activity = await union(
    db
      .select({ itemId: userPostsTable.postId, content: posts.title })
      .from(userPostsTable)
      .innerJoin(posts, eq(userPostsTable.postId, posts.id))
      .where(eq(userPostsTable.userId, userId)),
    db
      .select({ itemId: comments.id, content: comments.content })
      .from(comments)
      .where(eq(comments.authorId, userId)),
  );
  return activity;
};

//* Transaction
// When creating a post, we want to ensure that it is assigned one or more authors
// Either the post and the join table field connecting author(s) to the post should be created, or the whole transaction should fail
const createPost = async (
  authorIds: string[],
  post: InferInsertModel<typeof posts>,
) => {
  const result = db.transaction(async (trx) => {
    const [newPost] = await trx.insert(posts).values(post).returning();
    const authors = authorIds.map((id) => ({ userId: id, postId: newPost.id }));
    const createdAuthors = await trx
      .insert(userPostsTable)
      .values(authors)
      .returning();
    return {
      post: newPost,
      authors: createdAuthors,
    };
  });
  return result;
};

// The following uses the code
(async () => {
  const allUsers = await db.select().from(users);
  if (allUsers.length === 0) {
    console.log("No users found. Please run the seed script.");
    return;
  }
  const validUserId = allUsers[0].id;

  // 1. Basic select: Get user by ID
  const user = await getUser(validUserId);
  console.log("User:", user);

  // 2. Partial select: Get user's name only
  const userNameResult = await getUserName(validUserId);
  console.log("User's Name:", userNameResult);

  // 3. Ordering: Get posts sorted alphabetically
  const sortedPosts = await getPostsAlphabetically();
  console.log("Alphabetically Sorted Posts:", sortedPosts);

  // 4. Limit & Offset: Paginated posts (Page 0, 5 per page)
  const paginatedPosts = await getPostsPaginated(0, 5);
  console.log("Paginated Posts (Page 0, 5 per page):", paginatedPosts);

  // 5. Keyset Pagination: Get posts after a timestamp (if available)
  if (sortedPosts.length > 0) {
    const afterTimestamp = sortedPosts[0].createdAt;
    const keysetPosts = await getPostsPaginatedOptimized(5, afterTimestamp);
    console.log("Keyset Paginated Posts:", keysetPosts);
  }

  // 6. Aggregation: Total views of posts in the past day
  const totalViews = await totalViewsPastDay();
  console.log("Total Views (Past Day):", totalViews);

  // 7. Aggregation: Count of posts in the past week
  const postsCount = await usersSignedUpPastWeek();
  console.log("Posts Count (Past Week):", postsCount);

  // 8. Join: Get comments for the first post (if available)
  if (sortedPosts.length > 0) {
    const postComments = await getPostWithComments(sortedPosts[0].id);
    console.log(`Comments for Post ID ${sortedPosts[0].id}:`, postComments);
  }

  // 9. Many-to-Many Join: Get posts authored by the user
  const postsByUser = await getPostsByUser("user_01JQW33JE8T7GABPXNW70WYKQS");
  console.log("Posts by User:", postsByUser);

  // 10. Query API: Get a post with its comments (if a post exists)
  if (sortedPosts.length > 0) {
    const postWithComments = await getPostWithCommentsQuery(sortedPosts[0].id);
    console.log("Post with Comments (Query API):", postWithComments);
  }

  // 11. Transaction: Create a new post with the user as the author
  const newPostData = {
    title: "New Transaction Post",
    content: "This post was created within a transaction.",
    views: 0,
    createdAt: Math.floor(Date.now() / 1000),
    updatedAt: Math.floor(Date.now() / 1000),
  };
  const newPostTxResult = await createPost(["user_01JQW33JE8T7GABPXNW70WYKQS"], newPostData);
  console.log("New Post Transaction Result:", newPostTxResult);

  // 12. Union Query: Get a unified activity feed for the user (posts & comments)
  const activityFeed = await getUserActivity("user_01JQW33JE8T7GABPXNW70WYKQS");
  console.log("User Activity Feed:", activityFeed);

  // 13. Update: Change email of the user
  const updatedUser = await changeEmail("user_01JQW33JE8T7GABPXNW70WYKQS", "updated@example.com");
  console.log("Updated User Email:", updatedUser);

  // 14. Upsert: Set or update user settings (e.g., theme to 'dark')
  const updatedSettings = await setOrUpdateSettings("user_01JQW33JE8T7GABPXNW70WYKQS", "dark");
  console.log("Updated User Settings:", updatedSettings);

  // 15. Batch Insert: Insert multiple new users
  const newUsers = await insertUsers([
    { name: "New User 1", email: "new1@example.com" },
    { name: "New User 2", email: "new2@example.com" },
  ]);
  console.log("Batch Inserted Users:", newUsers);

  // 16. Update without fetch: Increment views for a post (if available)
  if (sortedPosts.length > 0) {
    const updatedPostView = await recordPostView(sortedPosts[0].id);
    console.log("Updated Post View for first post:", updatedPostView);
  }

  // 17. Delete: Remove a user (if more than one user exists)
  if (allUsers.length > 1) {
    const deletedUser = await deleteUser(allUsers[1].id);
    console.log("Deleted User:", deletedUser);
  }

  // 18. Inner Join: Get users that have settings associated with them
  const usersWithSettingsRes = await usersWithSettings();
  console.log("Users with Settings (Inner Join):", usersWithSettingsRes);
})();


import {
  int,
  sqliteTable,
  text,
  uniqueIndex,
  index,
  primaryKey,
  real,
} from "drizzle-orm/sqlite-core";
import { sql, relations, type SQL } from "drizzle-orm";
import { ulid } from "ulid";

const createPrefixedUlid = (prefix: string) => {
  return `${prefix}_${ulid()}`;
};

// Users table
export const users = sqliteTable(
  "users",
  {
    id: text()
      .primaryKey()
      .$defaultFn(() => createPrefixedUlid("user")),
    name: text().notNull(),
    age: int(),
    email: text().notNull(),
  },
  (users) => ({
    // Index for fast querying users by email
    emailIndex: uniqueIndex("users_email_idx").on(users.email),
    nameIndex: index("user_name_index").on(users.name),
  }),
);

export const userSettings = sqliteTable("user_settings", {
  id: text()
    .primaryKey()
    .$defaultFn(() => createPrefixedUlid("settings")),
  userId: text()
    .notNull()
    .references(() => users.id)
    .unique(),
  theme: text().notNull().default("light"),
});

// Posts table
export const posts = sqliteTable(
  "posts",
  {
    id: text()
      .primaryKey()
      .$defaultFn(() => createPrefixedUlid("post")),
    title: text().notNull(),
    content: text().notNull(),
    views: int().notNull().default(0),
    estimatedReadingLength: real().generatedAlwaysAs(
      (): SQL => sql`(LENGTH(${posts.content}) * 1.0) / 863`,
      { mode: "stored" },
    ),
    // Automatically set and updating createdAd and updatedAt columns to unix epoch time in seconds
    createdAt: int({ mode: "number" }).notNull().default(sql`(unixepoch())`),
    updatedAt: int({ mode: "number" }).$onUpdate(() => sql`(unixepoch())`),
  },
  (posts) => ({
    createdAtIndex: index("posts_created_at_index").on(posts.createdAt),
  }),
);

// userPosts join table supports many-to-many relationship between users and posts, as a post may have multiple authors and an author may have multiple posts
export const userPostsTable = sqliteTable(
  "user_posts_table",
  {
    userId: text()
      .notNull()
      .references(() => users.id),
    postId: text()
      .notNull()
      .references(() => posts.id),
  },
  (t) => ({
    pk: primaryKey({ columns: [t.userId, t.postId] }),
  }),
);

// Comments table
export const comments = sqliteTable("comments", {
  id: text()
    .primaryKey()
    .$defaultFn(() => createPrefixedUlid("comment")),
  postId: text()
    .notNull()
    .references(() => posts.id),
  authorId: text()
    .notNull()
    .references(() => users.id),
  content: text().notNull(),
});

//* Optional relations for queries API
export const usersRelations = relations(users, ({ many }) => ({
  comments: many(comments),
  posts: many(userPostsTable),
}));

// A post can have many comments, but a comment can only belong to one post
export const commentsRelations = relations(comments, ({ one }) => ({
  author: one(users, {
    fields: [comments.authorId],
    references: [users.id],
  }),
  post: one(posts, {
    fields: [comments.postId],
    references: [posts.id],
  }),
}));

export const userPostsRelations = relations(userPostsTable, ({ one }) => ({
  user: one(users, {
    fields: [userPostsTable.userId],
    references: [users.id],
  }),
  post: one(posts, {
    fields: [userPostsTable.postId],
    references: [posts.id],
  }),
}));

export const postsRelations = relations(posts, ({ many }) => ({
  comments: many(comments),
  authors: many(userPostsTable),
}));

import {
  int,
  sqliteTable,
  text,
  uniqueIndex,
  primaryKey,
} from "drizzle-orm/sqlite-core";
import { sql, relations } from "drizzle-orm";
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
    // If we wanted age to be required only for verified users, this constraint would have to be enforced in the application layer
    idVerified: int({ mode: "boolean" }).notNull().default(false),
    age: int(),
    email: text().notNull(),
  },
  (users) => ({
    // Index for fast querying users by email
    emailIndex: uniqueIndex("users_email_idx").on(users.email),
  }),
);

export const userSettings = sqliteTable("user_settings", {
  id: text()
    .primaryKey()
    .$defaultFn(() => createPrefixedUlid("settings")),
  userId: int()
    .notNull()
    .references(() => users.id),
  theme: text().notNull().default("light"),
});

// Posts table
export const posts = sqliteTable("posts", {
  id: text()
    .primaryKey()
    .$defaultFn(() => createPrefixedUlid("post")),
  title: text().notNull(),
  content: text().notNull(),
  createdAt: int({ mode: "number" }).notNull().default(sql`(unixepoch())`),
  updatedAt: int({ mode: "number" }).$onUpdate(() => sql`(unixepoch())`),
});

// userPosts join table supports many-to-many relationship between users and posts, as a post may have multiple authors and an author may have multiple posts
export const userPostsTable = sqliteTable(
  "user_posts_table",
  {
    userId: int()
      .notNull()
      .references(() => users.id),
    postId: int()
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
  postId: int()
    .notNull()
    .references(() => posts.id),
  authorId: int()
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

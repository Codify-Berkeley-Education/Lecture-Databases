import {
	int,
	sqliteTable,
	text,
	uniqueIndex,
	primaryKey,
} from "drizzle-orm/sqlite-core";
import {
	sql,
	relations,
	// Todo in lecture 10
	// type InferInsertModel,
	// type InferSelectModel,
} from "drizzle-orm";

// Users table
export const usersTable = sqliteTable(
	"users_table",
	{
		id: int().primaryKey({ autoIncrement: true }),
		name: text().notNull(),
		// If we wanted age to be required only for verified users, this constraint would have to be enforced in the application layer
		idVerified: int({ mode: "boolean" }).notNull().default(false),
		age: int(),
		email: text().notNull().unique(),
	},
	(users) => ({
		// Index for fast querying users by email
		emailIndex: uniqueIndex("users_email_idx").on(users.email),
	}),
);

export const usersRelations = relations(usersTable, ({ many }) => ({
	comments: many(commentsTable),
	posts: many(userPostsTable),
}));

// Posts table
export const postsTable = sqliteTable("posts_table", {
	id: int().primaryKey({ autoIncrement: true }),
	title: text().notNull(),
	content: text().notNull(),
	createdAt: int({ mode: "number" }).notNull().default(sql`(unixepoch())`),
	updatedAt: int({ mode: "number" }).$onUpdate(() => sql`(unixepoch())`),
});

export const postsRelations = relations(postsTable, ({ many }) => ({
	comments: many(commentsTable),
	authors: many(userPostsTable),
}));

// userPosts join table supports many-to-many relationship between users and posts, as a post may have multiple authors and an author may have multiple posts
export const userPostsTable = sqliteTable(
	"user_posts_table",
	{
		userId: int()
			.notNull()
			.references(() => usersTable.id),
		postId: int()
			.notNull()
			.references(() => postsTable.id),
	},
	(t) => ({
		pk: primaryKey({ columns: [t.userId, t.postId] }),
	}),
);

export const userPostsRelations = relations(userPostsTable, ({ one }) => ({
	user: one(usersTable, {
		fields: [userPostsTable.userId],
		references: [usersTable.id],
	}),
	post: one(postsTable, {
		fields: [userPostsTable.postId],
		references: [postsTable.id],
	}),
}));

// Comments table
export const commentsTable = sqliteTable("comments_table", {
	id: int().primaryKey({ autoIncrement: true }),
	postId: int()
		.notNull()
		.references(() => postsTable.id),
	authorId: int()
		.notNull()
		.references(() => usersTable.id),
	content: text().notNull(),
});

// A post can have many comments, but a comment can only belong to one post
export const commentsRelations = relations(commentsTable, ({ one }) => ({
	author: one(usersTable, {
		fields: [commentsTable.authorId],
		references: [usersTable.id],
	}),
	post: one(postsTable, {
		fields: [commentsTable.postId],
		references: [postsTable.id],
	}),
}));

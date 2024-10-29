import "dotenv/config";
import type { InferInsertModel } from "drizzle-orm";
import {
  users as usersSchema,
  comments as commentsSchema,
  posts as postsSchema,
  userPostsTable,
} from "./schema";
import { faker } from "@faker-js/faker";
import { db } from "./index";

const seed = async () => {
  const result = await db.transaction(async (db) => {
    // Create 5 users
    const users: InferInsertModel<typeof usersSchema>[] = [];
    for (let i = 0; i < 5; i++) {
      users.push({
        name: faker.person.fullName(),
        email: faker.internet.email(),
      });
    }
    const userResults = await db.insert(usersSchema).values(users).returning();

    // Create 10 posts
    const posts: InferInsertModel<typeof postsSchema>[] = [];
    for (let i = 0; i < 10; i++) {
      posts.push({
        title: faker.lorem.sentence(),
        content: faker.lorem.paragraph(),
      });
    }
    const postResults = await db.insert(postsSchema).values(posts).returning();

    // Assign each post either one, two or three authors randomly from the 5
    const userPosts: InferInsertModel<typeof userPostsTable>[] = [];
    for (const post of postResults) {
      const authors = faker.helpers.arrayElements(userResults, {
        min: 1,
        max: 3,
      });
      for (const author of authors) {
        userPosts.push({
          userId: author.id,
          postId: post.id,
        });
      }
    }
    const userPostResults = await db
      .insert(userPostsTable)
      .values(userPosts)
      .returning();

    // Create 20 comments
    const comments: InferInsertModel<typeof commentsSchema>[] = [];
    for (let i = 0; i < 20; i++) {
      comments.push({
        content: faker.lorem.paragraph(),
        authorId:
          userResults[Math.floor(Math.random() * userResults.length)].id,
        postId: postResults[Math.floor(Math.random() * postResults.length)].id,
      });
    }
    const commentResults = await db
      .insert(commentsSchema)
      .values(comments)
      .returning();
    return { userResults, postResults, userPostResults, commentResults };
  });
  console.log("Seed script run successfully");
  return result;
};

seed();

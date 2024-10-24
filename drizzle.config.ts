import "dotenv/config";
import { defineConfig } from "drizzle-kit";

export default defineConfig({
	out: "./drizzle",
	//* Change to starter schema to use your own schema
	// schema: "./starter/schema.ts",
	schema: "./solution/schema.ts",
	dialect: "sqlite",
	dbCredentials: {
		url: process.env.DB_FILE_NAME as string,
	},
	verbose: true,
});

import "dotenv/config";
import { defineConfig } from "drizzle-kit";

//* Config file for solution code
export default defineConfig({
	out: "./drizzle",
	schema: "./solution/schema.ts",
	dialect: "sqlite",
	dbCredentials: {
		url: process.env.SOLUTION_DB_FILE_NAME as string,
	},
	verbose: true,
});

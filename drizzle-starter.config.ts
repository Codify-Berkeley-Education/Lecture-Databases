import "dotenv/config";
import { defineConfig } from "drizzle-kit";

//* Config file for starter code
export default defineConfig({
	out: "./drizzle",
	schema: "./starter/schema.ts",
	dialect: "sqlite",
	dbCredentials: {
		url: process.env.DB_FILE_NAME as string,
	},
	verbose: true,
});

import path from "node:path";
import dotenv from "dotenv";
import { Pool } from "pg";

dotenv.config({ path: path.join(__dirname, "..", "..", "frontend", ".env.local") });

export const testPool = new Pool({ connectionString: process.env.DATABASE_URL });

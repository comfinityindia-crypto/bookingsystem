import "dotenv/config";
import { defineConfig } from "prisma/config";

export default defineConfig({
  datasource: {
    url:
      process.env.DATABASE_URL ||
      "postgresql://postgres.cgojufoorcxrrxixasbt:Soorajsu%4012345@aws-0-ap-northeast-1.pooler.supabase.com:5432/postgres",
  },
});

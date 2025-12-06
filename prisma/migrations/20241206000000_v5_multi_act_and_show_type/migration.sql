-- V5: Multi-act support and show type

-- Create ShowType enum
CREATE TYPE "ShowType" AS ENUM ('HOME', 'CALLAWAY');

-- Add show_type column with default value first (will update existing records)
ALTER TABLE "videos" ADD COLUMN "show_type" "ShowType" NOT NULL DEFAULT 'HOME';

-- Create video_acts join table for many-to-many relationship
CREATE TABLE "video_acts" (
    "id" TEXT NOT NULL,
    "video_id" TEXT NOT NULL,
    "act_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "video_acts_pkey" PRIMARY KEY ("id")
);

-- Create unique constraint on video_id + act_id
CREATE UNIQUE INDEX "video_acts_video_id_act_id_key" ON "video_acts"("video_id", "act_id");

-- Add foreign keys
ALTER TABLE "video_acts" ADD CONSTRAINT "video_acts_video_id_fkey" FOREIGN KEY ("video_id") REFERENCES "videos"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "video_acts" ADD CONSTRAINT "video_acts_act_id_fkey" FOREIGN KEY ("act_id") REFERENCES "acts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Migrate existing act_id data to video_acts table
INSERT INTO "video_acts" ("id", "video_id", "act_id", "created_at")
SELECT gen_random_uuid(), "id", "act_id", "created_at"
FROM "videos"
WHERE "act_id" IS NOT NULL;

-- Drop the old act_id foreign key constraint
ALTER TABLE "videos" DROP CONSTRAINT IF EXISTS "videos_act_id_fkey";

-- Drop the old act_id column
ALTER TABLE "videos" DROP COLUMN "act_id";

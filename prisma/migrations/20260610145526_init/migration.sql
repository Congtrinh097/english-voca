-- CreateEnum
CREATE TYPE "Role" AS ENUM ('learner', 'admin');

-- CreateEnum
CREATE TYPE "Level" AS ENUM ('beginner', 'middle', 'master');

-- CreateEnum
CREATE TYPE "TopicStatus" AS ENUM ('in_progress', 'passed', 'failed');

-- CreateTable
CREATE TABLE "users" (
    "id" UUID NOT NULL,
    "email" VARCHAR(255) NOT NULL,
    "name" VARCHAR(100) NOT NULL,
    "avatar_url" TEXT,
    "google_id" VARCHAR(255),
    "password_hash" TEXT,
    "email_verified" BOOLEAN NOT NULL DEFAULT false,
    "auth_provider" VARCHAR(50) NOT NULL DEFAULT 'credentials',
    "last_login_at" TIMESTAMP(3),
    "total_glory" INTEGER NOT NULL DEFAULT 0,
    "role" "Role" NOT NULL DEFAULT 'learner',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "password_reset_tokens" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "token" TEXT NOT NULL,
    "expires_at" TIMESTAMP(3) NOT NULL,
    "used_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "password_reset_tokens_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "topics" (
    "id" UUID NOT NULL,
    "title" VARCHAR(200) NOT NULL,
    "title_vi" VARCHAR(200) NOT NULL,
    "description" TEXT,
    "level" "Level" NOT NULL,
    "glory_reward" INTEGER NOT NULL,
    "thumbnail_url" TEXT,
    "is_published" BOOLEAN NOT NULL DEFAULT false,
    "created_by" UUID NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "topics_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "words" (
    "id" UUID NOT NULL,
    "topic_id" UUID NOT NULL,
    "word" VARCHAR(100) NOT NULL,
    "pronunciation" VARCHAR(200),
    "part_of_speech" VARCHAR(50),
    "definition" TEXT NOT NULL,
    "example" TEXT NOT NULL,
    "meaning_vi" TEXT NOT NULL,
    "audio_url" TEXT,
    "order_index" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "words_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_topics" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "topic_id" UUID NOT NULL,
    "status" "TopicStatus" NOT NULL,
    "words_learned" UUID[] DEFAULT ARRAY[]::UUID[],
    "added_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "last_studied_at" TIMESTAMP(3),
    "glory_earned" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "user_topics_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "quiz_results" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "topic_id" UUID NOT NULL,
    "score" INTEGER NOT NULL,
    "total_questions" INTEGER NOT NULL DEFAULT 10,
    "percentage" DECIMAL(5,2) NOT NULL,
    "passed" BOOLEAN NOT NULL,
    "answers" JSONB,
    "taken_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "quiz_results_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "users_google_id_key" ON "users"("google_id");

-- CreateIndex
CREATE INDEX "users_total_glory_idx" ON "users"("total_glory" DESC);

-- CreateIndex
CREATE UNIQUE INDEX "password_reset_tokens_token_key" ON "password_reset_tokens"("token");

-- CreateIndex
CREATE INDEX "topics_level_idx" ON "topics"("level");

-- CreateIndex
CREATE INDEX "topics_is_published_idx" ON "topics"("is_published");

-- CreateIndex
CREATE INDEX "words_topic_id_idx" ON "words"("topic_id");

-- CreateIndex
CREATE UNIQUE INDEX "user_topics_user_id_topic_id_key" ON "user_topics"("user_id", "topic_id");

-- CreateIndex
CREATE UNIQUE INDEX "quiz_results_user_id_topic_id_key" ON "quiz_results"("user_id", "topic_id");

-- AddForeignKey
ALTER TABLE "password_reset_tokens" ADD CONSTRAINT "password_reset_tokens_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "topics" ADD CONSTRAINT "topics_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "words" ADD CONSTRAINT "words_topic_id_fkey" FOREIGN KEY ("topic_id") REFERENCES "topics"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_topics" ADD CONSTRAINT "user_topics_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_topics" ADD CONSTRAINT "user_topics_topic_id_fkey" FOREIGN KEY ("topic_id") REFERENCES "topics"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "quiz_results" ADD CONSTRAINT "quiz_results_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "quiz_results" ADD CONSTRAINT "quiz_results_topic_id_fkey" FOREIGN KEY ("topic_id") REFERENCES "topics"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- CreateTable
CREATE TABLE "Session" (
    "id" SERIAL NOT NULL,
    "user_id" INTEGER NOT NULL,
    "refresh_token" TEXT NOT NULL,
    "name_id" TEXT,
    "session_index" TEXT,

    CONSTRAINT "Session_pkey" PRIMARY KEY ("id")
);

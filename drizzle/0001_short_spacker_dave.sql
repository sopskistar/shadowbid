CREATE TABLE "worker_health" (
	"name" text PRIMARY KEY NOT NULL,
	"state" text NOT NULL,
	"details" text DEFAULT '' NOT NULL,
	"last_seen_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE "judge_bids" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"session_id" uuid NOT NULL,
	"role" text NOT NULL,
	"commitment" text NOT NULL,
	"receipt_id" uuid DEFAULT gen_random_uuid() NOT NULL,
	"amount_zats" bigint,
	"revealed_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "judge_sessions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"token_hash" text NOT NULL,
	"domain" text DEFAULT 'private-auction.example' NOT NULL,
	"starting_zats" bigint DEFAULT 1000000 NOT NULL,
	"bidding_ends_at" timestamp with time zone NOT NULL,
	"reveal_ends_at" timestamp with time zone NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "judge_sessions_token_hash_unique" UNIQUE("token_hash")
);
--> statement-breakpoint
ALTER TABLE "judge_bids" ADD CONSTRAINT "judge_bids_session_id_judge_sessions_id_fk" FOREIGN KEY ("session_id") REFERENCES "public"."judge_sessions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "judge_one_bid_per_role" ON "judge_bids" USING btree ("session_id","role");--> statement-breakpoint
CREATE UNIQUE INDEX "judge_unique_commitment" ON "judge_bids" USING btree ("commitment");
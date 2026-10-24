CREATE TABLE "auctions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"seller_id" uuid,
	"domain" text NOT NULL,
	"description" text DEFAULT '' NOT NULL,
	"category" text DEFAULT 'Premium domain' NOT NULL,
	"starting_zats" bigint NOT NULL,
	"reserve_zats" bigint,
	"bidding_ends_at" timestamp with time zone NOT NULL,
	"reveal_ends_at" timestamp with time zone NOT NULL,
	"payment_hours" integer DEFAULT 24 NOT NULL,
	"sample" boolean DEFAULT false NOT NULL,
	"dns_challenge" text,
	"dns_verified_at" timestamp with time zone,
	"cancelled_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "bids" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"auction_id" uuid NOT NULL,
	"bidder_id" uuid NOT NULL,
	"commitment" text NOT NULL,
	"receipt_id" uuid DEFAULT gen_random_uuid() NOT NULL,
	"amount_zats" bigint,
	"revealed_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "invoices" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"auction_id" uuid NOT NULL,
	"bid_id" uuid NOT NULL,
	"winner_id" uuid NOT NULL,
	"token_hash" text NOT NULL,
	"token_ciphertext" text NOT NULL,
	"amount_zats" bigint NOT NULL,
	"address" text,
	"wallet_account" text,
	"status" text DEFAULT 'unconfigured' NOT NULL,
	"paid_zats" bigint DEFAULT 0 NOT NULL,
	"deadline" timestamp with time zone NOT NULL,
	"seller_acknowledged_at" timestamp with time zone,
	"transfer_initiated_at" timestamp with time zone,
	"buyer_received_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "invoices_auction_id_unique" UNIQUE("auction_id"),
	CONSTRAINT "invoices_bid_id_unique" UNIQUE("bid_id"),
	CONSTRAINT "invoices_token_hash_unique" UNIQUE("token_hash"),
	CONSTRAINT "invoices_address_unique" UNIQUE("address"),
	CONSTRAINT "invoices_wallet_account_unique" UNIQUE("wallet_account")
);
--> statement-breakpoint
CREATE TABLE "payment_notes" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"invoice_id" uuid NOT NULL,
	"txid" text NOT NULL,
	"out_index" integer NOT NULL,
	"amount_zats" bigint NOT NULL,
	"confirmations" integer NOT NULL,
	"last_seen_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "sessions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"token_hash" text NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	CONSTRAINT "sessions_token_hash_unique" UNIQUE("token_hash")
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"email" text NOT NULL,
	"password_hash" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "users_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE "worker_events" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"nonce" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "worker_events_nonce_unique" UNIQUE("nonce")
);
--> statement-breakpoint
ALTER TABLE "auctions" ADD CONSTRAINT "auctions_seller_id_users_id_fk" FOREIGN KEY ("seller_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "bids" ADD CONSTRAINT "bids_auction_id_auctions_id_fk" FOREIGN KEY ("auction_id") REFERENCES "public"."auctions"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "bids" ADD CONSTRAINT "bids_bidder_id_users_id_fk" FOREIGN KEY ("bidder_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "invoices" ADD CONSTRAINT "invoices_auction_id_auctions_id_fk" FOREIGN KEY ("auction_id") REFERENCES "public"."auctions"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "invoices" ADD CONSTRAINT "invoices_bid_id_bids_id_fk" FOREIGN KEY ("bid_id") REFERENCES "public"."bids"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "invoices" ADD CONSTRAINT "invoices_winner_id_users_id_fk" FOREIGN KEY ("winner_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payment_notes" ADD CONSTRAINT "payment_notes_invoice_id_invoices_id_fk" FOREIGN KEY ("invoice_id") REFERENCES "public"."invoices"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sessions" ADD CONSTRAINT "sessions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "one_bid_per_bidder" ON "bids" USING btree ("auction_id","bidder_id");--> statement-breakpoint
CREATE UNIQUE INDEX "unique_commitment" ON "bids" USING btree ("commitment");--> statement-breakpoint
CREATE UNIQUE INDEX "unique_note" ON "payment_notes" USING btree ("txid","out_index");
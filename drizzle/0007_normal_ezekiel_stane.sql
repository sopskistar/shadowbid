CREATE TABLE "imported_domains" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"seller_id" uuid NOT NULL,
	"domain" text NOT NULL,
	"description" text DEFAULT '' NOT NULL,
	"starting_zats" bigint NOT NULL,
	"bidding_ends_at" timestamp with time zone NOT NULL,
	"reveal_ends_at" timestamp with time zone NOT NULL,
	"dns_challenge" text NOT NULL,
	"attested_at" timestamp with time zone DEFAULT now() NOT NULL,
	"status" text DEFAULT 'pending' NOT NULL,
	"auction_id" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "imported_domains" ADD CONSTRAINT "imported_domains_seller_id_users_id_fk" FOREIGN KEY ("seller_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "imported_domains" ADD CONSTRAINT "imported_domains_auction_id_auctions_id_fk" FOREIGN KEY ("auction_id") REFERENCES "public"."auctions"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "one_pending_import_per_seller_domain" ON "imported_domains" USING btree ("seller_id","domain") WHERE "imported_domains"."status" = 'pending';
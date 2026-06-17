CREATE TABLE "achievements" (
	"id" serial PRIMARY KEY NOT NULL,
	"key" text NOT NULL,
	"name" text NOT NULL,
	"description" text NOT NULL,
	"icon_url" text,
	"category" text,
	CONSTRAINT "achievements_key_unique" UNIQUE("key"),
	CONSTRAINT "category_check" CHECK ("achievements"."category" IN ('matches', 'solves', 'social', 'elo'))
);
--> statement-breakpoint
CREATE TABLE "user_achievements" (
	"user_id" uuid,
	"achievement_id" integer,
	"earned_at" timestamp with time zone DEFAULT now(),
	CONSTRAINT "user_achievements_user_id_achievement_id_pk" PRIMARY KEY("user_id","achievement_id")
);
--> statement-breakpoint
CREATE TABLE "elo_tiers" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"min_elo" integer NOT NULL,
	"max_elo" integer NOT NULL,
	"badge_color" text,
	"icon_url" text,
	CONSTRAINT "elo_tiers_name_unique" UNIQUE("name")
);
--> statement-breakpoint
CREATE TABLE "friend_messages" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"sender_id" uuid NOT NULL,
	"receiver_id" uuid NOT NULL,
	"content" text NOT NULL,
	"sent_at" timestamp with time zone DEFAULT now(),
	"read_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "friendships" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"requester_id" uuid NOT NULL,
	"addressee_id" uuid NOT NULL,
	"status" text DEFAULT 'pending' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now(),
	CONSTRAINT "status_check" CHECK ("friendships"."status" IN ('pending', 'accepted', 'blocked')),
	CONSTRAINT "no_self_friend" CHECK ("friendships"."requester_id" != "friendships"."addressee_id")
);
--> statement-breakpoint
CREATE TABLE "match_challenges" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"sender_id" uuid NOT NULL,
	"receiver_id" uuid NOT NULL,
	"status" text DEFAULT 'pending',
	"created_at" timestamp with time zone DEFAULT now(),
	"expires_at" timestamp with time zone DEFAULT now() + INTERVAL '2 minutes',
	CONSTRAINT "status_check" CHECK ("match_challenges"."status" IN ('pending', 'accepted', 'declined', 'expired'))
);
--> statement-breakpoint
CREATE TABLE "match_results" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"match_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"solve_time_ms" integer,
	"penalty" text,
	"elo_before" integer,
	"elo_after" integer,
	"finished_at" timestamp with time zone,
	CONSTRAINT "match_results_match_id_user_id_unique" UNIQUE("match_id","user_id"),
	CONSTRAINT "penalty_check" CHECK ("match_results"."penalty" IN ('+2', 'DNF'))
);
--> statement-breakpoint
CREATE TABLE "matches" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"scramble" text NOT NULL,
	"match_type" text NOT NULL,
	"status" text DEFAULT 'in_progress' NOT NULL,
	"player_a_id" uuid NOT NULL,
	"player_b_id" uuid NOT NULL,
	"winner_id" uuid,
	"started_at" timestamp with time zone DEFAULT now(),
	"finished_at" timestamp with time zone,
	CONSTRAINT "match_type_check" CHECK ("matches"."match_type" IN ('ranked', 'friendly')),
	CONSTRAINT "status_check" CHECK ("matches"."status" IN ('in_progress', 'finished', 'aborted'))
);
--> statement-breakpoint
CREATE TABLE "solves" (
	"id" bigint PRIMARY KEY NOT NULL,
	"user_id" uuid,
	"time_ms" integer NOT NULL,
	"penalty" text,
	"scramble" text NOT NULL,
	"source" text DEFAULT 'solo',
	"match_id" uuid,
	"solved_at" timestamp with time zone NOT NULL,
	"synced" boolean DEFAULT false,
	CONSTRAINT "source_check" CHECK ("solves"."source" IN ('solo', 'match', 'imported')),
	CONSTRAINT "penalty_check" CHECK ("solves"."penalty" IN ('+2', 'DNF'))
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"username" text NOT NULL,
	"email" text NOT NULL,
	"password_hash" text NOT NULL,
	"avatar_url" text,
	"country_code" char(2),
	"created_at" timestamp with time zone DEFAULT now(),
	"last_seen_at" timestamp with time zone DEFAULT now(),
	CONSTRAINT "users_username_unique" UNIQUE("username"),
	CONSTRAINT "users_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE "user_stats" (
	"user_id" uuid PRIMARY KEY NOT NULL,
	"elo" integer DEFAULT 1000 NOT NULL,
	"matches_played" integer DEFAULT 0,
	"matches_won" integer DEFAULT 0,
	"pb_single_ms" integer,
	"updated_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
ALTER TABLE "user_achievements" ADD CONSTRAINT "user_achievements_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_achievements" ADD CONSTRAINT "user_achievements_achievement_id_achievements_id_fk" FOREIGN KEY ("achievement_id") REFERENCES "public"."achievements"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "friend_messages" ADD CONSTRAINT "friend_messages_sender_id_users_id_fk" FOREIGN KEY ("sender_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "friend_messages" ADD CONSTRAINT "friend_messages_receiver_id_users_id_fk" FOREIGN KEY ("receiver_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "friendships" ADD CONSTRAINT "friendships_requester_id_users_id_fk" FOREIGN KEY ("requester_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "friendships" ADD CONSTRAINT "friendships_addressee_id_users_id_fk" FOREIGN KEY ("addressee_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "match_challenges" ADD CONSTRAINT "match_challenges_sender_id_users_id_fk" FOREIGN KEY ("sender_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "match_challenges" ADD CONSTRAINT "match_challenges_receiver_id_users_id_fk" FOREIGN KEY ("receiver_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "match_results" ADD CONSTRAINT "match_results_match_id_matches_id_fk" FOREIGN KEY ("match_id") REFERENCES "public"."matches"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "match_results" ADD CONSTRAINT "match_results_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "matches" ADD CONSTRAINT "matches_player_a_id_users_id_fk" FOREIGN KEY ("player_a_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "matches" ADD CONSTRAINT "matches_player_b_id_users_id_fk" FOREIGN KEY ("player_b_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "matches" ADD CONSTRAINT "matches_winner_id_users_id_fk" FOREIGN KEY ("winner_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "solves" ADD CONSTRAINT "solves_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "solves" ADD CONSTRAINT "solves_match_id_matches_id_fk" FOREIGN KEY ("match_id") REFERENCES "public"."matches"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_stats" ADD CONSTRAINT "user_stats_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_friend_messages_thread" ON "friend_messages" USING btree (LEAST("sender_id", "receiver_id"),GREATEST("sender_id", "receiver_id"),"sent_at" DESC NULLS LAST);--> statement-breakpoint
CREATE UNIQUE INDEX "uq_friendship_pair" ON "friendships" USING btree (LEAST("requester_id", "addressee_id"),GREATEST("requester_id", "addressee_id"));--> statement-breakpoint
CREATE INDEX "idx_friendships_addressee" ON "friendships" USING btree ("addressee_id","status");--> statement-breakpoint
CREATE INDEX "idx_friendships_requester" ON "friendships" USING btree ("requester_id","status");--> statement-breakpoint
CREATE INDEX "uq_pending_invite" ON "match_challenges" USING btree ("sender_id","receiver_id") WHERE "match_challenges"."status" = 'pending';--> statement-breakpoint
CREATE INDEX "idx_solves_user" ON "solves" USING btree ("user_id","solved_at" DESC NULLS LAST);
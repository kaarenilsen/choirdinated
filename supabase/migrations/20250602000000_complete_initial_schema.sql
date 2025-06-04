-- Choirdinated Complete Initial Schema Migration
-- This is the complete baseline that includes:
-- 1. Database schema (all tables and relationships)
-- 2. Authentication setup (user profiles, triggers)
-- 3. Storage setup (buckets and policies)
-- 4. Row Level Security (RLS policies for all tables)
-- 5. Voice hierarchy functionality (indexes and functions)

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =============================================================================
-- 1. CORE SCHEMA - All tables and relationships
-- =============================================================================

CREATE TABLE IF NOT EXISTS "user_profiles" (
	"id" uuid REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
	"email" text NOT NULL,
	"name" text NOT NULL,
	"birth_date" date NOT NULL,
	"phone" text,
	"avatar_url" text,
	"emergency_contact" text,
	"emergency_phone" text,
	"is_active" boolean DEFAULT true,
	"created_at" timestamp DEFAULT now(),
	"last_login" timestamp,
	CONSTRAINT "user_profiles_email_unique" UNIQUE("email")
);

CREATE TABLE IF NOT EXISTS "choirs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"organization_type" text NOT NULL,
	"founded_year" integer,
	"website" text,
	"logo_url" text,
	"settings" jsonb DEFAULT '{}',
	"created_at" timestamp DEFAULT now()
);

CREATE TABLE IF NOT EXISTS "membership_types" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"choir_id" uuid NOT NULL,
	"name" text NOT NULL,
	"display_name" text NOT NULL,
	"is_active_membership" boolean DEFAULT true,
	"can_access_system" boolean DEFAULT true,
	"can_vote" boolean DEFAULT true,
	"sort_order" integer DEFAULT 0,
	"description" text,
	"created_at" timestamp DEFAULT now()
);

CREATE TABLE IF NOT EXISTS "list_of_values" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"choir_id" uuid,
	"category" text NOT NULL,
	"value" text NOT NULL,
	"display_name" text NOT NULL,
	"description" text,
	"is_active" boolean DEFAULT true,
	"sort_order" integer DEFAULT 0,
	"parent_id" uuid,
	"metadata" jsonb DEFAULT '{}',
	"created_at" timestamp DEFAULT now()
);

-- Add voice hierarchy comment
COMMENT ON COLUMN "list_of_values"."parent_id" IS 'For voice_type entries, this references the parent voice_group. For example, "1. Soprano" and "2. Soprano" would have parent_id pointing to the "Soprano" voice_group entry.';

CREATE TABLE IF NOT EXISTS "members" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_profile_id" uuid NOT NULL,
	"choir_id" uuid NOT NULL,
	"membership_type_id" uuid NOT NULL,
	"voice_group_id" uuid NOT NULL,
	"voice_type_id" uuid,
	"notes" text,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);

CREATE TABLE IF NOT EXISTS "membership_periods" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"member_id" uuid NOT NULL,
	"start_date" date NOT NULL,
	"end_date" date,
	"membership_type_id" uuid NOT NULL,
	"voice_group_id" uuid NOT NULL,
	"voice_type_id" uuid,
	"end_reason" text,
	"notes" text,
	"created_at" timestamp DEFAULT now()
);

CREATE TABLE IF NOT EXISTS "membership_leaves" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"member_id" uuid NOT NULL,
	"leave_type" text NOT NULL,
	"start_date" date NOT NULL,
	"expected_return_date" date,
	"actual_return_date" date,
	"reason" text NOT NULL,
	"status" text DEFAULT 'pending' NOT NULL,
	"requested_at" timestamp DEFAULT now(),
	"approved_by" uuid,
	"approved_at" timestamp,
	"notes" text
);

CREATE TABLE IF NOT EXISTS "setlists" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"title" text NOT NULL,
	"description" text,
	"created_by" uuid NOT NULL,
	"created_at" timestamp DEFAULT now(),
	"is_active" boolean DEFAULT true
);

CREATE TABLE IF NOT EXISTS "events" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"choir_id" uuid,
	"title" text NOT NULL,
	"description" text,
	"type_id" uuid,
	"status_id" uuid,
	"start_time" timestamp NOT NULL,
	"end_time" timestamp NOT NULL,
	"location" text NOT NULL,
	"setlist_id" uuid,
	"attendance_mode" text DEFAULT 'opt_out' NOT NULL,
	"target_membership_types" jsonb DEFAULT '[]',
	"target_voice_groups" jsonb DEFAULT '[]',
	"target_voice_types" jsonb DEFAULT '[]',
	"include_all_active" boolean DEFAULT true,
	"notes" text,
	"created_by" uuid,
	"is_recurring" boolean DEFAULT false,
	"recurrence_rule" jsonb,
	"parent_event_id" uuid,
	"exclude_holidays" boolean DEFAULT true,
	"calendar_sync_enabled" boolean DEFAULT true,
	"created_at" timestamp DEFAULT now()
);

CREATE TABLE IF NOT EXISTS "event_attendance" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"event_id" uuid,
	"member_id" uuid,
	"intended_status" text DEFAULT 'not_responded' NOT NULL,
	"intended_reason" text,
	"actual_status" text,
	"marked_by" uuid,
	"marked_at" timestamp,
	"member_response_at" timestamp,
	"notes" text
);

CREATE TABLE IF NOT EXISTS "attendance_expectations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"event_id" uuid,
	"expected_total" integer NOT NULL,
	"on_leave_count" integer NOT NULL,
	"voice_group_breakdown" jsonb NOT NULL,
	"calculated_at" timestamp DEFAULT now()
);

CREATE TABLE IF NOT EXISTS "holidays" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"date" date NOT NULL,
	"region" text NOT NULL,
	"is_active" boolean DEFAULT true,
	"created_at" timestamp DEFAULT now()
);

CREATE TABLE IF NOT EXISTS "sheet_music" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"title" text NOT NULL,
	"composer" text NOT NULL,
	"arranger" text,
	"key_signature" text,
	"time_signature" text,
	"duration_minutes" integer,
	"difficulty_level" integer,
	"language" text NOT NULL,
	"genre" text,
	"file_url" text NOT NULL,
	"file_type" text NOT NULL,
	"file_size_bytes" bigint NOT NULL,
	"uploaded_by" uuid NOT NULL,
	"uploaded_at" timestamp DEFAULT now(),
	"is_public" boolean DEFAULT false
);

CREATE TABLE IF NOT EXISTS "audio_files" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"sheet_music_id" uuid NOT NULL,
	"title" text NOT NULL,
	"voice_type_id" uuid,
	"voice_group_id" uuid,
	"file_url" text NOT NULL,
	"duration_seconds" integer NOT NULL,
	"file_size_bytes" bigint NOT NULL,
	"uploaded_by" uuid NOT NULL,
	"uploaded_at" timestamp DEFAULT now()
);

CREATE TABLE IF NOT EXISTS "setlist_items" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"setlist_id" uuid NOT NULL,
	"sheet_music_id" uuid NOT NULL,
	"order_index" integer NOT NULL,
	"notes" text
);

CREATE TABLE IF NOT EXISTS "info_feed" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"title" text NOT NULL,
	"content" text NOT NULL,
	"author_id" uuid NOT NULL,
	"published_at" timestamp DEFAULT now(),
	"is_pinned" boolean DEFAULT false,
	"target_membership_types" jsonb DEFAULT '[]',
	"target_voice_groups" jsonb DEFAULT '[]',
	"target_voice_types" jsonb DEFAULT '[]',
	"include_all_active" boolean DEFAULT true,
	"allows_comments" boolean DEFAULT true
);

CREATE TABLE IF NOT EXISTS "chats" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text,
	"type" text NOT NULL,
	"voice_type_id" uuid,
	"voice_group_id" uuid,
	"membership_type_ids" jsonb DEFAULT '[]',
	"created_by" uuid NOT NULL,
	"created_at" timestamp DEFAULT now(),
	"is_active" boolean DEFAULT true
);

CREATE TABLE IF NOT EXISTS "messages" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"chat_id" uuid NOT NULL,
	"sender_id" uuid NOT NULL,
	"content" text NOT NULL,
	"sent_at" timestamp DEFAULT now()
);

-- =============================================================================
-- 2. FOREIGN KEY CONSTRAINTS
-- =============================================================================

DO $$ BEGIN
 ALTER TABLE "membership_types" ADD CONSTRAINT "membership_types_choir_id_choirs_id_fk" FOREIGN KEY ("choir_id") REFERENCES "public"."choirs"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
 ALTER TABLE "list_of_values" ADD CONSTRAINT "list_of_values_choir_id_choirs_id_fk" FOREIGN KEY ("choir_id") REFERENCES "public"."choirs"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
 ALTER TABLE "list_of_values" ADD CONSTRAINT "list_of_values_parent_id_list_of_values_id_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."list_of_values"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
 ALTER TABLE "members" ADD CONSTRAINT "members_user_profile_id_user_profiles_id_fk" FOREIGN KEY ("user_profile_id") REFERENCES "public"."user_profiles"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
 ALTER TABLE "members" ADD CONSTRAINT "members_choir_id_choirs_id_fk" FOREIGN KEY ("choir_id") REFERENCES "public"."choirs"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
 ALTER TABLE "members" ADD CONSTRAINT "members_membership_type_id_membership_types_id_fk" FOREIGN KEY ("membership_type_id") REFERENCES "public"."membership_types"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
 ALTER TABLE "members" ADD CONSTRAINT "members_voice_group_id_list_of_values_id_fk" FOREIGN KEY ("voice_group_id") REFERENCES "public"."list_of_values"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
 ALTER TABLE "members" ADD CONSTRAINT "members_voice_type_id_list_of_values_id_fk" FOREIGN KEY ("voice_type_id") REFERENCES "public"."list_of_values"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
 ALTER TABLE "membership_periods" ADD CONSTRAINT "membership_periods_member_id_members_id_fk" FOREIGN KEY ("member_id") REFERENCES "public"."members"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
 ALTER TABLE "membership_periods" ADD CONSTRAINT "membership_periods_membership_type_id_membership_types_id_fk" FOREIGN KEY ("membership_type_id") REFERENCES "public"."membership_types"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
 ALTER TABLE "membership_periods" ADD CONSTRAINT "membership_periods_voice_group_id_list_of_values_id_fk" FOREIGN KEY ("voice_group_id") REFERENCES "public"."list_of_values"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
 ALTER TABLE "membership_periods" ADD CONSTRAINT "membership_periods_voice_type_id_list_of_values_id_fk" FOREIGN KEY ("voice_type_id") REFERENCES "public"."list_of_values"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
 ALTER TABLE "membership_leaves" ADD CONSTRAINT "membership_leaves_member_id_members_id_fk" FOREIGN KEY ("member_id") REFERENCES "public"."members"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
 ALTER TABLE "membership_leaves" ADD CONSTRAINT "membership_leaves_approved_by_user_profiles_id_fk" FOREIGN KEY ("approved_by") REFERENCES "public"."user_profiles"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
 ALTER TABLE "setlists" ADD CONSTRAINT "setlists_created_by_user_profiles_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."user_profiles"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
 ALTER TABLE "events" ADD CONSTRAINT "events_choir_id_choirs_id_fk" FOREIGN KEY ("choir_id") REFERENCES "public"."choirs"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
 ALTER TABLE "events" ADD CONSTRAINT "events_type_id_list_of_values_id_fk" FOREIGN KEY ("type_id") REFERENCES "public"."list_of_values"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
 ALTER TABLE "events" ADD CONSTRAINT "events_status_id_list_of_values_id_fk" FOREIGN KEY ("status_id") REFERENCES "public"."list_of_values"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
 ALTER TABLE "events" ADD CONSTRAINT "events_setlist_id_setlists_id_fk" FOREIGN KEY ("setlist_id") REFERENCES "public"."setlists"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
 ALTER TABLE "events" ADD CONSTRAINT "events_created_by_user_profiles_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."user_profiles"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
 ALTER TABLE "events" ADD CONSTRAINT "events_parent_event_id_events_id_fk" FOREIGN KEY ("parent_event_id") REFERENCES "public"."events"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
 ALTER TABLE "event_attendance" ADD CONSTRAINT "event_attendance_event_id_events_id_fk" FOREIGN KEY ("event_id") REFERENCES "public"."events"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
 ALTER TABLE "event_attendance" ADD CONSTRAINT "event_attendance_member_id_members_id_fk" FOREIGN KEY ("member_id") REFERENCES "public"."members"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
 ALTER TABLE "event_attendance" ADD CONSTRAINT "event_attendance_marked_by_user_profiles_id_fk" FOREIGN KEY ("marked_by") REFERENCES "public"."user_profiles"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
 ALTER TABLE "attendance_expectations" ADD CONSTRAINT "attendance_expectations_event_id_events_id_fk" FOREIGN KEY ("event_id") REFERENCES "public"."events"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
 ALTER TABLE "sheet_music" ADD CONSTRAINT "sheet_music_uploaded_by_user_profiles_id_fk" FOREIGN KEY ("uploaded_by") REFERENCES "public"."user_profiles"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
 ALTER TABLE "audio_files" ADD CONSTRAINT "audio_files_sheet_music_id_sheet_music_id_fk" FOREIGN KEY ("sheet_music_id") REFERENCES "public"."sheet_music"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
 ALTER TABLE "audio_files" ADD CONSTRAINT "audio_files_voice_type_id_list_of_values_id_fk" FOREIGN KEY ("voice_type_id") REFERENCES "public"."list_of_values"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
 ALTER TABLE "audio_files" ADD CONSTRAINT "audio_files_voice_group_id_list_of_values_id_fk" FOREIGN KEY ("voice_group_id") REFERENCES "public"."list_of_values"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
 ALTER TABLE "audio_files" ADD CONSTRAINT "audio_files_uploaded_by_user_profiles_id_fk" FOREIGN KEY ("uploaded_by") REFERENCES "public"."user_profiles"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
 ALTER TABLE "setlist_items" ADD CONSTRAINT "setlist_items_setlist_id_setlists_id_fk" FOREIGN KEY ("setlist_id") REFERENCES "public"."setlists"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
 ALTER TABLE "setlist_items" ADD CONSTRAINT "setlist_items_sheet_music_id_sheet_music_id_fk" FOREIGN KEY ("sheet_music_id") REFERENCES "public"."sheet_music"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
 ALTER TABLE "info_feed" ADD CONSTRAINT "info_feed_author_id_user_profiles_id_fk" FOREIGN KEY ("author_id") REFERENCES "public"."user_profiles"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
 ALTER TABLE "chats" ADD CONSTRAINT "chats_voice_type_id_list_of_values_id_fk" FOREIGN KEY ("voice_type_id") REFERENCES "public"."list_of_values"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
 ALTER TABLE "chats" ADD CONSTRAINT "chats_voice_group_id_list_of_values_id_fk" FOREIGN KEY ("voice_group_id") REFERENCES "public"."list_of_values"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
 ALTER TABLE "chats" ADD CONSTRAINT "chats_created_by_user_profiles_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."user_profiles"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
 ALTER TABLE "messages" ADD CONSTRAINT "messages_chat_id_chats_id_fk" FOREIGN KEY ("chat_id") REFERENCES "public"."chats"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
 ALTER TABLE "messages" ADD CONSTRAINT "messages_sender_id_user_profiles_id_fk" FOREIGN KEY ("sender_id") REFERENCES "public"."user_profiles"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

-- =============================================================================
-- 3. AUTHENTICATION SETUP
-- =============================================================================

-- Function to handle new user registration
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.user_profiles (id, email, name, birth_date)
    VALUES (
        new.id,
        new.email,
        COALESCE(new.raw_user_meta_data->>'name', 'Nytt medlem'),
        COALESCE((new.raw_user_meta_data->>'birth_date')::date, CURRENT_DATE)
    );
    RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to create user profile on signup
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- Function to update user profile last_login
CREATE OR REPLACE FUNCTION public.update_last_login()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE public.user_profiles
    SET last_login = NOW()
    WHERE id = new.id;
    RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to update last_login on sign in
DROP TRIGGER IF EXISTS on_auth_user_sign_in ON auth.users;
CREATE TRIGGER on_auth_user_sign_in
    AFTER UPDATE OF last_sign_in_at ON auth.users
    FOR EACH ROW EXECUTE PROCEDURE public.update_last_login();

-- =============================================================================
-- 4. STORAGE SETUP
-- =============================================================================

-- Create storage buckets
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES 
    ('sheet-music-files', 'sheet-music-files', false, 52428800, ARRAY['application/pdf', 'application/xml', 'text/xml']),
    ('audio-files', 'audio-files', false, 104857600, ARRAY['audio/mpeg', 'audio/wav', 'audio/mp3', 'audio/ogg']),
    ('avatars', 'avatars', true, 5242880, ARRAY['image/jpeg', 'image/png', 'image/webp']),
    ('choir-logos', 'choir-logos', true, 5242880, ARRAY['image/jpeg', 'image/png', 'image/webp'])
ON CONFLICT (id) DO NOTHING;

-- Storage policies for sheet-music-files bucket
CREATE POLICY "Authenticated users can view sheet music"
ON storage.objects FOR SELECT
USING (bucket_id = 'sheet-music-files' AND auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can upload sheet music"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'sheet-music-files' AND auth.role() = 'authenticated');

CREATE POLICY "Users can update their own uploads"
ON storage.objects FOR UPDATE
USING (bucket_id = 'sheet-music-files' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can delete their own uploads"
ON storage.objects FOR DELETE
USING (bucket_id = 'sheet-music-files' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Storage policies for audio-files bucket
CREATE POLICY "Authenticated users can view audio files"
ON storage.objects FOR SELECT
USING (bucket_id = 'audio-files' AND auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can upload audio files"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'audio-files' AND auth.role() = 'authenticated');

CREATE POLICY "Users can update their own audio uploads"
ON storage.objects FOR UPDATE
USING (bucket_id = 'audio-files' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can delete their own audio uploads"
ON storage.objects FOR DELETE
USING (bucket_id = 'audio-files' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Storage policies for avatars bucket (public)
CREATE POLICY "Anyone can view avatars"
ON storage.objects FOR SELECT
USING (bucket_id = 'avatars');

CREATE POLICY "Users can upload their own avatar"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can update their own avatar"
ON storage.objects FOR UPDATE
USING (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can delete their own avatar"
ON storage.objects FOR DELETE
USING (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Storage policies for choir-logos bucket (public)
CREATE POLICY "Anyone can view choir logos"
ON storage.objects FOR SELECT
USING (bucket_id = 'choir-logos');

CREATE POLICY "Authenticated users can upload choir logos"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'choir-logos' AND auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can update choir logos"
ON storage.objects FOR UPDATE
USING (bucket_id = 'choir-logos' AND auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can delete choir logos"
ON storage.objects FOR DELETE
USING (bucket_id = 'choir-logos' AND auth.role() = 'authenticated');

-- =============================================================================
-- 5. ROW LEVEL SECURITY SETUP
-- =============================================================================

-- Enable RLS on all tables
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE choirs ENABLE ROW LEVEL SECURITY;
ALTER TABLE membership_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE list_of_values ENABLE ROW LEVEL SECURITY;
ALTER TABLE members ENABLE ROW LEVEL SECURITY;
ALTER TABLE membership_periods ENABLE ROW LEVEL SECURITY;
ALTER TABLE membership_leaves ENABLE ROW LEVEL SECURITY;
ALTER TABLE events ENABLE ROW LEVEL SECURITY;
ALTER TABLE event_attendance ENABLE ROW LEVEL SECURITY;
ALTER TABLE attendance_expectations ENABLE ROW LEVEL SECURITY;
ALTER TABLE holidays ENABLE ROW LEVEL SECURITY;
ALTER TABLE sheet_music ENABLE ROW LEVEL SECURITY;
ALTER TABLE audio_files ENABLE ROW LEVEL SECURITY;
ALTER TABLE setlists ENABLE ROW LEVEL SECURITY;
ALTER TABLE setlist_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE info_feed ENABLE ROW LEVEL SECURITY;
ALTER TABLE chats ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

-- Helper function to get user's choir memberships
CREATE OR REPLACE FUNCTION get_user_choir_ids(user_id UUID)
RETURNS UUID[] AS $$
BEGIN
    RETURN ARRAY(
        SELECT DISTINCT m.choir_id
        FROM members m
        INNER JOIN membership_types mt ON m.membership_type_id = mt.id
        WHERE m.user_profile_id = user_id 
        AND mt.can_access_system = true
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Helper function to check if user is admin/conductor
CREATE OR REPLACE FUNCTION is_choir_admin(user_id UUID, choir_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS(
        SELECT 1
        FROM members m
        INNER JOIN membership_types mt ON m.membership_type_id = mt.id
        WHERE m.user_profile_id = user_id 
        AND m.choir_id = choir_id
        AND mt.name IN ('admin', 'conductor')
        AND mt.can_access_system = true
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- User profiles policies
CREATE POLICY "Users can view own profile" ON user_profiles
    FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON user_profiles
    FOR UPDATE USING (auth.uid() = id);

-- Choirs policies
CREATE POLICY "Users can view their choir" ON choirs
    FOR SELECT USING (id = ANY(get_user_choir_ids(auth.uid())));

CREATE POLICY "Admins can update their choir" ON choirs
    FOR UPDATE USING (is_choir_admin(auth.uid(), id));

-- Members policies
CREATE POLICY "Users can view members of their choir" ON members
    FOR SELECT USING (choir_id = ANY(get_user_choir_ids(auth.uid())));

CREATE POLICY "Users can view their own member record" ON members
    FOR SELECT USING (user_profile_id = auth.uid());

CREATE POLICY "Admins can manage members" ON members
    FOR ALL USING (is_choir_admin(auth.uid(), choir_id));

-- Membership Types policies
CREATE POLICY "Users can view membership types of their choir" ON membership_types
    FOR SELECT USING (choir_id = ANY(get_user_choir_ids(auth.uid())));

CREATE POLICY "Admins can manage membership types" ON membership_types
    FOR ALL USING (is_choir_admin(auth.uid(), choir_id));

-- List of Values policies
CREATE POLICY "Users can view list of values for their choir" ON list_of_values
    FOR SELECT USING (choir_id = ANY(get_user_choir_ids(auth.uid())) OR choir_id IS NULL);

CREATE POLICY "Admins can manage list of values" ON list_of_values
    FOR ALL USING (choir_id IS NULL OR is_choir_admin(auth.uid(), choir_id));

-- Events policies
CREATE POLICY "Users can view events for their choir" ON events
    FOR SELECT USING (choir_id = ANY(get_user_choir_ids(auth.uid())));

CREATE POLICY "Admins can manage events" ON events
    FOR ALL USING (is_choir_admin(auth.uid(), choir_id));

-- Event Attendance policies
CREATE POLICY "Users can view attendance for their choir events" ON event_attendance
    FOR SELECT USING (
        EXISTS(
            SELECT 1 FROM events e 
            WHERE e.id = event_id 
            AND e.choir_id = ANY(get_user_choir_ids(auth.uid()))
        )
    );

CREATE POLICY "Users can manage their own attendance" ON event_attendance
    FOR ALL USING (
        EXISTS(
            SELECT 1 FROM members m 
            WHERE m.id = member_id 
            AND m.user_profile_id = auth.uid()
        )
    );

CREATE POLICY "Admins can manage all attendance" ON event_attendance
    FOR ALL USING (
        EXISTS(
            SELECT 1 FROM events e 
            WHERE e.id = event_id 
            AND is_choir_admin(auth.uid(), e.choir_id)
        )
    );

-- Sheet Music policies
CREATE POLICY "Users can view sheet music" ON sheet_music
    FOR SELECT USING (is_public = true OR uploaded_by = auth.uid());

CREATE POLICY "Authenticated users can upload sheet music" ON sheet_music
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Users can manage their own sheet music" ON sheet_music
    FOR ALL USING (uploaded_by = auth.uid());

-- Audio Files policies
CREATE POLICY "Users can view audio files" ON audio_files
    FOR SELECT USING (
        EXISTS(
            SELECT 1 FROM sheet_music sm 
            WHERE sm.id = sheet_music_id 
            AND (sm.is_public = true OR sm.uploaded_by = auth.uid())
        )
    );

CREATE POLICY "Users can manage their own audio files" ON audio_files
    FOR ALL USING (uploaded_by = auth.uid());

-- Info Feed policies
CREATE POLICY "Users can view info feed for their choir" ON info_feed
    FOR SELECT USING (
        include_all_active = true 
        OR EXISTS(
            SELECT 1 FROM members m
            INNER JOIN membership_types mt ON m.membership_type_id = mt.id
            WHERE m.user_profile_id = auth.uid()
            AND mt.can_access_system = true
        )
    );

CREATE POLICY "Admins can manage info feed" ON info_feed
    FOR ALL USING (auth.role() = 'authenticated');

-- Chats policies
CREATE POLICY "Users can view their chats" ON chats
    FOR SELECT USING (
        created_by = auth.uid() 
        OR EXISTS(
            SELECT 1 FROM members m
            WHERE m.user_profile_id = auth.uid()
            AND (
                (voice_type_id IS NOT NULL AND m.voice_type_id = voice_type_id)
                OR (voice_group_id IS NOT NULL AND m.voice_group_id = voice_group_id)
                OR (membership_type_ids IS NOT NULL AND m.membership_type_id = ANY(SELECT jsonb_array_elements_text(membership_type_ids)::uuid))
            )
        )
    );

-- Messages policies
CREATE POLICY "Users can view messages in their chats" ON messages
    FOR SELECT USING (
        EXISTS(
            SELECT 1 FROM chats c
            WHERE c.id = chat_id
            AND (
                c.created_by = auth.uid()
                OR EXISTS(
                    SELECT 1 FROM members m
                    WHERE m.user_profile_id = auth.uid()
                    AND (
                        (c.voice_type_id IS NOT NULL AND m.voice_type_id = c.voice_type_id)
                        OR (c.voice_group_id IS NOT NULL AND m.voice_group_id = c.voice_group_id)
                        OR (c.membership_type_ids IS NOT NULL AND m.membership_type_id = ANY(SELECT jsonb_array_elements_text(c.membership_type_ids)::uuid))
                    )
                )
            )
        )
    );

CREATE POLICY "Users can send messages to their chats" ON messages
    FOR INSERT WITH CHECK (
        sender_id = auth.uid()
        AND EXISTS(
            SELECT 1 FROM chats c
            WHERE c.id = chat_id
            AND (
                c.created_by = auth.uid()
                OR EXISTS(
                    SELECT 1 FROM members m
                    WHERE m.user_profile_id = auth.uid()
                    AND (
                        (c.voice_type_id IS NOT NULL AND m.voice_type_id = c.voice_type_id)
                        OR (c.voice_group_id IS NOT NULL AND m.voice_group_id = c.voice_group_id)
                        OR (c.membership_type_ids IS NOT NULL AND m.membership_type_id = ANY(SELECT jsonb_array_elements_text(c.membership_type_ids)::uuid))
                    )
                )
            )
        )
    );

-- =============================================================================
-- 6. VOICE HIERARCHY FUNCTIONALITY
-- =============================================================================

-- Add indexes for voice hierarchy performance
CREATE INDEX IF NOT EXISTS "idx_list_of_values_parent_id" ON "list_of_values" ("parent_id");
CREATE INDEX IF NOT EXISTS "idx_list_of_values_category_choir" ON "list_of_values" ("category", "choir_id");
CREATE INDEX IF NOT EXISTS "idx_list_of_values_parent_active" ON "list_of_values" ("parent_id", "is_active");

-- Voice hierarchy functions
-- Function to get all voice types for a given voice group
CREATE OR REPLACE FUNCTION get_voice_types_for_group(group_id UUID)
RETURNS TABLE(id UUID, value TEXT, display_name TEXT)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN QUERY
    SELECT lov.id, lov.value, lov.display_name
    FROM list_of_values lov
    WHERE lov.parent_id = group_id
    AND lov.category = 'voice_type'
    AND lov.is_active = true
    ORDER BY lov.sort_order, lov.display_name;
END;
$$;

-- Function to get all members in a voice group (including all voice types)
CREATE OR REPLACE FUNCTION get_members_by_voice_group(p_choir_id UUID, p_voice_group_ids UUID[])
RETURNS TABLE(member_id UUID)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN QUERY
    SELECT DISTINCT m.id
    FROM members m
    WHERE m.choir_id = p_choir_id
    AND (
        -- Direct voice group match
        m.voice_group_id = ANY(p_voice_group_ids)
        OR
        -- Voice type match where parent is in the group list
        EXISTS (
            SELECT 1
            FROM list_of_values vt
            WHERE vt.id = m.voice_type_id
            AND vt.parent_id = ANY(p_voice_group_ids)
            AND vt.category = 'voice_type'
            AND vt.is_active = true
        )
    );
END;
$$;

-- Function to expand voice group targets to include all related voice types
CREATE OR REPLACE FUNCTION expand_voice_targets(
    p_voice_group_ids UUID[],
    p_voice_type_ids UUID[]
)
RETURNS TABLE(voice_type_id UUID, voice_group_id UUID)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN QUERY
    -- Include directly specified voice types
    SELECT vt.id as voice_type_id, vt.parent_id as voice_group_id
    FROM list_of_values vt
    WHERE vt.id = ANY(p_voice_type_ids)
    AND vt.category = 'voice_type'
    
    UNION
    
    -- Include all voice types under specified voice groups
    SELECT vt.id as voice_type_id, vt.parent_id as voice_group_id
    FROM list_of_values vt
    WHERE vt.parent_id = ANY(p_voice_group_ids)
    AND vt.category = 'voice_type'
    AND vt.is_active = true;
END;
$$;

-- Function to check if a member belongs to targeted voice groups/types
CREATE OR REPLACE FUNCTION member_in_voice_targets(
    p_member_id UUID,
    p_target_voice_groups JSONB,
    p_target_voice_types JSONB
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_member_voice_group_id UUID;
    v_member_voice_type_id UUID;
    v_voice_group_array UUID[];
    v_voice_type_array UUID[];
BEGIN
    -- Get member's voice assignments
    SELECT m.voice_group_id, m.voice_type_id
    INTO v_member_voice_group_id, v_member_voice_type_id
    FROM members m
    WHERE m.id = p_member_id;
    
    -- Convert JSONB arrays to UUID arrays
    SELECT ARRAY(SELECT jsonb_array_elements_text(p_target_voice_groups)::UUID)
    INTO v_voice_group_array;
    
    SELECT ARRAY(SELECT jsonb_array_elements_text(p_target_voice_types)::UUID)
    INTO v_voice_type_array;
    
    -- Check if member matches any target
    -- 1. Direct voice group match
    IF v_member_voice_group_id = ANY(v_voice_group_array) THEN
        RETURN TRUE;
    END IF;
    
    -- 2. Direct voice type match
    IF v_member_voice_type_id IS NOT NULL AND v_member_voice_type_id = ANY(v_voice_type_array) THEN
        RETURN TRUE;
    END IF;
    
    -- 3. Voice type under targeted voice group
    IF v_member_voice_type_id IS NOT NULL THEN
        RETURN EXISTS (
            SELECT 1
            FROM list_of_values vt
            WHERE vt.id = v_member_voice_type_id
            AND vt.parent_id = ANY(v_voice_group_array)
            AND vt.category = 'voice_type'
            AND vt.is_active = true
        );
    END IF;
    
    RETURN FALSE;
END;
$$;

-- Grant execute permissions on new functions
GRANT EXECUTE ON FUNCTION get_voice_types_for_group TO authenticated;
GRANT EXECUTE ON FUNCTION get_members_by_voice_group TO authenticated;
GRANT EXECUTE ON FUNCTION expand_voice_targets TO authenticated;
GRANT EXECUTE ON FUNCTION member_in_voice_targets TO authenticated;
GRANT EXECUTE ON FUNCTION get_user_choir_ids TO authenticated;
GRANT EXECUTE ON FUNCTION is_choir_admin TO authenticated;
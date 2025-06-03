-- Row Level Security Policies for ChorOS
-- Run this after running your Drizzle migrations

-- Enable RLS on all tables
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
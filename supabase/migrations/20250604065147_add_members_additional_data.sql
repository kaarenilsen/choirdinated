-- Add additional_data field to members table to store unmapped fields from imports
ALTER TABLE members 
ADD COLUMN IF NOT EXISTS additional_data JSONB DEFAULT '{}';

-- Add comment to explain the field
COMMENT ON COLUMN members.additional_data IS 'Stores additional unmapped fields from external system imports (e.g., Styreportalen, Choirmate). This allows preserving all original data that doesn''t have a direct mapping to our schema.';

-- Create an index on additional_data for better query performance if needed
CREATE INDEX IF NOT EXISTS idx_members_additional_data ON members USING GIN (additional_data);
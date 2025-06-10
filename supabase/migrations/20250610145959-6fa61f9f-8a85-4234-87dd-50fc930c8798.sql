
-- Update the checkout_comparisons table to ensure ai_analysis column exists and can store check-in data
-- The ai_analysis column should already exist, but let's make sure it's properly configured
ALTER TABLE checkout_comparisons 
ALTER COLUMN ai_analysis SET DEFAULT '{}'::jsonb;

-- Add a comment to clarify what this column stores
COMMENT ON COLUMN checkout_comparisons.ai_analysis IS 'Stores complete component data including check-in reference data (images, descriptions, conditions) and any AI analysis results';

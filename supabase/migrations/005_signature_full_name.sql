-- Add full_name to signatures so sender name is stored with their signature
ALTER TABLE signatures ADD COLUMN full_name text;

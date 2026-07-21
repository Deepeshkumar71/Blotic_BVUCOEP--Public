-- Seed data for Blotic BVUCOEP application
-- This file contains initial data for development and testing

-- Note: This is for development/testing only
-- Production data should be managed separately

-- Example: Insert test profiles (only if they don't exist)
-- Uncomment and modify as needed for your development environment

-- INSERT INTO profiles (id, email, full_name, role, created_at)
-- SELECT 
--   gen_random_uuid(),
--   'test@example.com',
--   'Test User',
--   'member',
--   now()
-- WHERE NOT EXISTS (
--   SELECT 1 FROM profiles WHERE email = 'test@example.com'
-- );

-- Example: Insert admin user (only if it doesn't exist)
-- INSERT INTO profiles (id, email, full_name, role, created_at)
-- SELECT 
--   gen_random_uuid(),
--   'admin@blotic.com',
--   'Admin User',
--   'admin',
--   now()
-- WHERE NOT EXISTS (
--   SELECT 1 FROM profiles WHERE email = 'admin@blotic.com'
-- );

-- Add any other seed data your application needs for development
-- Examples: default settings, test events, sample gallery items, etc.

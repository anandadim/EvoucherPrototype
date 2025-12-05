-- Migration: Add UTM tracking to downloads table
-- Date: 2024-11-27
-- Description: Add utm_source column for tracking download sources (RT01, RT02, etc)

-- Add utm_source column with default value 'direct'
ALTER TABLE downloads ADD COLUMN utm_source TEXT DEFAULT 'direct';

-- Verify the column was added
-- Run this to check: SELECT sql FROM sqlite_master WHERE name='downloads';

-- Sample query to test
-- SELECT id, phone_number, utm_source FROM downloads LIMIT 5;

-- Migration script to update photo_url column to support larger base64 images
-- Run this SQL script on your database

USE financeflow;

-- Change photo_url from VARCHAR(500) to MEDIUMTEXT to support large base64 images
ALTER TABLE users MODIFY COLUMN photo_url MEDIUMTEXT;


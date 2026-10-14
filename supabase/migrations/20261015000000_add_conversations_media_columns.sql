-- ============================================================
-- Migration: Add media_url and media_type columns to conversations
-- File: supabase/migrations/20261015000000_add_conversations_media_columns.sql
-- ============================================================

ALTER TABLE public.conversations
    ADD COLUMN IF NOT EXISTS media_url TEXT,
    ADD COLUMN IF NOT EXISTS media_type TEXT;

ALTER TABLE t_p60083583_messenger_phone_to_p.messages
  ADD COLUMN IF NOT EXISTS media_url TEXT,
  ADD COLUMN IF NOT EXISTS media_type VARCHAR(20);

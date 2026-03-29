
CREATE TABLE IF NOT EXISTS t_p60083583_messenger_phone_to_p.users (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  phone VARCHAR(20) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  username VARCHAR(50) UNIQUE,
  bio TEXT DEFAULT '',
  online BOOLEAN DEFAULT FALSE,
  last_seen TIMESTAMP DEFAULT NOW(),
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS t_p60083583_messenger_phone_to_p.chats (
  id SERIAL PRIMARY KEY,
  is_group BOOLEAN DEFAULT FALSE,
  name VARCHAR(100),
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS t_p60083583_messenger_phone_to_p.chat_members (
  id SERIAL PRIMARY KEY,
  chat_id INT REFERENCES t_p60083583_messenger_phone_to_p.chats(id),
  user_id INT REFERENCES t_p60083583_messenger_phone_to_p.users(id),
  joined_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(chat_id, user_id)
);

CREATE TABLE IF NOT EXISTS t_p60083583_messenger_phone_to_p.messages (
  id SERIAL PRIMARY KEY,
  chat_id INT REFERENCES t_p60083583_messenger_phone_to_p.chats(id),
  sender_id INT REFERENCES t_p60083583_messenger_phone_to_p.users(id),
  text TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  is_read BOOLEAN DEFAULT FALSE
);

CREATE TABLE IF NOT EXISTS t_p60083583_messenger_phone_to_p.sessions (
  id SERIAL PRIMARY KEY,
  user_id INT REFERENCES t_p60083583_messenger_phone_to_p.users(id),
  token VARCHAR(128) UNIQUE NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_messages_chat_id ON t_p60083583_messenger_phone_to_p.messages(chat_id);
CREATE INDEX IF NOT EXISTS idx_chat_members_user_id ON t_p60083583_messenger_phone_to_p.chat_members(user_id);
CREATE INDEX IF NOT EXISTS idx_sessions_token ON t_p60083583_messenger_phone_to_p.sessions(token);

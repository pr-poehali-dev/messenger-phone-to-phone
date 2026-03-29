CREATE TABLE IF NOT EXISTS calls (
  id SERIAL PRIMARY KEY,
  chat_id INT NOT NULL REFERENCES chats(id),
  caller_id INT NOT NULL REFERENCES users(id),
  callee_id INT NOT NULL REFERENCES users(id),
  call_type VARCHAR(10) NOT NULL DEFAULT 'audio',
  status VARCHAR(20) NOT NULL DEFAULT 'ringing',
  created_at TIMESTAMP DEFAULT NOW(),
  answered_at TIMESTAMP,
  ended_at TIMESTAMP
);

CREATE TABLE IF NOT EXISTS call_signals (
  id SERIAL PRIMARY KEY,
  call_id INT NOT NULL REFERENCES calls(id),
  from_user_id INT NOT NULL REFERENCES users(id),
  to_user_id INT NOT NULL REFERENCES users(id),
  signal_type VARCHAR(20) NOT NULL,
  payload TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_calls_chat_id ON calls(chat_id);
CREATE INDEX IF NOT EXISTS idx_call_signals_call_id ON call_signals(call_id);
CREATE INDEX IF NOT EXISTS idx_call_signals_to_user ON call_signals(to_user_id, created_at);

CREATE TABLE shared_chat_snapshots (
  share_id VARCHAR(20) PRIMARY KEY,
  original_session_id UUID NOT NULL,
  user_email VARCHAR(255) NOT NULL,
  user_name VARCHAR(255) NOT NULL,
  title VARCHAR(255) NOT NULL,
  messages JSONB NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_shared_snapshots_original_session ON shared_chat_snapshots(original_session_id);

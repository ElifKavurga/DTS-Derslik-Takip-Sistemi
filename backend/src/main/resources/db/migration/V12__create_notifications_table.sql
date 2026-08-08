CREATE TABLE notifications (
    id UUID PRIMARY KEY,
    recipient_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    title VARCHAR(150) NOT NULL,
    message VARCHAR(500) NOT NULL,
    target_url VARCHAR(255),
    read_at TIMESTAMP,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_notifications_recipient_created_at
    ON notifications (recipient_id, created_at DESC);

CREATE INDEX idx_notifications_recipient_unread
    ON notifications (recipient_id)
    WHERE read_at IS NULL;

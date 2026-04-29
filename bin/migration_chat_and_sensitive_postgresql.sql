-- Migration for Chat History and Sensitive Words Audit System (PostgreSQL Version)
-- This migration adds support for:
-- 1. Chat topics and messages (conversation history)
-- 2. Sensitive word rules management
-- 3. Sensitive word trigger audit logs

-- ============================================
-- Chat Topics Table
-- ============================================
CREATE TABLE IF NOT EXISTS chat_topics (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL,
    token_id INTEGER DEFAULT 0,
    title VARCHAR(255) DEFAULT '',
    description TEXT DEFAULT '',
    model_name VARCHAR(255) DEFAULT '',
    channel_id INTEGER DEFAULT 0,
    message_count INTEGER DEFAULT 0,
    last_message_at BIGINT NOT NULL,
    created_at BIGINT NOT NULL,
    updated_at BIGINT NOT NULL,
    ip VARCHAR(64) DEFAULT '',
    is_deleted BOOLEAN DEFAULT FALSE
);

-- Indexes for chat_topics
CREATE INDEX IF NOT EXISTS idx_chat_topics_user_id ON chat_topics(user_id);
CREATE INDEX IF NOT EXISTS idx_chat_topics_last_message_at ON chat_topics(last_message_at);
CREATE INDEX IF NOT EXISTS idx_chat_topics_created_at ON chat_topics(created_at);
CREATE INDEX IF NOT EXISTS idx_chat_topics_is_deleted ON chat_topics(is_deleted);

-- ============================================
-- Chat Messages Table
-- ============================================
CREATE TABLE IF NOT EXISTS chat_messages (
    id SERIAL PRIMARY KEY,
    topic_id INTEGER NOT NULL,
    user_id INTEGER NOT NULL,
    token_id INTEGER DEFAULT 0,
    token_name VARCHAR(255) DEFAULT '',
    role VARCHAR(20) DEFAULT 'user',
    model_name VARCHAR(255) DEFAULT '',
    channel_id INTEGER DEFAULT 0,
    request_content TEXT,
    response_content TEXT,
    request_tokens INTEGER DEFAULT 0,
    response_tokens INTEGER DEFAULT 0,
    total_tokens INTEGER DEFAULT 0,
    created_at BIGINT NOT NULL,
    use_time_seconds INTEGER DEFAULT 0,
    is_stream BOOLEAN DEFAULT FALSE,
    ip VARCHAR(64) DEFAULT '',
    request_id VARCHAR(64) DEFAULT '',
    sensitive_words_detected VARCHAR(500) DEFAULT '',
    filter_action VARCHAR(20) DEFAULT '',
    status_code INTEGER DEFAULT 200,
    is_deleted BOOLEAN DEFAULT FALSE
);

-- Indexes for chat_messages
CREATE INDEX IF NOT EXISTS idx_chat_messages_topic_id ON chat_messages(topic_id);
CREATE INDEX IF NOT EXISTS idx_chat_messages_user_id ON chat_messages(user_id);
CREATE INDEX IF NOT EXISTS idx_chat_messages_created_at ON chat_messages(created_at);
CREATE INDEX IF NOT EXISTS idx_chat_messages_request_id ON chat_messages(request_id);
CREATE INDEX IF NOT EXISTS idx_chat_messages_is_deleted ON chat_messages(is_deleted);

-- ============================================
-- Sensitive Rules Table
-- ============================================
CREATE TABLE IF NOT EXISTS sensitive_rules (
    id SERIAL PRIMARY KEY,
    user_id INTEGER DEFAULT 0,
    group_name VARCHAR(50) DEFAULT '',
    name VARCHAR(255) NOT NULL,
    description TEXT DEFAULT '',
    rule_type VARCHAR(20) NOT NULL,
    scope VARCHAR(20) DEFAULT 'global',
    pattern TEXT NOT NULL,
    case_sensitive BOOLEAN DEFAULT FALSE,
    action VARCHAR(20) DEFAULT 'block',
    replace_text VARCHAR(255) DEFAULT '***',
    priority INTEGER DEFAULT 0,
    is_enabled BOOLEAN DEFAULT TRUE,
    hit_count INTEGER DEFAULT 0,
    created_at BIGINT NOT NULL,
    updated_at BIGINT NOT NULL,
    created_by INTEGER DEFAULT 0
);

-- Indexes for sensitive_rules
CREATE INDEX IF NOT EXISTS idx_sensitive_rules_user_id ON sensitive_rules(user_id);
CREATE INDEX IF NOT EXISTS idx_sensitive_rules_scope ON sensitive_rules(scope);
CREATE INDEX IF NOT EXISTS idx_sensitive_rules_rule_type ON sensitive_rules(rule_type);
CREATE INDEX IF NOT EXISTS idx_sensitive_rules_is_enabled ON sensitive_rules(is_enabled);
CREATE INDEX IF NOT EXISTS idx_sensitive_rules_created_at ON sensitive_rules(created_at);
CREATE INDEX IF NOT EXISTS idx_sensitive_rules_group ON sensitive_rules(group_name);

-- Insert default global sensitive rules
INSERT INTO sensitive_rules (user_id, name, description, rule_type, scope, pattern, case_sensitive, action, replace_text, priority, is_enabled, created_at, updated_at, created_by) VALUES
(0, '测试敏感词', '用于测试的敏感词示例', 'keyword', 'global', 'test_sensitive', FALSE, 'block', '***', 0, TRUE, EXTRACT(EPOCH FROM NOW())::BIGINT, EXTRACT(EPOCH FROM NOW())::BIGINT, 0)
ON CONFLICT DO NOTHING;

INSERT INTO sensitive_rules (user_id, name, description, rule_type, scope, pattern, case_sensitive, action, replace_text, priority, is_enabled, created_at, updated_at, created_by) VALUES
(0, '邮箱地址检测', '检测邮箱地址格式', 'regex', 'global', '[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}', FALSE, 'mask', '***@***.***', 10, FALSE, EXTRACT(EPOCH FROM NOW())::BIGINT, EXTRACT(EPOCH FROM NOW())::BIGINT, 0)
ON CONFLICT DO NOTHING;

INSERT INTO sensitive_rules (user_id, name, description, rule_type, scope, pattern, case_sensitive, action, replace_text, priority, is_enabled, created_at, updated_at, created_by) VALUES
(0, '手机号码检测', '检测中国大陆手机号', 'regex', 'global', '1[3-9]\d{9}', FALSE, 'mask', '1****', 10, FALSE, EXTRACT(EPOCH FROM NOW())::BIGINT, EXTRACT(EPOCH FROM NOW())::BIGINT, 0)
ON CONFLICT DO NOTHING;

-- ============================================
-- Sensitive Logs Table (in LOG_DB)
-- ============================================
CREATE TABLE IF NOT EXISTS sensitive_logs (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL,
    username VARCHAR(255) DEFAULT '',
    token_id INTEGER DEFAULT 0,
    token_name VARCHAR(255) DEFAULT '',
    rule_id INTEGER DEFAULT 0,
    rule_name VARCHAR(255) DEFAULT '',
    rule_type VARCHAR(20) DEFAULT '',
    rule_scope VARCHAR(20) DEFAULT '',
    trigger_text TEXT,
    matched_pattern TEXT,
    full_request_text TEXT,
    source VARCHAR(20) DEFAULT 'chat',
    model_name VARCHAR(255) DEFAULT '',
    channel_id INTEGER DEFAULT 0,
    topic_id INTEGER DEFAULT 0,
    action VARCHAR(20) DEFAULT 'block',
    action_result TEXT DEFAULT '',
    request_blocked BOOLEAN DEFAULT FALSE,
    ip VARCHAR(64) DEFAULT '',
    request_id VARCHAR(64) DEFAULT '',
    user_agent TEXT DEFAULT '',
    created_at BIGINT NOT NULL,
    metadata TEXT DEFAULT ''
);

-- Indexes for sensitive_logs
CREATE INDEX IF NOT EXISTS idx_sensitive_logs_user_id ON sensitive_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_sensitive_logs_rule_id ON sensitive_logs(rule_id);
CREATE INDEX IF NOT EXISTS idx_sensitive_logs_created_at ON sensitive_logs(created_at);
CREATE INDEX IF NOT EXISTS idx_sensitive_logs_source ON sensitive_logs(source);
CREATE INDEX IF NOT EXISTS idx_sensitive_logs_model_name ON sensitive_logs(model_name);
CREATE INDEX IF NOT EXISTS idx_sensitive_logs_request_id ON sensitive_logs(request_id);
CREATE INDEX IF NOT EXISTS idx_sensitive_logs_ip ON sensitive_logs(ip);
CREATE INDEX IF NOT EXISTS idx_sensitive_logs_topic_id ON sensitive_logs(topic_id);
CREATE INDEX IF NOT EXISTS idx_sensitive_logs_user_created ON sensitive_logs(user_id, created_at);
CREATE INDEX IF NOT EXISTS idx_sensitive_logs_rule_created ON sensitive_logs(rule_id, created_at);

-- Migration for Chat History and Sensitive Words Audit System (MySQL Version)
-- This migration adds support for:
-- 1. Chat topics and messages (conversation history)
-- 2. Sensitive word rules management
-- 3. Sensitive word trigger audit logs

-- ============================================
-- Chat Topics Table
-- ============================================
CREATE TABLE IF NOT EXISTS `chat_topics` (
    `id` INT PRIMARY KEY AUTO_INCREMENT,
    `user_id` INT NOT NULL,
    `token_id` INT DEFAULT 0,
    `title` VARCHAR(255) DEFAULT '',
    `description` TEXT DEFAULT '',
    `model_name` VARCHAR(255) DEFAULT '',
    `channel_id` INT DEFAULT 0,
    `message_count` INT DEFAULT 0,
    `last_message_at` BIGINT NOT NULL,
    `created_at` BIGINT NOT NULL,
    `updated_at` BIGINT NOT NULL,
    `ip` VARCHAR(64) DEFAULT '',
    `is_deleted` TINYINT(1) DEFAULT 0,
    INDEX `idx_chat_topics_user_id` (`user_id`),
    INDEX `idx_chat_topics_last_message_at` (`last_message_at`),
    INDEX `idx_chat_topics_created_at` (`created_at`),
    INDEX `idx_chat_topics_is_deleted` (`is_deleted`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- Chat Messages Table
-- ============================================
CREATE TABLE IF NOT EXISTS `chat_messages` (
    `id` INT PRIMARY KEY AUTO_INCREMENT,
    `topic_id` INT NOT NULL,
    `user_id` INT NOT NULL,
    `token_id` INT DEFAULT 0,
    `token_name` VARCHAR(255) DEFAULT '',
    `role` VARCHAR(20) DEFAULT 'user',
    `model_name` VARCHAR(255) DEFAULT '',
    `channel_id` INT DEFAULT 0,
    `request_content` LONGTEXT,
    `response_content` LONGTEXT,
    `request_tokens` INT DEFAULT 0,
    `response_tokens` INT DEFAULT 0,
    `total_tokens` INT DEFAULT 0,
    `created_at` BIGINT NOT NULL,
    `use_time_seconds` INT DEFAULT 0,
    `is_stream` TINYINT(1) DEFAULT 0,
    `ip` VARCHAR(64) DEFAULT '',
    `request_id` VARCHAR(64) DEFAULT '',
    `sensitive_words_detected` VARCHAR(500) DEFAULT '',
    `filter_action` VARCHAR(20) DEFAULT '',
    `status_code` INT DEFAULT 200,
    `is_deleted` TINYINT(1) DEFAULT 0,
    INDEX `idx_chat_messages_topic_id` (`topic_id`),
    INDEX `idx_chat_messages_user_id` (`user_id`),
    INDEX `idx_chat_messages_created_at` (`created_at`),
    INDEX `idx_chat_messages_request_id` (`request_id`),
    INDEX `idx_chat_messages_is_deleted` (`is_deleted`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- Sensitive Rules Table
-- ============================================
CREATE TABLE IF NOT EXISTS `sensitive_rules` (
    `id` INT PRIMARY KEY AUTO_INCREMENT,
    `user_id` INT DEFAULT 0,
    `group_name` VARCHAR(50) DEFAULT '',
    `name` VARCHAR(255) NOT NULL,
    `description` TEXT DEFAULT '',
    `rule_type` VARCHAR(20) NOT NULL,
    `scope` VARCHAR(20) DEFAULT 'global',
    `pattern` TEXT NOT NULL,
    `case_sensitive` TINYINT(1) DEFAULT 0,
    `action` VARCHAR(20) DEFAULT 'block',
    `replace_text` VARCHAR(255) DEFAULT '***',
    `priority` INT DEFAULT 0,
    `is_enabled` TINYINT(1) DEFAULT 1,
    `hit_count` INT DEFAULT 0,
    `created_at` BIGINT NOT NULL,
    `updated_at` BIGINT NOT NULL,
    `created_by` INT DEFAULT 0,
    INDEX `idx_sensitive_rules_user_id` (`user_id`),
    INDEX `idx_sensitive_rules_scope` (`scope`),
    INDEX `idx_sensitive_rules_rule_type` (`rule_type`),
    INDEX `idx_sensitive_rules_is_enabled` (`is_enabled`),
    INDEX `idx_sensitive_rules_created_at` (`created_at`),
    INDEX `idx_sensitive_rules_group` (`group_name`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Insert default global sensitive rules
INSERT IGNORE INTO `sensitive_rules` (`user_id`, `name`, `description`, `rule_type`, `scope`, `pattern`, `case_sensitive`, `action`, `replace_text`, `priority`, `is_enabled`, `created_at`, `updated_at`, `created_by`) VALUES
(0, '测试敏感词', '用于测试的敏感词示例', 'keyword', 'global', 'test_sensitive', 0, 'block', '***', 0, 1, UNIX_TIMESTAMP(), UNIX_TIMESTAMP(), 0),
(0, '邮箱地址检测', '检测邮箱地址格式', 'regex', 'global', '[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}', 0, 'mask', '***@***.***', 10, 0, UNIX_TIMESTAMP(), UNIX_TIMESTAMP(), 0),
(0, '手机号码检测', '检测中国大陆手机号', 'regex', 'global', '1[3-9]\\d{9}', 0, 'mask', '1****', 10, 0, UNIX_TIMESTAMP(), UNIX_TIMESTAMP(), 0);

-- ============================================
-- Sensitive Logs Table (in LOG_DB)
-- ============================================
CREATE TABLE IF NOT EXISTS `sensitive_logs` (
    `id` INT PRIMARY KEY AUTO_INCREMENT,
    `user_id` INT NOT NULL,
    `username` VARCHAR(255) DEFAULT '',
    `token_id` INT DEFAULT 0,
    `token_name` VARCHAR(255) DEFAULT '',
    `rule_id` INT DEFAULT 0,
    `rule_name` VARCHAR(255) DEFAULT '',
    `rule_type` VARCHAR(20) DEFAULT '',
    `rule_scope` VARCHAR(20) DEFAULT '',
    `trigger_text` TEXT,
    `matched_pattern` TEXT,
    `full_request_text` LONGTEXT,
    `source` VARCHAR(20) DEFAULT 'chat',
    `model_name` VARCHAR(255) DEFAULT '',
    `channel_id` INT DEFAULT 0,
    `topic_id` INT DEFAULT 0,
    `action` VARCHAR(20) DEFAULT 'block',
    `action_result` TEXT DEFAULT '',
    `request_blocked` TINYINT(1) DEFAULT 0,
    `ip` VARCHAR(64) DEFAULT '',
    `request_id` VARCHAR(64) DEFAULT '',
    `user_agent` TEXT DEFAULT '',
    `created_at` BIGINT NOT NULL,
    `metadata` TEXT DEFAULT '',
    INDEX `idx_sensitive_logs_user_id` (`user_id`),
    INDEX `idx_sensitive_logs_rule_id` (`rule_id`),
    INDEX `idx_sensitive_logs_created_at` (`created_at`),
    INDEX `idx_sensitive_logs_source` (`source`),
    INDEX `idx_sensitive_logs_model_name` (`model_name`),
    INDEX `idx_sensitive_logs_request_id` (`request_id`),
    INDEX `idx_sensitive_logs_ip` (`ip`),
    INDEX `idx_sensitive_logs_topic_id` (`topic_id`),
    INDEX `idx_sensitive_logs_user_created` (`user_id`, `created_at`),
    INDEX `idx_sensitive_logs_rule_created` (`rule_id`, `created_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

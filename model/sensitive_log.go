package model

import (
	"github.com/QuantumNous/new-api/common"
)

// SensitiveLogTriggerSource 触发来源
const (
	SensitiveLogSourceChat  = "chat"  // 聊天请求
	SensitiveLogSourceImage = "image" // 图片生成
	SensitiveLogSourceAudio = "audio" // 音频处理
	SensitiveLogSourceFile  = "file"  // 文件上传
	SensitiveLogSourceAPI   = "api"   // API调用
)

// SensitiveLog 敏感词触发日志表
type SensitiveLog struct {
	Id int `json:"id" gorm:"primaryKey"`

	// 用户信息
	UserId    int    `json:"user_id" gorm:"index;not null"`
	Username  string `json:"username" gorm:"index;default:''"`
	TokenId   int    `json:"token_id" gorm:"index;default:0"`
	TokenName string `json:"token_name" gorm:"default:''"`

	// 触发的规则信息
	RuleId     int    `json:"rule_id" gorm:"index;default:0"`              // 触发的规则ID(0表示旧版全局敏感词)
	RuleName   string `json:"rule_name" gorm:"default:''"`                 // 规则名称
	RuleType   string `json:"rule_type" gorm:"type:varchar(20);default:''"` // keyword/regex/pattern
	RuleScope  string `json:"rule_scope" gorm:"type:varchar(20);default:''"` // global/user/group

	// 触发内容
	TriggerText     string `json:"trigger_text" gorm:"type:text"`           // 触发敏感词的原始文本片段
	MatchedPattern  string `json:"matched_pattern" gorm:"type:text"`        // 匹配到的模式/关键词
	FullRequestText string `json:"full_request_text" gorm:"type:longtext"`  // 完整请求文本(可选)

	// 触发场景
	Source      string `json:"source" gorm:"type:varchar(20);default:'chat'"` // 触发来源
	ModelName   string `json:"model_name" gorm:"index;default:''"`        // 使用的模型
	ChannelId   int    `json:"channel_id" gorm:"index;default:0"`         // 渠道ID
	TopicId     int    `json:"topic_id" gorm:"index;default:0"`           // 聊天话题ID

	// 处理动作
	Action         string `json:"action" gorm:"type:varchar(20);default:'block'"` // block/replace/warn/mask
	ActionResult   string `json:"action_result" gorm:"type:text;default:''"`      // 处理结果
	RequestBlocked bool   `json:"request_blocked" gorm:"default:false"`           // 请求是否被拦截

	// 上下文信息
	Ip        string `json:"ip" gorm:"varchar(64);index;default:''"`
	RequestId string `json:"request_id" gorm:"varchar(64);index;default:''"`
	UserAgent string `json:"user_agent" gorm:"type:text;default:''"`

	// 时间戳
	CreatedAt int64 `json:"created_at" gorm:"bigint;index"`

	// 额外信息(JSON格式)
	Metadata string `json:"metadata" gorm:"type:text;default:''"`
}

// TableName 指定表名
func (SensitiveLog) TableName() string {
	return "sensitive_logs"
}

// Insert 插入敏感词触发日志
func (log *SensitiveLog) Insert() error {
	log.CreatedAt = common.GetTimestamp()
	return LOG_DB.Create(log).Error
}

// BatchInsert 批量插入日志(性能优化)
func BatchInsertSensitiveLogs(logs []*SensitiveLog) error {
	if len(logs) == 0 {
		return nil
	}
	return LOG_DB.CreateInBatches(logs, 100).Error
}

// GetSensitiveLogsByPagination 分页查询敏感词日志
func GetSensitiveLogsByPagination(userId int, role int, ruleId int, source string,
	startDate int64, endDate int64, keyword string,
	startIdx int, num int) ([]*SensitiveLog, int64, error) {
	var logs []*SensitiveLog
	var total int64

	tx := LOG_DB.Model(&SensitiveLog{})

	// 权限控制
	if role < common.RoleAdminUser {
		tx = tx.Where("user_id = ?", userId)
	} else if userId > 0 {
		tx = tx.Where("user_id = ?", userId)
	}

	// 筛选条件
	if ruleId > 0 {
		tx = tx.Where("rule_id = ?", ruleId)
	}

	if source != "" && source != "all" {
		tx = tx.Where("source = ?", source)
	}

	if startDate > 0 {
		tx = tx.Where("created_at >= ?", startDate)
	}

	if endDate > 0 {
		tx = tx.Where("created_at <= ?", endDate)
	}

	if keyword != "" {
		keywordPattern, _ := sanitizeLikePattern(keyword)
		tx = tx.Where("username LIKE ? OR trigger_text LIKE ? OR matched_pattern LIKE ? OR model_name LIKE ?",
			keywordPattern, keywordPattern, keywordPattern, keywordPattern)
	}

	// 统计总数
	err := tx.Count(&total).Error
	if err != nil {
		return nil, 0, err
	}

	// 分页查询
	err = tx.Order("created_at DESC").Limit(num).Offset(startIdx).Find(&logs).Error
	return logs, total, err
}

// GetSensitiveLogById 根据ID获取日志详情
func GetSensitiveLogById(id int, userId int, role int) (*SensitiveLog, error) {
	var log SensitiveLog
	tx := LOG_DB.Where("id = ?", id)

	// 权限控制
	if role < common.RoleAdminUser {
		tx = tx.Where("user_id = ?", userId)
	}

	err := tx.First(&log).Error
	if err != nil {
		return nil, err
	}
	return &log, nil
}

// GetSensitiveLogStatistics 获取敏感词日志统计
func GetSensitiveLogStatistics(userId int, role int, startDate int64, endDate int64) (map[string]interface{}, error) {
	stats := make(map[string]interface{})

	tx := LOG_DB.Model(&SensitiveLog{})

	// 权限控制
	if role < common.RoleAdminUser {
		tx = tx.Where("user_id = ?", userId)
	}

	// 时间范围
	if startDate > 0 {
		tx = tx.Where("created_at >= ?", startDate)
	}
	if endDate > 0 {
		tx = tx.Where("created_at <= ?", endDate)
	}

	// 总触发次数
	var totalCount int64
	tx.Count(&totalCount)
	stats["total_triggers"] = totalCount

	// 按规则类型统计
	var typeStats []struct {
		RuleType string `gorm:"column:rule_type"`
		Count    int64  `gorm:"column:count"`
	}
	tx.Select("rule_type, COUNT(*) as count").Group("rule_type").Scan(&typeStats)
	stats["by_rule_type"] = typeStats

	// 按动作统计
	var actionStats []struct {
		Action string `gorm:"column:action"`
		Count  int64  `gorm:"column:count"`
	}
	tx.Select("action, COUNT(*) as count").Group("action").Scan(&actionStats)
	stats["by_action"] = actionStats

	// 按来源统计
	var sourceStats []struct {
		Source string `gorm:"column:source"`
		Count  int64  `gorm:"column:count"`
	}
	tx.Select("source, COUNT(*) as count").Group("source").Scan(&sourceStats)
	stats["by_source"] = sourceStats

	// 被拦截的请求数
	var blockedCount int64
	tx.Where("request_blocked = ?", true).Count(&blockedCount)
	stats["blocked_requests"] = blockedCount

	// 触发最多的用户(TOP 10)
	var topUsers []struct {
		UserId   int    `gorm:"column:user_id"`
		Username string `gorm:"column:username"`
		Count    int64  `gorm:"column:count"`
	}
	tx.Select("user_id, username, COUNT(*) as count").
		Group("user_id, username").
		Order("count DESC").
		Limit(10).
		Scan(&topUsers)
	stats["top_users"] = topUsers

	// 触发最多的规则(TOP 10)
	var topRules []struct {
		RuleId   int    `gorm:"column:rule_id"`
		RuleName string `gorm:"column:rule_name"`
		Count    int64  `gorm:"column:count"`
	}
	tx.Select("rule_id, rule_name, COUNT(*) as count").
		Where("rule_id > 0").
		Group("rule_id, rule_name").
		Order("count DESC").
		Limit(10).
		Scan(&topRules)
	stats["top_rules"] = topRules

	return stats, nil
}

// DeleteOldSensitiveLogs 清理旧的敏感词日志
func DeleteOldSensitiveLogs(targetTimestamp int64, limit int) (int64, error) {
	var total int64 = 0
	for {
		result := LOG_DB.Where("created_at < ?", targetTimestamp).Limit(limit).Delete(&SensitiveLog{})
		if result.Error != nil {
			return total, result.Error
		}
		total += result.RowsAffected
		if result.RowsAffected < int64(limit) {
			break
		}
	}
	return total, nil
}

// GetSensitiveLogsByUserId 获取用户的敏感词触发历史
func GetSensitiveLogsByUserId(userId int, days int) ([]*SensitiveLog, error) {
	var logs []*SensitiveLog
	cutoffTime := common.GetTimestamp() - int64(days*86400)

	err := LOG_DB.Where("user_id = ? AND created_at >= ?", userId, cutoffTime).
		Order("created_at DESC").
		Limit(100).
		Find(&logs).Error

	return logs, err
}

// CleanOldSensitiveLogs 清理指定天数之前的日志
func CleanOldSensitiveLogs(days int) (int64, error) {
	if days <= 0 || days > 365 {
		return 0, nil
	}

	targetTimestamp := common.GetTimestamp() - int64(days*86400)
	limit := 1000 // 每次删除1000条

	var total int64 = 0
	for {
		result := LOG_DB.Where("created_at < ?", targetTimestamp).Limit(limit).Delete(&SensitiveLog{})
		if result.Error != nil {
			return total, result.Error
		}
		total += result.RowsAffected
		if result.RowsAffected < int64(limit) {
			break
		}
	}
	return total, nil
}

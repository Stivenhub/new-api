package service

import (
	"encoding/json"
	"strings"

	"github.com/QuantumNous/new-api/common"
	"github.com/QuantumNous/new-api/model"
	"github.com/gin-gonic/gin"
)

// SensitiveLogRecord 敏感词日志记录参数
type SensitiveLogRecord struct {
	UserId          int
	Username        string
	TokenId         int
	TokenName       string
	RuleId          int
	RuleName        string
	RuleType        string
	RuleScope       string
	TriggerText     string
	MatchedPattern  string
	FullRequestText string
	Source          string
	ModelName       string
	ChannelId       int
	TopicId         int
	Action          string
	ActionResult    string
	RequestBlocked  bool
	Ip              string
	RequestId       string
	UserAgent       string
	Metadata        map[string]interface{}
}

// RecordSensitiveTrigger 记录敏感词触发事件
func RecordSensitiveTrigger(c *gin.Context, record *SensitiveLogRecord) {
	if record == nil {
		return
	}

	// 异步记录,避免影响主流程性能
	go func() {
		log := &model.SensitiveLog{
			UserId:          record.UserId,
			Username:        record.Username,
			TokenId:         record.TokenId,
			TokenName:       record.TokenName,
			RuleId:          record.RuleId,
			RuleName:        record.RuleName,
			RuleType:        record.RuleType,
			RuleScope:       record.RuleScope,
			TriggerText:     truncateString(record.TriggerText, 500),     // 限制长度
			MatchedPattern:  record.MatchedPattern,
			FullRequestText: truncateString(record.FullRequestText, 5000), // 限制长度
			Source:          record.Source,
			ModelName:       record.ModelName,
			ChannelId:       record.ChannelId,
			TopicId:         record.TopicId,
			Action:          record.Action,
			ActionResult:    record.ActionResult,
			RequestBlocked:  record.RequestBlocked,
			Ip:              record.Ip,
			RequestId:       record.RequestId,
			UserAgent:       record.UserAgent,
		}

		// 序列化元数据
		if record.Metadata != nil && len(record.Metadata) > 0 {
			if metadataJSON, err := json.Marshal(record.Metadata); err == nil {
				log.Metadata = string(metadataJSON)
			}
		}

		err := log.Insert()
		if err != nil {
			common.SysLog("failed to record sensitive trigger log: " + err.Error())
		}
	}()
}

// RecordSensitiveTriggersBatch 批量记录敏感词触发(一次触发多个规则)
func RecordSensitiveTriggersBatch(c *gin.Context, baseRecord *SensitiveLogRecord, matches []*SensitiveMatchResult) {
	if len(matches) == 0 {
		return
	}

	var logs []*model.SensitiveLog

	for _, match := range matches {
		log := &model.SensitiveLog{
			UserId:          baseRecord.UserId,
			Username:        baseRecord.Username,
			TokenId:         baseRecord.TokenId,
			TokenName:       baseRecord.TokenName,
			RuleId:          match.RuleId,
			RuleName:        match.RuleName,
			RuleType:        match.RuleType,
			RuleScope:       "global", // 简化处理,实际应该从规则中获取
			TriggerText:     truncateString(baseRecord.TriggerText, 500),
			MatchedPattern:  match.MatchedText,
			FullRequestText: truncateString(baseRecord.FullRequestText, 5000),
			Source:          baseRecord.Source,
			ModelName:       baseRecord.ModelName,
			ChannelId:       baseRecord.ChannelId,
			TopicId:         baseRecord.TopicId,
			Action:          match.Action,
			ActionResult:    "",
			RequestBlocked:  match.Action == "block",
			Ip:              baseRecord.Ip,
			RequestId:       baseRecord.RequestId,
			UserAgent:       baseRecord.UserAgent,
		}

		logs = append(logs, log)
	}

	// 异步批量插入
	go func() {
		err := model.BatchInsertSensitiveLogs(logs)
		if err != nil {
			common.SysLog("failed to batch insert sensitive trigger logs: " + err.Error())
		}
	}()
}

// RecordLegacySensitiveTrigger 记录旧版全局敏感词触发(向后兼容)
func RecordLegacySensitiveTrigger(c *gin.Context, userId int, username string,
	triggerText string, words []string, modelName string) {
	record := &SensitiveLogRecord{
		UserId:          userId,
		Username:        username,
		TokenId:         c.GetInt("token_id"),
		TokenName:       c.GetString("token_name"),
		RuleId:          0, // 0表示旧版全局敏感词
		RuleName:        "全局敏感词过滤",
		RuleType:        "keyword",
		RuleScope:       "global",
		TriggerText:     triggerText,
		MatchedPattern:  strings.Join(words, ", "),
		FullRequestText: "",
		Source:          model.SensitiveLogSourceChat,
		ModelName:       modelName,
		ChannelId:       c.GetInt("channel_id"),
		TopicId:         0,
		Action:          "block",
		RequestBlocked:  true,
		Ip:              c.ClientIP(),
		RequestId:       c.GetString(common.RequestIdKey),
		UserAgent:       c.Request.UserAgent(),
		Metadata: map[string]interface{}{
			"sensitive_words": words,
			"legacy_mode":     true,
		},
	}

	RecordSensitiveTrigger(c, record)
}

// truncateString 截断字符串
func truncateString(s string, maxLen int) string {
	if len(s) <= maxLen {
		return s
	}
	return s[:maxLen] + "..."
}

// BuildMetadataFromContext 从Gin Context构建元数据
func BuildMetadataFromContext(c *gin.Context) map[string]interface{} {
	metadata := make(map[string]interface{})

	// 添加有用的上下文信息
	if groupId := c.GetString("group"); groupId != "" {
		metadata["group"] = groupId
	}

	if useChannels := c.GetStringSlice("use_channel"); len(useChannels) > 0 {
		metadata["used_channels"] = useChannels
	}

	if isStream := c.GetBool("is_stream"); isStream {
		metadata["is_stream"] = true
	}

	return metadata
}

package service

import "github.com/QuantumNous/new-api/setting"

// IsChatHistoryEnabled 检查是否启用聊天历史
func IsChatHistoryEnabled() bool {
	return setting.EnableChatHistory
}

// IsSensitiveCheckEnabled 检查是否启用敏感词检查
func IsSensitiveCheckEnabled() bool {
	return setting.EnableSensitiveCheck
}

// ShouldRecordSensitiveLog 检查是否应该记录敏感词日志
func ShouldRecordSensitiveLog() bool {
	return setting.RecordSensitiveLog
}

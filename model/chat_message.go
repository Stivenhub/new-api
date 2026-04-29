package model

import (
	"github.com/QuantumNous/new-api/common"
)

// ChatMessage 聊天消息表
type ChatMessage struct {
	Id                int    `json:"id" gorm:"primaryKey"`
	TopicId           int    `json:"topic_id" gorm:"index;not null"`                    // 关联的话题ID
	UserId            int    `json:"user_id" gorm:"index;not null"`
	TokenId           int    `json:"token_id" gorm:"index;default:0"`
	TokenName         string `json:"token_name" gorm:"default:''"`

	// 请求信息
	Role              string `json:"role" gorm:"type:varchar(20);default:'user'"`      // user / assistant / system
	ModelName         string `json:"model_name" gorm:"index;default:''"`
	ChannelId         int    `json:"channel_id" gorm:"index;default:0"`

	// 内容存储
	RequestContent    string `json:"request_content" gorm:"type:longtext"`             // 用户请求内容
	ResponseContent   string `json:"response_content" gorm:"type:longtext"`            // AI响应内容

	// Token统计
	RequestTokens     int    `json:"request_tokens" gorm:"default:0"`
	ResponseTokens    int    `json:"response_tokens" gorm:"default:0"`
	TotalTokens       int    `json:"total_tokens" gorm:"default:0"`

	// 元数据
	CreatedAt         int64  `json:"created_at" gorm:"bigint;index"`
	UseTimeSeconds    int    `json:"use_time_seconds" gorm:"default:0"`
	IsStream          bool   `json:"is_stream"`
	Ip                string `json:"ip" gorm:"default:''"`
	RequestId         string `json:"request_id" gorm:"varchar(64);index;default:''"`

	// 敏感词检测
	SensitiveWordsDetected string `json:"sensitive_words_detected" gorm:"default:''"`
	FilterAction        string `json:"filter_action" gorm:"default:''"`               // blocked/replaced/passed

	// 状态
	StatusCode          int    `json:"status_code" gorm:"default:200"`                // HTTP状态码
	IsDeleted           bool   `json:"is_deleted" gorm:"default:false;index"`
}

// TableName 指定表名
func (ChatMessage) TableName() string {
	return "chat_messages"
}

// Insert 插入新消息
func (msg *ChatMessage) Insert() error {
	msg.CreatedAt = common.GetTimestamp()
	msg.IsDeleted = false
	msg.TotalTokens = msg.RequestTokens + msg.ResponseTokens
	return DB.Create(msg).Error
}

// GetMessagesByTopicId 获取话题下的消息列表(分页)
func GetMessagesByTopicId(topicId int, userId int, startIdx int, num int, orderBy string) (messages []*ChatMessage, total int64, err error) {
	tx := DB.Model(&ChatMessage{}).Where("topic_id = ? AND user_id = ? AND is_deleted = ?", topicId, userId, false)

	err = tx.Count(&total).Error
	if err != nil {
		return nil, 0, err
	}

	if orderBy == "" {
		orderBy = "created_at ASC"  // 默认按时间正序,模拟对话流
	}

	err = tx.Order(orderBy).Limit(num).Offset(startIdx).Find(&messages).Error
	return messages, total, err
}

// GetMessageById 根据ID获取单条消息
func GetMessageById(id int, userId int) (*ChatMessage, error) {
	var msg ChatMessage
	err := DB.Where("id = ? AND user_id = ? AND is_deleted = ?", id, userId, false).First(&msg).Error
	if err != nil {
		return nil, err
	}
	return &msg, nil
}

// DeleteSoft 软删除消息
func (msg *ChatMessage) DeleteSoft() error {
	msg.IsDeleted = true
	return DB.Save(msg).Error
}

// DeleteMessagesByTopicId 删除话题下的所有消息
func DeleteMessagesByTopicId(topicId int, userId int) error {
	return DB.Model(&ChatMessage{}).
		Where("topic_id = ? AND user_id = ?", topicId, userId).
		Update("is_deleted", true).Error
}

// DeleteOldMessages 清理旧消息
func DeleteOldMessages(targetTimestamp int64, limit int) (int64, error) {
	var total int64 = 0
	for {
		result := DB.Where("created_at < ? AND is_deleted = ?", targetTimestamp, false).Limit(limit).Delete(&ChatMessage{})
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

// SoftDeleteMessagesByTopicId 软删除话题下的所有消息
func SoftDeleteMessagesByTopicId(topicId int, userId int) error {
	return DB.Model(&ChatMessage{}).
		Where("topic_id = ? AND user_id = ?", topicId, userId).
		Update("is_deleted", true).Error
}

package model

import (
	"github.com/QuantumNous/new-api/common"
	"gorm.io/gorm"
)

// ChatTopic 聊天话题表
type ChatTopic struct {
	Id            int    `json:"id" gorm:"primaryKey"`
	UserId        int    `json:"user_id" gorm:"index;not null"`
	TokenId       int    `json:"token_id" gorm:"index;default:0"`

	Title         string `json:"title" gorm:"type:varchar(255);default:''"`           // 话题标题
	Description   string `json:"description" gorm:"type:text;default:''"`             // 话题描述

	ModelName     string `json:"model_name" gorm:"index;default:''"`                  // 主要使用的模型
	ChannelId     int    `json:"channel_id" gorm:"index;default:0"`                   // 主要使用的渠道

	MessageCount  int    `json:"message_count" gorm:"default:0"`                      // 消息数量
	LastMessageAt int64  `json:"last_message_at" gorm:"bigint;index"`                // 最后一条消息时间

	CreatedAt     int64  `json:"created_at" gorm:"bigint;index"`
	UpdatedAt     int64  `json:"updated_at" gorm:"bigint;index"`

	Ip            string `json:"ip" gorm:"default:''"`
	IsDeleted     bool   `json:"is_deleted" gorm:"default:false;index"`              // 软删除标记
}

// TableName 指定表名
func (ChatTopic) TableName() string {
	return "chat_topics"
}

// Insert 插入新话题
func (topic *ChatTopic) Insert() error {
	topic.CreatedAt = common.GetTimestamp()
	topic.UpdatedAt = common.GetTimestamp()
	topic.LastMessageAt = topic.CreatedAt
	topic.MessageCount = 0
	topic.IsDeleted = false
	return DB.Create(topic).Error
}

// Update 更新话题
func (topic *ChatTopic) Update(updateFields ...string) error {
	topic.UpdatedAt = common.GetTimestamp()
	db := DB.Model(topic)
	if len(updateFields) > 0 {
		db = db.Select(updateFields)
	}
	return db.Updates(topic).Error
}

// IncrementMessageCount 增加消息计数
func (topic *ChatTopic) IncrementMessageCount() error {
	return DB.Model(topic).UpdateColumn("message_count", gorm.Expr("message_count + ?", 1)).Error
}

// UpdateLastMessageTime 更新最后消息时间
func (topic *ChatTopic) UpdateLastMessageTime() error {
	now := common.GetTimestamp()
	return DB.Model(topic).Updates(map[string]interface{}{
		"last_message_at": now,
		"updated_at":      now,
	}).Error
}

// DeleteSoft 软删除话题
func (topic *ChatTopic) DeleteSoft() error {
	topic.IsDeleted = true
	topic.UpdatedAt = common.GetTimestamp()
	return DB.Save(topic).Error
}

// GetTopicsByUserId 获取用户的聊天话题列表(分页)
func GetTopicsByUserId(userId int, startIdx int, num int, orderBy string) (topics []*ChatTopic, total int64, err error) {
	tx := DB.Model(&ChatTopic{}).Where("user_id = ? AND is_deleted = ?", userId, false)

	err = tx.Count(&total).Error
	if err != nil {
		return nil, 0, err
	}

	if orderBy == "" {
		orderBy = "last_message_at DESC"
	}

	err = tx.Order(orderBy).Limit(num).Offset(startIdx).Find(&topics).Error
	return topics, total, err
}

// GetTopicById 根据ID获取话题
func GetTopicById(id int, userId int) (*ChatTopic, error) {
	var topic ChatTopic
	err := DB.Where("id = ? AND user_id = ? AND is_deleted = ?", id, userId, false).First(&topic).Error
	if err != nil {
		return nil, err
	}
	return &topic, nil
}

// DeleteOldTopics 清理旧话题(可选功能)
func DeleteOldTopics(targetTimestamp int64, limit int) (int64, error) {
	var total int64 = 0
	for {
		result := DB.Where("last_message_at < ? AND is_deleted = ?", targetTimestamp, false).Limit(limit).Delete(&ChatTopic{})
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

// SearchTopicsByKeyword 根据关键词搜索话题
func SearchTopicsByKeyword(userId int, keyword string, startIdx int, num int) ([]*ChatTopic, int64, error) {
	var topics []*ChatTopic
	var total int64

	db := DB.Model(&ChatTopic{}).Where("user_id = ? AND is_deleted = ?", userId, false)

	// 关键词搜索(标题或描述)
	searchPattern := "%" + keyword + "%"
	db = db.Where("title LIKE ? OR description LIKE ?", searchPattern, searchPattern)

	// 获取总数
	db.Count(&total)

	// 分页查询
	err := db.Order("last_message_at DESC").Offset(startIdx).Limit(num).Find(&topics).Error
	return topics, total, err
}

// GetUserTopicStats 获取用户话题统计
func GetUserTopicStats(userId int) (map[string]interface{}, error) {
	stats := make(map[string]interface{})

	// 总话题数
	var totalCount int64
	DB.Model(&ChatTopic{}).Where("user_id = ? AND is_deleted = ?", userId, false).Count(&totalCount)
	stats["total_topics"] = totalCount

	// 总消息数
	var totalMessages int
	DB.Model(&ChatTopic{}).Where("user_id = ? AND is_deleted = ?", userId, false).Select("SUM(message_count)").Scan(&totalMessages)
	stats["total_messages"] = totalMessages

	// 今日新增话题数
	todayStart := common.GetTodayStartTime()
	var todayCount int64
	DB.Model(&ChatTopic{}).Where("user_id = ? AND is_deleted = ? AND created_at >= ?", userId, false, todayStart).Count(&todayCount)
	stats["today_topics"] = todayCount

	// 本周新增话题数
	weekStart := common.GetWeekStartTime()
	var weekCount int64
	DB.Model(&ChatTopic{}).Where("user_id = ? AND is_deleted = ? AND created_at >= ?", userId, false, weekStart).Count(&weekCount)
	stats["week_topics"] = weekCount

	return stats, nil
}

package service

import (
	"strings"

	"github.com/QuantumNous/new-api/common"
	"github.com/QuantumNous/new-api/dto"
	"github.com/QuantumNous/new-api/model"
	"github.com/gin-gonic/gin"
)

// CreateOrUpdateTopic 创建或更新话题
func CreateOrUpdateTopic(c *gin.Context, userId int, firstMessage string, modelName string, channelId int) (*model.ChatTopic, error) {
	// 生成话题标题(简化实现,后续可扩展)
	title := GenerateTopicTitle(firstMessage, true)

	topic := &model.ChatTopic{
		UserId:    userId,
		TokenId:   c.GetInt("token_id"),
		Title:     title,
		ModelName: modelName,
		ChannelId: channelId,
		Ip:        c.ClientIP(),
	}

	err := topic.Insert()
	if err != nil {
		return nil, err
	}

	return topic, nil
}

// GenerateTopicTitle 生成话题标题
func GenerateTopicTitle(firstMessage string, autoGenerate bool) string {
	if !autoGenerate || firstMessage == "" {
		return "新对话"
	}

	// 简单实现:取前30个字符作为标题
	// TODO: 可以集成LLM自动生成更智能的标题
	title := strings.TrimSpace(firstMessage)
	if len(title) > 30 {
		title = title[:30] + "..."
	}
	return title
}

// SaveChatMessage 保存聊天消息
func SaveChatMessage(c *gin.Context, topicId int, userId int, request any, response string,
	requestTokens, responseTokens int, modelName string, channelId int,
	sensitiveWords []string, filterAction string) error {

	tokenId := c.GetInt("token_id")
	tokenName := c.GetString("token_name")
	requestId := c.GetString(common.RequestIdKey)

	// 提取请求内容
	requestContent := ExtractRequestContent(request)

	// 判断是否流式
	isStream := c.GetBool("is_stream")

	msg := &model.ChatMessage{
		TopicId:                topicId,
		UserId:                 userId,
		TokenId:                tokenId,
		TokenName:              tokenName,
		Role:                   "user", // 这里简化处理,实际需要区分user/assistant
		ModelName:              modelName,
		ChannelId:              channelId,
		RequestContent:         requestContent,
		ResponseContent:        response,
		RequestTokens:          requestTokens,
		ResponseTokens:         responseTokens,
		UseTimeSeconds:         c.GetInt("use_time_seconds"),
		IsStream:               isStream,
		Ip:                     c.ClientIP(),
		RequestId:              requestId,
		SensitiveWordsDetected: strings.Join(sensitiveWords, ","),
		FilterAction:           filterAction,
		StatusCode:             c.Writer.Status(),
	}

	err := msg.Insert()
	if err != nil {
		return err
	}

	// 更新话题的最后消息时间和计数
	topic, err := model.GetTopicById(topicId, userId)
	if err == nil {
		topic.IncrementMessageCount()
		topic.UpdateLastMessageTime()
	}

	return nil
}

// ExtractRequestContent 提取请求内容
func ExtractRequestContent(request any) string {
	switch req := request.(type) {
	case *dto.GeneralOpenAIRequest:
		// 提取最后一条用户消息
		if len(req.Messages) > 0 {
			lastMsg := req.Messages[len(req.Messages)-1]
			if lastMsg.IsStringContent() {
				return lastMsg.StringContent()
			}
		}
	case *dto.ClaudeRequest:
		// Claude格式处理
		if len(req.Messages) > 0 {
			lastMsg := req.Messages[len(req.Messages)-1]
			if lastMsg.IsStringContent() {
				return lastMsg.GetStringContent()
			}
		}
	}
	return ""
}

// GetOrCreateTopicForRequest 为请求获取或创建话题
// 如果提供了topicId则返回该话题,否则创建新话题
func GetOrCreateTopicForRequest(c *gin.Context, userId int, topicId int, firstMessage string, modelName string, channelId int) (*model.ChatTopic, error) {
	if topicId > 0 {
		// 使用现有话题
		topic, err := model.GetTopicById(topicId, userId)
		if err == nil {
			return topic, nil
		}
		// 如果话题不存在或无权访问,创建新话题
	}

	// 创建新话题
	return CreateOrUpdateTopic(c, userId, firstMessage, modelName, channelId)
}

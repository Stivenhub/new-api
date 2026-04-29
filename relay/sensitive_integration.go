package relay

import (
	"fmt"
	"github.com/QuantumNous/new-api/common"
	"github.com/QuantumNous/new-api/dto"
	"github.com/QuantumNous/new-api/logger"
	relaycommon "github.com/QuantumNous/new-api/relay/common"
	"github.com/QuantumNous/new-api/service"
	"github.com/gin-gonic/gin"
	"strconv"
)

// CheckSensitiveWords 检查请求中的敏感词
func CheckSensitiveWords(c *gin.Context, info *relaycommon.RelayInfo, request *dto.GeneralOpenAIRequest) ([]*service.SensitiveMatchResult, bool) {
	userId := c.GetInt("id")
	
	// 如果未启用敏感词检查,直接返回
	if !service.IsSensitiveCheckEnabled() {
		return nil, false
	}
	
	engine := service.GetSensitiveEngine()
	var allMatches []*service.SensitiveMatchResult
	var isBlocked bool
	
	for i, msg := range request.Messages {
		if msg.IsStringContent() {
			content := msg.StringContent()
			matches, _ := engine.CheckText(content, userId)
			
			if len(matches) > 0 {
				allMatches = append(allMatches, matches...)
				
				// 应用动作
				processedContent, blocked := engine.ApplyActions(content, matches)
				if blocked {
					isBlocked = true
				}
				
				// 更新消息内容
				request.Messages[i].SetStringContent(processedContent)
			}
		} else {
			// 处理多模态内容
			contents := msg.ParseContent()
			for j, content := range contents {
				if content.Type == dto.ContentTypeText && content.Text != "" {
					matches, _ := engine.CheckText(content.Text, userId)
					
					if len(matches) > 0 {
						allMatches = append(allMatches, matches...)
						
						processedText, blocked := engine.ApplyActions(content.Text, matches)
						if blocked {
							isBlocked = true
						}
						
						contents[j].Text = processedText
					}
				}
			}
			request.Messages[i].Content = contents
		}
	}
	
	// 记录审计日志
	if len(allMatches) > 0 && service.ShouldRecordSensitiveLog() {
		baseRecord := &service.SensitiveLogRecord{
			UserId:          userId,
			Username:        c.GetString("username"),
			TokenId:         c.GetInt("token_id"),
			TokenName:       c.GetString("token_name"),
			TriggerText:     extractFirstMessage(request),
			FullRequestText: extractFullRequest(request),
			Source:          "chat",
			ModelName:       request.Model,
			ChannelId:       info.ChannelId,
			Ip:              c.ClientIP(),
			RequestId:       c.GetString(common.RequestIdKey),
			UserAgent:       c.Request.UserAgent(),
		}
		
		go func() {
			service.RecordSensitiveTriggersBatch(nil, baseRecord, allMatches)
		}()
	}
	
	return allMatches, isBlocked
}

// SaveChatHistoryAsync 异步保存聊天记录
func SaveChatHistoryAsync(c *gin.Context, info *relaycommon.RelayInfo, request *dto.GeneralOpenAIRequest, response any, matchedWords []string, filterAction string) {
	if !service.IsChatHistoryEnabled() {
		return
	}
	
	userId := c.GetInt("id")
	modelName := request.Model
	channelId := info.ChannelId
	
	go func() {
		defer func() {
			if err := recover(); err != nil {
				logger.LogError(nil, fmt.Sprintf("SaveChatHistoryAsync panic: %v", err))
			}
		}()
		
		// 提取第一条消息用于创建话题
		firstMessage := ""
		if len(request.Messages) > 0 {
			firstMessage = request.Messages[0].StringContent()
		}
		
		// 获取或创建话题
		topicIdStr := c.Query("topic_id")
		topicId := 0
		if topicIdStr != "" {
			if id, err := strconv.Atoi(topicIdStr); err == nil {
				topicId = id
			}
		}
		topic, err := service.GetOrCreateTopicForRequest(
			c,
			userId,
			topicId,
			firstMessage,
			modelName,
			channelId,
		)
		if err != nil {
			logger.LogError(nil, "Failed to create topic: "+err.Error())
			return
		}
		
		// 提取响应内容
		responseContent := extractResponseContent(response)
		
		// 计算token使用量
		requestTokens := estimateTokens(extractFullRequest(request))
		responseTokens := estimateTokens(responseContent)
		
		// 保存消息
		err = service.SaveChatMessage(
			c,
			topic.Id,
			userId,
			request,
			responseContent,
			requestTokens,
			responseTokens,
			modelName,
			channelId,
			matchedWords,
			filterAction,
		)
		if err != nil {
			logger.LogError(nil, "Failed to save chat message: "+err.Error())
		}
	}()
}

// extractFirstMessage 提取第一条消息
func extractFirstMessage(request *dto.GeneralOpenAIRequest) string {
	if len(request.Messages) > 0 {
		return request.Messages[0].StringContent()
	}
	return ""
}

// extractFullRequest 提取完整请求内容
func extractFullRequest(request *dto.GeneralOpenAIRequest) string {
	var contents []string
	for _, msg := range request.Messages {
		if msg.IsStringContent() {
			contents = append(contents, msg.StringContent())
		}
	}
	result := ""
	for i, c := range contents {
		if i > 0 {
			result += "\n"
		}
		result += c
	}
	return result
}

// extractResponseContent 提取响应内容
func extractResponseContent(response any) string {
	switch resp := response.(type) {
	case *dto.OpenAITextResponse:
		if len(resp.Choices) > 0 {
			return resp.Choices[0].Message.StringContent()
		}
	case *dto.Usage:
		// Usage类型不包含消息内容,返回空字符串
		return ""
	}
	return ""
}

// estimateTokens 估算token数量
func estimateTokens(text string) int {
	if text == "" {
		return 0
	}
	// 粗略估算: 1 token ≈ 4 chars
	return len(text) / 4
}

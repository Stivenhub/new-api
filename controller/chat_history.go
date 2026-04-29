package controller

import (
	"net/http"
	"strconv"

	"github.com/QuantumNous/new-api/common"
	"github.com/QuantumNous/new-api/model"
	"github.com/gin-gonic/gin"
)

// CreateTopic 创建新话题
// @Summary 创建话题
// @Description 创建一个新的聊天话题
// @Tags chat_history
// @Accept json
// @Produce json
// @Param request body CreateTopicRequest true "创建请求"
// @Success 200 {object} common.Response{data=model.ChatTopic}
// @Router /api/chat/topics [post]
// @Security ApiKeyAuth
type CreateTopicRequest struct {
	Title       string `json:"title" binding:"required,max=255"`
	Description string `json:"description" binding:"max=1000"`
	ModelName   string `json:"model_name" binding:"max=100"`
}

func CreateTopic(c *gin.Context) {
	userId := c.GetInt("id")
	
	var req CreateTopicRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		common.ApiErrorMsg(c, "无效的参数")
		return
	}
	
	topic := &model.ChatTopic{
		UserId:      userId,
		Title:       req.Title,
		Description: req.Description,
		ModelName:   req.ModelName,
		Ip:          c.ClientIP(),
	}
	
	err := topic.Insert()
	if err != nil {
		common.ApiError(c, err)
		return
	}
	
	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"message": "话题创建成功",
		"data":    topic,
	})
}

// GetUserTopics 获取用户话题列表
// @Summary 获取用户话题列表
// @Description 获取当前用户的聊天话题列表,支持分页和排序
// @Tags chat_history
// @Accept json
// @Produce json
// @Param page query int false "页码" default(1)
// @Param per_page query int false "每页数量" default(20)
// @Param order_by query string false "排序字段" Enums(created_at,last_message_at,message_count) default(last_message_at)
// @Success 200 {object} common.Response{data=map[string]interface{}}
// @Router /api/chat/topics [get]
// @Security ApiKeyAuth
func GetUserTopics(c *gin.Context) {
	userId := c.GetInt("id")
	
	page, _ := strconv.Atoi(c.DefaultQuery("page", "1"))
	perPage, _ := strconv.Atoi(c.DefaultQuery("per_page", "20"))
	orderBy := c.DefaultQuery("order_by", "last_message_at")
	
	// 验证排序字段
	validOrderBy := map[string]bool{
		"created_at":      true,
		"last_message_at": true,
		"message_count":   true,
		"title":           true,
	}
	if !validOrderBy[orderBy] {
		orderBy = "last_message_at"
	}
	
	// 限制每页数量
	if perPage > 100 {
		perPage = 100
	}
	if perPage < 1 {
		perPage = 20
	}
	
	topics, total, err := model.GetTopicsByUserId(userId, (page-1)*perPage, perPage, orderBy)
	if err != nil {
		common.ApiError(c, err)
		return
	}
	
	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"data": gin.H{
			"topics":   topics,
			"total":    total,
			"page":     page,
			"per_page": perPage,
		},
	})
}

// GetTopicDetail 获取话题详情
// @Summary 获取话题详情
// @Description 获取指定话题的详细信息
// @Tags chat_history
// @Accept json
// @Produce json
// @Param id path int true "话题ID"
// @Success 200 {object} common.Response{data=model.ChatTopic}
// @Router /api/chat/topics/{id} [get]
// @Security ApiKeyAuth
func GetTopicDetail(c *gin.Context) {
	userId := c.GetInt("id")
	topicId, err := strconv.Atoi(c.Param("id"))
	if err != nil || topicId <= 0 {
		common.ApiErrorMsg(c, "无效的参数")
		return
	}
	
	topic, err := model.GetTopicById(topicId, userId)
	if err != nil {
		common.ApiError(c, err)
		return
	}
	
	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"data":    topic,
	})
}

// GetTopicMessages 获取话题下的消息列表
// @Summary 获取话题消息
// @Description 获取指定话题下的聊天消息列表,支持分页
// @Tags chat_history
// @Accept json
// @Produce json
// @Param id path int true "话题ID"
// @Param page query int false "页码" default(1)
// @Param per_page query int false "每页数量" default(50)
// @Success 200 {object} common.Response{data=map[string]interface{}}
// @Router /api/chat/topics/{id}/messages [get]
// @Security ApiKeyAuth
func GetTopicMessages(c *gin.Context) {
	userId := c.GetInt("id")
	topicId, err := strconv.Atoi(c.Param("id"))
	if err != nil || topicId <= 0 {
		common.ApiErrorMsg(c, "无效的参数")
		return
	}
	
	page, _ := strconv.Atoi(c.DefaultQuery("page", "1"))
	perPage, _ := strconv.Atoi(c.DefaultQuery("per_page", "50"))
	
	// 限制每页数量
	if perPage > 200 {
		perPage = 200
	}
	if perPage < 1 {
		perPage = 50
	}
	
	messages, total, err := model.GetMessagesByTopicId(topicId, userId, (page-1)*perPage, perPage, "created_at DESC")
	if err != nil {
		common.ApiError(c, err)
		return
	}
	
	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"data": gin.H{
			"messages": messages,
			"total":    total,
			"page":     page,
			"per_page": perPage,
		},
	})
}

// UpdateTopic 更新话题信息
// @Summary 更新话题
// @Description 更新话题的标题和描述
// @Tags chat_history
// @Accept json
// @Produce json
// @Param id path int true "话题ID"
// @Param request body UpdateTopicRequest true "更新请求"
// @Success 200 {object} common.Response
// @Router /api/chat/topics/{id} [put]
// @Security ApiKeyAuth
type UpdateTopicRequest struct {
	Title       string `json:"title" binding:"max=255"`
	Description string `json:"description" binding:"max=1000"`
}

func UpdateTopic(c *gin.Context) {
	userId := c.GetInt("id")
	topicId, err := strconv.Atoi(c.Param("id"))
	if err != nil || topicId <= 0 {
		common.ApiErrorMsg(c, "无效的参数")
		return
	}
	
	var req UpdateTopicRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		common.ApiErrorMsg(c, "无效的参数")
		return
	}
	
	// 获取话题并验证权限
	topic, err := model.GetTopicById(topicId, userId)
	if err != nil {
		common.ApiError(c, err)
		return
	}
	
	// 更新字段
	updateFields := make([]string, 0)
	if req.Title != "" {
		topic.Title = req.Title
		updateFields = append(updateFields, "title")
	}
	if req.Description != "" {
		topic.Description = req.Description
		updateFields = append(updateFields, "description")
	}
	
	if len(updateFields) == 0 {
		common.ApiErrorMsg(c, "没有要更新的字段")
		return
	}
	
	err = topic.Update(updateFields...)
	if err != nil {
		common.ApiError(c, err)
		return
	}
	
	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"message": "话题更新成功",
	})
}

// DeleteTopic 软删除话题
// @Summary 删除话题
// @Description 软删除话题及其所有消息
// @Tags chat_history
// @Accept json
// @Produce json
// @Param id path int true "话题ID"
// @Success 200 {object} common.Response
// @Router /api/chat/topics/{id} [delete]
// @Security ApiKeyAuth
func DeleteTopic(c *gin.Context) {
	userId := c.GetInt("id")
	topicId, err := strconv.Atoi(c.Param("id"))
	if err != nil || topicId <= 0 {
		common.ApiErrorMsg(c, "无效的参数")
		return
	}
	
	// 获取话题并验证权限
	topic, err := model.GetTopicById(topicId, userId)
	if err != nil {
		common.ApiError(c, err)
		return
	}
	
	// 软删除话题
	err = topic.DeleteSoft()
	if err != nil {
		common.ApiError(c, err)
		return
	}
	
	// 软删除该话题下的所有消息
	err = model.SoftDeleteMessagesByTopicId(topicId, userId)
	if err != nil {
		common.SysLog("Failed to soft delete messages for topic " + strconv.Itoa(topicId) + ": " + err.Error())
		// 不返回错误,因为话题已删除
	}
	
	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"message": "话题已删除",
	})
}

// SearchTopics 搜索话题
// @Summary 搜索话题
// @Description 根据关键词搜索用户的话题
// @Tags chat_history
// @Accept json
// @Produce json
// @Param keyword query string true "搜索关键词"
// @Param page query int false "页码" default(1)
// @Param per_page query int false "每页数量" default(20)
// @Success 200 {object} common.Response{data=map[string]interface{}}
// @Router /api/chat/topics/search [get]
// @Security ApiKeyAuth
func SearchTopics(c *gin.Context) {
	userId := c.GetInt("id")
	keyword := c.Query("keyword")
	
	if keyword == "" {
		common.ApiErrorMsg(c, "无效的参数")
		return
	}
	
	page, _ := strconv.Atoi(c.DefaultQuery("page", "1"))
	perPage, _ := strconv.Atoi(c.DefaultQuery("per_page", "20"))
	
	if perPage > 100 {
		perPage = 100
	}
	if perPage < 1 {
		perPage = 20
	}
	
	topics, total, err := model.SearchTopicsByKeyword(userId, keyword, (page-1)*perPage, perPage)
	if err != nil {
		common.ApiError(c, err)
		return
	}
	
	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"data": gin.H{
			"topics":   topics,
			"total":    total,
			"page":     page,
			"per_page": perPage,
		},
	})
}

// GetUserTopicStats 获取用户话题统计
// @Summary 获取话题统计
// @Description 获取用户的话题统计数据
// @Tags chat_history
// @Accept json
// @Produce json
// @Success 200 {object} common.Response{data=map[string]interface{}}
// @Router /api/chat/topics/stats [get]
// @Security ApiKeyAuth
func GetUserTopicStats(c *gin.Context) {
	userId := c.GetInt("id")
	
	stats, err := model.GetUserTopicStats(userId)
	if err != nil {
		common.ApiError(c, err)
		return
	}
	
	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"data":    stats,
	})
}

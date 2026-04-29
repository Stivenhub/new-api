package controller

import (
	"net/http"
	"strconv"

	"github.com/QuantumNous/new-api/common"
	"github.com/QuantumNous/new-api/model"
	"github.com/QuantumNous/new-api/service"
	"github.com/gin-gonic/gin"
)

// GetRules 获取敏感词规则列表
// @Summary 获取规则列表
// @Description 获取敏感词规则列表,支持分页和筛选。普通用户只能查看自己的规则,管理员可以查看所有规则
// @Tags sensitive_rules
// @Accept json
// @Produce json
// @Param page query int false "页码" default(1)
// @Param per_page query int false "每页数量" default(20)
// @Param rule_type query string false "规则类型" Enums(keyword,regex,pattern)
// @Param is_enabled query bool false "是否启用"
// @Param keyword query string false "关键词搜索"
// @Success 200 {object} common.Response{data=map[string]interface{}}
// @Router /api/sensitive-rules [get]
// @Security ApiKeyAuth
func GetRules(c *gin.Context) {
	userId := c.GetInt("id")
	userRole := c.GetInt("role")
	
	page, _ := strconv.Atoi(c.DefaultQuery("page", "1"))
	perPage, _ := strconv.Atoi(c.DefaultQuery("per_page", "20"))
	ruleType := c.Query("rule_type")
	isEnabledStr := c.Query("is_enabled")
	keyword := c.Query("keyword")
	
	var isEnabled *bool
	if isEnabledStr != "" {
		val := isEnabledStr == "true"
		isEnabled = &val
	}
	
	// 确定查询范围
	scope := "user"
	if userRole >= common.RoleAdminUser {
		scope = c.DefaultQuery("scope", "all") // all/global/user
	}
	
	rules, total, err := model.GetRulesByPagination(userId, userRole, scope, ruleType, isEnabled, keyword, (page-1)*perPage, perPage)
	if err != nil {
		common.ApiError(c, err)
		return
	}
	
	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"data": gin.H{
			"rules":    rules,
			"total":    total,
			"page":     page,
			"per_page": perPage,
		},
	})
}

// GetRuleById 获取单个规则详情
// @Summary 获取规则详情
// @Description 获取指定ID的规则详情
// @Tags sensitive_rules
// @Accept json
// @Produce json
// @Param id path int true "规则ID"
// @Success 200 {object} common.Response{data=model.SensitiveRule}
// @Router /api/sensitive-rules/{id} [get]
// @Security ApiKeyAuth
func GetRuleById(c *gin.Context) {
	userId := c.GetInt("id")
	userRole := c.GetInt("role")
	
	ruleId, err := strconv.Atoi(c.Param("id"))
	if err != nil || ruleId <= 0 {
		common.ApiErrorMsg(c, "无效的参数")
		return
	}
	
	rule, err := model.GetRuleById(ruleId, userId, userRole)
	if err != nil {
		common.ApiError(c, err)
		return
	}
	
	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"data":    rule,
	})
}

// CreateRule 创建敏感词规则
// @Summary 创建规则
// @Description 创建新的敏感词规则
// @Tags sensitive_rules
// @Accept json
// @Produce json
// @Param request body CreateRuleRequest true "创建请求"
// @Success 200 {object} common.Response
// @Router /api/sensitive-rules [post]
// @Security ApiKeyAuth
type CreateRuleRequest struct {
	Name          string `json:"name" binding:"required,max=255"`
	RuleType      string `json:"rule_type" binding:"required,oneof=keyword regex pattern"`
	Pattern       string `json:"pattern" binding:"required"`
	Action        string `json:"action" binding:"required,oneof=block replace warn mask"`
	ReplaceText   string `json:"replace_text" binding:"max=255"`
	CaseSensitive bool   `json:"case_sensitive"`
	Scope         string `json:"scope" binding:"omitempty,oneof=global user"`
	Description   string `json:"description" binding:"max=1000"`
}

func CreateRule(c *gin.Context) {
	userId := c.GetInt("id")
	userRole := c.GetInt("role")
	
	var req CreateRuleRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		common.ApiErrorMsg(c, "无效的参数")
		return
	}
	
	// 验证正则表达式
	if req.RuleType == model.SensitiveRuleTypeRegex {
		if _, err := common.CompileRegex(req.Pattern); err != nil {
			common.ApiErrorMsg(c, "正则表达式格式错误: "+err.Error())
			return
		}
	}
	
	// 确定作用域
	scope := req.Scope
	if scope == "" {
		scope = "user"
	}
	
	// 非管理员不能创建全局规则
	if scope == "global" && userRole < common.RoleAdminUser {
		common.ApiErrorMsg(c, "无权创建全局规则")
		return
	}
	
	rule := &model.SensitiveRule{
		Name:          req.Name,
		RuleType:      req.RuleType,
		Pattern:       req.Pattern,
		Action:        req.Action,
		ReplaceText:   req.ReplaceText,
		CaseSensitive: req.CaseSensitive,
		UserId:        userId,
		Scope:         scope,
		IsEnabled:     true,
		Description:   req.Description,
	}
	
	err := rule.Insert()
	if err != nil {
		common.ApiError(c, err)
		return
	}
	
	// 重新加载规则到引擎
	service.GetSensitiveEngine().ReloadRules()
	
	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"message": "规则创建成功",
		"data":    rule,
	})
}

// UpdateRule 更新敏感词规则
// @Summary 更新规则
// @Description 更新指定的敏感词规则
// @Tags sensitive_rules
// @Accept json
// @Produce json
// @Param id path int true "规则ID"
// @Param request body UpdateRuleRequest true "更新请求"
// @Success 200 {object} common.Response
// @Router /api/sensitive-rules/{id} [put]
// @Security ApiKeyAuth
type UpdateRuleRequest struct {
	Name          string `json:"name" binding:"omitempty,max=255"`
	Pattern       string `json:"pattern" binding:"omitempty"`
	Action        string `json:"action" binding:"omitempty,oneof=block replace warn mask"`
	ReplaceText   string `json:"replace_text" binding:"omitempty,max=255"`
	CaseSensitive *bool  `json:"case_sensitive"`
	Description   string `json:"description" binding:"omitempty,max=1000"`
}

func UpdateRule(c *gin.Context) {
	userId := c.GetInt("id")
	userRole := c.GetInt("role")
	
	ruleId, err := strconv.Atoi(c.Param("id"))
	if err != nil || ruleId <= 0 {
		common.ApiErrorMsg(c, "无效的参数")
		return
	}
	
	var req UpdateRuleRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		common.ApiErrorMsg(c, "无效的参数")
		return
	}
	
	// 获取规则并验证权限
	rule, err := model.GetRuleById(ruleId, userId, userRole)
	if err != nil {
		common.ApiError(c, err)
		return
	}
	
	// 验证正则表达式
	if req.Pattern != "" && rule.RuleType == model.SensitiveRuleTypeRegex {
		if _, err := common.CompileRegex(req.Pattern); err != nil {
			common.ApiErrorMsg(c, "正则表达式格式错误: "+err.Error())
			return
		}
	}
	
	// 更新字段
	updateFields := make([]string, 0)
	if req.Name != "" {
		rule.Name = req.Name
		updateFields = append(updateFields, "name")
	}
	if req.Pattern != "" {
		rule.Pattern = req.Pattern
		updateFields = append(updateFields, "pattern")
	}
	if req.Action != "" {
		rule.Action = req.Action
		updateFields = append(updateFields, "action")
	}
	if req.ReplaceText != "" {
		rule.ReplaceText = req.ReplaceText
		updateFields = append(updateFields, "replace_text")
	}
	if req.CaseSensitive != nil {
		rule.CaseSensitive = *req.CaseSensitive
		updateFields = append(updateFields, "case_sensitive")
	}
	if req.Description != "" {
		rule.Description = req.Description
		updateFields = append(updateFields, "description")
	}
	
	if len(updateFields) == 0 {
		common.ApiErrorMsg(c, "无效的参数")
		return
	}
	
	err = rule.Update(updateFields...)
	if err != nil {
		common.ApiError(c, err)
		return
	}
	
	// 重新加载规则到引擎
	service.GetSensitiveEngine().ReloadRules()
	
	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"message": "规则更新成功",
	})
}

// DeleteRule 删除敏感词规则
// @Summary 删除规则
// @Description 删除指定的敏感词规则
// @Tags sensitive_rules
// @Accept json
// @Produce json
// @Param id path int true "规则ID"
// @Success 200 {object} common.Response
// @Router /api/sensitive-rules/{id} [delete]
// @Security ApiKeyAuth
func DeleteRule(c *gin.Context) {
	userId := c.GetInt("id")
	userRole := c.GetInt("role")
	
	ruleId, err := strconv.Atoi(c.Param("id"))
	if err != nil || ruleId <= 0 {
		common.ApiErrorMsg(c, "无效的参数")
		return
	}
	
	// 获取规则并验证权限
	rule, err := model.GetRuleById(ruleId, userId, userRole)
	if err != nil {
		common.ApiError(c, err)
		return
	}
	
	err = rule.DeleteSoft()
	if err != nil {
		common.ApiError(c, err)
		return
	}
	
	// 重新加载规则到引擎
	service.GetSensitiveEngine().ReloadRules()
	
	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"message": "规则已删除",
	})
}

// ToggleRuleStatus 启用/禁用规则
// @Summary 切换规则状态
// @Description 启用或禁用指定的敏感词规则
// @Tags sensitive_rules
// @Accept json
// @Produce json
// @Param id path int true "规则ID"
// @Param request body ToggleRuleRequest true "切换请求"
// @Success 200 {object} common.Response
// @Router /api/sensitive-rules/{id}/toggle [post]
// @Security ApiKeyAuth
type ToggleRuleRequest struct {
	IsEnabled bool `json:"is_enabled"`
}

func ToggleRuleStatus(c *gin.Context) {
	userId := c.GetInt("id")
	userRole := c.GetInt("role")
	
	ruleId, err := strconv.Atoi(c.Param("id"))
	if err != nil || ruleId <= 0 {
		common.ApiErrorMsg(c, "无效的参数")
		return
	}
	
	var req ToggleRuleRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		common.ApiErrorMsg(c, "无效的参数")
		return
	}
	
	// 获取规则并验证权限
	rule, err := model.GetRuleById(ruleId, userId, userRole)
	if err != nil {
		common.ApiError(c, err)
		return
	}
	
	rule.IsEnabled = req.IsEnabled
	err = rule.Update("is_enabled")
	if err != nil {
		common.ApiError(c, err)
		return
	}
	
	// 重新加载规则到引擎
	service.GetSensitiveEngine().ReloadRules()
	
	status := "禁用"
	if req.IsEnabled {
		status = "启用"
	}
	
	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"message": "规则已" + status,
	})
}

// ReloadRules 重新加载规则到引擎
// @Summary 重新加载规则
// @Description 将所有规则重新加载到内存引擎中
// @Tags sensitive_rules
// @Accept json
// @Produce json
// @Success 200 {object} common.Response
// @Router /api/sensitive-rules/reload [post]
// @Security ApiKeyAuth
func ReloadRules(c *gin.Context) {
	engine := service.GetSensitiveEngine()
	engine.ReloadRules()
	
	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"message": "规则已重新加载",
	})
}

// GetRuleStatistics 获取规则统计
// @Summary 获取规则统计
// @Description 获取敏感词规则的统计数据
// @Tags sensitive_rules
// @Accept json
// @Produce json
// @Success 200 {object} common.Response{data=map[string]interface{}}
// @Router /api/sensitive-rules/statistics [get]
// @Security ApiKeyAuth
func GetRuleStatistics(c *gin.Context) {
	userId := c.GetInt("id")
	userRole := c.GetInt("role")
	
	stats, err := model.GetRuleStatistics(userId, userRole)
	if err != nil {
		common.ApiError(c, err)
		return
	}
	
	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"data":    stats,
	})
}

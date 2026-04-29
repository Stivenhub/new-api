package controller

import (
	"net/http"
	"strconv"

	"github.com/QuantumNous/new-api/common"
	"github.com/QuantumNous/new-api/model"
	"github.com/gin-gonic/gin"
)

// GetSensitiveLogs 获取敏感词触发日志列表
// @Summary 获取日志列表
// @Description 获取敏感词触发日志列表,支持多维度筛选。普通用户只能查看自己的日志,管理员可以查看所有日志
// @Tags sensitive_logs
// @Accept json
// @Produce json
// @Param page query int false "页码" default(1)
// @Param per_page query int false "每页数量" default(20)
// @Param action query string false "动作类型" Enums(block,replace,warn,mask)
// @Param rule_id query int false "规则ID"
// @Param source query string false "来源" Enums(chat,image,task,playground)
// @Param start_date query int64 false "开始时间(Unix时间戳)"
// @Param end_date query int64 false "结束时间(Unix时间戳)"
// @Param keyword query string false "关键词搜索"
// @Success 200 {object} common.Response{data=map[string]interface{}}
// @Router /api/sensitive-logs [get]
// @Security ApiKeyAuth
func GetSensitiveLogs(c *gin.Context) {
	userId := c.GetInt("id")
	userRole := c.GetInt("role")
	
	page, _ := strconv.Atoi(c.DefaultQuery("page", "1"))
	perPage, _ := strconv.Atoi(c.DefaultQuery("per_page", "20"))
	ruleIdStr := c.Query("rule_id")
	source := c.Query("source")
	startDateStr := c.Query("start_date")
	endDateStr := c.Query("end_date")
	keyword := c.Query("keyword")
	
	var ruleId int
	if ruleIdStr != "" {
		ruleId, _ = strconv.Atoi(ruleIdStr)
	}
	
	var startDate, endDate int64
	if startDateStr != "" {
		startDate, _ = strconv.ParseInt(startDateStr, 10, 64)
	}
	if endDateStr != "" {
		endDate, _ = strconv.ParseInt(endDateStr, 10, 64)
	}
	
	logs, total, err := model.GetSensitiveLogsByPagination(
		userId, userRole, ruleId, source,
		startDate, endDate, keyword,
		(page-1)*perPage, perPage,
	)
	if err != nil {
		common.ApiError(c, err)
		return
	}
	
	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"data": gin.H{
			"logs":     logs,
			"total":    total,
			"page":     page,
			"per_page": perPage,
		},
	})
}

// GetLogDetail 获取日志详情
// @Summary 获取日志详情
// @Description 获取指定ID的敏感词触发日志详情
// @Tags sensitive_logs
// @Accept json
// @Produce json
// @Param id path int true "日志ID"
// @Success 200 {object} common.Response{data=model.SensitiveLog}
// @Router /api/sensitive-logs/{id} [get]
// @Security ApiKeyAuth
func GetLogDetail(c *gin.Context) {
	userId := c.GetInt("id")
	userRole := c.GetInt("role")
	
	logId, err := strconv.Atoi(c.Param("id"))
	if err != nil || logId <= 0 {
		common.ApiErrorMsg(c, "无效的参数")
		return
	}
	
	log, err := model.GetSensitiveLogById(logId, userId, userRole)
	if err != nil {
		common.ApiError(c, err)
		return
	}
	
	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"data":    log,
	})
}

// GetMyHistory 获取个人敏感词历史
// @Summary 获取个人历史
// @Description 获取当前用户的敏感词触发历史记录
// @Tags sensitive_logs
// @Accept json
// @Produce json
// @Param page query int false "页码" default(1)
// @Param per_page query int false "每页数量" default(20)
// @Success 200 {object} common.Response{data=map[string]interface{}}
// @Router /api/sensitive-logs/my-history [get]
// @Security ApiKeyAuth
func GetMyHistory(c *gin.Context) {
	userId := c.GetInt("id")
	
	page, _ := strconv.Atoi(c.DefaultQuery("page", "1"))
	perPage, _ := strconv.Atoi(c.DefaultQuery("per_page", "20"))
	
	logs, total, err := model.GetSensitiveLogsByPagination(
		userId, userId, 0, "",
		0, 0, "",
		(page-1)*perPage, perPage,
	)
	if err != nil {
		common.ApiError(c, err)
		return
	}
	
	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"data": gin.H{
			"logs":     logs,
			"total":    total,
			"page":     page,
			"per_page": perPage,
		},
	})
}

// GetStatistics 获取统计数据
// @Summary 获取统计数据
// @Description 获取敏感词触发的统计数据,支持时间范围筛选
// @Tags sensitive_logs
// @Accept json
// @Produce json
// @Param start_date query int64 false "开始时间(Unix时间戳)"
// @Param end_date query int64 false "结束时间(Unix时间戳)"
// @Success 200 {object} common.Response{data=map[string]interface{}}
// @Router /api/sensitive-logs/statistics [get]
// @Security ApiKeyAuth
func GetStatistics(c *gin.Context) {
	userId := c.GetInt("id")
	userRole := c.GetInt("role")
	
	startDateStr := c.Query("start_date")
	endDateStr := c.Query("end_date")
	
	var startDate, endDate int64
	if startDateStr != "" {
		startDate, _ = strconv.ParseInt(startDateStr, 10, 64)
	}
	if endDateStr != "" {
		endDate, _ = strconv.ParseInt(endDateStr, 10, 64)
	}
	
	stats, err := model.GetSensitiveLogStatistics(userId, userRole, startDate, endDate)
	if err != nil {
		common.ApiError(c, err)
		return
	}
	
	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"data":    stats,
	})
}

// CleanOldLogs 清理旧日志
// @Summary 清理旧日志
// @Description 清理指定天数之前的敏感词触发日志(仅管理员)
// @Tags sensitive_logs
// @Accept json
// @Produce json
// @Param request body CleanLogsRequest true "清理请求"
// @Success 200 {object} common.Response
// @Router /api/sensitive-logs/clean [post]
// @Security ApiKeyAuth
type CleanLogsRequest struct {
	Days int `json:"days" binding:"required,min=1,max=365"`
}

func CleanOldLogs(c *gin.Context) {
	userRole := c.GetInt("role")
	
	// 仅管理员可执行
	if userRole < common.RoleAdminUser {
		common.ApiErrorMsg(c, "无权执行此操作")
		return
	}
	
	var req CleanLogsRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		common.ApiErrorMsg(c, "无效的参数")
		return
	}
	
	deletedCount, err := model.CleanOldSensitiveLogs(req.Days)
	if err != nil {
		common.ApiError(c, err)
		return
	}
	
	c.JSON(http.StatusOK, gin.H{
		"success":       true,
		"message":       "清理完成",
		"deleted_count": deletedCount,
	})
}

// ExportLogs 导出日志
// @Summary 导出日志
// @Description 导出敏感词触发日志为CSV格式
// @Tags sensitive_logs
// @Accept json
// @Produce json
// @Param action query string false "动作类型"
// @Param start_date query int64 false "开始时间(Unix时间戳)"
// @Param end_date query int64 false "结束时间(Unix时间戳)"
// @Success 200 {file} text/csv
// @Router /api/sensitive-logs/export [get]
// @Security ApiKeyAuth
func ExportLogs(c *gin.Context) {
	userId := c.GetInt("id")
	userRole := c.GetInt("role")
	
	startDateStr := c.Query("start_date")
	endDateStr := c.Query("end_date")
	
	var startDate, endDate int64
	if startDateStr != "" {
		startDate, _ = strconv.ParseInt(startDateStr, 10, 64)
	}
	if endDateStr != "" {
		endDate, _ = strconv.ParseInt(endDateStr, 10, 64)
	}
	
	// 获取所有日志(不分页)
	logs, _, err := model.GetSensitiveLogsByPagination(
		userId, userRole, 0, "",
		startDate, endDate, "",
		0, 10000, // 限制最多导出10000条
	)
	if err != nil {
		common.ApiError(c, err)
		return
	}
	
	// 生成CSV
	csvContent := generateLogsCSV(logs)
	
	// 设置响应头
	c.Header("Content-Type", "text/csv; charset=utf-8")
	c.Header("Content-Disposition", "attachment; filename=sensitive_logs.csv")
	c.String(http.StatusOK, csvContent)
}

// generateLogsCSV 生成CSV内容
func generateLogsCSV(logs []*model.SensitiveLog) string {
	// CSV头部
	csv := "ID,用户名,规则名称,规则类型,触发动作,是否拦截,模型名称,来源,触发文本,匹配模式,IP地址,请求ID,时间\n"
	
	for _, log := range logs {
		// 转义CSV特殊字符
		triggerText := escapeCSV(log.TriggerText)
		matchedPattern := escapeCSV(log.MatchedPattern)
		
		csv += strconv.Itoa(log.Id) + ","
		csv += log.Username + ","
		csv += log.RuleName + ","
		csv += log.RuleType + ","
		csv += log.Action + ","
		csv += boolToStr(log.RequestBlocked) + ","
		csv += log.ModelName + ","
		csv += log.Source + ","
		csv += triggerText + ","
		csv += matchedPattern + ","
		csv += log.Ip + ","
		csv += log.RequestId + ","
		csv += formatTimestamp(log.CreatedAt) + "\n"
	}
	
	return csv
}

// escapeCSV 转义CSV特殊字符
func escapeCSV(s string) string {
	// 如果包含逗号、引号或换行符,需要用引号包裹
	if len(s) == 0 {
		return ""
	}
	
	needsQuote := false
	for _, ch := range s {
		if ch == ',' || ch == '"' || ch == '\n' || ch == '\r' {
			needsQuote = true
			break
		}
	}
	
	if !needsQuote {
		return s
	}
	
	// 转义引号
	result := "\""
	for _, ch := range s {
		if ch == '"' {
			result += "\"\""
		} else {
			result += string(ch)
		}
	}
	result += "\""
	
	return result
}

// boolToStr 布尔值转字符串
func boolToStr(b bool) string {
	if b {
		return "是"
	}
	return "否"
}

// formatTimestamp 格式化时间戳
func formatTimestamp(ts int64) string {
	// 简单实现,实际应该使用time包格式化
	return strconv.FormatInt(ts, 10)
}

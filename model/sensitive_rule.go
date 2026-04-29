package model

import (
	"github.com/QuantumNous/new-api/common"
	"gorm.io/gorm"
)

// SensitiveRuleType 敏感规则类型
const (
	SensitiveRuleTypeKeyword = "keyword" // 关键词匹配
	SensitiveRuleTypeRegex   = "regex"   // 正则表达式
	SensitiveRuleTypePattern = "pattern" // 模式匹配
)

// SensitiveRuleScope 规则作用范围
const (
	SensitiveRuleScopeGlobal = "global" // 全局规则(管理员设置)
	SensitiveRuleScopeUser   = "user"   // 用户自定义规则
	SensitiveRuleScopeGroup  = "group"  // 分组规则
)

// SensitiveRuleAction 规则动作
const (
	SensitiveRuleActionBlock   = "block"   // 拦截
	SensitiveRuleActionReplace = "replace" // 替换
	SensitiveRuleActionWarn    = "warn"    // 警告
	SensitiveRuleActionMask    = "mask"    // 脱敏
)

// SensitiveRule 敏感规则表
type SensitiveRule struct {
	Id            int    `json:"id" gorm:"primaryKey"`
	UserId        int    `json:"user_id" gorm:"index;default:0"`              // 0表示全局规则
	Group         string `json:"group" gorm:"index;default:''"`               // 适用的用户组

	Name          string `json:"name" gorm:"type:varchar(255);not null"`      // 规则名称
	Description   string `json:"description" gorm:"type:text;default:''"`     // 规则描述

	RuleType      string `json:"rule_type" gorm:"type:varchar(20);not null"`  // keyword/regex/pattern
	Scope         string `json:"scope" gorm:"type:varchar(20);default:'global'"` // global/user/group

	Pattern       string `json:"pattern" gorm:"type:text;not null"`           // 匹配模式
	CaseSensitive bool   `json:"case_sensitive" gorm:"default:false"`         // 是否区分大小写

	Action        string `json:"action" gorm:"type:varchar(20);default:'block'"` // block/replace/warn/mask
	ReplaceText   string `json:"replace_text" gorm:"type:varchar(255);default:'***'"` // 替换文本

	Priority      int    `json:"priority" gorm:"default:0"`                    // 优先级

	IsEnabled     bool   `json:"is_enabled" gorm:"default:true;index"`         // 是否启用
	HitCount      int    `json:"hit_count" gorm:"default:0"`                   // 命中次数统计

	IsDeleted     bool   `json:"is_deleted" gorm:"default:false;index"`        // 软删除标记

	CreatedAt     int64  `json:"created_at" gorm:"bigint;index"`
	UpdatedAt     int64  `json:"updated_at" gorm:"bigint;index"`
	CreatedBy     int    `json:"created_by" gorm:"default:0"`                  // 创建者ID
}

// TableName 指定表名
func (SensitiveRule) TableName() string {
	return "sensitive_rules"
}

// Insert 插入新规则
func (rule *SensitiveRule) Insert() error {
	rule.CreatedAt = common.GetTimestamp()
	rule.UpdatedAt = common.GetTimestamp()
	if rule.UserId == 0 {
		rule.Scope = SensitiveRuleScopeGlobal
	} else {
		rule.Scope = SensitiveRuleScopeUser
	}
	return DB.Create(rule).Error
}

// Update 更新规则
func (rule *SensitiveRule) Update(updateFields ...string) error {
	rule.UpdatedAt = common.GetTimestamp()
	db := DB.Model(rule)
	if len(updateFields) > 0 {
		db = db.Select(updateFields)
	}
	return db.Updates(rule).Error
}

// IncrementHitCount 增加命中次数
func (rule *SensitiveRule) IncrementHitCount() error {
	return DB.Model(rule).UpdateColumn("hit_count", gorm.Expr("hit_count + ?", 1)).Error
}

// Delete 删除规则
func (rule *SensitiveRule) Delete() error {
	return DB.Delete(rule).Error
}

// DeleteSoft 软删除规则
func (rule *SensitiveRule) DeleteSoft() error {
	rule.IsDeleted = true
	rule.UpdatedAt = common.GetTimestamp()
	return DB.Model(rule).Select("is_deleted", "updated_at").Updates(rule).Error
}

// GetGlobalRules 获取全局启用的规则
func GetGlobalRules(ruleType string) ([]*SensitiveRule, error) {
	var rules []*SensitiveRule
	tx := DB.Where("user_id = ? AND is_enabled = ?", 0, true)

	if ruleType != "" {
		tx = tx.Where("rule_type = ?", ruleType)
	}

	err := tx.Order("priority DESC, id ASC").Find(&rules).Error
	return rules, err
}

// GetUserRules 获取用户的自定义规则
func GetUserRules(userId int, ruleType string, isEnabled *bool) ([]*SensitiveRule, error) {
	var rules []*SensitiveRule
	tx := DB.Where("user_id = ?", userId)

	if ruleType != "" {
		tx = tx.Where("rule_type = ?", ruleType)
	}

	if isEnabled != nil {
		tx = tx.Where("is_enabled = ?", *isEnabled)
	}

	err := tx.Order("priority DESC, id ASC").Find(&rules).Error
	return rules, err
}

// GetRulesByPagination 分页获取规则
func GetRulesByPagination(userId int, role int, scope string, ruleType string,
	isEnabled *bool, keyword string, startIdx int, num int) ([]*SensitiveRule, int64, error) {
	var rules []*SensitiveRule
	var total int64

	tx := DB.Model(&SensitiveRule{}).Where("is_deleted = ?", false)

	// 权限控制
	if role < common.RoleAdminUser {
		tx = tx.Where("user_id = ? OR user_id = 0", userId)
	} else if userId > 0 && scope == "user" {
		tx = tx.Where("user_id = ?", userId)
	}

	// 筛选条件
	if scope != "" && scope != "all" {
		tx = tx.Where("scope = ?", scope)
	}

	if ruleType != "" {
		tx = tx.Where("rule_type = ?", ruleType)
	}

	if isEnabled != nil {
		tx = tx.Where("is_enabled = ?", *isEnabled)
	}

	if keyword != "" {
		keywordPattern, _ := sanitizeLikePattern(keyword)
		tx = tx.Where("name LIKE ? OR pattern LIKE ? OR description LIKE ?",
			keywordPattern, keywordPattern, keywordPattern)
	}

	// 统计总数
	err := tx.Count(&total).Error
	if err != nil {
		return nil, 0, err
	}

	// 分页查询
	err = tx.Order("priority DESC, created_at DESC").Limit(num).Offset(startIdx).Find(&rules).Error
	return rules, total, err
}

// GetRuleById 根据ID获取规则
func GetRuleById(id int, userId int, role int) (*SensitiveRule, error) {
	var rule SensitiveRule
	tx := DB.Where("id = ? AND is_deleted = ?", id, false)

	// 权限控制
	if role < common.RoleAdminUser {
		tx = tx.Where("user_id = ? OR user_id = 0", userId)
	}

	err := tx.First(&rule).Error
	if err != nil {
		return nil, err
	}
	return &rule, nil
}

// ToggleRuleEnabled 切换规则启用状态
func ToggleRuleEnabled(id int, userId int, role int) error {
	rule, err := GetRuleById(id, userId, role)
	if err != nil {
		return err
	}

	rule.IsEnabled = !rule.IsEnabled
	rule.UpdatedAt = common.GetTimestamp()
	return DB.Save(rule).Error
}

// BatchDeleteRules 批量删除规则
func BatchDeleteRules(ids []int, userId int, role int) error {
	tx := DB.Where("id IN ?", ids)

	// 权限控制
	if role < common.RoleAdminUser {
		tx = tx.Where("user_id = ?", userId)
	}

	return tx.Delete(&SensitiveRule{}).Error
}

// GetRuleStatistics 获取规则统计信息
func GetRuleStatistics(userId int, role int) (map[string]interface{}, error) {
	stats := make(map[string]interface{})

	tx := DB.Model(&SensitiveRule{})
	if role < common.RoleAdminUser {
		tx = tx.Where("user_id = ? OR user_id = 0", userId)
	}

	// 总数
	var totalCount int64
	tx.Count(&totalCount)
	stats["total"] = totalCount

	// 按类型统计
	var typeStats []struct {
		RuleType string `gorm:"column:rule_type"`
		Count    int64  `gorm:"column:count"`
	}
	tx.Select("rule_type, COUNT(*) as count").Group("rule_type").Scan(&typeStats)
	stats["by_type"] = typeStats

	// 按状态统计
	var enabledCount, disabledCount int64
	tx.Where("is_enabled = ?", true).Count(&enabledCount)
	tx.Where("is_enabled = ?", false).Count(&disabledCount)
	stats["enabled"] = enabledCount
	stats["disabled"] = disabledCount

	// 总命中次数
	var totalHits int64
	tx.Select("COALESCE(SUM(hit_count), 0)").Scan(&totalHits)
	stats["total_hits"] = totalHits

	return stats, nil
}

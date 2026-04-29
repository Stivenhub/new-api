package service

import (
	"regexp"
	"strings"
	"sync"

	goahocorasick "github.com/anknown/ahocorasick"
	"github.com/QuantumNous/new-api/common"
	"github.com/QuantumNous/new-api/model"
)

// SensitiveEngine 敏感词检测引擎
type SensitiveEngine struct {
	mu          sync.RWMutex
	keywordTrie *goahocorasick.Machine      // 关键词AC自动机
	regexCache  map[int]*regexp.Regexp      // 正则表达式缓存
	rules       map[int]*model.SensitiveRule // 规则缓存(key: rule ID)
}

var (
	globalEngine *SensitiveEngine
	engineOnce   sync.Once
)

// GetSensitiveEngine 获取全局敏感词引擎单例
func GetSensitiveEngine() *SensitiveEngine {
	engineOnce.Do(func() {
		globalEngine = &SensitiveEngine{
			regexCache: make(map[int]*regexp.Regexp),
			rules:      make(map[int]*model.SensitiveRule),
		}
		globalEngine.ReloadRules()
	})
	return globalEngine
}

// ReloadRules 重新加载规则
func (e *SensitiveEngine) ReloadRules() {
	e.mu.Lock()
	defer e.mu.Unlock()

	// 清空旧数据
	e.keywordTrie = nil
	e.regexCache = make(map[int]*regexp.Regexp)
	e.rules = make(map[int]*model.SensitiveRule)

	// 加载全局规则
	rules, err := model.GetGlobalRules("")
	if err != nil {
		common.SysLog("failed to load sensitive rules: " + err.Error())
		return
	}

	var keywords []string
	for _, rule := range rules {
		if !rule.IsEnabled {
			continue
		}

		e.rules[rule.Id] = rule

		switch rule.RuleType {
		case model.SensitiveRuleTypeKeyword:
			if !rule.CaseSensitive {
				keywords = append(keywords, strings.ToLower(rule.Pattern))
			} else {
				keywords = append(keywords, rule.Pattern)
			}

		case model.SensitiveRuleTypeRegex:
			if compiled, err := regexp.Compile(rule.Pattern); err == nil {
				e.regexCache[rule.Id] = compiled
			} else {
				common.SysLog("failed to compile regex rule #" + string(rune(rule.Id)) + ": " + err.Error())
			}
		}
	}

	// 构建AC自动机
	if len(keywords) > 0 {
		e.keywordTrie = e.buildACMachine(keywords)
	}
}

// CheckText 检查文本(返回命中的规则和检测结果)
func (e *SensitiveEngine) CheckText(text string, userId int) ([]*SensitiveMatchResult, error) {
	e.mu.RLock()
	defer e.mu.RUnlock()

	var results []*SensitiveMatchResult

	// 1. 关键词匹配
	if e.keywordTrie != nil {
		checkText := text
		hits := e.keywordTrie.MultiPatternSearch([]rune(checkText), false)

		for _, hit := range hits {
			word := string(hit.Word)
			// 找到对应的规则(通过pattern匹配)
			for ruleId, rule := range e.rules {
				if rule.RuleType == model.SensitiveRuleTypeKeyword && rule.IsEnabled {
					pattern := rule.Pattern
					if !rule.CaseSensitive {
						pattern = strings.ToLower(pattern)
					}
					if pattern == word {
						results = append(results, &SensitiveMatchResult{
							RuleId:      ruleId,
							RuleName:    rule.Name,
							RuleType:    rule.RuleType,
							MatchedText: word,
							Action:      rule.Action,
							ReplaceText: rule.ReplaceText,
							Position:    hit.Pos,
						})

						// 增加命中计数(异步)
						go func(id int) {
							if r, err := model.GetRuleById(id, 0, common.RoleAdminUser); err == nil {
								r.IncrementHitCount()
							}
						}(ruleId)

						break
					}
				}
			}
		}
	}

	// 2. 正则表达式匹配
	for ruleId, regex := range e.regexCache {
		if rule, exists := e.rules[ruleId]; exists {
			matches := regex.FindAllStringIndex(text, -1)
			for _, match := range matches {
				matchedText := text[match[0]:match[1]]
				results = append(results, &SensitiveMatchResult{
					RuleId:      ruleId,
					RuleName:    rule.Name,
					RuleType:    rule.RuleType,
					MatchedText: matchedText,
					Action:      rule.Action,
					ReplaceText: rule.ReplaceText,
					Position:    match[0],
				})

				// 增加命中计数
				go func(ruleId int) {
					if r, err := model.GetRuleById(ruleId, 0, common.RoleAdminUser); err == nil {
						r.IncrementHitCount()
					}
				}(ruleId)
			}
		}
	}

	// 3. 加载用户自定义规则并检查
	if userId > 0 {
		userResults, _ := e.checkUserRules(text, userId)
		results = append(results, userResults...)
	}

	return results, nil
}

// checkUserRules 检查用户自定义规则
func (e *SensitiveEngine) checkUserRules(text string, userId int) ([]*SensitiveMatchResult, error) {
	userRules, err := model.GetUserRules(userId, "", nil)
	if err != nil || len(userRules) == 0 {
		return nil, err
	}

	var results []*SensitiveMatchResult

	for _, rule := range userRules {
		if !rule.IsEnabled {
			continue
		}

		switch rule.RuleType {
		case model.SensitiveRuleTypeKeyword:
			pattern := rule.Pattern
			checkText := text
			if !rule.CaseSensitive {
				pattern = strings.ToLower(pattern)
				checkText = strings.ToLower(text)
			}

			if strings.Contains(checkText, pattern) {
				results = append(results, &SensitiveMatchResult{
					RuleId:      rule.Id,
					RuleName:    rule.Name,
					RuleType:    rule.RuleType,
					MatchedText: pattern,
					Action:      rule.Action,
					ReplaceText: rule.ReplaceText,
					Position:    strings.Index(checkText, pattern),
				})
			}

		case model.SensitiveRuleTypeRegex:
			if compiled, err := regexp.Compile(rule.Pattern); err == nil {
				matches := compiled.FindAllStringIndex(text, -1)
				for _, match := range matches {
					results = append(results, &SensitiveMatchResult{
						RuleId:      rule.Id,
						RuleName:    rule.Name,
						RuleType:    rule.RuleType,
						MatchedText: text[match[0]:match[1]],
						Action:      rule.Action,
						ReplaceText: rule.ReplaceText,
						Position:    match[0],
					})
				}
			}
		}
	}

	return results, nil
}

// ApplyActions 应用检测结果的动作
func (e *SensitiveEngine) ApplyActions(text string, matches []*SensitiveMatchResult) (string, bool) {
	if len(matches) == 0 {
		return text, false
	}

	hasBlocked := false
	result := text

	// 按位置倒序排序,避免替换时位置偏移
	sorted := make([]*SensitiveMatchResult, len(matches))
	copy(sorted, matches)
	// TODO: 实现排序逻辑

	for _, match := range sorted {
		switch match.Action {
		case model.SensitiveRuleActionBlock:
			hasBlocked = true

		case model.SensitiveRuleActionReplace:
			result = strings.Replace(result, match.MatchedText, match.ReplaceText, 1)

		case model.SensitiveRuleActionMask:
			// 脱敏处理
			masked := e.maskText(match.MatchedText, match.ReplaceText)
			result = strings.Replace(result, match.MatchedText, masked, 1)

		case model.SensitiveRuleActionWarn:
			// 仅警告,不修改文本
		}
	}

	return result, hasBlocked
}

// buildACMachine 构建AC自动机
func (e *SensitiveEngine) buildACMachine(keywords []string) *goahocorasick.Machine {
	m := new(goahocorasick.Machine)
	var runes [][]rune
	for _, word := range keywords {
		word = strings.ToLower(word)
		runes = append(runes, []rune(word))
	}
	if err := m.Build(runes); err != nil {
		common.SysLog("failed to build AC machine: " + err.Error())
		return nil
	}
	return m
}

// maskText 脱敏文本
func (e *SensitiveEngine) maskText(original, maskPattern string) string {
	// 简单实现:保留前后字符,中间用***替代
	if len(original) <= 4 {
		return maskPattern
	}

	keepStart := 1
	keepEnd := 1

	if len(original) > 8 {
		keepStart = 3
		keepEnd = 2
	}

	return original[:keepStart] + maskPattern + original[len(original)-keepEnd:]
}

// SensitiveMatchResult 敏感词匹配结果
type SensitiveMatchResult struct {
	RuleId      int    `json:"rule_id"`
	RuleName    string `json:"rule_name"`
	RuleType    string `json:"rule_type"`
	MatchedText string `json:"matched_text"`
	Action      string `json:"action"`
	ReplaceText string `json:"replace_text"`
	Position    int    `json:"position"`
}

/*
Copyright (C) 2025 QuantumNous

This program is free software: you can redistribute it and/or modify
it under the terms of the GNU Affero General Public License as
published by the Free Software Foundation, either version 3 of the
License, or (at your option) any later version.

This program is distributed in the hope that it will be useful,
but WITHOUT ANY WARRANTY; without even the implied warranty of
MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
GNU Affero General Public License for more details.

You should have received a copy of the GNU Affero General Public License
along with this program. If not, see <https://www.gnu.org/licenses/>.

For commercial licensing, please contact support@quantumnous.com
*/

import { API } from '../helpers';

// ==================== 聊天历史API ====================

/**
 * 创建新话题
 * @param {Object} data - 话题数据
 * @param {string} data.title - 话题标题
 * @param {string} data.description - 话题描述（可选）
 * @param {string} data.model_name - 模型名称（可选）
 * @returns {Promise<Object>}
 */
export const createTopic = async (data) => {
  return await API.post('/api/chat/topics', data);
};

/**
 * 获取用户话题列表
 * @param {number} page - 页码
 * @param {number} perPage - 每页数量
 * @param {string} orderBy - 排序字段
 * @returns {Promise<Object>}
 */
export const getTopics = async (page = 1, perPage = 20, orderBy = 'last_message_at') => {
  return await API.get(`/api/chat/topics`, {
    params: { page, per_page: perPage, order_by: orderBy },
  });
};

/**
 * 获取话题详情
 * @param {number} topicId - 话题ID
 * @returns {Promise<Object>}
 */
export const getTopicDetail = async (topicId) => {
  return await API.get(`/api/chat/topics/${topicId}`);
};

/**
 * 获取话题下的消息列表
 * @param {number} topicId - 话题ID
 * @param {number} page - 页码
 * @param {number} perPage - 每页数量
 * @returns {Promise<Object>}
 */
export const getTopicMessages = async (topicId, page = 1, perPage = 50) => {
  return await API.get(`/api/chat/topics/${topicId}/messages`, {
    params: { page, per_page: perPage },
  });
};

/**
 * 更新话题
 * @param {number} topicId - 话题ID
 * @param {Object} data - 更新数据
 * @returns {Promise<Object>}
 */
export const updateTopic = async (topicId, data) => {
  return await API.put(`/api/chat/topics/${topicId}`, data);
};

/**
 * 删除话题
 * @param {number} topicId - 话题ID
 * @returns {Promise<Object>}
 */
export const deleteTopic = async (topicId) => {
  return await API.delete(`/api/chat/topics/${topicId}`);
};

/**
 * 搜索话题
 * @param {string} keyword - 搜索关键词
 * @param {number} page - 页码
 * @param {number} perPage - 每页数量
 * @returns {Promise<Object>}
 */
export const searchTopics = async (keyword, page = 1, perPage = 20) => {
  return await API.get(`/api/chat/topics/search`, {
    params: { keyword, page, per_page: perPage },
  });
};

/**
 * 获取用户话题统计
 * @returns {Promise<Object>}
 */
export const getTopicStats = async () => {
  return await API.get(`/api/chat/topics/stats`);
};

/**
 * 获取用户可用模型列表
 * @returns {Promise<string[]>}
 */
export const fetchUserModels = async () => {
  try {
    const res = await API.get('/api/user/models', { skipErrorHandler: true });
    if (res.data.success && res.data.data) {
      return res.data.data;
    }
    return [];
  } catch {
    return [];
  }
};

/**
 * 流式发送聊天消息（通过 relay 接口）
 * @param {Object} params
 * @param {string} params.model - 模型名称
 * @param {Array} params.messages - 消息列表 [{role, content}]
 * @param {function} params.onMessage - 收到文本块回调
 * @param {function} params.onReasoning - 收到推理内容回调
 * @param {function} params.onDone - 完成回调
 * @param {function} params.onError - 错误回调
 * @returns {Promise<void>}
 */
export const streamChatCompletion = async ({ model, messages, onMessage, onReasoning, onDone, onError }) => {
  try {
    const response = await fetch('/pg/chat/completions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model,
        messages,
        stream: true,
      }),
    });

    if (!response.ok) {
      const errText = await response.text().catch(() => '');
      onError?.(`HTTP ${response.status}: ${errText}`);
      return;
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let buffer = '';

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop() || '';

      for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed || !trimmed.startsWith('data: ')) continue;
        const data = trimmed.slice(6);
        if (data === '[DONE]') continue;

        try {
          const parsed = JSON.parse(data);
          const delta = parsed.choices?.[0]?.delta;
          if (delta?.reasoning_content) {
            onReasoning?.(delta.reasoning_content);
          }
          if (delta?.content) {
            onMessage?.(delta.content);
          }
        } catch {
          // 跳过解析失败的 chunk
        }
      }
    }

    // 处理 buffer 中剩余的数据
    const lastLine = buffer.trim();
    if (lastLine && lastLine.startsWith('data: ')) {
      const data = lastLine.slice(6);
      if (data !== '[DONE]') {
        try {
          const parsed = JSON.parse(data);
          const delta = parsed.choices?.[0]?.delta;
          if (delta?.reasoning_content) onReasoning?.(delta.reasoning_content);
          if (delta?.content) onMessage?.(delta.content);
        } catch {}
      }
    }

    onDone?.();
  } catch (err) {
    onError?.(err.message || '网络请求失败');
  }
};

// ==================== 敏感词规则API ====================

/**
 * 获取敏感词规则列表
 * @param {Object} params - 查询参数
 * @returns {Promise<Object>}
 */
export const getSensitiveRules = async (params = {}) => {
  return await API.get('/api/sensitive-rules', { params });
};

/**
 * 获取规则详情
 * @param {number} ruleId - 规则ID
 * @returns {Promise<Object>}
 */
export const getRuleDetail = async (ruleId) => {
  return await API.get(`/api/sensitive-rules/${ruleId}`);
};

/**
 * 创建规则
 * @param {Object} data - 规则数据
 * @returns {Promise<Object>}
 */
export const createRule = async (data) => {
  return await API.post('/api/sensitive-rules', data);
};

/**
 * 更新规则
 * @param {number} ruleId - 规则ID
 * @param {Object} data - 更新数据
 * @returns {Promise<Object>}
 */
export const updateRule = async (ruleId, data) => {
  return await API.put(`/api/sensitive-rules/${ruleId}`, data);
};

/**
 * 删除规则
 * @param {number} ruleId - 规则ID
 * @returns {Promise<Object>}
 */
export const deleteRule = async (ruleId) => {
  return await API.delete(`/api/sensitive-rules/${ruleId}`);
};

/**
 * 切换规则状态
 * @param {number} ruleId - 规则ID
 * @param {boolean} isEnabled - 是否启用
 * @returns {Promise<Object>}
 */
export const toggleRuleStatus = async (ruleId, isEnabled) => {
  return await API.post(`/api/sensitive-rules/${ruleId}/toggle`, { is_enabled: isEnabled });
};

/**
 * 重新加载规则
 * @returns {Promise<Object>}
 */
export const reloadRules = async () => {
  return await API.post('/api/sensitive-rules/reload');
};

/**
 * 获取规则统计
 * @returns {Promise<Object>}
 */
export const getRuleStatistics = async () => {
  return await API.get('/api/sensitive-rules/statistics');
};

// ==================== 敏感词日志API ====================

/**
 * 获取敏感词日志列表
 * @param {Object} params - 查询参数
 * @returns {Promise<Object>}
 */
export const getSensitiveLogs = async (params = {}) => {
  return await API.get('/api/sensitive-logs', { params });
};

/**
 * 获取日志详情
 * @param {number} logId - 日志ID
 * @returns {Promise<Object>}
 */
export const getLogDetail = async (logId) => {
  return await API.get(`/api/sensitive-logs/${logId}`);
};

/**
 * 获取个人历史
 * @param {number} page - 页码
 * @param {number} perPage - 每页数量
 * @returns {Promise<Object>}
 */
export const getMyHistory = async (page = 1, perPage = 20) => {
  return await API.get('/api/sensitive-logs/my-history', {
    params: { page, per_page: perPage },
  });
};

/**
 * 获取统计数据
 * @param {Object} params - 查询参数
 * @returns {Promise<Object>}
 */
export const getLogStatistics = async (params = {}) => {
  return await API.get('/api/sensitive-logs/statistics', { params });
};

/**
 * 清理旧日志
 * @param {number} days - 保留天数
 * @returns {Promise<Object>}
 */
export const cleanOldLogs = async (days) => {
  return await API.post('/api/sensitive-logs/clean', { days });
};

/**
 * 导出日志(CSV)
 * @param {Object} params - 筛选参数
 * @returns {Promise<Blob>}
 */
export const exportLogs = async (params = {}) => {
  return await API.get('/api/sensitive-logs/export', {
    params,
    responseType: 'blob',
  });
};

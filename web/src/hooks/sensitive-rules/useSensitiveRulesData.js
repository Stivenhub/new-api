/*
Copyright (C) 2025 QuantumNous
*/

import { useState, useEffect } from 'react';
import { 
  getSensitiveRules, 
  createRule, 
  updateRule, 
  deleteRule, 
  toggleRuleStatus,
  reloadRules,
  getRuleStatistics 
} from '../../services/chatAndSensitive';
import { showSuccess, showError } from '../../helpers';
import { useTranslation } from 'react-i18next';

export const useSensitiveRulesData = () => {
  const { t } = useTranslation();
  const [rules, setRules] = useState([]);
  const [activePage, setActivePage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [ruleCount, setRuleCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [filters, setFilters] = useState({
    ruleType: '',
    scope: '',
    isEnabled: null,
  });
  const [statistics, setStatistics] = useState(null);
  const [createModalVisible, setCreateModalVisible] = useState(false);
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [currentRule, setCurrentRule] = useState(null);

  // 加载规则列表
  const loadRules = async (page = activePage) => {
    setLoading(true);
    try {
      const params = {
        page,
        per_page: pageSize,
        ...filters,
      };
      
      const response = await getSensitiveRules(params);
      
      if (response.data.success) {
        setRules(response.data.data.rules || []);
        setRuleCount(response.data.data.total || 0);
        setActivePage(page);
      } else {
        showError(response.data.message || t('加载失败'));
      }
    } catch (error) {
      showError(error.message || t('网络错误'));
    } finally {
      setLoading(false);
    }
  };

  // 加载统计
  const loadStatistics = async () => {
    try {
      const response = await getRuleStatistics();
      if (response.data.success) {
        setStatistics(response.data.data);
      }
    } catch (error) {
      console.error('Failed to load statistics:', error);
    }
  };

  // 创建规则
  const handleCreateRule = async (data) => {
    try {
      const response = await createRule(data);
      if (response.data.success) {
        showSuccess(t('规则创建成功'));
        setCreateModalVisible(false);
        loadRules();
        loadStatistics();
      } else {
        showError(response.data.message || t('创建失败'));
      }
    } catch (error) {
      showError(error.message || t('网络错误'));
    }
  };

  // 更新规则
  const handleUpdateRule = async (ruleId, data) => {
    try {
      const response = await updateRule(ruleId, data);
      if (response.data.success) {
        showSuccess(t('规则更新成功'));
        setEditModalVisible(false);
        loadRules();
      } else {
        showError(response.data.message || t('更新失败'));
      }
    } catch (error) {
      showError(error.message || t('网络错误'));
    }
  };

  // 删除规则
  const handleDeleteRule = async (ruleId) => {
    try {
      const response = await deleteRule(ruleId);
      if (response.data.success) {
        showSuccess(t('删除成功'));
        loadRules();
        loadStatistics();
      } else {
        showError(response.data.message || t('删除失败'));
      }
    } catch (error) {
      showError(error.message || t('网络错误'));
    }
  };

  // 切换规则状态
  const handleToggleStatus = async (ruleId, isEnabled) => {
    try {
      const response = await toggleRuleStatus(ruleId, isEnabled);
      if (response.data.success) {
        showSuccess(isEnabled ? t('已启用') : t('已禁用'));
        loadRules();
      } else {
        showError(response.data.message || t('操作失败'));
      }
    } catch (error) {
      showError(error.message || t('网络错误'));
    }
  };

  // 重新加载规则
  const handleReloadRules = async () => {
    try {
      const response = await reloadRules();
      if (response.data.success) {
        showSuccess(t('规则重载成功'));
      } else {
        showError(response.data.message || t('重载失败'));
      }
    } catch (error) {
      showError(error.message || t('网络错误'));
    }
  };

  // 筛选
  const handleFilterChange = (newFilters) => {
    setFilters({ ...filters, ...newFilters });
    setActivePage(1);
    loadRules(1);
  };

  // 分页变化
  const handlePageChange = (page) => {
    loadRules(page);
  };

  const handlePageSizeChange = (size) => {
    setPageSize(size);
    setActivePage(1);
    loadRules(1);
  };

  // 打开编辑弹窗
  const handleEdit = (rule) => {
    setCurrentRule(rule);
    setEditModalVisible(true);
  };

  // 初始加载
  useEffect(() => {
    loadRules();
    loadStatistics();
  }, []);

  return {
    rules,
    activePage,
    pageSize,
    ruleCount,
    loading,
    filters,
    statistics,
    createModalVisible,
    editModalVisible,
    currentRule,
    t,
    loadRules,
    loadStatistics,
    handleCreateRule,
    handleUpdateRule,
    handleDeleteRule,
    handleToggleStatus,
    handleReloadRules,
    handleFilterChange,
    handlePageChange,
    handlePageSizeChange,
    handleEdit,
    setCreateModalVisible,
    setEditModalVisible,
    setCurrentRule,
  };
};

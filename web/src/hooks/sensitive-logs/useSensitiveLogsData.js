/*
Copyright (C) 2025 QuantumNous
*/

import { useState, useEffect, useCallback } from 'react';
import { 
  getSensitiveLogs, 
  getLogDetail,
  getMyHistory,
  getLogStatistics,
  cleanOldLogs,
  exportLogs
} from '../../services/chatAndSensitive';
import { showSuccess, showError } from '../../helpers';
import { useTranslation } from 'react-i18next';

export const useSensitiveLogsData = () => {
  const { t } = useTranslation();
  const [logs, setLogs] = useState([]);
  const [activePage, setActivePage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [logCount, setLogCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [filters, setFilters] = useState({
    action: '',
    source: '',
    startDate: null,
    endDate: null,
  });
  const [statistics, setStatistics] = useState(null);
  const [detailModalVisible, setDetailModalVisible] = useState(false);
  const [currentLog, setCurrentLog] = useState(null);

  // 加载日志列表
  const loadLogs = async (page = activePage) => {
    setLoading(true);
    try {
      const params = {
        page,
        per_page: pageSize,
        ...filters,
      };
      
      const response = await getSensitiveLogs(params);
      
      if (response.data.success) {
        setLogs(response.data.data.logs || []);
        setLogCount(response.data.data.total || 0);
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
      const response = await getLogStatistics(filters);
      if (response.data.success) {
        setStatistics(response.data.data);
      }
    } catch (error) {
      console.error('Failed to load statistics:', error);
    }
  };

  // 关闭详情弹窗
  const handleCloseDetailModal = useCallback(() => {
    setDetailModalVisible(false);
    setCurrentLog(null);
  }, []);

  // 查看日志详情
  const handleViewDetail = useCallback(async (record) => {
    // 立即用表格已有数据显示弹窗
    setCurrentLog(record);
    setDetailModalVisible(true);

    // 后台异步拉取完整详情
    try {
      const response = await getLogDetail(record.id);
      if (response.data.success) {
        setCurrentLog(response.data.data);
      }
    } catch (error) {
      // 静默处理，表格数据已足够展示
    }
  }, []);

  // 清理旧日志
  const handleCleanOldLogs = useCallback(async (days) => {
    if (!window.confirm(t(`确定要清理${days}天前的日志吗?`))) {
      return;
    }

    try {
      const response = await cleanOldLogs(days);
      if (response.data.success) {
        showSuccess(t('清理成功'));
        loadLogs();
        loadStatistics();
      } else {
        showError(response.data.message || t('清理失败'));
      }
    } catch (error) {
      showError(error.message || t('网络错误'));
    }
  }, []);

  // 导出日志
  const handleExportLogs = useCallback(async () => {
    try {
      const response = await exportLogs(filters);
      
      // 创建下载链接
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `sensitive_logs_${Date.now()}.csv`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      
      showSuccess(t('导出成功'));
    } catch (error) {
      showError(error.message || t('导出失败'));
    }
  }, []);

  // 筛选
  const handleFilterChange = useCallback((newFilters) => {
    setFilters({ ...filters, ...newFilters });
    setActivePage(1);
    loadLogs(1);
    loadStatistics();
  }, [filters, loadLogs, loadStatistics]);

  // 分页变化
  const handlePageChange = useCallback((page) => {
    loadLogs(page);
  }, [loadLogs]);

  const handlePageSizeChange = useCallback((size) => {
    setPageSize(size);
    setActivePage(1);
    loadLogs(1);
  }, [loadLogs]);

  // 初始加载
  useEffect(() => {
    loadLogs();
    loadStatistics();
  }, []);

  return {
    logs,
    activePage,
    pageSize,
    logCount,
    loading,
    filters,
    statistics,
    detailModalVisible,
    currentLog,
    t,
    loadLogs,
    loadStatistics,
    handleViewDetail,
    handleCleanOldLogs,
    handleExportLogs,
    handleFilterChange,
    handlePageChange,
    handlePageSizeChange,
    setDetailModalVisible,
    handleCloseDetailModal,
  };
};

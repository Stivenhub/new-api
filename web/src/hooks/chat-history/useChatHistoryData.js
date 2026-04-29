/*
Copyright (C) 2025 QuantumNous
*/

import { useState, useEffect } from 'react';
import { getTopics, deleteTopic, searchTopics, getTopicStats } from '../../services/chatAndSensitive';
import { showSuccess, showError } from '../../helpers';
import { useTranslation } from 'react-i18next';

export const useChatHistoryData = () => {
  const { t } = useTranslation();
  const [topics, setTopics] = useState([]);
  const [activePage, setActivePage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [topicCount, setTopicCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [searchKeyword, setSearchKeyword] = useState('');
  const [orderBy, setOrderBy] = useState('last_message_at');
  const [stats, setStats] = useState(null);
  const [detailModalVisible, setDetailModalVisible] = useState(false);
  const [currentTopic, setCurrentTopic] = useState(null);

  const loadTopics = async (page = activePage) => {
    setLoading(true);
    try {
      let response;
      if (searchKeyword) {
        response = await searchTopics(searchKeyword, page, pageSize);
      } else {
        response = await getTopics(page, pageSize, orderBy);
      }
      
      if (response.data.success) {
        setTopics(response.data.data.topics || []);
        setTopicCount(response.data.data.total || 0);
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

  const loadStats = async () => {
    try {
      const response = await getTopicStats();
      if (response.data.success) {
        setStats(response.data.data);
      }
    } catch (error) {
      console.error('Failed to load stats:', error);
    }
  };

  const handleDeleteTopic = async (topicId) => {
    try {
      const response = await deleteTopic(topicId);
      if (response.data.success) {
        showSuccess(t('删除成功'));
        loadTopics();
        loadStats();
      } else {
        showError(response.data.message || t('删除失败'));
      }
    } catch (error) {
      showError(error.message || t('网络错误'));
    }
  };

  const handleSearch = (keyword) => {
    setSearchKeyword(keyword);
    setActivePage(1);
    loadTopics(1);
  };

  const handleViewDetail = (topic) => {
    setCurrentTopic(topic);
    setDetailModalVisible(true);
  };

  const handlePageChange = (page) => {
    loadTopics(page);
  };

  const handlePageSizeChange = (size) => {
    setPageSize(size);
    setActivePage(1);
    loadTopics(1);
  };

  useEffect(() => {
    loadTopics();
    loadStats();
  }, []);

  return {
    topics,
    activePage,
    pageSize,
    topicCount,
    loading,
    searchKeyword,
    orderBy,
    stats,
    detailModalVisible,
    currentTopic,
    t,
    loadTopics,
    loadStats,
    handleDeleteTopic,
    handleSearch,
    handleViewDetail,
    handlePageChange,
    handlePageSizeChange,
    setOrderBy,
    setDetailModalVisible,
    setCurrentTopic,
  };
};

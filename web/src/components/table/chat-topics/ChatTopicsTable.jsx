/*
Copyright (C) 2025 QuantumNous
*/

import React from 'react';
import { Table, Empty } from '@douyinfe/semi-ui';
import { getChatTopicsColumns } from './ChatTopicsColumnDefs';
import { useIsMobile } from '../../../hooks/common/useIsMobile';

const ChatTopicsTable = ({ 
  topics, 
  loading, 
  activePage, 
  pageSize,
  t,
  handleDeleteTopic,
  handleViewDetail
}) => {
  const isMobile = useIsMobile();

  const columns = getChatTopicsColumns(t, handleViewDetail, handleDeleteTopic);

  if (!topics || topics.length === 0) {
    return (
      <Empty
        title={t('暂无话题')}
        description={t('开始对话后会自动创建话题')}
      />
    );
  }

  return (
    <Table
      columns={columns}
      dataSource={topics}
      rowKey='id'
      loading={loading}
      pagination={false}
      scroll={{ x: isMobile ? 800 : undefined }}
      size='middle'
    />
  );
};

export default ChatTopicsTable;

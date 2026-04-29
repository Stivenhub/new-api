/*
Copyright (C) 2025 QuantumNous
*/

import React, { useMemo } from 'react';
import { Table, Empty, Button } from '@douyinfe/semi-ui';
import getSensitiveLogsColumns from './SensitiveLogsColumnDefs';
import { useIsMobile } from '../../../hooks/common/useIsMobile';

const SensitiveLogsTable = ({ 
  logs, 
  loading, 
  t,
  handleViewDetail,
  handleExportLogs,
  handleCleanOldLogs,
}) => {
  const isMobile = useIsMobile();

  const columns = useMemo(() => getSensitiveLogsColumns(t, handleViewDetail), [t, handleViewDetail]);

  if (!logs || logs.length === 0) {
    return (
      <Empty
        title={t('暂无日志')}
        description={t('没有敏感词触发记录')}
      />
    );
  }

  return (
    <>
      <div className='mb-2 flex justify-end gap-2'>
        <Button 
          onClick={handleExportLogs}
        >
          {t('导出CSV')}
        </Button>
        <Button 
          onClick={() => handleCleanOldLogs(30)}
          type='danger'
          theme='light'
        >
          {t('清理30天前日志')}
        </Button>
      </div>
      <Table
        columns={columns}
        dataSource={logs}
        rowKey='id'
        loading={loading}
        pagination={false}
        scroll={{ x: isMobile ? 1200 : undefined }}
        size='middle'
      />
    </>
  );
};

export default SensitiveLogsTable;

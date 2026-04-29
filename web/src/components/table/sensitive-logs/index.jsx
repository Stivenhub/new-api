/*
Copyright (C) 2025 QuantumNous
*/

import React from 'react';
import CardPro from '../../common/ui/CardPro';
import SensitiveLogsTable from './SensitiveLogsTable';
import SensitiveLogDetailModal from './SensitiveLogDetailModal';
import { useSensitiveLogsData } from '../../../hooks/sensitive-logs/useSensitiveLogsData';
import { useIsMobile } from '../../../hooks/common/useIsMobile';
import { createCardProPagination } from '../../../helpers/utils';

const SensitiveLogsPage = () => {
  const logsData = useSensitiveLogsData();
  const isMobile = useIsMobile();

  return (
    <CardPro
      type='type2'
      title={logsData.t('敏感词日志')}
      paginationArea={createCardProPagination({
        currentPage: logsData.activePage,
        pageSize: logsData.pageSize,
        total: logsData.logCount,
        onPageChange: logsData.handlePageChange,
        onPageSizeChange: logsData.handlePageSizeChange,
        isMobile: isMobile,
        t: logsData.t,
      })}
      t={logsData.t}
    >
      <SensitiveLogsTable {...logsData} />
      <SensitiveLogDetailModal
        visible={logsData.detailModalVisible}
        log={logsData.currentLog}
        onCancel={() => { logsData.setDetailModalVisible(false); }}
      />
    </CardPro>
  );
};

export default SensitiveLogsPage;

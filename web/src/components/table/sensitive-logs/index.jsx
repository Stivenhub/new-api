/*
Copyright (C) 2025 QuantumNous
*/

import React, { useMemo, useCallback } from 'react';
import CardPro from '../../common/ui/CardPro';
import SensitiveLogsTable from './SensitiveLogsTable';
import SensitiveLogDetailModal from './modals/SensitiveLogDetailModal';
import { useSensitiveLogsData } from '../../../hooks/sensitive-logs/useSensitiveLogsData';
import { useIsMobile } from '../../../hooks/common/useIsMobile';
import { createCardProPagination } from '../../../helpers/utils';

const SensitiveLogsPage = () => {
  const logsData = useSensitiveLogsData();
  const isMobile = useIsMobile();

  const paginationArea = useMemo(() => createCardProPagination({
    currentPage: logsData.activePage,
    pageSize: logsData.pageSize,
    total: logsData.logCount,
    onPageChange: logsData.handlePageChange,
    onPageSizeChange: logsData.handlePageSizeChange,
    isMobile: isMobile,
    t: logsData.t,
  }), [
    logsData.activePage,
    logsData.pageSize,
    logsData.logCount,
    logsData.handlePageChange,
    logsData.handlePageSizeChange,
    logsData.t,
    isMobile,
  ]);

  const handleCancelModal = useCallback(() => {
    logsData.handleCloseDetailModal();
  }, [logsData.handleCloseDetailModal]);

  return (
    <CardPro
      type='type2'
      title={logsData.t('敏感词日志')}
      paginationArea={paginationArea}
      t={logsData.t}
    >
      <SensitiveLogsTable {...logsData} />
      <SensitiveLogDetailModal
        visible={logsData.detailModalVisible}
        log={logsData.currentLog}
        onCancel={handleCancelModal}
      />
    </CardPro>
  );
};

export default SensitiveLogsPage;

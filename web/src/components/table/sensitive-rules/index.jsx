/*
Copyright (C) 2025 QuantumNous
*/

import React from 'react';
import CardPro from '../../common/ui/CardPro';
import SensitiveRulesTable from './SensitiveRulesTable';
import { useSensitiveRulesData } from '../../../hooks/sensitive-rules/useSensitiveRulesData';
import { useIsMobile } from '../../../hooks/common/useIsMobile';
import { createCardProPagination } from '../../../helpers/utils';
import CreateSensitiveRuleModal from './modals/CreateSensitiveRuleModal';
import EditSensitiveRuleModal from './modals/EditSensitiveRuleModal';

const SensitiveRulesPage = () => {
  const rulesData = useSensitiveRulesData();
  const isMobile = useIsMobile();

  return (
    <CardPro
      type='type2'
      title={rulesData.t('敏感词规则')}
      paginationArea={createCardProPagination({
        currentPage: rulesData.activePage,
        pageSize: rulesData.pageSize,
        total: rulesData.ruleCount,
        onPageChange: rulesData.handlePageChange,
        onPageSizeChange: rulesData.handlePageSizeChange,
        isMobile: isMobile,
        t: rulesData.t,
      })}
      t={rulesData.t}
    >
      <SensitiveRulesTable {...rulesData} />
      <CreateSensitiveRuleModal
        visible={rulesData.createModalVisible}
        onCancel={() => rulesData.setCreateModalVisible(false)}
        onSubmit={rulesData.handleCreateRule}
      />
      <EditSensitiveRuleModal
        visible={rulesData.editModalVisible}
        onCancel={() => { rulesData.setEditModalVisible(false); rulesData.setCurrentRule(null); }}
        onSubmit={rulesData.handleUpdateRule}
        rule={rulesData.currentRule}
      />
    </CardPro>
  );
};

export default SensitiveRulesPage;

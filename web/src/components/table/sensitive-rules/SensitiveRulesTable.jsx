/*
Copyright (C) 2025 QuantumNous
*/

import React from 'react';
import { Table, Empty, Button } from '@douyinfe/semi-ui';
import { IconPlus, IconRefresh } from '@douyinfe/semi-icons';
import getSensitiveRulesColumns from './SensitiveRulesColumnDefs';
import { useIsMobile } from '../../../hooks/common/useIsMobile';

const SensitiveRulesTable = ({ 
  rules, 
  loading, 
  t,
  handleEdit,
  handleDeleteRule,
  handleToggleStatus,
  handleReloadRules,
  setCreateModalVisible,
}) => {
  const isMobile = useIsMobile();

  const columns = getSensitiveRulesColumns(t, handleEdit, handleDeleteRule, handleToggleStatus);

  if (!rules || rules.length === 0) {
    return (
      <Empty
        title={t('暂无规则')}
        description={
          <Button 
            icon={<IconPlus />} 
            onClick={() => setCreateModalVisible(true)}
          >
            {t('创建规则')}
          </Button>
        }
      />
    );
  }

  return (
    <>
      <div className='mb-2 flex justify-between'>
        <Button 
          icon={<IconPlus />} 
          onClick={() => setCreateModalVisible(true)}
          type='primary'
        >
          {t('创建规则')}
        </Button>
        <Button 
          icon={<IconRefresh />} 
          onClick={handleReloadRules}
          loading={loading}
        >
          {t('重新加载规则')}
        </Button>
      </div>
      <Table
        columns={columns}
        dataSource={rules}
        rowKey='id'
        loading={loading}
        pagination={false}
        scroll={{ x: isMobile ? 1000 : undefined }}
        size='middle'
      />
    </>
  );
};

export default SensitiveRulesTable;

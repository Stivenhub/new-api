/*
Copyright (C) 2025 QuantumNous
*/

import React from 'react';
import { Table, Tag, Button } from '@douyinfe/semi-ui';

const getSensitiveLogsColumns = (t, onViewDetail) => {
  return [
    {
      title: t('ID'),
      dataIndex: 'id',
      width: 80,
    },
    {
      title: t('用户名'),
      dataIndex: 'username',
      width: 120,
    },
    {
      title: t('规则名称'),
      dataIndex: 'rule_name',
      width: 150,
      ellipsis: true,
    },
    {
      title: t('动作'),
      dataIndex: 'action',
      width: 100,
      render: (action) => {
        const actionMap = {
          block: { text: t('拦截'), color: 'red' },
          replace: { text: t('替换'), color: 'orange' },
          warn: { text: t('警告'), color: 'yellow' },
          mask: { text: t('脱敏'), color: 'blue' },
        };
        const config = actionMap[action] || { text: action, color: 'grey' };
        return <Tag color={config.color}>{config.text}</Tag>;
      },
    },
    {
      title: t('模型'),
      dataIndex: 'model_name',
      width: 120,
    },
    {
      title: t('来源'),
      dataIndex: 'source',
      width: 100,
    },
    {
      title: t('IP地址'),
      dataIndex: 'ip',
      width: 140,
    },
    {
      title: t('时间'),
      dataIndex: 'created_at',
      width: 180,
      render: (timestamp) => {
        return new Date(timestamp * 1000).toLocaleString();
      },
    },
    {
      title: t('操作'),
      dataIndex: 'actions',
      width: 100,
      fixed: 'right',
      render: (_, record) => (
        <Button
          theme='light'
          onClick={() => onViewDetail(record.id)}
          size='small'
        >
          {t('详情')}
        </Button>
      ),
    },
  ];
};

export default getSensitiveLogsColumns;

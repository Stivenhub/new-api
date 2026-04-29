/*
Copyright (C) 2025 QuantumNous
*/

import React from 'react';
import { Table, Tag, Button, Switch, Popconfirm } from '@douyinfe/semi-ui';
import { IconEdit, IconDelete, IconRefresh } from '@douyinfe/semi-icons';

const getSensitiveRulesColumns = (t, onEdit, onDelete, onToggle) => {
  return [
    {
      title: t('ID'),
      dataIndex: 'id',
      width: 80,
    },
    {
      title: t('规则名称'),
      dataIndex: 'name',
      width: 150,
      ellipsis: true,
    },
    {
      title: t('规则类型'),
      dataIndex: 'rule_type',
      width: 100,
      render: (type) => {
        const typeMap = {
          keyword: { text: t('关键词'), color: 'blue' },
          regex: { text: t('正则表达式'), color: 'orange' },
          pattern: { text: t('模式'), color: 'purple' },
        };
        const config = typeMap[type] || { text: type, color: 'grey' };
        return <Tag color={config.color}>{config.text}</Tag>;
      },
    },
    {
      title: t('作用域'),
      dataIndex: 'scope',
      width: 100,
      render: (scope) => {
        const scopeMap = {
          global: { text: t('全局'), color: 'red' },
          user: { text: t('用户'), color: 'green' },
          group: { text: t('分组'), color: 'cyan' },
        };
        const config = scopeMap[scope] || { text: scope, color: 'grey' };
        return <Tag color={config.color}>{config.text}</Tag>;
      },
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
      title: t('命中次数'),
      dataIndex: 'hit_count',
      width: 100,
    },
    {
      title: t('状态'),
      dataIndex: 'is_enabled',
      width: 100,
      render: (isEnabled, record) => (
        <Switch
          checked={isEnabled}
          onChange={(checked) => onToggle(record.id, checked)}
        />
      ),
    },
    {
      title: t('操作'),
      dataIndex: 'actions',
      width: 150,
      fixed: 'right',
      render: (_, record) => (
        <div className='flex gap-2'>
          <Button
            theme='light'
            icon={<IconEdit />}
            onClick={() => onEdit(record)}
            size='small'
          >
            {t('编辑')}
          </Button>
          <Popconfirm
            title={t('确定要删除这条规则吗?')}
            content={t('删除后无法恢复')}
            onConfirm={() => onDelete(record.id)}
          >
            <Button 
              theme='light' 
              type='danger' 
              icon={<IconDelete />}
              size='small'
            >
              {t('删除')}
            </Button>
          </Popconfirm>
        </div>
      ),
    },
  ];
};

export default getSensitiveRulesColumns;

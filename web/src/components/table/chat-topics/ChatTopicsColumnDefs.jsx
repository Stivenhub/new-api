/*
Copyright (C) 2025 QuantumNous
*/

import React from 'react';
import { Button, Popconfirm } from '@douyinfe/semi-ui';
import { IconDelete } from '@douyinfe/semi-icons';

export const getChatTopicsColumns = (t, onViewMessages, onDeleteTopic) => {
  return [
    {
      title: t('ID'),
      dataIndex: 'id',
      width: 80,
    },
    {
      title: t('标题'),
      dataIndex: 'title',
      width: 200,
      ellipsis: true,
    },
    {
      title: t('模型'),
      dataIndex: 'model_name',
      width: 120,
    },
    {
      title: t('消息数'),
      dataIndex: 'message_count',
      width: 100,
    },
    {
      title: t('最后消息时间'),
      dataIndex: 'last_message_at',
      width: 180,
      render: (timestamp) => {
        if (!timestamp) return '-';
        return new Date(timestamp * 1000).toLocaleString();
      },
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
            onClick={() => onViewMessages(record)}
            size='small'
          >
            {t('查看')}
          </Button>
          <Popconfirm
            title={t('确定要删除这个话题吗?')}
            content={t('删除后无法恢复')}
            onConfirm={() => onDeleteTopic(record.id)}
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

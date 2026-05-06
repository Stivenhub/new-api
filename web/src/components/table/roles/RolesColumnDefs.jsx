import React from 'react';
import {
  Button,
  Space,
  Tag,
} from '@douyinfe/semi-ui';

/**
 * Render status tag
 */
const renderStatus = (status, t) => {
  if (status === 1) {
    return (
      <Tag color='green' shape='circle' size='small'>
        {t('启用')}
      </Tag>
    );
  }
  return (
    <Tag color='red' shape='circle' size='small'>
      {t('禁用')}
    </Tag>
  );
};

/**
 * Render operations column
 */
const renderOperations = (
  text,
  record,
  {
    setEditingItem,
    setShowEdit,
    showDeleteModal,
    openMembers,
    t,
  },
) => {
  return (
    <Space>
      <Button
        type='tertiary'
        size='small'
        onClick={() => {
          setEditingItem(record);
          setShowEdit(true);
        }}
      >
        {t('编辑')}
      </Button>
      <Button
        type='tertiary'
        size='small'
        onClick={() => openMembers(record)}
      >
        {t('成员')}
      </Button>
      <Button
        type='danger'
        size='small'
        onClick={() => showDeleteModal(record)}
      >
        {t('删除')}
      </Button>
    </Space>
  );
};

/**
 * Get roles table column definitions
 */
export const getRolesColumns = ({
  t,
  setEditingItem,
  setShowEdit,
  showDeleteModal,
  openMembers,
}) => {
  return [
    {
      title: 'ID',
      dataIndex: 'id',
      width: 80,
    },
    {
      title: t('名称'),
      dataIndex: 'name',
      width: 150,
    },
    {
      title: t('编码'),
      dataIndex: 'code',
      width: 120,
    },
    {
      title: t('描述'),
      dataIndex: 'description',
      width: 200,
      ellipsis: true,
    },
    {
      title: t('状态'),
      dataIndex: 'status',
      width: 80,
      render: (text, record) => renderStatus(text, t),
    },
    {
      title: '',
      dataIndex: 'operate',
      fixed: 'right',
      width: 220,
      render: (text, record, index) =>
        renderOperations(text, record, {
          setEditingItem,
          setShowEdit,
          showDeleteModal,
          openMembers,
          t,
        }),
    },
  ];
};

import React from 'react';
import { Tag, Button, Space } from '@douyinfe/semi-ui';
import { timestamp2string } from '../../../helpers';

const renderTimestamp = (timestamp) => {
  return <>{timestamp2string(timestamp)}</>;
};

const renderStatus = (status, t) => {
  if (status === 1) {
    return (
      <Tag color='green' shape='circle'>
        {t('启用')}
      </Tag>
    );
  }
  return (
    <Tag color='grey' shape='circle'>
      {t('禁用')}
    </Tag>
  );
};

export const getOrganizationsColumns = ({
  t,
  setEditingOrg,
  setShowEdit,
  showDeleteOrganizationModal,
  showMembersModal,
}) => {
  return [
    {
      title: t('ID'),
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
      render: (text) => {
        return <>{text || '-'}</>;
      },
    },
    {
      title: t('状态'),
      dataIndex: 'status',
      width: 80,
      render: (text, record) => {
        return <div>{renderStatus(text, t)}</div>;
      },
    },
    {
      title: t('创建时间'),
      dataIndex: 'created_time',
      width: 160,
      render: (text) => {
        return <div>{text ? renderTimestamp(text) : '-'}</div>;
      },
    },
    {
      title: t('更新时间'),
      dataIndex: 'updated_time',
      width: 160,
      render: (text) => {
        return <div>{text ? renderTimestamp(text) : '-'}</div>;
      },
    },
    {
      title: t('操作'),
      dataIndex: 'operate',
      fixed: 'right',
      width: 220,
      render: (text, record) => {
        return (
          <Space>
            <Button
              type='tertiary'
              size='small'
              onClick={() => {
                showMembersModal(record);
              }}
            >
              {t('成员')}
            </Button>
            <Button
              size='small'
              onClick={() => {
                setEditingOrg(record);
                setShowEdit(true);
              }}
            >
              {t('编辑')}
            </Button>
            <Button
              type='danger'
              size='small'
              onClick={() => {
                showDeleteOrganizationModal(record);
              }}
            >
              {t('删除')}
            </Button>
          </Space>
        );
      },
    },
  ];
};

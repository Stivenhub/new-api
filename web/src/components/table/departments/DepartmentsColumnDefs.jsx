import React from 'react';
import { Tag, Button, Space, Dropdown } from '@douyinfe/semi-ui';
import { IconMore } from '@douyinfe/semi-icons';
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
    <Tag color='red' shape='circle'>
      {t('禁用')}
    </Tag>
  );
};

export const getDepartmentsColumns = ({
  t,
  setEditingDepartment,
  setShowEditDepartment,
  showDeleteDepartmentModal,
  showMembersModal,
  orgMap,
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
      title: t('所属组织'),
      dataIndex: 'organization_id',
      width: 120,
      render: (text) => {
        return <div>{orgMap[text] || text}</div>;
      },
    },
    {
      title: t('上级部门ID'),
      dataIndex: 'parent_id',
      width: 100,
      render: (text) => {
        return <div>{text === 0 || text === '0' ? t('根部门') : text}</div>;
      },
    },
    {
      title: t('描述'),
      dataIndex: 'description',
      width: 150,
      ellipsis: true,
      render: (text) => {
        return <div>{text || '-'}</div>;
      },
    },
    {
      title: t('排序'),
      dataIndex: 'sort',
      width: 80,
    },
    {
      title: t('状态'),
      dataIndex: 'status',
      width: 80,
      render: (text) => {
        return <div>{renderStatus(text, t)}</div>;
      },
    },
    {
      title: t('创建时间'),
      dataIndex: 'created_time',
      width: 160,
      render: (text) => {
        return <div>{renderTimestamp(text)}</div>;
      },
    },
    {
      title: '',
      dataIndex: 'operate',
      fixed: 'right',
      width: 220,
      render: (text, record) => {
        const moreMenuItems = [
          {
            node: 'item',
            name: t('删除'),
            type: 'danger',
            onClick: () => {
              showDeleteDepartmentModal(record);
            },
          },
        ];

        return (
          <Space>
            <Button
              size='small'
              onClick={() => {
                setEditingDepartment(record);
                setShowEditDepartment(true);
              }}
            >
              {t('编辑')}
            </Button>
            <Button
              type='tertiary'
              size='small'
              onClick={() => {
                showMembersModal(record);
              }}
            >
              {t('成员')}
            </Button>
            <Dropdown
              trigger='click'
              position='bottomRight'
              menu={moreMenuItems}
            >
              <Button type='tertiary' size='small' icon={<IconMore />} />
            </Dropdown>
          </Space>
        );
      },
    },
  ];
};

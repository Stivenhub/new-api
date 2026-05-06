import React, { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import {
  API,
  showError,
  showSuccess,
} from '../../../../helpers';
import {
  Button,
  SideSheet,
  Space,
  Spin,
  Typography,
  Table,
  Form,
  Tag,
  Avatar,
} from '@douyinfe/semi-ui';
import { IconUser, IconClose, IconPlus } from '@douyinfe/semi-icons';

const { Text, Title } = Typography;

const DepartmentMembersModal = (props) => {
  const { t } = useTranslation();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [addingUsers, setAddingUsers] = useState(false);
  const [userIdsInput, setUserIdsInput] = useState('');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [total, setTotal] = useState(0);

  const loadUsers = async (p = 1, ps = 10) => {
    if (!props.record) return;
    setLoading(true);
    const res = await API.get(`/api/department/${props.record.id}/users?p=${p - 1}&page_size=${ps}`);
    const { success, message, data } = res.data;
    if (success) {
      setUsers(data.items || []);
      setTotal(data.total || 0);
      setPage(data.page || 1);
    } else {
      showError(message);
    }
    setLoading(false);
  };

  useEffect(() => {
    if (props.visible && props.record) {
      loadUsers(1, pageSize);
    }
  }, [props.visible, props.record]);

  const handleAddUsers = async () => {
    if (!userIdsInput.trim()) return;
    const ids = userIdsInput
      .split(',')
      .map((id) => parseInt(id.trim()))
      .filter((id) => !isNaN(id) && id > 0);
    if (ids.length === 0) {
      showError(t('请输入有效的用户ID'));
      return;
    }
    setAddingUsers(true);
    const res = await API.post(`/api/department/${props.record.id}/users`, {
      user_ids: ids,
    });
    const { success, message } = res.data;
    if (success) {
      showSuccess(t('添加成功！'));
      setUserIdsInput('');
      loadUsers(1, pageSize);
    } else {
      showError(message);
    }
    setAddingUsers(false);
  };

  const handleRemoveUser = async (userId) => {
    const res = await API.delete(`/api/department/${props.record.id}/users`, {
      data: { user_ids: [userId] },
    });
    const { success, message } = res.data;
    if (success) {
      showSuccess(t('移除成功！'));
      loadUsers(page, pageSize);
    } else {
      showError(message);
    }
  };

  const columns = [
    {
      title: t('ID'),
      dataIndex: 'id',
      width: 80,
    },
    {
      title: t('用户名'),
      dataIndex: 'username',
      width: 150,
    },
    {
      title: t('邮箱'),
      dataIndex: 'email',
      width: 200,
      render: (text) => text || '-',
    },
    {
      title: t('状态'),
      dataIndex: 'status',
      width: 80,
      render: (text) => (
        <Tag color={text === 1 ? 'green' : 'red'} shape='circle'>
          {text === 1 ? t('启用') : t('禁用')}
        </Tag>
      ),
    },
    {
      title: '',
      dataIndex: 'operate',
      width: 80,
      render: (text, record) => (
        <Button
          type='danger'
          size='small'
          onClick={() => handleRemoveUser(record.id)}
        >
          {t('移除')}
        </Button>
      ),
    },
  ];

  const handlePageChange = (newPage) => {
    loadUsers(newPage, pageSize);
  };

  const handlePageSizeChange = (newSize) => {
    setPageSize(newSize);
    loadUsers(1, newSize);
  };

  return (
    <SideSheet
      placement='right'
      title={
        <Space>
          <Avatar size='small' color='blue' className='mr-2'>
            <IconUser size={16} />
          </Avatar>
          <Title heading={4} className='m-0'>
            {t('部门成员')}
            {props.record && (
              <Text className='text-gray-500 ml-2' size='normal'>
                - {props.record.name}
              </Text>
            )}
          </Title>
        </Space>
      }
      bodyStyle={{ padding: '16px' }}
      visible={props.visible}
      width={700}
      closeIcon={null}
      onCancel={props.onCancel}
    >
      <Spin spinning={loading}>
        <div className='space-y-4'>
          {/* Add user section */}
          <div className='p-3 bg-gray-50 rounded-lg'>
            <Text strong className='block mb-2'>
              {t('添加用户')}
            </Text>
            <div className='flex gap-2'>
              <Form.Input
                value={userIdsInput}
                onChange={setUserIdsInput}
                placeholder={t('输入用户ID，多个用逗号分隔')}
                className='flex-1'
                size='small'
              />
              <Button
                type='primary'
                icon={<IconPlus />}
                loading={addingUsers}
                onClick={handleAddUsers}
                size='small'
              >
                {t('添加')}
              </Button>
            </div>
          </div>

          {/* Members table */}
          <Table
            columns={columns}
            dataSource={users.map((u) => ({ ...u, key: u.id }))}
            pagination={{
              currentPage: page,
              pageSize: pageSize,
              total: total,
              showSizeChanger: true,
              pageSizeOptions: [10, 20, 50],
              onPageSizeChange: handlePageSizeChange,
              onPageChange: handlePageChange,
            }}
            size='small'
            className='rounded-xl'
          />
        </div>
      </Spin>
    </SideSheet>
  );
};

export default DepartmentMembersModal;

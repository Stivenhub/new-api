import React, { useEffect, useState, useCallback } from 'react';
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
  Tag,
  Form,
  Select,
} from '@douyinfe/semi-ui';

const { Text, Title } = Typography;

const OrganizationMembersModal = (props) => {
  const { t } = useTranslation();
  const { visible, onCancel, record } = props;

  const [loading, setLoading] = useState(false);
  const [members, setMembers] = useState([]);
  const [totalCount, setTotalCount] = useState(0);
  const [activePage, setActivePage] = useState(1);
  const [allUsers, setAllUsers] = useState([]);
  const [selectedUserIds, setSelectedUserIds] = useState([]);
  const [addingUsers, setAddingUsers] = useState(false);

  const pageSize = 10;

  const loadMembers = useCallback(
    async (page = 1) => {
      if (!record?.id) return;
      setLoading(true);
      try {
        const res = await API.get(
          `/api/organization/${record.id}/users?p=${page}&page_size=${pageSize}`,
        );
        const { success, message, data } = res.data;
        if (success) {
          setMembers(data.items || []);
          setTotalCount(data.total || 0);
          setActivePage(data.page || 1);
        } else {
          showError(message);
        }
      } catch (error) {
        showError(error.message);
      }
      setLoading(false);
    },
    [record?.id],
  );

  const loadAllUsers = useCallback(async () => {
    try {
      const res = await API.get('/api/user/?p=0&page_size=10000');
      const { success, data } = res.data;
      if (success) {
        setAllUsers(data.items || []);
      }
    } catch (error) {
      // ignore
    }
  }, []);

  useEffect(() => {
    if (visible && record?.id) {
      loadMembers(1);
      loadAllUsers();
    }
  }, [visible, record?.id, loadMembers, loadAllUsers]);

  const handlePageChange = (page) => {
    loadMembers(page);
  };

  const handleAddUsers = async () => {
    if (selectedUserIds.length === 0) {
      showError(t('请选择要添加的用户'));
      return;
    }
    setAddingUsers(true);
    try {
      const res = await API.post(`/api/organization/${record.id}/users`, {
        user_ids: selectedUserIds,
      });
      const { success, message } = res.data;
      if (success) {
        showSuccess(t('用户添加成功！'));
        setSelectedUserIds([]);
        loadMembers(1);
      } else {
        showError(message);
      }
    } catch (error) {
      showError(error.message);
    }
    setAddingUsers(false);
  };

  const handleRemoveUser = async (userId) => {
    try {
      const res = await API.delete(`/api/organization/${record.id}/users`, {
        data: { user_ids: [userId] },
      });
      const { success, message } = res.data;
      if (success) {
        showSuccess(t('用户移除成功！'));
        loadMembers(activePage);
      } else {
        showError(message);
      }
    } catch (error) {
      showError(error.message);
    }
  };

  const memberColumns = [
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
      ellipsis: true,
    },
    {
      title: t('操作'),
      dataIndex: 'operate',
      width: 100,
      render: (text, userRecord) => {
        return (
          <Button
            type='danger'
            size='small'
            onClick={() => handleRemoveUser(userRecord.id)}
          >
            {t('移除')}
          </Button>
        );
      },
    },
  ];

  const existingMemberIds = new Set(members.map((m) => m.id));
  const availableUsers = allUsers.filter((u) => !existingMemberIds.has(u.id));

  return (
    <SideSheet
      placement='right'
      title={
        <Space>
          <Tag color='blue' shape='circle'>
            {t('成员')}
          </Tag>
          <Title heading={4} className='m-0'>
            {record?.name ? t('{{name}} - 成员管理', { name: record.name }) : t('成员管理')}
          </Title>
        </Space>
      }
      bodyStyle={{ padding: '16px' }}
      visible={visible}
      width={700}
      onCancel={onCancel}
    >
      <div className='flex flex-col gap-4'>
        {/* Add user section */}
        <div className='flex flex-col gap-2 p-4 bg-gray-50 rounded-lg'>
          <Text strong>{t('添加用户')}</Text>
          <div className='flex items-center gap-2'>
            <Select
              multiple
              placeholder={t('选择用户')}
              value={selectedUserIds}
              onChange={setSelectedUserIds}
              style={{ flex: 1 }}
              filter
            >
              {availableUsers.map((user) => (
                <Select.Option key={user.id} value={user.id}>
                  {user.username} ({user.email || '-'})
                </Select.Option>
              ))}
            </Select>
            <Button
              type='primary'
              size='small'
              onClick={handleAddUsers}
              loading={addingUsers}
            >
              {t('添加')}
            </Button>
          </div>
        </div>

        {/* Members table */}
        <Spin spinning={loading}>
          <Table
            columns={memberColumns}
            dataSource={members}
            pagination={{
              currentPage: activePage,
              pageSize: pageSize,
              total: totalCount,
              showSizeChanger: false,
              onPageChange: handlePageChange,
            }}
            size='small'
          />
        </Spin>
      </div>
    </SideSheet>
  );
};

export default OrganizationMembersModal;

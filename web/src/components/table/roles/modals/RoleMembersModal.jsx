import React, { useState, useEffect } from 'react';
import { Button, SideSheet, Space, Spin, Typography, Tag, Table, Select, Empty } from '@douyinfe/semi-ui';
import { API, showError, showSuccess } from '../../../../helpers';
import { useIsMobile } from '../../../../hooks/common/useIsMobile';
import { IconUser, IconClose } from '@douyinfe/semi-icons';
import { useTranslation } from 'react-i18next';

const { Text, Title } = Typography;

const RoleMembersModal = (props) => {
  const { t } = useTranslation();
  const {
    visible,
    onCancel,
    item,
    users,
    loading,
    total,
    page,
    pageSize,
    onPageChange,
    onPageSizeChange,
    onAddMembers,
    onRemoveMembers,
  } = props;
  const isMobile = useIsMobile();

  const [selectedUserIds, setSelectedUserIds] = useState([]);
  const [allUsers, setAllUsers] = useState([]);
  const [fetchingUsers, setFetchingUsers] = useState(false);
  const [removing, setRemoving] = useState(false);
  const [adding, setAdding] = useState(false);
  const [searchKeyword, setSearchKeyword] = useState('');

  // Fetch all users for the add member select
  const fetchAllUsers = async (keyword = '') => {
    setFetchingUsers(true);
    try {
      const url = keyword
        ? `/api/user/search?keyword=${keyword}&p=0&page_size=100`
        : `/api/user/?p=0&page_size=100`;
      const res = await API.get(url);
      const { success, data } = res.data;
      if (success) {
        setAllUsers(data.items || []);
      }
    } catch (error) {
      showError(error.message);
    }
    setFetchingUsers(false);
  };

  useEffect(() => {
    if (visible && item) {
      fetchAllUsers();
    } else {
      setAllUsers([]);
      setSelectedUserIds([]);
      setSearchKeyword('');
    }
  }, [visible, item]);

  // Remove selected members
  const handleRemoveMembers = async () => {
    if (selectedUserIds.length === 0) return;
    setRemoving(true);
    await onRemoveMembers(item.id, selectedUserIds);
    setSelectedUserIds([]);
    setRemoving(false);
  };

  // Add members
  const handleAddMembers = async (userIds) => {
    if (!userIds || userIds.length === 0) return;
    setAdding(true);
    await onAddMembers(item.id, userIds);
    setAdding(false);
  };

  // Columns for the member table
  const memberColumns = [
    {
      title: 'ID',
      dataIndex: 'id',
      width: 80,
    },
    {
      title: t('用户名'),
      dataIndex: 'username',
      width: 150,
    },
    {
      title: t('显示名称'),
      dataIndex: 'display_name',
      width: 150,
    },
  ];

  return (
    <>
      <SideSheet
        placement='right'
        title={
          <Space>
            <Tag color='blue' shape='circle'>
              {t('成员')}
            </Tag>
            <Title heading={4} className='m-0'>
              {item ? `${t('角色成员')} - ${item.name}` : t('角色成员')}
            </Title>
          </Space>
        }
        bodyStyle={{ padding: '0' }}
        visible={visible}
        width={isMobile ? '100%' : 700}
        closeIcon={null}
        onCancel={onCancel}
      >
        <Spin spinning={loading || fetchingUsers}>
          <div className='p-4 space-y-4'>
            {/* Current members section */}
            <div>
              <div className='flex items-center justify-between mb-2'>
                <Text className='font-medium'>{t('当前成员')}</Text>
                <Button
                  type='danger'
                  size='small'
                  disabled={selectedUserIds.length === 0}
                  loading={removing}
                  onClick={handleRemoveMembers}
                >
                  {t('移除选中')}
                </Button>
              </div>
              {users && users.length > 0 ? (
                <Table
                  columns={memberColumns}
                  dataSource={users}
                  rowKey='id'
                  rowSelection={{
                    selectedRowKeys: selectedUserIds,
                    onChange: (selectedRowKeys) => {
                      setSelectedUserIds(selectedRowKeys);
                    },
                  }}
                  pagination={{
                    currentPage: page,
                    pageSize: pageSize,
                    total: total,
                    onPageChange: onPageChange,
                    onPageSizeChange: onPageSizeChange,
                    pageSizeOpts: [10, 20, 50],
                    showSizeChanger: true,
                  }}
                  size='small'
                />
              ) : (
                <Empty description={t('暂无成员')} />
              )}
            </div>

            {/* Add members section */}
            <div>
              <div className='flex items-center mb-2'>
                <IconUser className='mr-2' />
                <Text className='font-medium'>{t('添加成员')}</Text>
              </div>
              <div className='flex gap-2'>
                <div className='flex-1'>
                  <Select
                    filter
                    multiple
                    placeholder={t('搜索并选择用户')}
                    style={{ width: '100%' }}
                    optionList={allUsers.map((user) => ({
                      label: `${user.username} (ID: ${user.id})`,
                      value: user.id,
                    }))}
                    onSearch={(value) => {
                      setSearchKeyword(value || '');
                      // Debounce search
                      if (value && value.length >= 2) {
                        setTimeout(() => fetchAllUsers(value), 300);
                      }
                    }}
                    onChange={(value) => {
                      if (value && value.length > 0) {
                        handleAddMembers(value);
                      }
                    }}
                    loading={fetchingUsers}
                  />
                </div>
              </div>
            </div>
          </div>
        </Spin>
      </SideSheet>
    </>
  );
};

export default RoleMembersModal;

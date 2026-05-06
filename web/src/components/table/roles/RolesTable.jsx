import React, { useMemo, useState } from 'react';
import { Empty } from '@douyinfe/semi-ui';
import CardTable from '../../common/ui/CardTable';
import {
  IllustrationNoResult,
  IllustrationNoResultDark,
} from '@douyinfe/semi-illustrations';
import { getRolesColumns } from './RolesColumnDefs';
import DeleteRoleModal from './modals/DeleteRoleModal';
import RoleMembersModal from './modals/RoleMembersModal';

const RolesTable = (rolesData) => {
  const {
    roles,
    loading,
    activePage,
    pageSize,
    roleCount,
    compactMode,
    handlePageChange,
    handlePageSizeChange,
    setEditingItem,
    setShowEdit,
    deleteRole,
    openMembers,
    showMembers,
    currentMembersItem,
    memberUsers,
    memberLoading,
    memberTotal,
    memberPage,
    memberPageSize,
    closeMembers,
    addMembers,
    removeMembers,
    loadMemberUsers,
    handleMemberPageChange,
    handleMemberPageSizeChange,
    t,
  } = rolesData;

  // Delete modal state
  const [showDelete, setShowDelete] = useState(false);
  const [deleteItem, setDeleteItem] = useState(null);

  // Delete handlers
  const showDeleteModal = (item) => {
    setDeleteItem(item);
    setShowDelete(true);
  };

  const handleDeleteConfirm = async () => {
    if (deleteItem) {
      await deleteRole(deleteItem.id);
      setShowDelete(false);
      setDeleteItem(null);
    }
  };

  // Get all columns
  const columns = useMemo(() => {
    return getRolesColumns({
      t,
      setEditingItem,
      setShowEdit,
      showDeleteModal,
      openMembers,
    });
  }, [
    t,
    setEditingItem,
    setShowEdit,
    showDeleteModal,
    openMembers,
  ]);

  // Handle compact mode by removing fixed positioning
  const tableColumns = useMemo(() => {
    return compactMode
      ? columns.map((col) => {
          if (col.dataIndex === 'operate') {
            const { fixed, ...rest } = col;
            return rest;
          }
          return col;
        })
      : columns;
  }, [compactMode, columns]);

  return (
    <>
      <CardTable
        columns={tableColumns}
        dataSource={roles}
        scroll={compactMode ? undefined : { x: 'max-content' }}
        pagination={{
          currentPage: activePage,
          pageSize: pageSize,
          total: roleCount,
          pageSizeOpts: [10, 20, 50, 100],
          showSizeChanger: true,
          onPageSizeChange: handlePageSizeChange,
          onPageChange: handlePageChange,
        }}
        hidePagination={true}
        loading={loading}
        empty={
          <Empty
            image={<IllustrationNoResult style={{ width: 150, height: 150 }} />}
            darkModeImage={
              <IllustrationNoResultDark style={{ width: 150, height: 150 }} />
            }
            description={t('搜索无结果')}
            style={{ padding: 30 }}
          />
        }
        className='overflow-hidden'
        size='middle'
      />

      <DeleteRoleModal
        visible={showDelete}
        onCancel={() => setShowDelete(false)}
        onConfirm={handleDeleteConfirm}
        item={deleteItem}
        t={t}
      />

      <RoleMembersModal
        visible={showMembers}
        onCancel={closeMembers}
        item={currentMembersItem}
        users={memberUsers}
        loading={memberLoading}
        total={memberTotal}
        page={memberPage}
        pageSize={memberPageSize}
        onPageChange={handleMemberPageChange}
        onPageSizeChange={handleMemberPageSizeChange}
        onAddMembers={addMembers}
        onRemoveMembers={removeMembers}
        t={t}
      />
    </>
  );
};

export default RolesTable;

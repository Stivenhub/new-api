import React, { useMemo, useState } from 'react';
import { Empty } from '@douyinfe/semi-ui';
import CardTable from '../../common/ui/CardTable';
import {
  IllustrationNoResult,
  IllustrationNoResultDark,
} from '@douyinfe/semi-illustrations';
import { getDepartmentsColumns } from './DepartmentsColumnDefs';
import DeleteDepartmentModal from './modals/DeleteDepartmentModal';
import DepartmentMembersModal from './modals/DepartmentMembersModal';

const DepartmentsTable = (departmentsData) => {
  const {
    departments,
    loading,
    activePage,
    pageSize,
    total,
    compactMode,
    handlePageChange,
    refresh,
    deleteDepartment,
    orgOptions,
    showEditDepartment,
    setShowEditDepartment,
    editingDepartment,
    setEditingDepartment,
    t,
  } = departmentsData;

  // Modal states
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deletingRecord, setDeletingRecord] = useState(null);

  // Members modal state
  const [showMembers, setShowMembers] = useState(false);
  const [membersRecord, setMembersRecord] = useState(null);

  // Build org name map
  const orgMap = useMemo(() => {
    const map = {};
    orgOptions.forEach((opt) => {
      map[opt.value] = opt.label;
    });
    return map;
  }, [orgOptions]);

  const showDeleteDepartmentModal = (record) => {
    setDeletingRecord(record);
    setShowDeleteModal(true);
  };

  const showMembersModal = (record) => {
    setMembersRecord(record);
    setShowMembers(true);
  };

  const closeMembersModal = () => {
    setShowMembers(false);
    setMembersRecord(null);
  };

  // Get all columns
  const columns = useMemo(() => {
    return getDepartmentsColumns({
      t,
      setEditingDepartment,
      setShowEditDepartment,
      showDeleteDepartmentModal,
      showMembersModal,
      orgMap,
    });
  }, [t, orgMap, showDeleteDepartmentModal, showMembersModal]);

  // Handle compact mode by removing fixed positioning
  const tableColumns = useMemo(() => {
    return compactMode
      ? columns.map((col) => {
          if (col.fixed) {
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
        dataSource={departments}
        scroll={compactMode ? undefined : { x: 'max-content' }}
        pagination={{
          currentPage: activePage,
          pageSize: pageSize,
          total: total,
          showSizeChanger: true,
          pageSizeOptions: [10, 20, 50, 100],
          onPageSizeChange: departmentsData.handlePageSizeChange,
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
        className='rounded-xl overflow-hidden'
        size='middle'
      />

      <DeleteDepartmentModal
        visible={showDeleteModal}
        onCancel={() => setShowDeleteModal(false)}
        record={deletingRecord}
        deleteDepartment={deleteDepartment}
        refresh={refresh}
        departments={departments}
        activePage={activePage}
        t={t}
      />

      <DepartmentMembersModal
        visible={showMembers}
        onCancel={closeMembersModal}
        record={membersRecord}
        t={t}
      />
    </>
  );
};

export default DepartmentsTable;

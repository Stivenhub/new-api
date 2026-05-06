import React, { useMemo, useState } from 'react';
import { Empty } from '@douyinfe/semi-ui';
import CardTable from '../../common/ui/CardTable';
import {
  IllustrationNoResult,
  IllustrationNoResultDark,
} from '@douyinfe/semi-illustrations';
import { getOrganizationsColumns } from './OrganizationsColumnDefs';
import DeleteOrganizationModal from './modals/DeleteOrganizationModal';
import OrganizationMembersModal from './modals/OrganizationMembersModal';

const OrganizationsTable = (organizationsData) => {
  const {
    organizations,
    loading,
    activePage,
    pageSize,
    totalCount,
    compactMode,
    handlePageChange,
    setEditingOrg,
    setShowEdit,
    refresh,
    t,
  } = organizationsData;

  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deletingRecord, setDeletingRecord] = useState(null);

  const [showMembersModal, setShowMembersModal] = useState(false);
  const [membersRecord, setMembersRecord] = useState(null);

  const showDeleteOrganizationModal = (record) => {
    setDeletingRecord(record);
    setShowDeleteModal(true);
  };

  const handleShowMembersModal = (record) => {
    setMembersRecord(record);
    setShowMembersModal(true);
  };

  const columns = useMemo(() => {
    return getOrganizationsColumns({
      t,
      setEditingOrg,
      setShowEdit,
      showDeleteOrganizationModal,
      showMembersModal: handleShowMembersModal,
    });
  }, [t, setEditingOrg, setShowEdit, showDeleteOrganizationModal, handleShowMembersModal]);

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
        dataSource={organizations}
        scroll={compactMode ? undefined : { x: 'max-content' }}
        pagination={{
          currentPage: activePage,
          pageSize: pageSize,
          total: totalCount,
          showSizeChanger: true,
          pageSizeOptions: [10, 20, 50, 100],
          onPageSizeChange: organizationsData.handlePageSizeChange,
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

      <DeleteOrganizationModal
        visible={showDeleteModal}
        onCancel={() => setShowDeleteModal(false)}
        record={deletingRecord}
        refresh={refresh}
        organizations={organizations}
        activePage={activePage}
        t={t}
      />

      <OrganizationMembersModal
        visible={showMembersModal}
        onCancel={() => setShowMembersModal(false)}
        record={membersRecord}
        t={t}
      />
    </>
  );
};

export default OrganizationsTable;

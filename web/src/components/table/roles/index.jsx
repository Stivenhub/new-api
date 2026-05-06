import React from 'react';
import CardPro from '../../common/ui/CardPro';
import RolesTable from './RolesTable';
import RolesActions from './RolesActions';
import RolesFilters from './RolesFilters';
import RolesDescription from './RolesDescription';
import AddRoleModal from './modals/AddRoleModal';
import EditRoleModal from './modals/EditRoleModal';
import { useRolesData } from '../../../hooks/roles/useRolesData';
import { useIsMobile } from '../../../hooks/common/useIsMobile';
import { createCardProPagination } from '../../../helpers/utils';

const RolesPage = () => {
  const rolesData = useRolesData();
  const isMobile = useIsMobile();

  const {
    // Modal state
    showAdd,
    showEdit,
    editingItem,
    setShowAdd,
    closeAdd,
    closeEdit,
    refresh,

    // Form state
    formInitValues,
    setFormApi,
    searchRoles,
    loadRoles,
    activePage,
    pageSize,
    loading,
    searching,

    // Description state
    compactMode,
    setCompactMode,

    // Translation
    t,
  } = rolesData;

  return (
    <>
      <AddRoleModal
        refresh={refresh}
        visible={showAdd}
        handleClose={closeAdd}
      />

      <EditRoleModal
        refresh={refresh}
        visible={showEdit}
        handleClose={closeEdit}
        editingItem={editingItem}
      />

      <CardPro
        type='type1'
        descriptionArea={
          <RolesDescription
            compactMode={compactMode}
            setCompactMode={setCompactMode}
            t={t}
          />
        }
        actionsArea={
          <div className='flex flex-col md:flex-row justify-between items-center gap-2 w-full'>
            <RolesActions setShowAdd={setShowAdd} t={t} />

            <RolesFilters
              formInitValues={formInitValues}
              setFormApi={setFormApi}
              searchRoles={searchRoles}
              loadRoles={loadRoles}
              activePage={activePage}
              pageSize={pageSize}
              loading={loading}
              searching={searching}
              t={t}
            />
          </div>
        }
        paginationArea={createCardProPagination({
          currentPage: rolesData.activePage,
          pageSize: rolesData.pageSize,
          total: rolesData.roleCount,
          onPageChange: rolesData.handlePageChange,
          onPageSizeChange: rolesData.handlePageSizeChange,
          isMobile: isMobile,
          t: rolesData.t,
        })}
        t={rolesData.t}
      >
        <RolesTable {...rolesData} />
      </CardPro>
    </>
  );
};

export default RolesPage;

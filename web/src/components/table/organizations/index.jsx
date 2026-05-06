import React from 'react';
import CardPro from '../../common/ui/CardPro';
import OrganizationsTable from './OrganizationsTable';
import OrganizationsActions from './OrganizationsActions';
import OrganizationsFilters from './OrganizationsFilters';
import OrganizationsDescription from './OrganizationsDescription';
import AddOrganizationModal from './modals/AddOrganizationModal';
import EditOrganizationModal from './modals/EditOrganizationModal';
import { useOrganizationsData } from '../../../hooks/organizations/useOrganizationsData';
import { useIsMobile } from '../../../hooks/common/useIsMobile';
import { createCardProPagination } from '../../../helpers';

const OrganizationsPage = () => {
  const organizationsData = useOrganizationsData();
  const isMobile = useIsMobile();

  const {
    showAdd,
    showEdit,
    editingOrg,
    closeAdd,
    closeEdit,
    refresh,
    setEditingOrg,
    setShowEdit,
    setShowAdd,
    formInitValues,
    setFormApi,
    searchOrganizations,
    loading,
    searching,
    compactMode,
    setCompactMode,
    t,
  } = organizationsData;

  return (
    <>
      <AddOrganizationModal
        refresh={refresh}
        visible={showAdd}
        handleClose={closeAdd}
      />
      <EditOrganizationModal
        refresh={refresh}
        editingOrg={editingOrg}
        visible={showEdit}
        handleClose={closeEdit}
      />

      <CardPro
        type='type1'
        descriptionArea={
          <OrganizationsDescription
            compactMode={compactMode}
            setCompactMode={setCompactMode}
            t={t}
          />
        }
        actionsArea={
          <div className='flex flex-col md:flex-row justify-between items-center gap-2 w-full'>
            <OrganizationsActions
              setEditingOrg={setEditingOrg}
              setShowAdd={setShowAdd}
              t={t}
            />
            <div className='w-full md:w-full lg:w-auto order-1 md:order-2'>
              <OrganizationsFilters
                formInitValues={formInitValues}
                setFormApi={setFormApi}
                searchOrganizations={searchOrganizations}
                loading={loading}
                searching={searching}
                t={t}
              />
            </div>
          </div>
        }
        paginationArea={createCardProPagination({
          currentPage: organizationsData.activePage,
          pageSize: organizationsData.pageSize,
          total: organizationsData.totalCount,
          onPageChange: organizationsData.handlePageChange,
          onPageSizeChange: organizationsData.handlePageSizeChange,
          isMobile: isMobile,
          t: organizationsData.t,
        })}
        t={organizationsData.t}
      >
        <OrganizationsTable {...organizationsData} />
      </CardPro>
    </>
  );
};

export default OrganizationsPage;

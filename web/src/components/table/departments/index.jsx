import React from 'react';
import CardPro from '../../common/ui/CardPro';
import DepartmentsTable from './DepartmentsTable';
import DepartmentsActions from './DepartmentsActions';
import DepartmentsFilters from './DepartmentsFilters';
import DepartmentsDescription from './DepartmentsDescription';
import AddDepartmentModal from './modals/AddDepartmentModal';
import EditDepartmentModal from './modals/EditDepartmentModal';
import { useDepartmentsData } from '../../../hooks/departments/useDepartmentsData';
import { useIsMobile } from '../../../hooks/common/useIsMobile';
import { createCardProPagination } from '../../../helpers/utils';

const DepartmentsPage = () => {
  const departmentsData = useDepartmentsData();
  const isMobile = useIsMobile();

  const {
    // Modal state
    showAddDepartment,
    showEditDepartment,
    editingDepartment,
    setShowAddDepartment,
    closeAddDepartment,
    closeEditDepartment,
    refresh,

    // Form state
    formInitValues,
    setFormApi,
    searchDepartments,
    loadDepartments,
    activePage,
    pageSize,
    orgOptions,
    loading,
    searching,

    // UI state
    compactMode,
    setCompactMode,

    // Translation
    t,
  } = departmentsData;

  return (
    <>
      <AddDepartmentModal
        refresh={refresh}
        visible={showAddDepartment}
        handleClose={closeAddDepartment}
        orgOptions={orgOptions}
      />

      <EditDepartmentModal
        refresh={refresh}
        visible={showEditDepartment}
        handleClose={closeEditDepartment}
        editingDepartment={editingDepartment}
        orgOptions={orgOptions}
      />

      <CardPro
        type='type1'
        descriptionArea={
          <DepartmentsDescription
            compactMode={compactMode}
            setCompactMode={setCompactMode}
            t={t}
          />
        }
        actionsArea={
          <div className='flex flex-col md:flex-row justify-between items-center gap-2 w-full'>
            <DepartmentsActions setShowAddDepartment={setShowAddDepartment} t={t} />

            <DepartmentsFilters
              formInitValues={formInitValues}
              setFormApi={setFormApi}
              searchDepartments={searchDepartments}
              loadDepartments={loadDepartments}
              pageSize={pageSize}
              orgOptions={orgOptions}
              loading={loading}
              searching={searching}
              t={t}
            />
          </div>
        }
        paginationArea={createCardProPagination({
          currentPage: departmentsData.activePage,
          pageSize: departmentsData.pageSize,
          total: departmentsData.total,
          onPageChange: departmentsData.handlePageChange,
          onPageSizeChange: departmentsData.handlePageSizeChange,
          isMobile: isMobile,
          t: departmentsData.t,
        })}
        t={departmentsData.t}
      >
        <DepartmentsTable {...departmentsData} />
      </CardPro>
    </>
  );
};

export default DepartmentsPage;

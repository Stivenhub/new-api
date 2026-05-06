import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { API, showError, showSuccess } from '../../helpers';
import { ITEMS_PER_PAGE } from '../../constants';
import { useTableCompactMode } from '../common/useTableCompactMode';

export const useDepartmentsData = () => {
  const { t } = useTranslation();
  const [compactMode, setCompactMode] = useTableCompactMode('departments');

  // Data state
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activePage, setActivePage] = useState(1);
  const [pageSize, setPageSize] = useState(ITEMS_PER_PAGE);
  const [searching, setSearching] = useState(false);
  const [total, setTotal] = useState(0);

  // Organization options
  const [orgOptions, setOrgOptions] = useState([]);

  // Modal states
  const [showAddDepartment, setShowAddDepartment] = useState(false);
  const [showEditDepartment, setShowEditDepartment] = useState(false);
  const [editingDepartment, setEditingDepartment] = useState({
    id: undefined,
  });

  // Form initial values
  const formInitValues = {
    searchKeyword: '',
    organizationId: '',
  };

  const [formApi, setFormApi] = useState(null);

  const getFormValues = () => {
    const formValues = formApi ? formApi.getValues() : {};
    return {
      searchKeyword: formValues.searchKeyword || '',
      organizationId: formValues.organizationId || '',
    };
  };

  const setDepartmentFormat = (items) => {
    for (let i = 0; i < items.length; i++) {
      items[i].key = items[i].id;
    }
    setDepartments(items);
  };

  // Load organizations for filter dropdown
  const loadOrganizations = async () => {
    try {
      const res = await API.get('/api/organization/?p=0&page_size=1000');
      if (res === undefined) return;
      const { success, data } = res.data;
      if (success && data && data.items) {
        setOrgOptions(
          data.items.map((org) => ({
            label: org.name,
            value: org.id,
          })),
        );
      }
    } catch (error) {
      showError(error.message);
    }
  };

  // Load departments
  const loadDepartments = async (startIdx, pageSize) => {
    setLoading(true);
    const { organizationId } = getFormValues();
    let url = `/api/department/?p=${startIdx}&page_size=${pageSize}`;
    if (organizationId) {
      url += `&organization_id=${organizationId}`;
    }
    const res = await API.get(url);
    const { success, message, data } = res.data;
    if (success) {
      setActivePage(data.page);
      setTotal(data.total);
      setDepartmentFormat(data.items);
    } else {
      showError(message);
    }
    setLoading(false);
  };

  // Search departments
  const searchDepartments = async (
    startIdx,
    pageSize,
    searchKeyword = null,
    organizationId = null,
  ) => {
    if (searchKeyword === null || organizationId === null) {
      const formValues = getFormValues();
      searchKeyword = formValues.searchKeyword;
      organizationId = formValues.organizationId;
    }

    if (searchKeyword === '' && organizationId === '') {
      await loadDepartments(startIdx, pageSize);
      return;
    }
    setSearching(true);
    let url = `/api/department/search?keyword=${searchKeyword}&p=${startIdx}&page_size=${pageSize}`;
    if (organizationId) {
      url += `&organization_id=${organizationId}`;
    }
    const res = await API.get(url);
    const { success, message, data } = res.data;
    if (success) {
      setActivePage(data.page);
      setTotal(data.total);
      setDepartmentFormat(data.items);
    } else {
      showError(message);
    }
    setSearching(false);
  };

  // Delete department
  const deleteDepartment = async (id) => {
    const res = await API.delete(`/api/department/${id}`);
    const { success, message } = res.data;
    if (success) {
      showSuccess(t('删除成功！'));
    } else {
      showError(message);
    }
    return success;
  };

  // Handle page change
  const handlePageChange = (page) => {
    setActivePage(page);
    const { searchKeyword, organizationId } = getFormValues();
    if (searchKeyword === '' && organizationId === '') {
      loadDepartments(page, pageSize).then();
    } else {
      searchDepartments(page, pageSize, searchKeyword, organizationId).then();
    }
  };

  // Handle page size change
  const handlePageSizeChange = async (size) => {
    localStorage.setItem('page-size', size + '');
    setPageSize(size);
    setActivePage(1);
    loadDepartments(1, size)
      .then()
      .catch((reason) => {
        showError(reason);
      });
  };

  // Refresh data
  const refresh = async (page = activePage) => {
    const { searchKeyword, organizationId } = getFormValues();
    if (searchKeyword === '' && organizationId === '') {
      await loadDepartments(page, pageSize);
    } else {
      await searchDepartments(page, pageSize, searchKeyword, organizationId);
    }
  };

  // Modal control functions
  const closeAddDepartment = () => {
    setShowAddDepartment(false);
  };

  const closeEditDepartment = () => {
    setShowEditDepartment(false);
    setEditingDepartment({
      id: undefined,
    });
  };

  // Initialize data
  useEffect(() => {
    loadDepartments(0, pageSize)
      .then()
      .catch((reason) => {
        showError(reason);
      });
    loadOrganizations().then();
  }, []);

  return {
    // Data state
    departments,
    loading,
    activePage,
    pageSize,
    total,
    searching,
    orgOptions,

    // Modal state
    showAddDepartment,
    showEditDepartment,
    editingDepartment,
    setShowAddDepartment,
    setShowEditDepartment,
    setEditingDepartment,

    // Form state
    formInitValues,
    formApi,
    setFormApi,

    // UI state
    compactMode,
    setCompactMode,

    // Actions
    loadDepartments,
    searchDepartments,
    deleteDepartment,
    handlePageChange,
    handlePageSizeChange,
    refresh,
    closeAddDepartment,
    closeEditDepartment,
    getFormValues,

    // Translation
    t,
  };
};

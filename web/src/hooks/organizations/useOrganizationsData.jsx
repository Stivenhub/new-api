import { useState, useEffect } from 'react';
import { API, showError } from '../../helpers';
import { ITEMS_PER_PAGE } from '../../constants';
import { useTranslation } from 'react-i18next';
import { useTableCompactMode } from '../common/useTableCompactMode';

export const useOrganizationsData = () => {
  const { t } = useTranslation();

  const [organizations, setOrganizations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searching, setSearching] = useState(false);
  const [activePage, setActivePage] = useState(1);
  const [pageSize, setPageSize] = useState(ITEMS_PER_PAGE);
  const [totalCount, setTotalCount] = useState(0);

  const [editingOrg, setEditingOrg] = useState({
    id: undefined,
  });
  const [showAdd, setShowAdd] = useState(false);
  const [showEdit, setShowEdit] = useState(false);

  const [formApi, setFormApi] = useState(null);

  const [compactMode, setCompactMode] = useTableCompactMode('organizations');

  const formInitValues = {
    searchKeyword: '',
  };

  const getFormValues = () => {
    const formValues = formApi ? formApi.getValues() : {};
    return {
      searchKeyword: formValues.searchKeyword || '',
    };
  };

  const loadOrganizations = async (page = 1, size = pageSize) => {
    setLoading(true);
    try {
      const res = await API.get(
        `/api/organization/?p=${page}&page_size=${size}`,
      );
      const { success, message, data } = res.data;
      if (success) {
        const items = data.items || [];
        setOrganizations(items);
        setActivePage(data.page <= 0 ? 1 : data.page);
        setTotalCount(data.total);
      } else {
        showError(message);
      }
    } catch (error) {
      showError(error.message);
    }
    setLoading(false);
  };

  const searchOrganizations = async () => {
    const { searchKeyword } = getFormValues();
    if (searchKeyword === '') {
      await loadOrganizations(1, pageSize);
      return;
    }

    setSearching(true);
    try {
      const res = await API.get(
        `/api/organization/search?keyword=${searchKeyword}&p=1&page_size=${pageSize}`,
      );
      const { success, message, data } = res.data;
      if (success) {
        const items = data.items || [];
        setOrganizations(items);
        setActivePage(data.page || 1);
        setTotalCount(data.total);
      } else {
        showError(message);
      }
    } catch (error) {
      showError(error.message);
    }
    setSearching(false);
  };

  const refresh = async (page = activePage) => {
    const { searchKeyword } = getFormValues();
    if (searchKeyword === '') {
      await loadOrganizations(page, pageSize);
    } else {
      await searchOrganizations();
    }
  };

  const handlePageChange = (page) => {
    setActivePage(page);
    const { searchKeyword } = getFormValues();
    if (searchKeyword === '') {
      loadOrganizations(page, pageSize);
    } else {
      searchOrganizations();
    }
  };

  const handlePageSizeChange = (size) => {
    setPageSize(size);
    setActivePage(1);
    const { searchKeyword } = getFormValues();
    if (searchKeyword === '') {
      loadOrganizations(1, size);
    } else {
      searchOrganizations();
    }
  };

  const closeAdd = () => {
    setShowAdd(false);
    setTimeout(() => {
      setEditingOrg({
        id: undefined,
      });
    }, 500);
  };

  const closeEdit = () => {
    setShowEdit(false);
    setTimeout(() => {
      setEditingOrg({
        id: undefined,
      });
    }, 500);
  };

  useEffect(() => {
    loadOrganizations(1, pageSize)
      .then()
      .catch((reason) => {
        showError(reason);
      });
  }, [pageSize]);

  return {
    organizations,
    loading,
    searching,
    activePage,
    pageSize,
    totalCount,
    editingOrg,
    showAdd,
    showEdit,
    formApi,
    formInitValues,
    compactMode,
    setCompactMode,
    loadOrganizations,
    searchOrganizations,
    refresh,
    setActivePage,
    setPageSize,
    setEditingOrg,
    setShowAdd,
    setShowEdit,
    setFormApi,
    setLoading,
    handlePageChange,
    handlePageSizeChange,
    closeAdd,
    closeEdit,
    getFormValues,
    t,
  };
};

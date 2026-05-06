import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { API, showError, showSuccess } from '../../helpers';
import { ITEMS_PER_PAGE } from '../../constants';
import { useTableCompactMode } from '../common/useTableCompactMode';

export const useRolesData = () => {
  const { t } = useTranslation();
  const [compactMode, setCompactMode] = useTableCompactMode('roles');

  // State management
  const [roles, setRoles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activePage, setActivePage] = useState(1);
  const [pageSize, setPageSize] = useState(ITEMS_PER_PAGE);
  const [searching, setSearching] = useState(false);
  const [roleCount, setRoleCount] = useState(0);

  // Modal states
  const [showAdd, setShowAdd] = useState(false);
  const [showEdit, setShowEdit] = useState(false);
  const [editingItem, setEditingItem] = useState({
    id: undefined,
  });

  // Member management states
  const [showMembers, setShowMembers] = useState(false);
  const [currentMembersItem, setCurrentMembersItem] = useState(null);
  const [memberUsers, setMemberUsers] = useState([]);
  const [memberLoading, setMemberLoading] = useState(false);
  const [memberTotal, setMemberTotal] = useState(0);
  const [memberPage, setMemberPage] = useState(1);
  const [memberPageSize, setMemberPageSize] = useState(ITEMS_PER_PAGE);

  // Form initial values
  const formInitValues = {
    searchKeyword: '',
  };

  // Form API reference
  const [formApi, setFormApi] = useState(null);

  // Get form values helper function
  const getFormValues = () => {
    const formValues = formApi ? formApi.getValues() : {};
    return {
      searchKeyword: formValues.searchKeyword || '',
    };
  };

  // Set role format with key field
  const setRoleFormat = (roles) => {
    for (let i = 0; i < roles.length; i++) {
      roles[i].key = roles[i].id;
    }
    setRoles(roles);
  };

  // Load roles data
  const loadRoles = async (startIdx, pageSize) => {
    setLoading(true);
    const res = await API.get(`/api/custom-role/?p=${startIdx}&page_size=${pageSize}`);
    const { success, message, data } = res.data;
    if (success) {
      const newPageData = data.items;
      setActivePage(data.page);
      setRoleCount(data.total);
      setRoleFormat(newPageData);
    } else {
      showError(message);
    }
    setLoading(false);
  };

  // Search roles with keyword
  const searchRoles = async (
    startIdx,
    pageSize,
    searchKeyword = null,
  ) => {
    if (searchKeyword === null) {
      const formValues = getFormValues();
      searchKeyword = formValues.searchKeyword;
    }

    if (searchKeyword === '') {
      await loadRoles(startIdx, pageSize);
      return;
    }
    setSearching(true);
    const res = await API.get(
      `/api/custom-role/search?keyword=${searchKeyword}&p=${startIdx}&page_size=${pageSize}`,
    );
    const { success, message, data } = res.data;
    if (success) {
      const newPageData = data.items;
      setActivePage(data.page);
      setRoleCount(data.total);
      setRoleFormat(newPageData);
    } else {
      showError(message);
    }
    setSearching(false);
  };

  // Handle page change
  const handlePageChange = (page) => {
    setActivePage(page);
    const { searchKeyword } = getFormValues();
    if (searchKeyword === '') {
      loadRoles(page, pageSize).then();
    } else {
      searchRoles(page, pageSize, searchKeyword).then();
    }
  };

  // Handle page size change
  const handlePageSizeChange = async (size) => {
    localStorage.setItem('page-size', size + '');
    setPageSize(size);
    setActivePage(1);
    loadRoles(1, size)
      .then()
      .catch((reason) => {
        showError(reason);
      });
  };

  // Refresh data
  const refresh = async (page = activePage) => {
    const { searchKeyword } = getFormValues();
    if (searchKeyword === '') {
      await loadRoles(page, pageSize);
    } else {
      await searchRoles(page, pageSize, searchKeyword);
    }
  };

  // Load member users for a role
  const loadMemberUsers = async (roleId, p = 0, size = ITEMS_PER_PAGE) => {
    setMemberLoading(true);
    try {
      const res = await API.get(`/api/custom-role/${roleId}/users?p=${p}&page_size=${size}`);
      const { success, message, data } = res.data;
      if (success) {
        setMemberUsers(data.items || []);
        setMemberTotal(data.total);
        setMemberPage(data.page);
      } else {
        showError(message);
      }
    } catch (error) {
      showError(error.message);
    }
    setMemberLoading(false);
  };

  // Add users to role
  const addMembers = async (roleId, userIds) => {
    const res = await API.post(`/api/custom-role/${roleId}/users`, { user_ids: userIds });
    const { success, message } = res.data;
    if (success) {
      showSuccess(t('添加成员成功！'));
      await loadMemberUsers(roleId, 0, memberPageSize);
    } else {
      showError(message);
    }
  };

  // Remove users from role
  const removeMembers = async (roleId, userIds) => {
    const res = await API.delete(`/api/custom-role/${roleId}/users`, { data: { user_ids: userIds } });
    const { success, message } = res.data;
    if (success) {
      showSuccess(t('移除成员成功！'));
      await loadMemberUsers(roleId, 0, memberPageSize);
    } else {
      showError(message);
    }
  };

  // Delete role
  const deleteRole = async (roleId) => {
    const res = await API.delete(`/api/custom-role/${roleId}`);
    const { success, message } = res.data;
    if (success) {
      showSuccess(t('角色删除成功！'));
      await refresh();
    } else {
      showError(message);
    }
  };

  // Modal control functions
  const closeAdd = () => {
    setShowAdd(false);
  };

  const closeEdit = () => {
    setShowEdit(false);
    setEditingItem({
      id: undefined,
    });
  };

  const openMembers = (item) => {
    setCurrentMembersItem(item);
    setShowMembers(true);
    loadMemberUsers(item.id, 0, memberPageSize);
  };

  const closeMembers = () => {
    setShowMembers(false);
    setCurrentMembersItem(null);
    setMemberUsers([]);
  };

  // Handle member page change
  const handleMemberPageChange = (page) => {
    setMemberPage(page);
    if (currentMembersItem) {
      loadMemberUsers(currentMembersItem.id, page, memberPageSize);
    }
  };

  // Handle member page size change
  const handleMemberPageSizeChange = (size) => {
    setMemberPageSize(size);
    setMemberPage(1);
    if (currentMembersItem) {
      loadMemberUsers(currentMembersItem.id, 1, size);
    }
  };

  // Initialize data on component mount
  useEffect(() => {
    loadRoles(0, pageSize)
      .then()
      .catch((reason) => {
        showError(reason);
      });
  }, []);

  return {
    // Data state
    roles,
    loading,
    activePage,
    pageSize,
    roleCount,
    searching,

    // Modal state
    showAdd,
    showEdit,
    editingItem,
    setShowAdd,
    setShowEdit,
    setEditingItem,

    // Member management state
    showMembers,
    currentMembersItem,
    memberUsers,
    memberLoading,
    memberTotal,
    memberPage,
    memberPageSize,
    openMembers,
    closeMembers,
    loadMemberUsers,
    addMembers,
    removeMembers,
    handleMemberPageChange,
    handleMemberPageSizeChange,

    // Form state
    formInitValues,
    formApi,
    setFormApi,

    // UI state
    compactMode,
    setCompactMode,

    // Actions
    loadRoles,
    searchRoles,
    deleteRole,
    handlePageChange,
    handlePageSizeChange,
    refresh,
    closeAdd,
    closeEdit,
    getFormValues,

    // Translation
    t,
  };
};

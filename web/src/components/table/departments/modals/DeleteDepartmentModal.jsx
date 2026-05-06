import React from 'react';
import { Modal } from '@douyinfe/semi-ui';

const DeleteDepartmentModal = ({
  visible,
  onCancel,
  record,
  deleteDepartment,
  refresh,
  departments,
  activePage,
  t,
}) => {
  const handleConfirm = async () => {
    await deleteDepartment(record.id);
    await refresh();
    setTimeout(() => {
      if (departments.length === 0 && activePage > 1) {
        refresh(activePage - 1);
      }
    }, 100);
    onCancel();
  };

  return (
    <Modal
      title={t('确定要删除该部门吗？')}
      visible={visible}
      onCancel={onCancel}
      onOk={handleConfirm}
      type='warning'
    >
      {t('删除后相关用户关联将被清除')}
    </Modal>
  );
};

export default DeleteDepartmentModal;

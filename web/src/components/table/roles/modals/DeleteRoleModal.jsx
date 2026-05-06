import React from 'react';
import { Modal } from '@douyinfe/semi-ui';

const DeleteRoleModal = ({
  visible,
  onCancel,
  onConfirm,
  item,
  t,
}) => {
  return (
    <Modal
      title={t('确定要删除该角色吗？')}
      visible={visible}
      onCancel={onCancel}
      onOk={onConfirm}
      type='danger'
    >
      {t('确定要删除该角色吗？删除后相关用户关联将被清除')}
    </Modal>
  );
};

export default DeleteRoleModal;

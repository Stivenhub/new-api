import React from "react";
import { Modal } from "@douyinfe/semi-ui";
import { API, showError, showSuccess } from "../../../../helpers";

const DeleteOrganizationModal = ({
  visible,
  onCancel,
  record,
  refresh,
  organizations,
  activePage,
  t,
}) => {
  const handleConfirm = async () => {
    if (!record?.id) return;
    try {
      const res = await API.delete(`/api/organization/${record.id}`);
      const { success, message } = res.data;
      if (success) {
        showSuccess(t("组织删除成功！"));
        await refresh();
        setTimeout(() => {
          if (organizations.length === 0 && activePage > 1) {
            refresh(activePage - 1);
          }
        }, 100);
        onCancel();
      } else {
        showError(message);
      }
    } catch (error) {
      showError(error.message);
    }
  };

  return (
    <Modal
      title={t("确定是否要删除此组织？")}
      visible={visible}
      onCancel={onCancel}
      onOk={handleConfirm}
      type="warning"
    >
      {t("此修改将不可逆")}
    </Modal>
  );
};

export default DeleteOrganizationModal;

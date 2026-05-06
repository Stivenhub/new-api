import React, { useEffect, useState, useRef } from 'react';
import { API, showError, showSuccess } from '../../../../helpers';
import { useIsMobile } from '../../../../hooks/common/useIsMobile';
import {
  Button,
  SideSheet,
  Space,
  Spin,
  Typography,
  Card,
  Tag,
  Avatar,
  Form,
  Row,
  Col,
  Select,
} from '@douyinfe/semi-ui';
import { IconSave, IconClose, IconUserGroup } from '@douyinfe/semi-icons';
import { useTranslation } from 'react-i18next';

const { Text, Title } = Typography;

const EditRoleModal = (props) => {
  const { t } = useTranslation();
  const formApiRef = useRef(null);
  const [loading, setLoading] = useState(true);
  const [inputs, setInputs] = useState(null);
  const isMobile = useIsMobile();

  const itemId = props.editingItem.id;
  const isEdit = Boolean(itemId);

  const getInitValues = () => ({
    name: '',
    code: '',
    description: '',
    status: 1,
  });

  const handleCancel = () => props.handleClose();

  const loadItem = async () => {
    setLoading(true);
    // Since there's no single-role GET endpoint, we'll use the editingItem passed in
    if (props.editingItem && props.editingItem.id) {
      setInputs({ ...getInitValues(), ...props.editingItem });
    }
    setLoading(false);
  };

  useEffect(() => {
    if (inputs && formApiRef.current) {
      formApiRef.current.setValues(inputs);
    }
  }, [inputs]);

  useEffect(() => {
    loadItem();
  }, [props.editingItem.id]);

  const submit = async (values) => {
    setLoading(true);
    const payload = { ...values, id: parseInt(itemId) };
    const res = await API.put(`/api/custom-role/`, payload);
    const { success, message } = res.data;
    if (success) {
      showSuccess(t('角色更新成功！'));
      props.refresh();
      props.handleClose();
    } else {
      showError(message);
    }
    setLoading(false);
  };

  return (
    <>
      <SideSheet
        placement='right'
        title={
          <Space>
            <Tag color='blue' shape='circle'>
              {t(isEdit ? '编辑' : '新建')}
            </Tag>
            <Title heading={4} className='m-0'>
              {isEdit ? t('编辑角色') : t('创建角色')}
            </Title>
          </Space>
        }
        bodyStyle={{ padding: 0 }}
        visible={props.visible}
        width={isMobile ? '100%' : 600}
        footer={
          <div className='flex justify-end bg-white'>
            <Space>
              <Button
                theme='solid'
                onClick={() => formApiRef.current?.submitForm()}
                icon={<IconSave />}
                loading={loading}
              >
                {t('提交')}
              </Button>
              <Button
                theme='light'
                type='primary'
                onClick={handleCancel}
                icon={<IconClose />}
              >
                {t('取消')}
              </Button>
            </Space>
          </div>
        }
        closeIcon={null}
        onCancel={handleCancel}
      >
        <Spin spinning={loading}>
          <Form
            initValues={getInitValues()}
            getFormApi={(api) => (formApiRef.current = api)}
            onSubmit={submit}
            onSubmitFail={(errs) => {
              const first = Object.values(errs)[0];
              if (first) showError(Array.isArray(first) ? first[0] : first);
              formApiRef.current?.scrollToError();
            }}
          >
            {({ values }) => (
              <div className='p-2'>
                <Card className='!rounded-2xl shadow-sm border-0'>
                  <div className='flex items-center mb-2'>
                    <Avatar size='small' color='blue' className='mr-2 shadow-md'>
                      <IconUserGroup size={16} />
                    </Avatar>
                    <div>
                      <Text className='text-lg font-medium'>
                        {t('角色信息')}
                      </Text>
                      <div className='text-xs text-gray-600'>
                        {t('编辑自定义角色信息')}
                      </div>
                    </div>
                  </div>

                  <Row gutter={12}>
                    <Col span={24}>
                      <Form.Input
                        field='name'
                        label={t('角色名称')}
                        placeholder={t('请输入角色名称')}
                        rules={[{ required: true, message: t('请输入角色名称') }]}
                        showClear
                      />
                    </Col>
                    <Col span={24}>
                      <Form.Input
                        field='code'
                        label={t('角色编码')}
                        placeholder={t('请输入角色编码')}
                        rules={[{ required: true, message: t('请输入角色编码') }]}
                        showClear
                      />
                    </Col>
                    <Col span={24}>
                      <Form.TextArea
                        field='description'
                        label={t('角色描述')}
                        placeholder={t('请输入角色描述')}
                        showClear
                      />
                    </Col>
                    <Col span={24}>
                      <Form.Select
                        field='status'
                        label={t('状态')}
                        placeholder={t('请选择状态')}
                        rules={[{ required: true, message: t('请选择状态') }]}
                      >
                        <Select.Option value={1}>{t('启用')}</Select.Option>
                        <Select.Option value={0}>{t('禁用')}</Select.Option>
                      </Form.Select>
                    </Col>
                  </Row>
                </Card>
              </div>
            )}
          </Form>
        </Spin>
      </SideSheet>
    </>
  );
};

export default EditRoleModal;

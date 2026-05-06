import React, { useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import {
  API,
  showError,
  showSuccess,
} from '../../../../helpers';
import {
  Button,
  SideSheet,
  Space,
  Spin,
  Typography,
  Card,
  Tag,
  Form,
  Avatar,
  Row,
  Col,
  Select,
} from '@douyinfe/semi-ui';
import { IconSave, IconClose, IconHome } from '@douyinfe/semi-icons';

const { Text, Title } = Typography;

const EditOrganizationModal = (props) => {
  const { t } = useTranslation();
  const isEdit = props.editingOrg.id !== undefined;
  const [loading, setLoading] = React.useState(isEdit);
  const formApiRef = useRef(null);

  const getInitValues = () => ({
    name: '',
    code: '',
    description: '',
    status: 1,
  });

  const handleCancel = () => {
    props.handleClose();
  };

  const loadOrganization = async () => {
    setLoading(true);
    const res = await API.get(`/api/organization/search?keyword=${props.editingOrg.id}&p=0&page_size=1`);
    const { success, message, data } = res.data;
    if (success && data && data.items && data.items.length > 0) {
      const org = data.items[0];
      formApiRef.current?.setValues({
        name: org.name || '',
        code: org.code || '',
        description: org.description || '',
        status: org.status,
      });
    } else {
      showError(message || t('加载组织信息失败'));
    }
    setLoading(false);
  };

  useEffect(() => {
    if (formApiRef.current) {
      if (isEdit) {
        loadOrganization();
      } else {
        formApiRef.current.setValues(getInitValues());
      }
    }
  }, [props.editingOrg.id]);

  const submit = async (values) => {
    setLoading(true);
    const res = await API.put('/api/organization/', {
      id: parseInt(props.editingOrg.id),
      name: values.name,
      code: values.code,
      description: values.description,
      status: values.status,
    });
    const { success, message } = res.data;
    if (success) {
      showSuccess(t('组织更新成功！'));
      props.refresh();
      props.handleClose();
    } else {
      showError(message);
    }
    setLoading(false);
  };

  return (
    <SideSheet
      placement='right'
      title={
        <Space>
          <Tag color='blue' shape='circle'>
            {t('更新')}
          </Tag>
          <Title heading={4} className='m-0'>
            {t('更新组织信息')}
          </Title>
        </Space>
      }
      bodyStyle={{ padding: '0' }}
      visible={props.visible}
      width={600}
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
      onCancel={() => handleCancel()}
    >
      <Spin spinning={loading}>
        <Form
          initValues={getInitValues()}
          getFormApi={(api) => (formApiRef.current = api)}
          onSubmit={submit}
        >
          <div className='p-2'>
            <Card className='!rounded-2xl shadow-sm border-0'>
              <div className='flex items-center mb-2'>
                <Avatar size='small' color='blue' className='mr-2 shadow-md'>
                  <IconHome size={16} />
                </Avatar>
                <div>
                  <Text className='text-lg font-medium'>{t('基本信息')}</Text>
                  <div className='text-xs text-gray-600'>{t('修改组织的各项信息')}</div>
                </div>
              </div>

              <Row gutter={12}>
                <Col span={12}>
                  <Form.Input
                    field='name'
                    label={t('名称')}
                    placeholder={t('请输入组织名称')}
                    rules={[{ required: true, message: t('请输入组织名称') }]}
                    style={{ width: '100%' }}
                    showClear
                  />
                </Col>
                <Col span={12}>
                  <Form.Input
                    field='code'
                    label={t('编码')}
                    placeholder={t('请输入组织编码')}
                    rules={[{ required: true, message: t('请输入组织编码') }]}
                    style={{ width: '100%' }}
                    showClear
                  />
                </Col>
                <Col span={12}>
                  <Form.Select
                    field='status'
                    label={t('状态')}
                    placeholder={t('选择状态')}
                    optionList={[
                      { label: t('启用'), value: 1 },
                      { label: t('禁用'), value: 0 },
                    ]}
                    style={{ width: '100%' }}
                  />
                </Col>
                <Col span={24}>
                  <Form.TextArea
                    field='description'
                    label={t('描述')}
                    placeholder={t('请输入组织描述（可选）')}
                    style={{ width: '100%' }}
                    showClear
                  />
                </Col>
              </Row>
            </Card>
          </div>
        </Form>
      </Spin>
    </SideSheet>
  );
};

export default EditOrganizationModal;

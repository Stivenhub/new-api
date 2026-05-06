import React, { useRef } from 'react';
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
  InputNumber,
} from '@douyinfe/semi-ui';
import { IconSave, IconClose, IconHome } from '@douyinfe/semi-icons';

const { Text, Title } = Typography;

const AddDepartmentModal = (props) => {
  const { t } = useTranslation();
  const [loading, setLoading] = React.useState(false);
  const formApiRef = useRef(null);

  const getInitValues = () => ({
    organization_id: '',
    parent_id: 0,
    name: '',
    code: '',
    description: '',
    sort: 0,
    status: 1,
  });

  const handleCancel = () => {
    props.handleClose();
  };

  const submit = async (values) => {
    setLoading(true);
    const res = await API.post('/api/department/', {
      organization_id: values.organization_id,
      parent_id: parseInt(values.parent_id) || 0,
      name: values.name,
      code: values.code,
      description: values.description,
      sort: parseInt(values.sort) || 0,
      status: values.status,
    });
    const { success, message } = res.data;
    if (success) {
      showSuccess(t('部门创建成功！'));
      props.refresh();
      props.handleClose();
    } else {
      showError(message);
    }
    setLoading(false);
  };

  return (
    <SideSheet
      placement='left'
      title={
        <Space>
          <Tag color='green' shape='circle'>
            {t('新建')}
          </Tag>
          <Title heading={4} className='m-0'>
            {t('创建新部门')}
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
                  <div className='text-xs text-gray-600'>{t('设置部门的基本信息')}</div>
                </div>
              </div>

              <Row gutter={12}>
                <Col span={12}>
                  <Form.Select
                    field='organization_id'
                    label={t('所属组织')}
                    placeholder={t('选择组织')}
                    optionList={props.orgOptions}
                    rules={[{ required: true, message: t('请选择组织') }]}
                    style={{ width: '100%' }}
                    showClear
                  />
                </Col>
                <Col span={12}>
                  <Form.InputNumber
                    field='parent_id'
                    label={t('上级部门ID')}
                    placeholder={t('0表示根部门')}
                    min={0}
                    style={{ width: '100%' }}
                    showClear
                  />
                </Col>
                <Col span={12}>
                  <Form.Input
                    field='name'
                    label={t('名称')}
                    placeholder={t('请输入部门名称')}
                    rules={[{ required: true, message: t('请输入部门名称') }]}
                    style={{ width: '100%' }}
                    showClear
                  />
                </Col>
                <Col span={12}>
                  <Form.Input
                    field='code'
                    label={t('编码')}
                    placeholder={t('请输入部门编码')}
                    style={{ width: '100%' }}
                    showClear
                  />
                </Col>
                <Col span={12}>
                  <Form.InputNumber
                    field='sort'
                    label={t('排序')}
                    placeholder={t('数字越小越靠前')}
                    min={0}
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
                    placeholder={t('请输入部门描述（可选）')}
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

export default AddDepartmentModal;

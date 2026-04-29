import React, { useState, useEffect } from 'react';
import { Modal, Form, Select, Input, Switch, Space } from '@douyinfe/semi-ui';
import { useTranslation } from 'react-i18next';

const EditSensitiveRuleModal = ({ visible, onCancel, onSubmit, rule }) => {
  const { t } = useTranslation();
  const [loading, setLoading] = useState(false);
  const [formValues, setFormValues] = useState({
    name: '',
    rule_type: 'keyword',
    pattern: '',
    action: 'block',
    replace_text: '***',
    case_sensitive: false,
    scope: 'user',
    description: '',
  });

  useEffect(() => {
    if (rule) {
      setFormValues({
        name: rule.name || '',
        rule_type: rule.rule_type || 'keyword',
        pattern: rule.pattern || '',
        action: rule.action || 'block',
        replace_text: rule.replace_text || '***',
        case_sensitive: rule.case_sensitive || false,
        scope: rule.scope || 'user',
        description: rule.description || '',
      });
    }
  }, [rule]);

  const handleOk = async () => {
    if (!formValues.name.trim()) {
      return;
    }
    if (!formValues.pattern.trim()) {
      return;
    }
    setLoading(true);
    try {
      await onSubmit(rule.id, formValues);
    } catch (error) {
      // error handled by parent
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    onCancel();
  };

  return (
    <Modal
      title={t('编辑规则')}
      visible={visible}
      onOk={handleOk}
      onCancel={handleCancel}
      confirmLoading={loading}
      okText={t('保存')}
      cancelText={t('取消')}
      style={{ width: 520 }}
    >
      <Form layout='vertical'>
        <Form.Input
          field='name'
          label={t('规则名称')}
          placeholder={t('请输入规则名称')}
          value={formValues.name}
          onChange={(v) => setFormValues({ ...formValues, name: v })}
          required
        />
        <Form.Select
          field='rule_type'
          label={t('规则类型')}
          value={formValues.rule_type}
          onChange={(v) => setFormValues({ ...formValues, rule_type: v })}
          style={{ width: '100%' }}
        >
          <Select.Option value='keyword'>{t('关键词')}</Select.Option>
          <Select.Option value='regex'>{t('正则表达式')}</Select.Option>
          <Select.Option value='pattern'>{t('模式')}</Select.Option>
        </Form.Select>
        <Form.Input
          field='pattern'
          label={t('匹配模式')}
          placeholder={t('请输入敏感词或正则表达式')}
          value={formValues.pattern}
          onChange={(v) => setFormValues({ ...formValues, pattern: v })}
          required
        />
        <Form.Select
          field='action'
          label={t('动作')}
          value={formValues.action}
          onChange={(v) => setFormValues({ ...formValues, action: v })}
          style={{ width: '100%' }}
        >
          <Select.Option value='block'>{t('拦截')}</Select.Option>
          <Select.Option value='replace'>{t('替换')}</Select.Option>
          <Select.Option value='mask'>{t('脱敏')}</Select.Option>
          <Select.Option value='warn'>{t('警告')}</Select.Option>
        </Form.Select>
        <Form.Input
          field='replace_text'
          label={t('替换文本')}
          placeholder={t('默认: ***')}
          value={formValues.replace_text}
          onChange={(v) => setFormValues({ ...formValues, replace_text: v })}
        />
        <Space style={{ display: 'flex', alignItems: 'center' }}>
          <span>{t('区分大小写')}</span>
          <Switch
            checked={formValues.case_sensitive}
            onChange={(v) => setFormValues({ ...formValues, case_sensitive: v })}
          />
        </Space>
        <Form.Input
          field='description'
          label={t('描述')}
          placeholder={t('可选）输入规则描述')}
          value={formValues.description}
          onChange={(v) => setFormValues({ ...formValues, description: v })}
        />
      </Form>
    </Modal>
  );
};

export default EditSensitiveRuleModal;

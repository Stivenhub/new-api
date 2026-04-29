import React, { useState, useEffect } from 'react';
import { Modal, Select, Input, Switch, Space, Typography } from '@douyinfe/semi-ui';
import { useTranslation } from 'react-i18next';

const fieldStyle = {
  marginBottom: 20,
};

const labelStyle = {
  display: 'block',
  marginBottom: 6,
  fontSize: 14,
  fontWeight: 500,
  color: 'var(--semi-color-text-0)',
};

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

  const updateField = (field, value) => {
    setFormValues((prev) => ({ ...prev, [field]: value }));
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
      <div style={{ padding: '4px 0' }}>
        {/* 规则名称 */}
        <div style={fieldStyle}>
          <label style={labelStyle}>
            {t('规则名称')} <span style={{ color: 'var(--semi-color-danger)' }}>*</span>
          </label>
          <Input
            placeholder={t('请输入规则名称')}
            value={formValues.name}
            onChange={(v) => updateField('name', v)}
          />
        </div>

        {/* 规则类型 */}
        <div style={fieldStyle}>
          <label style={labelStyle}>{t('规则类型')}</label>
          <Select
            value={formValues.rule_type}
            onChange={(v) => updateField('rule_type', v)}
            style={{ width: '100%' }}
          >
            <Select.Option value='keyword'>{t('关键词')}</Select.Option>
            <Select.Option value='regex'>{t('正则表达式')}</Select.Option>
            <Select.Option value='pattern'>{t('模式')}</Select.Option>
          </Select>
        </div>

        {/* 匹配模式 */}
        <div style={fieldStyle}>
          <label style={labelStyle}>
            {t('匹配模式')} <span style={{ color: 'var(--semi-color-danger)' }}>*</span>
          </label>
          <Input
            placeholder={t('请输入敏感词或正则表达式')}
            value={formValues.pattern}
            onChange={(v) => updateField('pattern', v)}
          />
        </div>

        {/* 动作 */}
        <div style={fieldStyle}>
          <label style={labelStyle}>{t('动作')}</label>
          <Select
            value={formValues.action}
            onChange={(v) => updateField('action', v)}
            style={{ width: '100%' }}
          >
            <Select.Option value='block'>{t('拦截')}</Select.Option>
            <Select.Option value='replace'>{t('替换')}</Select.Option>
            <Select.Option value='mask'>{t('脱敏')}</Select.Option>
            <Select.Option value='warn'>{t('警告')}</Select.Option>
          </Select>
        </div>

        {/* 替换文本 */}
        <div style={fieldStyle}>
          <label style={labelStyle}>{t('替换文本')}</label>
          <Input
            placeholder={t('默认: ***')}
            value={formValues.replace_text}
            onChange={(v) => updateField('replace_text', v)}
          />
        </div>

        {/* 区分大小写 */}
        <div style={fieldStyle}>
          <Space style={{ display: 'flex', alignItems: 'center' }}>
            <Switch
              checked={formValues.case_sensitive}
              onChange={(v) => updateField('case_sensitive', v)}
            />
            <Typography.Text>{t('区分大小写')}</Typography.Text>
          </Space>
        </div>

        {/* 描述 */}
        <div style={fieldStyle}>
          <label style={labelStyle}>{t('描述')}</label>
          <Input
            placeholder={t('可选）输入规则描述')}
            value={formValues.description}
            onChange={(v) => updateField('description', v)}
          />
        </div>
      </div>
    </Modal>
  );
};

export default EditSensitiveRuleModal;

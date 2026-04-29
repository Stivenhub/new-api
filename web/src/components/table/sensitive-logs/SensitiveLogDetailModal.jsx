import React, { useState } from 'react';
import { Modal, Tag, Typography, Button, Tooltip, Toast } from '@douyinfe/semi-ui';
import { IconCopy, IconAlertTriangle, IconCheckCircle, IconClose, IconInfoCircle } from '@douyinfe/semi-icons';
import { useTranslation } from 'react-i18next';

const styles = {
  sectionCard: {
    background: 'var(--semi-color-bg-1)',
    border: '1px solid var(--semi-color-border)',
    borderRadius: 10,
    padding: 0,
    overflow: 'hidden',
  },
  sectionHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    padding: '12px 16px',
    background: 'var(--semi-color-fill-0)',
    borderBottom: '1px solid var(--semi-color-border)',
  },
  sectionBody: {
    padding: 16,
  },
  metaGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
    gap: '16px 24px',
  },
  metaItem: {
    display: 'flex',
    flexDirection: 'column',
    gap: 4,
  },
  metaLabel: {
    fontSize: 12,
    color: 'var(--semi-color-text-2)',
    fontWeight: 500,
    textTransform: 'uppercase',
    letterSpacing: '0.3px',
  },
  metaValue: {
    fontSize: 14,
    color: 'var(--semi-color-text-0)',
    fontWeight: 500,
    wordBreak: 'break-word',
  },
  contentBlock: {
    whiteSpace: 'pre-wrap',
    wordBreak: 'break-word',
    display: 'block',
    background: 'var(--semi-color-fill-0)',
    border: '1px solid var(--semi-color-border)',
    padding: 14,
    borderRadius: 8,
    marginTop: 8,
    maxHeight: 280,
    overflow: 'auto',
    fontSize: 13,
    lineHeight: 1.7,
    fontFamily: "'SF Mono', 'Fira Code', 'Consolas', monospace",
  },
  divider: {
    height: 1,
    background: 'var(--semi-color-border)',
    margin: '16px 0',
  },
  tagRow: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: 8,
    alignItems: 'center',
  },
  tokenMasked: {
    fontFamily: 'monospace',
    background: 'var(--semi-color-fill-1)',
    padding: '2px 8px',
    borderRadius: 4,
    fontSize: 13,
  },
  copyIcon: {
    cursor: 'pointer',
    color: 'var(--semi-color-text-2)',
    transition: 'color 0.2s',
    display: 'inline-flex',
    alignItems: 'center',
    marginLeft: 6,
  },
};

const SectionCard = ({ icon, title, children, style, bodyStyle }) => (
  <div style={{ ...styles.sectionCard, ...style }}>
    <div style={styles.sectionHeader}>
      {icon && <span style={{ color: 'var(--semi-color-text-2)', display: 'flex' }}>{icon}</span>}
      <Typography.Text strong size='small' style={{ color: 'var(--semi-color-text-1)' }}>
        {title}
      </Typography.Text>
    </div>
    <div style={{ ...styles.sectionBody, ...bodyStyle }}>
      {children}
    </div>
  </div>
);

const MetaItem = ({ label, children, span }) => (
  <div style={{ ...styles.metaItem, gridColumn: span ? `span ${span}` : undefined }}>
    <span style={styles.metaLabel}>{label}</span>
    <div style={styles.metaValue}>{children}</div>
  </div>
);

const CopyableValue = ({ value, maxLength }) => {
  const { t } = useTranslation();

  const handleCopy = () => {
    navigator.clipboard.writeText(value).then(() => {
      Toast.success(t('已复制'));
    }).catch(() => {
      Toast.error(t('复制失败'));
    });
  };

  const displayValue = maxLength && value?.length > maxLength
    ? `${value.substring(0, maxLength)}...`
    : value;

  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', flexWrap: 'wrap' }}>
      <span style={{ fontFamily: 'monospace', fontSize: 13, wordBreak: 'break-all' }}>
        {displayValue || '-'}
      </span>
      {value && (
        <Tooltip content={t('复制')}>
          <span
            style={styles.copyIcon}
            onClick={handleCopy}
            onMouseEnter={(e) => e.currentTarget.style.color = 'var(--semi-color-primary)'}
            onMouseLeave={(e) => e.currentTarget.style.color = 'var(--semi-color-text-2)'}
          >
            <IconCopy size={14} />
          </span>
        </Tooltip>
      )}
    </span>
  );
};

const SensitiveLogDetailModal = ({ visible, onCancel, log }) => {
  const { t } = useTranslation();
  const [isHovered, setIsHovered] = useState(false);

  if (!log) return null;

  const formatTimeISO = (timestamp) => {
    if (!timestamp) return '-';
    try {
      const d = new Date(timestamp * 1000);
      const pad = (n) => String(n).padStart(2, '0');
      return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}Z`;
    } catch {
      return '-';
    }
  };

  const getActionConfig = (action) => {
    const map = {
      block: { text: t('拦截'), color: 'red', icon: <IconClose size={14} /> },
      replace: { text: t('替换'), color: 'orange', icon: <IconInfoCircle size={14} /> },
      mask: { text: t('脱敏'), color: 'blue', icon: <IconInfoCircle size={14} /> },
      warn: { text: t('警告'), color: 'yellow', icon: <IconAlertTriangle size={14} /> },
    };
    return map[action] || { text: action, color: 'grey', icon: null };
  };

  const getRuleTypeTag = (type) => {
    const map = {
      keyword: { text: t('关键词'), color: 'blue' },
      regex: { text: t('正则表达式'), color: 'orange' },
      pattern: { text: t('模式匹配'), color: 'purple' },
    };
    const config = map[type] || { text: type, color: 'grey' };
    return <Tag color={config.color} size='small'>{config.text}</Tag>;
  };

  const getSourceTag = (source) => {
    const map = {
      chat: { text: t('聊天'), color: 'blue' },
      image: { text: t('图片'), color: 'cyan' },
      audio: { text: t('音频'), color: 'green' },
      file: { text: t('文件'), color: 'orange' },
      api: { text: t('API'), color: 'purple' },
    };
    const config = map[source] || { text: source, color: 'grey' };
    return <Tag color={config.color} size='small'>{config.text}</Tag>;
  };

  const maskToken = (token) => {
    if (!token || token.length <= 4) return token || '-';
    return `${'*'.repeat(token.length - 4)}${token.slice(-4)}`;
  };

  const actionConfig = getActionConfig(log.action);
  const contentSections = [];

  if (log.trigger_text) {
    contentSections.push({
      key: 'trigger_text',
      title: t('触发文本'),
      subtitle: t('触发敏感词检测的文本片段'),
      icon: <IconAlertTriangle size={16} style={{ color: 'var(--semi-color-warning)' }} />,
      content: log.trigger_text,
    });
  }

  if (log.matched_pattern) {
    contentSections.push({
      key: 'matched_pattern',
      title: t('匹配模式'),
      subtitle: t('命中规则'),
      icon: <IconInfoCircle size={16} style={{ color: 'var(--semi-color-primary)' }} />,
      content: log.matched_pattern,
    });
  }

  if (log.full_request_text) {
    contentSections.push({
      key: 'full_request_text',
      title: t('完整请求'),
      subtitle: t('触发时的完整请求内容'),
      icon: null,
      content: log.full_request_text,
      mono: true,
      maxHeight: 400,
    });
  }

  if (log.action_result) {
    contentSections.push({
      key: 'action_result',
      title: t('处理结果'),
      subtitle: t('系统对该请求的处理结果描述'),
      icon: null,
      content: log.action_result,
    });
  }

  if (log.metadata) {
    contentSections.push({
      key: 'metadata',
      title: t('元数据'),
      subtitle: t('附加的上下文信息'),
      icon: null,
      content: log.metadata,
      mono: true,
    });
  }

  return (
    <Modal
      title={
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 16, fontWeight: 600 }}>
          <IconAlertTriangle size={20} style={{ color: actionConfig.color === 'red' ? 'var(--semi-color-danger)' : 'var(--semi-color-warning)' }} />
          <span>{t('敏感日志详情')}</span>
          {getRuleTypeTag(log.rule_type)}
          <Tag
            color={actionConfig.color}
            style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontWeight: 600 }}
          >
            {actionConfig.icon}
            {actionConfig.text}
          </Tag>
          {log.request_blocked && (
            <Tag color='red' style={{ fontWeight: 600 }}>{t('已拦截')}</Tag>
          )}
        </div>
      }
      visible={visible}
      onCancel={onCancel}
      footer={
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
          <Button
            icon={<IconCopy />}
            onClick={() => {
              const text = JSON.stringify(log, null, 2);
              navigator.clipboard.writeText(text).then(() => {
                Toast.success(t('已复制全部数据'));
              });
            }}
          >
            {t('复制全部')}
          </Button>
          <Button type='primary' onClick={onCancel}>
            {t('关闭')}
          </Button>
        </div>
      }
      style={{ width: 780, maxWidth: '90vw' }}
      bodyStyle={{ padding: 20, maxHeight: '68vh', overflowY: 'auto' }}
      maskClosable
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
        {/* ===== 基础信息区 ===== */}
        <SectionCard
          icon={<IconInfoCircle size={16} />}
          title={t('基础信息')}
        >
          <div style={styles.metaGrid}>
            <MetaItem label={t('日志ID')}>
              <span style={{ fontFamily: 'monospace', fontWeight: 600, color: 'var(--semi-color-primary)' }}>
                #{log.id}
              </span>
            </MetaItem>
            <MetaItem label={t('用户名')}>
              <span style={{ fontWeight: 600 }}>{log.username || '-'}</span>
            </MetaItem>
            <MetaItem label={t('规则名称')}>
              <Tag color='red' type='light'>{log.rule_name || '-'}</Tag>
            </MetaItem>
            <MetaItem label={t('规则类型')}>
              {getRuleTypeTag(log.rule_type)}
            </MetaItem>
            <MetaItem label={t('触发动作')}>
              <Tag
                color={actionConfig.color}
                type='solid'
                style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontWeight: 600 }}
              >
                {actionConfig.icon}
                {actionConfig.text}
              </Tag>
            </MetaItem>
            <MetaItem label={t('是否拦截')}>
              {log.request_blocked ? (
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <IconClose size={16} style={{ color: 'var(--semi-color-danger)' }} />
                  <span style={{ color: 'var(--semi-color-danger)', fontWeight: 600 }}>{t('是')}</span>
                </div>
              ) : (
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <IconCheckCircle size={16} style={{ color: 'var(--semi-color-success)' }} />
                  <span style={{ color: 'var(--semi-color-success)', fontWeight: 600 }}>{t('否')}</span>
                </div>
              )}
            </MetaItem>
            <MetaItem label={t('来源')}>
              {getSourceTag(log.source)}
            </MetaItem>
            <MetaItem label={t('模型名称')}>
              <Tag color='grey' size='small' style={{ fontFamily: 'monospace' }}>
                {log.model_name || '-'}
              </Tag>
            </MetaItem>
            <MetaItem label={t('IP地址')}>
              <code style={{ fontSize: 13, background: 'var(--semi-color-fill-0)', padding: '2px 6px', borderRadius: 4 }}>
                {log.ip || '-'}
              </code>
            </MetaItem>
          </div>
        </SectionCard>

        {/* ===== 请求标识区 ===== */}
        <SectionCard
          title={t('请求标识')}
        >
          <div style={styles.metaGrid}>
            <MetaItem label={t('请求ID')}>
              <CopyableValue value={log.request_id} maxLength={32} />
            </MetaItem>
            <MetaItem label={t('Token')}>
              <code style={styles.tokenMasked}>{maskToken(log.token_name)}</code>
              {log.token_name && log.token_name.length > 4 && (
                <span style={{ fontSize: 11, color: 'var(--semi-color-text-3)', marginLeft: 6 }}>
                  ({t('已脱敏')})
                </span>
              )}
            </MetaItem>
          </div>
          <div style={{ ...styles.metaGrid, marginTop: 12 }}>
            <MetaItem label={t('User Agent')} span={2}>
              <div
                style={{
                  fontSize: 12,
                  color: 'var(--semi-color-text-1)',
                  wordBreak: 'break-all',
                  whiteSpace: 'pre-wrap',
                  lineHeight: 1.6,
                  background: 'var(--semi-color-fill-0)',
                  padding: '6px 10px',
                  borderRadius: 6,
                  fontFamily: 'monospace',
                  maxHeight: 80,
                  overflow: 'auto',
                }}
              >
                {log.user_agent || '-'}
              </div>
            </MetaItem>
            <MetaItem label={t('时间')}>
              <span style={{ fontFamily: 'monospace', fontSize: 13 }}>
                {formatTimeISO(log.created_at)}
              </span>
            </MetaItem>
          </div>
        </SectionCard>

        {/* ===== 内容详情区 ===== */}
        {contentSections.map((section, idx) => (
          <React.Fragment key={section.key}>
            {idx > 0 && <div style={styles.divider} />}
            <SectionCard
              icon={section.icon}
              title={
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <span>{section.title}</span>
                  {section.subtitle && (
                    <span style={{ fontSize: 12, color: 'var(--semi-color-text-3)', fontWeight: 400 }}>
                      — {section.subtitle}
                    </span>
                  )}
                </div>
              }
            >
              <Typography.Text
                style={{
                  ...styles.contentBlock,
                  fontFamily: section.mono ? "'SF Mono', 'Fira Code', 'Consolas', monospace" : undefined,
                  maxHeight: section.maxHeight || 280,
                  fontSize: section.mono ? 12 : 13,
                }}
              >
                {section.content}
              </Typography.Text>
            </SectionCard>
          </React.Fragment>
        ))}

        {/* 空白时的占位提示 */}
        {contentSections.length === 0 && (
          <div style={{ textAlign: 'center', padding: 32, color: 'var(--semi-color-text-2)' }}>
            <IconInfoCircle size={32} />
            <p style={{ marginTop: 8 }}>{t('无详细内容')}</p>
          </div>
        )}
      </div>
    </Modal>
  );
};

export default SensitiveLogDetailModal;

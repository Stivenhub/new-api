import React, { memo } from 'react';
import { Modal, Tag, Typography, Button, Toast } from '@douyinfe/semi-ui';
import { IconCopy, IconAlertTriangle, IconTickCircle, IconClose, IconInfoCircle } from '@douyinfe/semi-icons';
import { useTranslation } from 'react-i18next';

const TagRow = ({ children }) => (
  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, alignItems: 'center' }}>{children}</div>
);

const FieldGroup = ({ label, children, span }) => (
  <div style={{ gridColumn: span ? `span ${span}` : undefined, display: 'flex', flexDirection: 'column', gap: 4 }}>
    <span style={{ fontSize: 12, color: 'var(--semi-color-text-2)', fontWeight: 500 }}>{label}</span>
    <div style={{ fontSize: 14, color: 'var(--semi-color-text-0)', fontWeight: 500, wordBreak: 'break-word' }}>
      {children}
    </div>
  </div>
);

const ContentBlock = ({ children, mono, maxH }) => (
  <div style={{
    whiteSpace: 'pre-wrap', wordBreak: 'break-word', display: 'block',
    background: 'var(--semi-color-fill-0)', border: '1px solid var(--semi-color-border)',
    padding: 14, borderRadius: 8, marginTop: 8,
    maxHeight: maxH || 280, overflow: 'auto',
    fontSize: mono ? 12 : 13, lineHeight: 1.7,
    fontFamily: mono ? "'SF Mono','Fira Code','Consolas',monospace" : undefined,
  }}>{children}</div>
);

const SectionCard = ({ icon, title, children }) => (
  <div style={{ background: 'var(--semi-color-bg-1)', border: '1px solid var(--semi-color-border)', borderRadius: 10, overflow: 'hidden' }}>
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '12px 16px', background: 'var(--semi-color-fill-0)', borderBottom: '1px solid var(--semi-color-border)' }}>
      {icon && <span style={{ color: 'var(--semi-color-text-2)', display: 'flex' }}>{icon}</span>}
      <Typography.Text strong size='small' style={{ color: 'var(--semi-color-text-1)' }}>{title}</Typography.Text>
    </div>
    <div style={{ padding: 16 }}>{children}</div>
  </div>
);

const getActionConfig = (action, t) => ({
  block: { text: t('拦截'), color: 'red', icon: <IconClose size={14} /> },
  replace: { text: t('替换'), color: 'orange', icon: <IconInfoCircle size={14} /> },
  mask: { text: t('脱敏'), color: 'blue', icon: <IconInfoCircle size={14} /> },
  warn: { text: t('警告'), color: 'yellow', icon: <IconAlertTriangle size={14} /> },
}[action] || { text: action, color: 'grey', icon: null });

const ruleTypeTag = (type, t) => {
  const map = { keyword: { text: t('关键词'), color: 'blue' }, regex: { text: t('正则表达式'), color: 'orange' }, pattern: { text: t('模式匹配'), color: 'purple' } };
  const c = map[type] || { text: type, color: 'grey' };
  return <Tag color={c.color} size='small'>{c.text}</Tag>;
};

const sourceTag = (source, t) => {
  const map = { chat: { text: t('聊天'), color: 'blue' }, image: { text: t('图片'), color: 'cyan' }, audio: { text: t('音频'), color: 'green' }, file: { text: t('文件'), color: 'orange' }, api: { text: t('API'), color: 'purple' } };
  const c = map[source] || { text: source, color: 'grey' };
  return <Tag color={c.color} size='small'>{c.text}</Tag>;
};

const formatTime = (ts) => {
  if (!ts) return '-';
  try { const d = new Date(ts * 1000); return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}T${String(d.getHours()).padStart(2,'0')}:${String(d.getMinutes()).padStart(2,'0')}:${String(d.getSeconds()).padStart(2,'0')}Z`; }
  catch { return '-'; }
};

const maskToken = (token) => {
  if (!token || token.length <= 4) return token || '-';
  return `${'*'.repeat(token.length - 4)}${token.slice(-4)}`;
};

const SensitiveLogDetailModal = memo(({ visible, onCancel, log }) => {
  const { t } = useTranslation();
  if (!log) return null;

  const ac = getActionConfig(log.action, t);
  const metaGrid = { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '16px 24px' };
  const tokenMasked = { fontFamily: 'monospace', background: 'var(--semi-color-fill-1)', padding: '2px 8px', borderRadius: 4, fontSize: 13 };
  const divider = { height: 1, background: 'var(--semi-color-border)', margin: '16px 0' };

  return (
    <Modal
      title={
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 16, fontWeight: 600 }}>
          <IconAlertTriangle size={20} style={{ color: ac.color === 'red' ? 'var(--semi-color-danger)' : 'var(--semi-color-warning)' }} />
          <span>{t('敏感日志详情')}</span>
          {ruleTypeTag(log.rule_type, t)}
          <Tag color={ac.color} style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontWeight: 600 }}>
            {ac.icon}{ac.text}
          </Tag>
          {log.request_blocked && <Tag color='red' style={{ fontWeight: 600 }}>{t('已拦截')}</Tag>}
        </div>
      }
      visible={visible}
      onCancel={onCancel}
      footer={
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
          <Button icon={<IconCopy />} onClick={() => {
            navigator.clipboard.writeText(JSON.stringify(log, null, 2)).then(() => Toast.success(t('已复制全部数据')));
          }}>{t('复制全部')}</Button>
          <Button type='primary' onClick={onCancel}>{t('关闭')}</Button>
        </div>
      }
      style={{ width: 780, maxWidth: '90vw', height: '70vh' }}
      bodyStyle={{ padding: 20, overflowY: 'auto' }}
      maskClosable
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
        {/* 基础信息 */}
        <SectionCard icon={<IconInfoCircle size={16} />} title={t('基础信息')}>
          <div style={metaGrid}>
            <FieldGroup label={t('日志ID')}>
              <span style={{ fontFamily: 'monospace', fontWeight: 600, color: 'var(--semi-color-primary)' }}>#{log.id}</span>
            </FieldGroup>
            <FieldGroup label={t('用户名')}>
              <span style={{ fontWeight: 600 }}>{log.username || '-'}</span>
            </FieldGroup>
            <FieldGroup label={t('规则名称')}>
              <Tag color='red' type='light'>{log.rule_name || '-'}</Tag>
            </FieldGroup>
            <FieldGroup label={t('规则类型')}>{ruleTypeTag(log.rule_type, t)}</FieldGroup>
            <FieldGroup label={t('触发动作')}>
              <Tag color={ac.color} type='solid' style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontWeight: 600 }}>
                {ac.icon}{ac.text}
              </Tag>
            </FieldGroup>
            <FieldGroup label={t('是否拦截')}>
              {log.request_blocked ? (
                <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <IconClose size={16} style={{ color: 'var(--semi-color-danger)' }} />
                  <span style={{ color: 'var(--semi-color-danger)', fontWeight: 600 }}>{t('是')}</span>
                </span>
              ) : (
                <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <IconTickCircle size={16} style={{ color: 'var(--semi-color-success)' }} />
                  <span style={{ color: 'var(--semi-color-success)', fontWeight: 600 }}>{t('否')}</span>
                </span>
              )}
            </FieldGroup>
            <FieldGroup label={t('来源')}>{sourceTag(log.source, t)}</FieldGroup>
            <FieldGroup label={t('模型名称')}>
              <Tag color='grey' size='small' style={{ fontFamily: 'monospace' }}>{log.model_name || '-'}</Tag>
            </FieldGroup>
            <FieldGroup label={t('IP地址')}>
              <code style={{ fontSize: 13, background: 'var(--semi-color-fill-0)', padding: '2px 6px', borderRadius: 4 }}>{log.ip || '-'}</code>
            </FieldGroup>
          </div>
        </SectionCard>

        {/* 请求标识 */}
        <SectionCard title={t('请求标识')}>
          <div style={metaGrid}>
            <FieldGroup label={t('请求ID')}>
              <span style={{ fontFamily: 'monospace', fontSize: 13, wordBreak: 'break-all' }}>
                {log.request_id ? `${log.request_id.substring(0, 32)}...` : '-'}
              </span>
            </FieldGroup>
            <FieldGroup label={t('Token')}>
              <code style={tokenMasked}>{maskToken(log.token_name)}</code>
              {log.token_name?.length > 4 && (
                <span style={{ fontSize: 11, color: 'var(--semi-color-text-3)', marginLeft: 6 }}>({t('已脱敏')})</span>
              )}
            </FieldGroup>
          </div>
          <div style={{ ...metaGrid, marginTop: 12 }}>
            <FieldGroup label={t('User Agent')} span={2}>
              <div style={{ fontSize: 12, color: 'var(--semi-color-text-1)', wordBreak: 'break-all', whiteSpace: 'pre-wrap', lineHeight: 1.6, background: 'var(--semi-color-fill-0)', padding: '6px 10px', borderRadius: 6, fontFamily: 'monospace', maxHeight: 80, overflow: 'auto' }}>
                {log.user_agent || '-'}
              </div>
            </FieldGroup>
            <FieldGroup label={t('时间')}>
              <span style={{ fontFamily: 'monospace', fontSize: 13 }}>{formatTime(log.created_at)}</span>
            </FieldGroup>
          </div>
        </SectionCard>

        {/* 内容详情 */}
        {log.trigger_text && (
          <>
            <div style={divider} />
            <SectionCard icon={<IconAlertTriangle size={16} style={{ color: 'var(--semi-color-warning)' }} />}
              title={<>{t('触发文本')} <span style={{ fontSize: 12, color: 'var(--semi-color-text-3)', fontWeight: 400 }}>— {t('触发敏感词检测的文本片段')}</span></>}>
              <ContentBlock>{log.trigger_text}</ContentBlock>
            </SectionCard>
          </>
        )}
        {log.matched_pattern && (
          <>
            <div style={divider} />
            <SectionCard icon={<IconInfoCircle size={16} style={{ color: 'var(--semi-color-primary)' }} />}
              title={<>{t('匹配模式')} <span style={{ fontSize: 12, color: 'var(--semi-color-text-3)', fontWeight: 400 }}>— {t('命中规则')}</span></>}>
              <ContentBlock>{log.matched_pattern}</ContentBlock>
            </SectionCard>
          </>
        )}
        {log.full_request_text && (
          <>
            <div style={divider} />
            <SectionCard title={<>{t('完整请求')} <span style={{ fontSize: 12, color: 'var(--semi-color-text-3)', fontWeight: 400 }}>— {t('触发时的完整请求内容')}</span></>}>
              <ContentBlock mono maxH={400}>{log.full_request_text}</ContentBlock>
            </SectionCard>
          </>
        )}
        {log.action_result && (
          <>
            <div style={divider} />
            <SectionCard title={<>{t('处理结果')} <span style={{ fontSize: 12, color: 'var(--semi-color-text-3)', fontWeight: 400 }}>— {t('系统对该请求的处理结果描述')}</span></>}>
              <ContentBlock>{log.action_result}</ContentBlock>
            </SectionCard>
          </>
        )}
        {log.metadata && (
          <>
            <div style={divider} />
            <SectionCard title={<>{t('元数据')} <span style={{ fontSize: 12, color: 'var(--semi-color-text-3)', fontWeight: 400 }}>— {t('附加的上下文信息')}</span></>}>
              <ContentBlock mono>{log.metadata}</ContentBlock>
            </SectionCard>
          </>
        )}
        {!log.trigger_text && !log.matched_pattern && !log.full_request_text && !log.action_result && !log.metadata && (
          <div style={{ textAlign: 'center', padding: 32, color: 'var(--semi-color-text-2)' }}>
            <IconInfoCircle size={32} />
            <p style={{ marginTop: 8 }}>{t('无详细内容')}</p>
          </div>
        )}
      </div>
    </Modal>
  );
});

export default SensitiveLogDetailModal;

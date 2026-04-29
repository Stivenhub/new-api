import React, { useState, useEffect, useCallback } from 'react';
import { Modal, List, Typography, Tag, Spin } from '@douyinfe/semi-ui';
import { IconCommentStroked } from '@douyinfe/semi-icons';
import { useTranslation } from 'react-i18next';
import { getTopicMessages } from '../../../../services/chatAndSensitive';

const ChatMessagesModal = ({ visible, onCancel, topicId, topicTitle }) => {
  const { t } = useTranslation();
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);

  const loadMessages = useCallback(async (pageNum = 1) => {
    if (!topicId) return;
    setLoading(true);
    try {
      const response = await getTopicMessages(topicId, pageNum, 200);
      if (response.data.success) {
        setMessages(response.data.data.messages || []);
        setTotal(response.data.data.total || 0);
      }
    } catch (error) {
      console.error('Failed to load messages:', error);
    } finally {
      setLoading(false);
    }
  }, [topicId]);

  useEffect(() => {
    if (visible && topicId) {
      loadMessages(1);
      setPage(1);
    }
  }, [visible, topicId, loadMessages]);

  const formatTime = (timestamp) => {
    if (!timestamp) return '-';
    return new Date(timestamp * 1000).toLocaleString();
  };

  return (
    <Modal
      title={topicTitle ? `${t('话题详情')}: ${topicTitle}` : t('话题详情')}
      visible={visible}
      onCancel={onCancel}
      footer={null}
      style={{ width: 800 }}
      bodyStyle={{ maxHeight: '70vh', overflow: 'auto', padding: 20 }}
    >
      {loading ? (
        <div style={{ textAlign: 'center', padding: '60px 0' }}>
          <Spin size='large' />
          <Typography.Text style={{ display: 'block', marginTop: 16, color: 'var(--semi-color-text-2)' }}>
            {t('加载中...')}
          </Typography.Text>
        </div>
      ) : messages.length === 0 ? (
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '60px 20px',
            textAlign: 'center',
          }}
        >
          {/* 装饰图标 */}
          <div
            style={{
              width: 80,
              height: 80,
              borderRadius: '50%',
              background: 'var(--semi-color-fill-0)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: 24,
            }}
          >
            <IconCommentStroked
              size={40}
              style={{ color: 'var(--semi-color-primary-light-active)' }}
            />
          </div>

          {/* 主标题 */}
          <Typography.Title heading={5} style={{ marginBottom: 8, color: 'var(--semi-color-text-0)' }}>
            {t('暂无对话消息')}
          </Typography.Title>

          {/* 副标题 */}
          <Typography.Paragraph
            style={{
              margin: '0 0 0 0',
              color: 'var(--semi-color-text-2)',
              fontSize: 14,
              maxWidth: 360,
              lineHeight: 1.6,
            }}
          >
            {t('当前话题暂没有任何对话记录，请通过聊天界面发送消息开始对话。')}
          </Typography.Paragraph>

          {/* 装饰性底部横线 */}
          <div
            style={{
              marginTop: 32,
              width: 120,
              height: 3,
              borderRadius: 2,
              background: 'var(--semi-color-fill-1)',
            }}
          />
        </div>
      ) : (
        <>
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: 12,
            }}
          >
            <Typography.Text type='secondary' style={{ fontSize: 13 }}>
              {t('共 {{count}} 条消息', { count: total })}
            </Typography.Text>
          </div>
          <List
            dataSource={messages}
            renderItem={(item, index) => (
              <List.Item
                style={{
                  background: item.role === 'user' ? 'var(--semi-color-fill-0)' : 'transparent',
                  borderRadius: 8,
                  marginBottom: 8,
                  padding: '12px 16px',
                  border: item.role === 'user' ? 'none' : '1px solid var(--semi-color-border)',
                }}
              >
                <div style={{ width: '100%' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8, flexWrap: 'wrap' }}>
                    <Tag color={item.role === 'user' ? 'blue' : 'green'} size='small'>
                      {item.role === 'user' ? t('用户') : t('AI')}
                    </Tag>
                    {item.model_name && (
                      <Tag color='grey' size='small' style={{ fontFamily: 'monospace', fontSize: 11 }}>
                        {item.model_name}
                      </Tag>
                    )}
                    <Typography.Text size='small' type='secondary' style={{ fontSize: 12 }}>
                      {formatTime(item.created_at)}
                    </Typography.Text>
                    {item.total_tokens > 0 && (
                      <Typography.Text size='small' type='tertiary' style={{ fontSize: 12 }}>
                        {t('{{tokens}} tokens', { tokens: item.total_tokens })}
                      </Typography.Text>
                    )}
                  </div>
                  <Typography.Text
                    style={{
                      whiteSpace: 'pre-wrap',
                      wordBreak: 'break-word',
                      display: 'block',
                      maxHeight: 200,
                      overflow: 'auto',
                      fontSize: 13,
                      lineHeight: 1.6,
                    }}
                  >
                    {item.request_content || item.response_content || '-'}
                  </Typography.Text>
                </div>
              </List.Item>
            )}
          />
        </>
      )}
    </Modal>
  );
};

export default ChatMessagesModal;

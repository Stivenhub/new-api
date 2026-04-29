import React, { useState, useEffect, useCallback } from 'react';
import { Modal, List, Typography, Tag, Spin, Empty } from '@douyinfe/semi-ui';
import { useTranslation } from 'react-i18next';
import { getTopicMessages } from '../../../services/chatAndSensitive';

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
      bodyStyle={{ maxHeight: '70vh', overflow: 'auto' }}
    >
      {loading ? (
        <div style={{ textAlign: 'center', padding: '40px 0' }}>
          <Spin />
        </div>
      ) : messages.length === 0 ? (
        <Empty description={t('暂无消息')} />
      ) : (
        <>
          <Typography.Text type='secondary' style={{ marginBottom: 12, display: 'block' }}>
            {t('共 {{count}} 条消息', { count: total })}
          </Typography.Text>
          <List
            dataSource={messages}
            renderItem={(item) => (
              <List.Item
                style={{
                  background: item.role === 'user' ? 'var(--semi-color-fill-0)' : 'transparent',
                  borderRadius: 8,
                  marginBottom: 8,
                  padding: '12px 16px',
                }}
              >
                <div style={{ width: '100%' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                    <Tag color={item.role === 'user' ? 'blue' : 'green'}>
                      {item.role === 'user' ? t('用户') : t('AI')}
                    </Tag>
                    <Typography.Text size='small' type='secondary'>
                      {item.model_name || ''}
                    </Typography.Text>
                    <Typography.Text size='small' type='secondary'>
                      {formatTime(item.created_at)}
                    </Typography.Text>
                    {item.total_tokens > 0 && (
                      <Typography.Text size='small' type='tertiary'>
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

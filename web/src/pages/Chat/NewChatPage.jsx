/*
Copyright (C) 2025 QuantumNous

This program is free software: you can redistribute it and/or modify
it under the terms of the GNU Affero General Public License as
published by the Free Software Foundation, either version 3 of the
License, or (at your option) any later version.

This program is distributed in the hope that it will be useful,
but WITHOUT ANY WARRANTY; without even the implied warranty of
MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
GNU Affero General Public License for more details.

You should have received a copy of the GNU Affero General Public License
along with this program. If not, see <https://www.gnu.org/licenses/>.

For commercial licensing, please contact support@quantumnous.com
*/

import React, { useState, useEffect, useCallback } from 'react';
import { Layout, Button, Modal, Toast, Input, Typography, Empty, Spin } from '@douyinfe/semi-ui';
import { IconPlus, IconSearch } from '@douyinfe/semi-icons';
import { MessageSquare } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { getTopics, createTopic, deleteTopic, updateTopic, getTopicMessages } from '../../services/chatAndSensitive';
import TopicList from './components/TopicList';
import ChatWindow from './components/ChatWindow';
import './NewChatPage.css';

const { Sider, Content } = Layout;
const { Title, Text } = Typography;

const NewChatPage = () => {
  const { t } = useTranslation();
  
  // 状态管理
  const [topics, setTopics] = useState([]);
  const [currentTopicId, setCurrentTopicId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [topicsLoading, setTopicsLoading] = useState(false);
  const [searchKeyword, setSearchKeyword] = useState('');
  
  // 编辑话题弹窗
  const [editTopicModalVisible, setEditTopicModalVisible] = useState(false);
  const [editingTopic, setEditingTopic] = useState(null);
  const [editTopicTitle, setEditTopicTitle] = useState('');

  // 加载话题列表
  const loadTopics = useCallback(async () => {
    try {
      setTopicsLoading(true);
      const res = await getTopics(1, 100, 'last_message_at');
      if (res.data.success) {
        setTopics(res.data.data || []);
      } else {
        Toast.error(res.data.message || t('加载话题列表失败'));
      }
    } catch (error) {
      console.error('加载话题列表失败:', error);
      Toast.error(t('加载话题列表失败'));
    } finally {
      setTopicsLoading(false);
    }
  }, [t]);

  // 加载话题消息
  const loadTopicMessages = useCallback(async (topicId) => {
    if (!topicId) {
      setMessages([]);
      return;
    }
    
    try {
      setLoading(true);
      const res = await getTopicMessages(topicId, 1, 100);
      if (res.data.success) {
        const msgs = (res.data.data || []).map(msg => ({
          id: msg.id.toString(),
          role: msg.role,
          content: msg.response_content || msg.request_content || '',
          model: msg.model_name,
          created_at: msg.created_at,
          tokens: {
            request: msg.request_tokens,
            response: msg.response_tokens,
          },
        }));
        setMessages(msgs);
      } else {
        Toast.error(res.data.message || t('加载消息失败'));
      }
    } catch (error) {
      console.error('加载消息失败:', error);
      Toast.error(t('加载消息失败'));
    } finally {
      setLoading(false);
    }
  }, [t]);

  // 初始化加载
  useEffect(() => {
    loadTopics();
  }, [loadTopics]);

  // 选择话题
  const handleSelectTopic = (topicId) => {
    setCurrentTopicId(topicId);
    loadTopicMessages(topicId);
  };

  // 删除话题
  const handleDeleteTopic = async (topicId) => {
    Modal.confirm({
      title: t('确认删除'),
      content: t('确定要删除这个话题吗？此操作不可恢复。'),
      onOk: async () => {
        try {
          const res = await deleteTopic(topicId);
          if (res.data.success) {
            Toast.success(t('删除成功'));
            
            // 如果删除的是当前话题，清空消息
            if (currentTopicId === topicId) {
              setCurrentTopicId(null);
              setMessages([]);
            }
            
            await loadTopics();
          } else {
            Toast.error(res.data.message || t('删除失败'));
          }
        } catch (error) {
          console.error('删除话题失败:', error);
          Toast.error(t('删除失败'));
        }
      },
    });
  };

  // 打开编辑话题弹窗
  const handleOpenEditModal = (topic) => {
    setEditingTopic(topic);
    setEditTopicTitle(topic.title);
    setEditTopicModalVisible(true);
  };

  // 保存编辑
  const handleSaveEdit = async () => {
    if (!editTopicTitle.trim()) {
      Toast.warning(t('请输入话题标题'));
      return;
    }

    try {
      const res = await updateTopic(editingTopic.id, {
        title: editTopicTitle,
      });
      
      if (res.data.success) {
        Toast.success(t('更新成功'));
        setEditTopicModalVisible(false);
        setEditingTopic(null);
        setEditTopicTitle('');
        await loadTopics();
      } else {
        Toast.error(res.data.message || t('更新失败'));
      }
    } catch (error) {
      console.error('更新话题失败:', error);
      Toast.error(t('更新失败'));
    }
  };

  // 发送消息 - 支持无话题自动创建
  const handleSendMessage = async (messageData) => {
    // messageData = { content: string, images: Array<{base64: string, type: string}> }
    let topicId = currentTopicId;

    // 如果没有当前话题，自动创建一个
    if (!topicId) {
      try {
        const title = messageData.content.slice(0, 20) + (messageData.content.length > 20 ? '...' : '');
        const res = await createTopic({ title, model_name: 'default' });
        if (res.data.success && res.data.data) {
          topicId = res.data.data.id;
          setCurrentTopicId(topicId);
          await loadTopics();
        } else {
          Toast.error(res.data.message || t('创建对话失败'));
          return;
        }
      } catch (error) {
        console.error('自动创建话题失败:', error);
        Toast.error(t('创建对话失败'));
        return;
      }
    }

    // 将用户消息立即添加到界面（乐观更新）
    const userMsg = {
      id: 'temp-' + Date.now(),
      role: 'user',
      content: messageData.content,
      images: messageData.images || [],
      created_at: new Date().toISOString(),
    };
    setMessages(prev => [...prev, userMsg]);

    // TODO: 后续接入实际的 AI 回复 API
    console.log('发送消息到话题:', topicId, messageData);
  };

  // 新建对话 - 清空当前状态
  const handleNewConversation = () => {
    setCurrentTopicId(null);
    setMessages([]);
  };

  // 过滤话题列表
  const filteredTopics = searchKeyword
    ? topics.filter(topic => 
        topic.title.toLowerCase().includes(searchKeyword.toLowerCase())
      )
    : topics;

  return (
    <div className="new-chat-page">
      <Layout style={{ height: 'calc(100vh - 64px)', marginTop: '64px' }}>
        {/* 左侧话题列表 */}
        <Sider
          width={280}
          theme="light"
          className="chat-sider"
        >
          <div className="sider-header">
            <Title heading={5} style={{ margin: 0, color: 'white' }}>
              {t('聊天历史')}
            </Title>
            <Button
              icon={<IconPlus />}
              onClick={handleNewConversation}
              block
              theme="solid"
              type="tertiary"
              style={{
                background: 'rgba(255,255,255,0.2)',
                color: 'white',
                border: '1px solid rgba(255,255,255,0.3)',
              }}
            >
              {t('新建对话')}
            </Button>
          </div>

          {/* 搜索框 */}
          <div className="sider-search">
            <Input
              prefix={<IconSearch />}
              placeholder={t('搜索话题...')}
              value={searchKeyword}
              onChange={(value) => setSearchKeyword(value)}
              showClear
            />
          </div>

          {/* 话题列表 */}
          <div className="sider-content">
            <Spin spinning={topicsLoading}>
              {filteredTopics.length > 0 ? (
                <TopicList
                  topics={filteredTopics}
                  currentTopicId={currentTopicId}
                  onSelectTopic={handleSelectTopic}
                  onEditTopic={handleOpenEditModal}
                  onDeleteTopic={handleDeleteTopic}
                />
              ) : (
                <Empty
                  image={<MessageSquare size={48} />}
                  title={searchKeyword ? t('未找到相关话题') : t('暂无话题')}
                  description={
                    searchKeyword
                      ? t('尝试其他关键词')
                      : t('点击"新建对话"开始对话')
                  }
                />
              )}
            </Spin>
          </div>
        </Sider>

        {/* 右侧聊天窗口 - 始终显示 */}
        <Content className="chat-content">
          <ChatWindow
            topicId={currentTopicId}
            messages={messages}
            loading={loading}
            onSendMessage={handleSendMessage}
            onRefreshMessages={() => currentTopicId && loadTopicMessages(currentTopicId)}
          />
        </Content>
      </Layout>

      {/* 编辑话题弹窗 */}
      <Modal
        title={t('编辑话题')}
        visible={editTopicModalVisible}
        onOk={handleSaveEdit}
        onCancel={() => {
          setEditTopicModalVisible(false);
          setEditingTopic(null);
          setEditTopicTitle('');
        }}
        okText={t('保存')}
        cancelText={t('取消')}
      >
        <div>
          <Text strong>{t('话题标题')}</Text>
          <Input
            placeholder={t('请输入话题标题')}
            value={editTopicTitle}
            onChange={(value) => setEditTopicTitle(value)}
            style={{ marginTop: 8 }}
          />
        </div>
      </Modal>
    </div>
  );
};

export default NewChatPage;

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

import React, { useRef, useEffect, useState, useCallback } from 'react';
import { Spin, Typography, Card } from '@douyinfe/semi-ui';
import { MessageSquare, Send, Sparkles, Code, BookOpen, Lightbulb } from 'lucide-react';
import { useTranslation } from 'react-i18next';

const ChatWindow = ({ topicId, messages, loading, onSendMessage, onRefreshMessages }) => {
  const { t } = useTranslation();
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);
  const [inputValue, setInputValue] = useState('');
  const [pastedImages, setPastedImages] = useState([]);

  // 消息更新时滚动到底部
  useEffect(() => {
    if (messagesEndRef.current && messages.length > 0) {
      setTimeout(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
      }, 100);
    }
  }, [messages]);

  // 处理粘贴图片
  const handlePaste = useCallback((e) => {
    const items = e.clipboardData?.items;
    if (!items) return;

    for (let i = 0; i < items.length; i++) {
      if (items[i].type.startsWith('image/')) {
        e.preventDefault();
        const file = items[i].getAsFile();
        const reader = new FileReader();
        reader.onload = (event) => {
          setPastedImages(prev => [...prev, {
            id: Date.now() + '-' + Math.random().toString(36).substr(2, 9),
            base64: event.target.result,
            type: file.type,
            name: file.name || 'pasted-image',
          }]);
        };
        reader.readAsDataURL(file);
      }
    }
  }, []);

  // 处理发送
  const handleSend = useCallback(() => {
    const content = inputValue.trim();
    if (!content && pastedImages.length === 0) return;

    onSendMessage({
      content,
      images: pastedImages.map(img => ({ base64: img.base64, type: img.type })),
    });

    setInputValue('');
    setPastedImages([]);
  }, [inputValue, pastedImages, onSendMessage]);

  // 快捷提问
  const quickQuestions = [
    { icon: <Sparkles size={14} />, text: t('帮我写一段代码') },
    { icon: <BookOpen size={14} />, text: t('解释一个概念') },
    { icon: <Code size={14} />, text: t('代码审查') },
    { icon: <Lightbulb size={14} />, text: t('头脑风暴') },
  ];

  const handleQuickQuestion = (text) => {
    setInputValue(text);
    inputRef.current?.focus();
  };

  return (
    <Card
      className="chat-window-card"
      bordered={false}
      bodyStyle={{
        padding: 0,
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
      }}
    >
      {/* 聊天头部 - 渐变设计 */}
      <div className="chat-header-gradient">
        <div className="chat-header-content">
          <div className="chat-header-left">
            <div className="chat-avatar">
              <MessageSquare size={20} />
            </div>
            <div>
              <Typography.Title heading={5} className="chat-title">
                {t('AI 对话')}
              </Typography.Title>
              <Typography.Text className="chat-subtitle">
                {topicId ? `${t('话题')} #${topicId}` : t('新对话')}
              </Typography.Text>
            </div>
          </div>
        </div>
      </div>

      {/* 聊天内容区域 */}
      <div className="chat-body">
        <div className="chat-messages-area">
          <Spin spinning={loading} style={{ width: '100%', minHeight: 80 }}>
            {messages.length > 0 ? (
              /* 消息列表 */
              <div className="chat-messages-list">
                {messages.map((msg) => (
                  <div
                    key={msg.id}
                    className={`chat-message-item chat-message-${msg.role}`}
                  >
                    <div className="chat-message-avatar">
                      {msg.role === 'user' ? '👤' : '🤖'}
                    </div>
                    <div className="chat-message-bubble">
                      <div className="chat-message-content">{msg.content}</div>
                      {msg.images && msg.images.length > 0 && (
                        <div className="message-images">
                          {msg.images.map((img, idx) => (
                            <img
                              key={idx}
                              src={img.base64}
                              alt=""
                              className="message-image"
                            />
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
                <div ref={messagesEndRef} />
              </div>
            ) : (
              /* 豆包风格欢迎页 */
              <div className="doubao-welcome">
                <div className="doubao-welcome-icon">
                  <Sparkles size={32} />
                </div>
                <h2 className="doubao-welcome-title">
                  {t('有什么可以帮助你的？')}
                </h2>
                <p className="doubao-welcome-subtitle">
                  {t('我是 AI 助手，可以帮你解答问题、创作内容、分析数据')}
                </p>
                <div className="doubao-quick-questions">
                  {quickQuestions.map((q, idx) => (
                    <button
                      key={idx}
                      className="doubao-quick-btn"
                      onClick={() => handleQuickQuestion(q.text)}
                    >
                      <span className="doubao-quick-icon">{q.icon}</span>
                      <span>{q.text}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </Spin>
        </div>

        {/* 统一输入区域 - 始终在底部 */}
        <div className="chat-input-section" onPaste={handlePaste}>
          {/* 图片预览区域 */}
          {pastedImages.length > 0 && (
            <div className="image-preview-container">
              {pastedImages.map((img) => (
                <div key={img.id} className="image-preview-item">
                  <img src={img.base64} alt={img.name} />
                  <button
                    className="image-preview-remove"
                    onClick={() => setPastedImages(prev => prev.filter(i => i.id !== img.id))}
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
          )}
          {/* 输入框 */}
          <div className="chat-input-container">
            <div className="chat-input-box">
              <div className="chat-input-wrapper">
                <textarea
                  ref={inputRef}
                  className="chat-textarea"
                  placeholder={t('请输入您的问题... (Enter 发送，Shift+Enter 换行)')}
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  rows={1}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      handleSend();
                    }
                  }}
                />
              </div>
              <button
                className={`chat-send-btn ${(inputValue.trim() || pastedImages.length > 0) ? 'chat-send-btn-active' : ''}`}
                onClick={handleSend}
                disabled={!inputValue.trim() && pastedImages.length === 0}
              >
                <Send size={16} />
              </button>
            </div>
          </div>
        </div>
      </div>
    </Card>
  );
};

export default ChatWindow;

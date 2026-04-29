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
import { Spin, Typography, Card, Select, Tooltip } from '@douyinfe/semi-ui';
import {
  MessageSquare, Send, Sparkles, Code, BookOpen, Lightbulb,
  Image, Globe, PenLine, Languages, Music, BrainCircuit,
  Palette, ChevronDown, ChevronUp, X
} from 'lucide-react';
import { useTranslation } from 'react-i18next';

const ChatWindow = ({ topicId, currentTopicTitle, messages, loading, onSendMessage, onRefreshMessages, models, selectedModel, onModelChange }) => {
  const { t } = useTranslation();
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);
  const messagesAreaRef = useRef(null);
  const [inputValue, setInputValue] = useState('');
  const [pastedImages, setPastedImages] = useState([]);
  const [previewImage, setPreviewImage] = useState(null);
  const [toolbarExpanded, setToolbarExpanded] = useState(false);

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

  // 快捷提问卡片（豆包风格）
  const suggestionCards = [
    { icon: <Sparkles size={18} />, text: t('帮我写一段代码'), category: 'code' },
    { icon: <BookOpen size={18} />, text: t('解释一个概念'), category: 'learn' },
    { icon: <Lightbulb size={18} />, text: t('头脑风暴创意'), category: 'create' },
    { icon: <Code size={18} />, text: t('代码审查优化'), category: 'code' },
    { icon: <PenLine size={18} />, text: t('写一篇文章'), category: 'write' },
    { icon: <Globe size={18} />, text: t('总结新闻要点'), category: 'info' },
    { icon: <Languages size={18} />, text: t('翻译成英文'), category: 'trans' },
    { icon: <BrainCircuit size={18} />, text: t('制定学习计划'), category: 'plan' },
    { icon: <Palette size={18} />, text: t('设计配色方案'), category: 'create' },
  ];

  const handleQuickQuestion = (text) => {
    setInputValue(text);
    inputRef.current?.focus();
  };

  // 输入工具栏按钮
  const toolbarItems = [
    { icon: <Code size={16} />, label: t('编程'), action: () => setInputValue(t('帮我写一段代码')) },
    { icon: <PenLine size={16} />, label: t('写作'), action: () => setInputValue(t('写一篇文章')) },
    { icon: <Languages size={16} />, label: t('翻译'), action: () => setInputValue(t('翻译成英文')) },
    { icon: <BrainCircuit size={16} />, label: t('学习'), action: () => setInputValue(t('制定学习计划')) },
    { icon: <Palette size={16} />, label: t('设计'), action: () => setInputValue(t('设计配色方案')) },
  ];

  const visibleToolbarItems = toolbarExpanded ? toolbarItems : toolbarItems.slice(0, 4);

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
      {/* 聊天头部 */}
      <div className="chat-header-gradient">
        <div className="chat-header-content">
          <div className="chat-header-left">
            <div className="chat-avatar">
              <MessageSquare size={20} />
            </div>
            <div>
              <Typography.Title heading={5} className="chat-title" ellipsis={{ showTooltip: true, rows: 1 }}>
                {topicId && currentTopicTitle ? currentTopicTitle : t('AI 对话')}
              </Typography.Title>
              <Typography.Text className="chat-subtitle">
                {topicId ? `${t('话题')} #${topicId}` : t('新对话')}
              </Typography.Text>
            </div>
            {models.length > 0 && (
              <Select
                value={selectedModel}
                onChange={onModelChange}
                style={{ width: 180, marginLeft: 16 }}
                size="small"
                showSearch
                filter={(val, opt) => opt.value.toLowerCase().includes(val.toLowerCase())}
                placeholder={t('选择模型')}
                insetLabel={t('模型')}
              >
                {models.map((m) => (
                  <Select.Option key={m} value={m}>{m}</Select.Option>
                ))}
              </Select>
            )}
          </div>
        </div>
      </div>

      {/* 聊天内容区域 */}
      <div className="chat-body" ref={messagesAreaRef}>
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
                      {msg.role === 'user' ? (
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
                      ) : (
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 2a8 8 0 0 0-8 8c0 4.4 3.6 8 8 8s8-3.6 8-8-3.6-8-8-8z"/><path d="M12 6v6l4 2"/></svg>
                      )}
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
                              onClick={() => setPreviewImage(img.base64)}
                              style={{ cursor: 'pointer' }}
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
              /* 优化版 */
              <div className="doubao-welcome">
                <div className="doubao-welcome-header">
                  <div className="doubao-welcome-icon">
                    <Sparkles size={28} />
                  </div>
                  <h2 className="doubao-welcome-title">
                    {t('有什么可以帮助你的？')}
                  </h2>
                  <p className="doubao-welcome-subtitle">
                    {t('我是 AI 助手，可以帮你解答问题、创作内容、分析数据')}
                  </p>
                </div>

                {/* 快捷建议卡片 */}
                <div className="suggestion-grid">
                  {suggestionCards.map((card, idx) => (
                    <button
                      key={idx}
                      className="suggestion-card"
                      onClick={() => handleQuickQuestion(card.text)}
                    >
                      <span className="suggestion-card-icon">{card.icon}</span>
                      <span className="suggestion-card-text">{card.text}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </Spin>
        </div>

        {/* 统一输入区域 */}
        <div className="chat-input-section" onPaste={handlePaste}>
          {/* 图片预览区域 */}
          {pastedImages.length > 0 && (
            <div className="image-preview-container">
              {pastedImages.map((img) => (
                <div key={img.id} className="image-preview-item">
                  <img src={img.base64} alt={img.name} onClick={() => setPreviewImage(img.base64)} style={{ cursor: 'zoom-in' }} />
                  <button
                    className="image-preview-remove"
                    onClick={() => setPastedImages(prev => prev.filter(i => i.id !== img.id))}
                  >
                    <X size={10} />
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

            {/* 输入工具栏 */}
            <div className="input-toolbar">
              <div className="input-toolbar-items">
                {visibleToolbarItems.map((item, idx) => (
                  <Tooltip key={idx} content={item.label}>
                    <button
                      className="input-toolbar-btn"
                      onClick={item.action}
                      title={item.label}
                    >
                      {item.icon}
                      <span className="input-toolbar-label">{item.label}</span>
                    </button>
                  </Tooltip>
                ))}
                {toolbarItems.length > 4 && (
                  <button
                    className="input-toolbar-btn input-toolbar-expand"
                    onClick={() => setToolbarExpanded(!toolbarExpanded)}
                    title={toolbarExpanded ? t('收起') : t('更多')}
                  >
                    {toolbarExpanded ? <ChevronDown size={14} /> : <ChevronUp size={14} />}
                    <span className="input-toolbar-label">{toolbarExpanded ? t('收起') : t('更多')}</span>
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 图片预览遮罩 */}
      {previewImage && (
        <div className="image-preview-overlay" onClick={() => setPreviewImage(null)}>
          <img src={previewImage} alt="" className="image-preview-full" />
        </div>
      )}
    </Card>
  );
};

export default ChatWindow;

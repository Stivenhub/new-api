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

import React from 'react';
import { Dropdown, Button, Typography } from '@douyinfe/semi-ui';
import { IconMore, IconEdit, IconDelete } from '@douyinfe/semi-icons';
import { useTranslation } from 'react-i18next';

const { Text } = Typography;

const TopicList = ({ topics, currentTopicId, onSelectTopic, onEditTopic, onDeleteTopic }) => {
  const { t } = useTranslation();

  // 格式化时间
  const formatTime = (timestamp) => {
    if (!timestamp) return '';
    const date = new Date(timestamp * 1000);
    const now = new Date();
    const diff = now - date;
    
    // 小于1小时显示分钟
    if (diff < 3600000) {
      const minutes = Math.floor(diff / 60000);
      return minutes <= 0 ? t('刚刚') : `${minutes}${t('分钟前')}`;
    }
    
    // 小于24小时显示小时
    if (diff < 86400000) {
      const hours = Math.floor(diff / 3600000);
      return `${hours}${t('小时前')}`;
    }
    
    // 否则显示日期
    return date.toLocaleDateString();
  };

  return (
    <div className="topic-list">
      {topics.map((topic) => {
        const isActive = currentTopicId === topic.id;
        
        return (
          <div
            key={topic.id}
            className={`topic-item ${isActive ? 'active' : ''}`}
            onClick={() => onSelectTopic(topic.id)}
          >
            <div className="topic-content">
              <Text 
                strong={isActive}
                ellipsis={{ showTooltip: true }}
                className="topic-title"
              >
                {topic.title || t('未命名话题')}
              </Text>
              <div className="topic-meta">
                <Text size="small" type="tertiary">
                  {formatTime(topic.last_message_at)}
                </Text>
                {topic.message_count > 0 && (
                  <Text size="small" type="tertiary">
                    · {topic.message_count}{t('条消息')}
                  </Text>
                )}
              </div>
            </div>
            
            <Dropdown
              render={
                <Dropdown.Menu>
                  <Dropdown.Item
                    icon={<IconEdit />}
                    onClick={(e) => {
                      e.stopPropagation();
                      onEditTopic(topic);
                    }}
                  >
                    {t('重命名')}
                  </Dropdown.Item>
                  <Dropdown.Item
                    icon={<IconDelete />}
                    onClick={(e) => {
                      e.stopPropagation();
                      onDeleteTopic(topic.id);
                    }}
                  >
                    {t('删除')}
                  </Dropdown.Item>
                </Dropdown.Menu>
              }
              trigger="click"
              position="bottomRight"
            >
              <Button
                theme="borderless"
                icon={<IconMore />}
                size="small"
                className="topic-more-btn"
                onClick={(e) => e.stopPropagation()}
              />
            </Dropdown>
          </div>
        );
      })}
    </div>
  );
};

export default TopicList;

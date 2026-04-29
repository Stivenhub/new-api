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

import React, { useRef, useCallback } from 'react';
import { Toast } from '@douyinfe/semi-ui';
import { useTranslation } from 'react-i18next';

/**
 * 简化的输入渲染组件，不依赖 PlaygroundContext
 * 适用于新聊天页面
 */
const SimpleInputRender = (props) => {
  const { t } = useTranslation();
  const { detailProps } = props;
  const { inputNode, sendNode, onClick } = detailProps || {};
  const containerRef = useRef(null);

  // 发送按钮样式
  const styledSendNode = sendNode
    ? React.cloneElement(sendNode, {
        className: `!rounded-full !bg-gradient-to-r !from-purple-500 !to-blue-500 hover:!from-purple-600 hover:!to-blue-600 !text-white flex-shrink-0 transition-all shadow-md hover:shadow-lg ${sendNode.props?.className || ''}`,
        style: {
          ...sendNode.props?.style,
          width: '36px',
          height: '36px',
          minWidth: '36px',
          padding: 0,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        },
      })
    : null;

  return (
    <div className="chat-input-container" ref={containerRef}>
      <div
        className="chat-input-box"
        onClick={onClick}
      >
        {/* 输入框 */}
        <div className="chat-input-wrapper">{inputNode}</div>
        {/* 发送按钮 */}
        {styledSendNode}
      </div>
    </div>
  );
};

export default SimpleInputRender;

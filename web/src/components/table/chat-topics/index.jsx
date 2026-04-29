/*
Copyright (C) 2025 QuantumNous
*/

import React from 'react';
import CardPro from '../../common/ui/CardPro';
import ChatTopicsTable from './ChatTopicsTable';
import ChatMessagesModal from './modals/ChatMessagesModal';
import { useChatHistoryData } from '../../../hooks/chat-history/useChatHistoryData';
import { useIsMobile } from '../../../hooks/common/useIsMobile';
import { createCardProPagination } from '../../../helpers/utils';

const ChatTopicsPage = () => {
  const chatData = useChatHistoryData();
  const isMobile = useIsMobile();

  return (
    <CardPro
      type='type2'
      title={chatData.t('聊天历史')}
      paginationArea={createCardProPagination({
        currentPage: chatData.activePage,
        pageSize: chatData.pageSize,
        total: chatData.topicCount,
        onPageChange: chatData.handlePageChange,
        onPageSizeChange: chatData.handlePageSizeChange,
        isMobile: isMobile,
        t: chatData.t,
      })}
      t={chatData.t}
    >
      <ChatTopicsTable {...chatData} />
      <ChatMessagesModal
        visible={chatData.detailModalVisible}
        topicId={chatData.currentTopic?.id}
        topicTitle={chatData.currentTopic?.title}
        onCancel={() => { chatData.setDetailModalVisible(false); chatData.setCurrentTopic(null); }}
      />
    </CardPro>
  );
};

export default ChatTopicsPage;

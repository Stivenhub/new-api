import React from 'react';
import { Typography } from '@douyinfe/semi-ui';
import { IconUserGroup } from '@douyinfe/semi-icons';
import CompactModeToggle from '../../common/ui/CompactModeToggle';

const { Text } = Typography;

const RolesDescription = ({ compactMode, setCompactMode, t }) => {
  return (
    <div className='flex flex-col md:flex-row justify-between items-start md:items-center gap-2 w-full'>
      <div className='flex items-center text-blue-500'>
        <IconUserGroup className='mr-2' />
        <Text>{t('自定义角色管理')}</Text>
      </div>
      <CompactModeToggle
        compactMode={compactMode}
        setCompactMode={setCompactMode}
        t={t}
      />
    </div>
  );
};

export default RolesDescription;

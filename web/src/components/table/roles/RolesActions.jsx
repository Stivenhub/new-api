import React from 'react';
import { Button } from '@douyinfe/semi-ui';

const RolesActions = ({ setShowAdd, t }) => {
  const handleAddRole = () => {
    setShowAdd(true);
  };

  return (
    <div className='flex gap-2 w-full md:w-auto order-2 md:order-1'>
      <Button className='w-full md:w-auto' onClick={handleAddRole} size='small'>
        {t('添加角色')}
      </Button>
    </div>
  );
};

export default RolesActions;

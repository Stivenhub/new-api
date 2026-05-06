import React from 'react';
import { Button } from '@douyinfe/semi-ui';

const OrganizationsActions = ({ setEditingOrg, setShowAdd, t }) => {
  const handleAddOrganization = () => {
    setEditingOrg({
      id: undefined,
    });
    setShowAdd(true);
  };

  return (
    <div className='flex flex-wrap gap-2 w-full md:w-auto order-2 md:order-1'>
      <Button
        type='primary'
        className='flex-1 md:flex-initial'
        onClick={handleAddOrganization}
        size='small'
      >
        {t('添加组织')}
      </Button>
    </div>
  );
};

export default OrganizationsActions;

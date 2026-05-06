import React from 'react';
import { Button } from '@douyinfe/semi-ui';

const DepartmentsActions = ({ setShowAddDepartment, t }) => {
  const handleAddDepartment = () => {
    setShowAddDepartment(true);
  };

  return (
    <div className='flex flex-wrap gap-2 w-full md:w-auto order-2 md:order-1'>
      <Button
        type='primary'
        className='flex-1 md:flex-initial'
        onClick={handleAddDepartment}
        size='small'
      >
        {t('添加部门')}
      </Button>
    </div>
  );
};

export default DepartmentsActions;

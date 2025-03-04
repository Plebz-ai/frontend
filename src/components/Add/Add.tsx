import React from 'react';

interface AddProps {
  title?: string;
}

export const Add: React.FC<AddProps> = ({ title }) => {
  return (
    <div className="component">
      <h3>{title || 'Add Component'}</h3>
    </div>
  );
};

export default Add;

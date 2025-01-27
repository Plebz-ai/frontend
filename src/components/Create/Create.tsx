import React from 'react';

interface CreateProps {
  title?: string;
}

export const Create: React.FC<CreateProps> = ({ title }) => {
  return (
    <div className="component">
      <h3>{title || 'Create Component'}</h3>
    </div>
  );
};

export default Create;

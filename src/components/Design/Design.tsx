import React from 'react';

interface DesignProps {
  title?: string;
}

export const Design: React.FC<DesignProps> = ({ title }) => {
  return (
    <div className="component">
      <h3>{title || 'Design Component'}</h3>
    </div>
  );
};

export default Design;

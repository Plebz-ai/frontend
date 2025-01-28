import React from 'react';

interface BuildProps {
  title?: string;
}

export const Build: React.FC<BuildProps> = ({ title }) => {
  return (
    <div className="component">
      <h3>{title || 'Build Component'}</h3>
    </div>
  );
};

export default Build;

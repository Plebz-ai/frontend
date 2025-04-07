import React from 'react';

interface SetupProps {
  title?: string;
}

export const Setup: React.FC<SetupProps> = ({ title }) => {
  return (
    <div className="component">
      <h3>{title || 'Setup Component'}</h3>
    </div>
  );
};

export default Setup;

import React from 'react';

interface SquareSpinnerProps {
  label?: string;
  className?: string;
}

export const SquareSpinner: React.FC<SquareSpinnerProps> = ({ label = 'Caricamento in corso...', className = '' }) => {
  return (
    <div className={`flex flex-col items-center justify-center p-6 gap-4 ${className}`} role="status" aria-live="polite">
      <div className="spinner-squares relative" aria-hidden="true">
        <span></span>
        <span></span>
        <span></span>
        <span></span>
      </div>
      {label && <span className="text-sm font-medium text-stone-600">{label}</span>}
      <span className="sr-only">{label}</span>
    </div>
  );
};

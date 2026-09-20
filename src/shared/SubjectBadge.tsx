import React from 'react';
import { Materia } from '../data/models';
import { getAccessibleTextColor } from '../orario/subjectColors';

interface SubjectBadgeProps {
  materia?: Materia | null;
  fallbackText?: string;
  size?: 'sm' | 'md' | 'lg';
  showDotOnlyOnMobile?: boolean;
  className?: string;
}

export const SubjectBadge: React.FC<SubjectBadgeProps> = ({
  materia,
  fallbackText = 'Generale',
  size = 'md',
  className = '',
}) => {
  if (!materia) {
    return (
      <span
        className={`inline-flex items-center gap-1.5 rounded-full font-medium bg-stone-100 text-stone-600 border border-stone-200 ${
          size === 'sm' ? 'px-2 py-0.5 text-xs' : size === 'lg' ? 'px-3.5 py-1 text-sm' : 'px-2.5 py-0.5 text-xs'
        } ${className}`}
      >
        <span className="w-1.5 h-1.5 rounded-full bg-stone-400" aria-hidden="true"></span>
        <span>{fallbackText}</span>
      </span>
    );
  }

  const textColor = getAccessibleTextColor(materia.colore);

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-md font-semibold tracking-tight shadow-2xs whitespace-nowrap ${
        size === 'sm'
          ? 'px-2 py-0.5 text-xs'
          : size === 'lg'
          ? 'px-3 py-1 text-sm'
          : 'px-2.5 py-0.5 text-xs'
      } ${className}`}
      style={{
        backgroundColor: materia.colore,
        color: textColor,
      }}
      title={`Materia: ${materia.nome}`}
    >
      <span
        className="w-1.5 h-1.5 rounded-full shrink-0"
        style={{ backgroundColor: textColor === '#FFFFFF' ? 'rgba(255,255,255,0.7)' : 'rgba(0,0,0,0.4)' }}
        aria-hidden="true"
      />
      <span className="truncate">{materia.nome}</span>
    </span>
  );
};

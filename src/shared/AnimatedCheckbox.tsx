import React from 'react';

interface AnimatedCheckboxProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  id?: string;
  ariaLabel?: string;
  disabled?: boolean;
}

export const AnimatedCheckbox: React.FC<AnimatedCheckboxProps> = ({
  checked,
  onChange,
  id,
  ariaLabel = 'Completa elemento',
  disabled = false,
}) => {
  return (
    <label className="animated-checkbox-wrapper" htmlFor={id}>
      <input
        type="checkbox"
        id={id}
        checked={checked}
        onChange={e => onChange(e.target.checked)}
        disabled={disabled}
        aria-label={ariaLabel}
        className="animated-checkbox-input"
      />
      <div className="animated-checkbox-box" aria-hidden="true">
        <svg className="animated-checkbox-check" viewBox="0 0 24 24" width="16" height="16">
          <polyline points="20 6 9 17 4 12" />
        </svg>
      </div>
    </label>
  );
};

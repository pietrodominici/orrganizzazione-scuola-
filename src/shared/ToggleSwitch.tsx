import React from 'react';

interface ToggleSwitchProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  id?: string;
  label?: string;
  disabled?: boolean;
}

export const ToggleSwitch: React.FC<ToggleSwitchProps> = ({
  checked,
  onChange,
  id,
  label,
  disabled = false,
}) => {
  const inputId = id || `toggle-${Math.random().toString(36).substring(2, 6)}`;
  return (
    <label htmlFor={inputId} className="inline-flex items-center gap-2 cursor-pointer select-none">
      <div className="custom-toggle">
        <input
          type="checkbox"
          id={inputId}
          checked={checked}
          onChange={e => onChange(e.target.checked)}
          disabled={disabled}
        />
        <span className="custom-toggle-slider"></span>
      </div>
      {label && <span className="text-sm font-medium text-stone-700">{label}</span>}
    </label>
  );
};

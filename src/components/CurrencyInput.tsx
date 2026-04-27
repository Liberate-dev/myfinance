import { type FC, useState, useEffect } from 'react';

interface CurrencyInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
}

export const CurrencyInput: FC<CurrencyInputProps> = ({
  value,
  onChange,
  placeholder = '0',
  disabled = false,
  className = '',
}) => {
  const [displayValue, setDisplayValue] = useState('');

  useEffect(() => {
    if (value === '' || value === '0') {
      setDisplayValue('');
    } else {
      const num = parseFloat(value.replace(/,/g, ''));
      if (!isNaN(num)) {
        setDisplayValue(num.toLocaleString('id-ID'));
      }
    }
  }, [value]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value.replace(/[^\d]/g, '');
    if (raw === '') {
      setDisplayValue('');
      onChange('');
      return;
    }
    const num = parseInt(raw, 10);
    setDisplayValue(num.toLocaleString('id-ID'));
    onChange(raw);
  };

  return (
    <input
      type="text"
      inputMode="numeric"
      value={displayValue}
      onChange={handleChange}
      placeholder={placeholder}
      disabled={disabled}
      className={className}
    />
  );
};

export default CurrencyInput;

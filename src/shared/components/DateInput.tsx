import React, { useRef, useState, useEffect } from 'react';

interface DateInputProps {
  value: string;
  onChange: (value: string) => void;
  className?: string;
}

export function DateInput({ value, onChange, className }: DateInputProps) {
  // value is expected in 'yyyy-MM-dd' format
  const parseDateToDisplay = (isoStr: string) => {
    if (!isoStr || isoStr.length !== 10) return '';
    const [year, month, day] = isoStr.split('-');
    if (!year || !month || !day) return '';
    return `${day}/${month}/${year}`;
  };

  const [displayValue, setDisplayValue] = useState(parseDateToDisplay(value));
  const previousValueRef = useRef(value);

  useEffect(() => {
    if (value !== previousValueRef.current) {
      setDisplayValue(parseDateToDisplay(value));
      previousValueRef.current = value;
    }
  }, [value]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let input = e.target.value.replace(/\D/g, ''); // Remove non-digits
    
    if (input.length > 8) {
      input = input.slice(0, 8);
    }
    
    // Format as dd/mm/yyyy
    let formatted = '';
    if (input.length > 0) {
      formatted = input.slice(0, 2);
    }
    if (input.length > 2) {
      formatted += '/' + input.slice(2, 4);
    }
    if (input.length > 4) {
      formatted += '/' + input.slice(4, 8);
    }
    
    setDisplayValue(formatted);

    // If fully entered, try to emit ISO string
    if (input.length === 8) {
      const day = parseInt(input.slice(0, 2), 10);
      const month = parseInt(input.slice(2, 4), 10);
      const year = parseInt(input.slice(4, 8), 10);

      // Basic validation
      if (day > 0 && day <= 31 && month > 0 && month <= 12 && year >= 1900 && year <= 2100) {
        const isoStr = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
        previousValueRef.current = isoStr;
        onChange(isoStr);
      }
    }
  };

  const handleBlur = () => {
    // Revert to known good value if completely invalid on blur
    if (displayValue.length > 0 && displayValue.length < 10) {
       setDisplayValue(parseDateToDisplay(previousValueRef.current));
    }
  };

  return (
    <input
      type="text"
      placeholder="dd/mm/yyyy"
      value={displayValue}
      onChange={handleChange}
      onBlur={handleBlur}
      className={className}
    />
  );
}

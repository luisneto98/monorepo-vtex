import React from 'react';

export const Calendar = ({ selected, onSelect, initialFocus }: any) => {
  const formatDateForInput = (date: any) => {
    if (!date) return '';

    // Se for uma string, converte para Date
    if (typeof date === 'string') {
      date = new Date(date);
    }

    // Verifica se é uma Date válida
    if (!(date instanceof Date) || isNaN(date.getTime())) {
      return '';
    }

    return date.toISOString().split('T')[0];
  };

  const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const dateValue = e.target.value;
    if (dateValue) {
      const newDate = new Date(dateValue);
      // Ajustar para evitar problemas de timezone
      newDate.setMinutes(newDate.getMinutes() + newDate.getTimezoneOffset());
      onSelect?.(newDate);
    } else {
      onSelect?.(undefined);
    }
  };

  return (
    <div className="p-3">
      <input
        type="date"
        value={formatDateForInput(selected)}
        onChange={handleDateChange}
        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        autoFocus={initialFocus}
      />
    </div>
  );
};
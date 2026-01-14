import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon } from 'lucide-react';
import { Button } from './shadcn/Button';

interface CalendarEvent {
  id: string;
  title: string;
  date: Date;
  time?: string;
  color?: string;
  type?: string;
}

interface CalendarProps {
  events?: CalendarEvent[];
  onDateSelect?: (date: Date) => void;
  onEventClick?: (event: CalendarEvent) => void;
  selectedDate?: Date;
  minDate?: Date;
  maxDate?: Date;
}

const DAYS = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
const MONTHS = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
];

export function Calendar({ 
  events = [], 
  onDateSelect, 
  onEventClick,
  selectedDate,
  minDate,
  maxDate 
}: CalendarProps) {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [viewDate, setViewDate] = useState(new Date());

  const year = viewDate.getFullYear();
  const month = viewDate.getMonth();

  const firstDayOfMonth = new Date(year, month, 1);
  const lastDayOfMonth = new Date(year, month + 1, 0);
  const startingDayOfWeek = firstDayOfMonth.getDay();
  const daysInMonth = lastDayOfMonth.getDate();

  const prevMonth = () => {
    setViewDate(new Date(year, month - 1, 1));
  };

  const nextMonth = () => {
    setViewDate(new Date(year, month + 1, 1));
  };

  const goToToday = () => {
    setViewDate(new Date());
  };

  const isToday = (day: number) => {
    const today = new Date();
    return (
      day === today.getDate() &&
      month === today.getMonth() &&
      year === today.getFullYear()
    );
  };

  const isSelected = (day: number) => {
    if (!selectedDate) return false;
    return (
      day === selectedDate.getDate() &&
      month === selectedDate.getMonth() &&
      year === selectedDate.getFullYear()
    );
  };

  const isDisabled = (day: number) => {
    const date = new Date(year, month, day);
    if (minDate && date < minDate) return true;
    if (maxDate && date > maxDate) return true;
    return false;
  };

  const getEventsForDay = (day: number) => {
    return events.filter(event => {
      const eventDate = new Date(event.date);
      return (
        eventDate.getDate() === day &&
        eventDate.getMonth() === month &&
        eventDate.getFullYear() === year
      );
    });
  };

  const handleDateClick = (day: number) => {
    if (isDisabled(day)) return;
    const date = new Date(year, month, day);
    onDateSelect?.(date);
  };

  // Generate calendar days
  const days: (number | null)[] = [];
  for (let i = 0; i < startingDayOfWeek; i++) {
    days.push(null);
  }
  for (let i = 1; i <= daysInMonth; i++) {
    days.push(i);
  }

  return (
    <div className="w-full max-w-md bg-white dark:bg-gray-900 rounded-lg shadow-lg p-4">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <Button variant="ghost" size="icon" onClick={prevMonth}>
          <ChevronLeft className="w-5 h-5" />
        </Button>
        
        <div className="flex items-center space-x-2">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
            {MONTHS[month]} {year}
          </h2>
          <Button variant="ghost" size="sm" onClick={goToToday} className="text-xs">
            Hoje
          </Button>
        </div>
        
        <Button variant="ghost" size="icon" onClick={nextMonth}>
          <ChevronRight className="w-5 h-5" />
        </Button>
      </div>

      {/* Days of week header */}
      <div className="grid grid-cols-7 gap-1 mb-2">
        {DAYS.map(day => (
          <div
            key={day}
            className="text-center text-xs font-medium text-gray-500 dark:text-gray-400 py-2"
          >
            {day}
          </div>
        ))}
      </div>

      {/* Calendar grid */}
      <AnimatePresence mode="wait">
        <motion.div
          key={`${month}-${year}`}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          className="grid grid-cols-7 gap-1"
        >
          {days.map((day, index) => {
            if (day === null) {
              return <div key={`empty-${index}`} className="aspect-square" />;
            }

            const dayEvents = getEventsForDay(day);
            const disabled = isDisabled(day);

            return (
              <button
                key={day}
                onClick={() => handleDateClick(day)}
                disabled={disabled}
                className={`
                  aspect-square p-1 rounded-lg text-sm font-medium transition-colors relative
                  ${isToday(day) ? 'bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300' : ''}
                  ${isSelected(day) ? 'bg-primary-600 text-white' : ''}
                  ${disabled ? 'text-gray-300 dark:text-gray-600 cursor-not-allowed' : 'hover:bg-gray-100 dark:hover:bg-gray-800'}
                  ${!isToday(day) && !isSelected(day) && !disabled ? 'text-gray-700 dark:text-gray-300' : ''}
                `}
              >
                <span>{day}</span>
                
                {/* Event indicators */}
                {dayEvents.length > 0 && (
                  <div className="absolute bottom-1 left-1/2 transform -translate-x-1/2 flex space-x-0.5">
                    {dayEvents.slice(0, 3).map((event, i) => (
                      <span
                        key={event.id}
                        className="w-1.5 h-1.5 rounded-full"
                        style={{ backgroundColor: event.color || '#3b82f6' }}
                      />
                    ))}
                  </div>
                )}
              </button>
            );
          })}
        </motion.div>
      </AnimatePresence>

      {/* Events list for selected date */}
      {selectedDate && (
        <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
          <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Eventos em {selectedDate.toLocaleDateString('pt-BR')}
          </h3>
          <div className="space-y-2 max-h-40 overflow-y-auto">
            {getEventsForDay(selectedDate.getDate()).length === 0 ? (
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Nenhum evento neste dia
              </p>
            ) : (
              getEventsForDay(selectedDate.getDate()).map(event => (
                <button
                  key={event.id}
                  onClick={() => onEventClick?.(event)}
                  className="w-full flex items-center space-x-2 p-2 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors text-left"
                >
                  <span
                    className="w-2 h-2 rounded-full flex-shrink-0"
                    style={{ backgroundColor: event.color || '#3b82f6' }}
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                      {event.title}
                    </p>
                    {event.time && (
                      <p className="text-xs text-gray-500">{event.time}</p>
                    )}
                  </div>
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// Mini Calendar for date picker
interface MiniCalendarProps {
  value?: Date;
  onChange?: (date: Date) => void;
  minDate?: Date;
  maxDate?: Date;
}

export function MiniCalendar({ value, onChange, minDate, maxDate }: MiniCalendarProps) {
  return (
    <Calendar
      selectedDate={value}
      onDateSelect={onChange}
      minDate={minDate}
      maxDate={maxDate}
    />
  );
}

// Date Range Picker
interface DateRangePickerProps {
  startDate?: Date;
  endDate?: Date;
  onRangeChange?: (start: Date, end: Date) => void;
}

export function DateRangePicker({ startDate, endDate, onRangeChange }: DateRangePickerProps) {
  const [selecting, setSelecting] = useState<'start' | 'end'>('start');
  const [tempStart, setTempStart] = useState<Date | undefined>(startDate);
  const [tempEnd, setTempEnd] = useState<Date | undefined>(endDate);

  const handleDateSelect = (date: Date) => {
    if (selecting === 'start') {
      setTempStart(date);
      setSelecting('end');
    } else {
      if (tempStart && date >= tempStart) {
        setTempEnd(date);
        onRangeChange?.(tempStart, date);
      } else {
        setTempStart(date);
        setSelecting('end');
      }
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center space-x-4">
        <div className={`flex-1 p-3 rounded-lg border-2 cursor-pointer transition-colors ${
          selecting === 'start' 
            ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20' 
            : 'border-gray-200 dark:border-gray-700'
        }`}
        onClick={() => setSelecting('start')}
        >
          <p className="text-xs text-gray-500 dark:text-gray-400">Data inicial</p>
          <p className="font-medium text-gray-900 dark:text-white">
            {tempStart ? tempStart.toLocaleDateString('pt-BR') : 'Selecione'}
          </p>
        </div>
        <div className={`flex-1 p-3 rounded-lg border-2 cursor-pointer transition-colors ${
          selecting === 'end' 
            ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20' 
            : 'border-gray-200 dark:border-gray-700'
        }`}
        onClick={() => setSelecting('end')}
        >
          <p className="text-xs text-gray-500 dark:text-gray-400">Data final</p>
          <p className="font-medium text-gray-900 dark:text-white">
            {tempEnd ? tempEnd.toLocaleDateString('pt-BR') : 'Selecione'}
          </p>
        </div>
      </div>
      
      <Calendar
        selectedDate={selecting === 'start' ? tempStart : tempEnd}
        onDateSelect={handleDateSelect}
        minDate={selecting === 'end' ? tempStart : undefined}
      />
    </div>
  );
}

import { format, formatDistanceToNow, differenceInMinutes, addDays, startOfWeek, endOfWeek } from 'date-fns';

export const formatDate = (date: string | Date) => {
  return format(new Date(date), 'MMM d, yyyy');
};

export const formatTime = (date: string | Date) => {
  return format(new Date(date), 'h:mm a');
};

export const formatDateTime = (date: string | Date) => {
  return format(new Date(date), 'MMM d, yyyy h:mm a');
};

export const getTimeAgo = (date: string | Date) => {
  return formatDistanceToNow(new Date(date), { addSuffix: true });
};

export const calculateDuration = (startTime: string, endTime: string) => {
  return differenceInMinutes(new Date(endTime), new Date(startTime));
};

export const formatDuration = (minutes: number) => {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;

  if (hours > 0) {
    return `${hours}h ${mins}m`;
  }
  return `${mins}m`;
};

export const getWeekDates = (date: Date = new Date()) => {
  return {
    start: startOfWeek(date, { weekStartsOn: 1 }),
    end: endOfWeek(date, { weekStartsOn: 1 })
  };
};

export const getDayOfWeek = (date: Date) => {
  return format(date, 'EEEE');
};

export const addDaysToDate = (date: Date, days: number) => {
  return addDays(date, days);
};

export const isToday = (date: string | Date) => {
  const today = new Date();
  const checkDate = new Date(date);
  return format(today, 'yyyy-MM-dd') === format(checkDate, 'yyyy-MM-dd');
};

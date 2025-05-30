import { format, formatDistanceToNow, isValid } from 'date-fns';

export const formatDate = (date) => {
  const d = typeof date === 'string' ? new Date(date) : date;
  return isValid(d) ? format(d, 'MMM dd, yyyy') : '-';
};

export const formatDateTime = (date) => {
  const d = typeof date === 'string' ? new Date(date) : date;
  return isValid(d) ? format(d, 'MMM dd, yyyy hh:mm a') : '-';
};

export const formatTimeAgo = (date) => {
  const d = typeof date === 'string' ? new Date(date) : date;
  return isValid(d) ? formatDistanceToNow(d, { addSuffix: true }) : '-';
};

export const getTodayString = () => {
  return format(new Date(), 'yyyy-MM-dd');
};
import {
  differenceInDays,
  differenceInHours,
  differenceInMinutes,
  format,
} from 'date-fns';

export function getReadableDate(date: Date): string {
  const now = new Date();

  // Calculate differences
  const minutesDiff = differenceInMinutes(now, date);
  const hoursDiff = differenceInHours(now, date);
  const daysDiff = differenceInDays(now, date);

  // Less than 1 minute ago
  if (minutesDiff < 1) {
    return '< 1 minute ago';
  }

  // Less than 1 hour ago
  if (hoursDiff < 1) {
    return `${minutesDiff} min${minutesDiff > 1 ? 's' : ''} ago`;
  }

  // Less than 1 day ago
  if (daysDiff < 1) {
    if (hoursDiff > 5) {
      return `about ${hoursDiff} hrs ago`;
    } else {
      if (hoursDiff === 1 && minutesDiff < 75) {
        return `about an hr ago`;
      }

      if (minutesDiff >= 75 && minutesDiff < 105) {
        return `about ${hoursDiff} hr${
          hoursDiff > 1 ? 's' : ''
        } and 30 min ago`;
      }

      return `about ${hoursDiff + 1} hrs ago`;
    }
  }

  // 1 day ago
  if (daysDiff === 1) {
    return 'Yesterday';
  }

  // Less than 7 days ago
  if (daysDiff <= 7) {
    return `${daysDiff} day${daysDiff > 1 ? 's' : ''} ago`;
  }

  // More than 7 days ago
  return format(date, 'MMM. d, yyyy @ h:mm');
}

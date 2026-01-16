const API_BASE = '/api';

/**
 * Save a report to history after it's generated
 * @param {Object} params - Report parameters
 * @param {number} userId - Current user ID
 * @param {string} reportType - Type of report (summary, events, trips, etc.)
 * @param {string} period - Period label (Today, Yesterday, This Week, etc.)
 */

export const saveReportToHistory = async ({
  userId,
  reportType,
  deviceIds = [],
  groupIds = [],
  from,
  to,
  period = 'Custom',
  additionalParams = {},
  description = null,
}) => {
  try {
    const payload = {
      userId,
      reportType,
      deviceIds: JSON.stringify(deviceIds),
      groupIds: JSON.stringify(groupIds),
      fromDate: from,
      toDate: to,
      additionalParams: JSON.stringify(additionalParams),
      generatedAt: new Date().toISOString(),
      description,
      period,
    };

    const response = await fetch(`${API_BASE}/reporthistory`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      throw new Error('Failed to save report history');
    }

    return await response.json();
  } catch (error) {
    console.error('Error saving report history:', error);
    return null;
  }
};

/**
 * Get period label based on from/to dates
 * @param {string} from - Start date
 * @param {string} to - End date
 * @returns {string} Period label
 */

export const getPeriodLabel = (from, to) => {
  const fromDate = new Date(from);
  const toDate = new Date(to);
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);

  const fromDateOnly = new Date(fromDate);
  fromDateOnly.setHours(0, 0, 0, 0);

  const toDateOnly = new Date(toDate);
  toDateOnly.setHours(0, 0, 0, 0);

  if (fromDateOnly.getTime() === today.getTime() && toDateOnly.getTime() === today.getTime()) {
    return 'Today';
  }

  if (fromDateOnly.getTime() === yesterday.getTime() && toDateOnly.getTime() === yesterday.getTime()) {
    return 'Yesterday';
  }

  const weekStart = new Date(today);
  weekStart.setDate(today.getDate() - today.getDay());
  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekStart.getDate() + 6);

  if (fromDateOnly.getTime() === weekStart.getTime() && toDateOnly.getTime() === weekEnd.getTime()) {
    return 'This Week';
  }

  const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);
  const monthEnd = new Date(today.getFullYear(), today.getMonth() + 1, 0);

  if (fromDateOnly.getTime() === monthStart.getTime() && toDateOnly.getTime() === monthEnd.getTime()) {
    return 'This Month';
  }

  return 'Custom';
};

export default {
  saveReportToHistory,
  getPeriodLabel,
};

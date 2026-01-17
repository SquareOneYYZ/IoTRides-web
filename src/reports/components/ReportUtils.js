// Report History and Favorites Utility Functions

const normalizeDate = (dateStr) => {
  if (!dateStr) return '';
  const date = new Date(dateStr);
  return date.toISOString().split('T')[0];
};

const normalizeArray = (arr) => {
  if (!Array.isArray(arr)) return '';
  return [...arr].sort((a, b) => a - b).join(',');
};

const safeJsonParse = (jsonStr, defaultValue = null) => {
  try {
    return JSON.parse(jsonStr);
  } catch {
    return defaultValue;
  }
};

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

const areDuplicateReports = (report1, report2) => {
  // Normalize dates to YYYY-MM-DD format for comparison
  const date1From = normalizeDate(report1.fromDate);
  const date1To = normalizeDate(report1.toDate);
  const date2From = normalizeDate(report2.from);
  const date2To = normalizeDate(report2.to);

  console.log('Comparing dates:', {
    report1: { from: date1From, to: date1To },
    report2: { from: date2From, to: date2To },
  });

  if (date1From !== date2From || date1To !== date2To) {
    console.log('Dates do not match - not a duplicate');
    return false;
  }

  // Normalize and compare device IDs
  const devices1 = normalizeArray(safeJsonParse(report1.deviceIds, []));
  const devices2 = normalizeArray(report2.deviceIds || []);

  console.log('Comparing devices:', { devices1, devices2 });

  if (devices1 !== devices2) {
    console.log('Devices do not match - not a duplicate');
    return false;
  }

  // Normalize and compare group IDs
  const groups1 = normalizeArray(safeJsonParse(report1.groupIds, []));
  const groups2 = normalizeArray(report2.groupIds || []);

  console.log('Comparing groups:', { groups1, groups2 });

  if (groups1 !== groups2) {
    console.log('Groups do not match - not a duplicate');
    return false;
  }

  // Compare additional parameters (deep comparison)
  const params1 = JSON.stringify(safeJsonParse(report1.additionalParams, {}));
  const params2 = JSON.stringify(report2.additionalParams || {});

  console.log('Comparing params:', { params1, params2 });

  const isDuplicate = params1 === params2;
  console.log(isDuplicate ? 'DUPLICATE FOUND' : 'Not a duplicate');

  return isDuplicate;
};

export const fetchReportHistory = async (userId, reportType) => {
  try {
    const response = await fetch(`/api/reporthistory?userId=${userId}&reportType=${reportType}`);

    if (!response.ok) {
      throw new Error('Failed to fetch report history');
    }

    const data = await response.json();

    if (Array.isArray(data)) {
      return data.filter((item) => item.reportType === reportType);
    } if (data && data.reportType === reportType) {
      return [data];
    }

    return [];
  } catch (error) {
    console.error('Error fetching report history:', error);
    return [];
  }
};

// Save or update report history (updates generatedAt if duplicate exists)
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
  console.log('=== SAVING TO HISTORY ===');
  console.log('Parameters:', {
    userId, reportType, deviceIds, groupIds, from, to, period, additionalParams,
  });

  try {
    const history = await fetchReportHistory(userId, reportType);
    console.log(`Found ${history.length} existing reports in history`);

    const duplicate = history.find((item) => areDuplicateReports(item, { from, to, deviceIds, groupIds, additionalParams }));

    if (duplicate) {
      console.log('Duplicate found! Updating timestamp for report ID:', duplicate.id);

      const updateResponse = await fetch(`/api/reporthistory/${duplicate.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          generatedAt: new Date().toISOString(),
        }),
      });

      if (!updateResponse.ok) {
        throw new Error('Failed to update report history');
      }

      const updated = await updateResponse.json();
      console.log('Report timestamp updated successfully');
      return updated;
    }

    console.log('No duplicate found - creating new history entry');

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

    console.log('Creating new report with payload:', payload);

    const createResponse = await fetch('/api/reporthistory', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    if (!createResponse.ok) {
      throw new Error('Failed to create report history');
    }

    const created = await createResponse.json();
    console.log('New report created successfully with ID:', created.id);
    return created;
  } catch (error) {
    console.error('Error saving report to history:', error);
    return null;
  }
};

export const deleteReportHistory = async (reportId) => {
  try {
    const response = await fetch(`/api/reporthistory/${reportId}`, {
      method: 'DELETE',
    });

    return response.ok;
  } catch (error) {
    console.error('Error deleting report history:', error);
    return false;
  }
};

export const fetchFavoriteReports = async (userId, reportType) => {
  try {
    const response = await fetch(`/api/favoritereports?userId=${userId}&reportType=${reportType}`);

    if (!response.ok) {
      throw new Error('Failed to fetch favorite reports');
    }

    const data = await response.json();
    return Array.isArray(data) ? data : [data];
  } catch (error) {
    console.error('Error fetching favorite reports:', error);
    return [];
  }
};

export const createFavoriteReport = async ({
  name,
  description,
  reportType,
  deviceIds = [],
  groupIds = [],
  additionalParams = {},
  period = 'Custom',
}) => {
  try {
    const payload = {
      name,
      description,
      reportType,
      deviceIds: JSON.stringify(deviceIds),
      groupIds: JSON.stringify(groupIds),
      additionalParams: JSON.stringify(additionalParams),
      period,
    };

    const response = await fetch('/api/favoritereports', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      throw new Error('Failed to create favorite report');
    }

    return await response.json();
  } catch (error) {
    console.error('Error creating favorite report:', error);
    return null;
  }
};

export const updateFavoriteReport = async (favoriteId, updates) => {
  try {
    const response = await fetch(`/api/favoritereports/${favoriteId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates),
    });

    if (!response.ok) {
      throw new Error('Failed to update favorite report');
    }

    return await response.json();
  } catch (error) {
    console.error('Error updating favorite report:', error);
    return null;
  }
};

export const deleteFavoriteReport = async (favoriteId) => {
  try {
    const response = await fetch(`/api/favoritereports/${favoriteId}`, {
      method: 'DELETE',
    });

    return response.ok;
  } catch (error) {
    console.error('Error deleting favorite report:', error);
    return false;
  }
};

// Parse saved report config for re-running
export const parseReportConfig = (report) => {
  if (!report) {
    console.error('parseReportConfig: No report provided');
    return null;
  }

  const deviceIds = safeJsonParse(report.deviceIds, []);
  const groupIds = safeJsonParse(report.groupIds, []);
  const additionalParams = safeJsonParse(report.additionalParams, {});

  if (!report.fromDate || !report.toDate) {
    console.error('parseReportConfig: Missing fromDate or toDate', report);
    return null;
  }

  return {
    deviceIds,
    groupIds,
    from: report.fromDate,
    to: report.toDate,
    period: report.period || 'Custom',
    additionalParams,
  };
};

export default {
  getPeriodLabel,
  saveReportToHistory,
  deleteReportHistory,
  fetchReportHistory,
  fetchFavoriteReports,
  createFavoriteReport,
  updateFavoriteReport,
  deleteFavoriteReport,
  parseReportConfig,
};

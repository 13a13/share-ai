
import { Report } from '@/types';
import { getAllReports, getReportsByPropertyId, getReportById } from './reportQueries';
import { createReport } from './reportCreation';

/**
 * Base Reports API for fetching and creating reports
 */
export const BaseReportsAPI = {
  /**
   * Get all reports
   */
  getAll: getAllReports,
  
  /**
   * Get reports by property ID
   */
  getByPropertyId: getReportsByPropertyId,
  
  /**
   * Get full report by ID with all rooms
   */
  getById: getReportById,
  
  /**
   * Create a new report
   */
  create: createReport,
};

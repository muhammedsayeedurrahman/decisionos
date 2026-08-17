import { WeekInfo } from './types';

// ─── Dimension & Timing Constants ───
export const WORKING_HOURS_START = 8; // 8 AM
export const WORKING_HOURS_COUNT = 11; // 8 AM to 7 PM (11 hours)
export const CALENDAR_HEIGHT_PX = 520;
export const MOBILE_BREAKPOINT_PX = 768;
export const PULL_REFRESH_DELAY_MS = 1000;
export const PULL_REFRESH_THRESHOLD_PX = 80;

// ─── Demo Calendar Date Range ───
export const DEMO_CALENDAR_MIN_DATE = '2026-07-27';
export const DEMO_CALENDAR_MAX_DATE = '2026-09-06';

// ─── Filter Tabs ───
export const FILTER_TABS = [
  { key: 'ALL', label: 'All Tasks' },
  { key: 'CUSTOMER', label: 'Customers' },
  { key: 'SUPPLIER', label: 'Suppliers' },
  { key: 'INVOICE', label: 'Invoices' },
  { key: 'PAYMENT', label: 'Payments' },
  { key: 'COMPLAINT', label: 'Complaints' },
  { key: 'TASK', label: 'Tasks' },
  { key: 'REMINDER', label: 'Reminders' },
  { key: 'APPROVAL', label: 'Approvals' },
];

// ─── 6 Weeks of August 2026 Dataset ───
export const weeksData: WeekInfo[] = [
  {
    weekNum: 31,
    label: 'W31',
    days: [
      { name: 'MON', date: '27', fullDateLabel: 'July 27', dayNum: 1, month: 'prev', dayOfYear: 208 },
      { name: 'TUE', date: '28', fullDateLabel: 'July 28', dayNum: 2, month: 'prev', dayOfYear: 209 },
      { name: 'WED', date: '29', fullDateLabel: 'July 29', dayNum: 3, month: 'prev', dayOfYear: 210 },
      { name: 'THU', date: '30', fullDateLabel: 'July 30', dayNum: 4, month: 'prev', dayOfYear: 211 },
      { name: 'FRI', date: '31', fullDateLabel: 'July 31', dayNum: 5, month: 'prev', dayOfYear: 212 },
      { name: 'SAT', date: '1',  fullDateLabel: 'August 1', dayNum: 6, month: 'current', dayOfYear: 213 },
      { name: 'SUN', date: '2',  fullDateLabel: 'August 2', dayNum: 7, month: 'current', dayOfYear: 214 },
    ]
  },
  {
    weekNum: 32,
    label: 'W32',
    days: [
      { name: 'MON', date: '3',  fullDateLabel: 'August 3', dayNum: 1, month: 'current', dayOfYear: 215 },
      { name: 'TUE', date: '4',  fullDateLabel: 'August 4', dayNum: 2, month: 'current', dayOfYear: 216 },
      { name: 'WED', date: '5',  fullDateLabel: 'August 5', dayNum: 3, month: 'current', dayOfYear: 217 },
      { name: 'THU', date: '6',  fullDateLabel: 'August 6', dayNum: 4, month: 'current', dayOfYear: 218 },
      { name: 'FRI', date: '7',  fullDateLabel: 'August 7', dayNum: 5, month: 'current', dayOfYear: 219 },
      { name: 'SAT', date: '8',  fullDateLabel: 'August 8', dayNum: 6, month: 'current', dayOfYear: 220 },
      { name: 'SUN', date: '9',  fullDateLabel: 'August 9', dayNum: 7, month: 'current', dayOfYear: 221 },
    ]
  },
  {
    weekNum: 33,
    label: 'W33',
    days: [
      { name: 'MON', date: '10', fullDateLabel: 'August 10', dayNum: 1, month: 'current', dayOfYear: 222 },
      { name: 'TUE', date: '11', fullDateLabel: 'August 11', dayNum: 2, month: 'current', dayOfYear: 223 },
      { name: 'WED', date: '12', fullDateLabel: 'August 12', dayNum: 3, month: 'current', dayOfYear: 224 },
      { name: 'THU', date: '13', fullDateLabel: 'August 13', dayNum: 4, month: 'current', dayOfYear: 225 },
      { name: 'FRI', date: '14', fullDateLabel: 'August 14', dayNum: 5, month: 'current', dayOfYear: 226 },
      { name: 'SAT', date: '15', fullDateLabel: 'August 15', dayNum: 6, month: 'current', dayOfYear: 227 },
      { name: 'SUN', date: '16', fullDateLabel: 'August 16', dayNum: 7, month: 'current', dayOfYear: 228 },
    ]
  },
  {
    weekNum: 34,
    label: 'W34',
    days: [
      { name: 'MON', date: '17', fullDateLabel: 'August 17', dayNum: 1, month: 'current', dayOfYear: 229 },
      { name: 'TUE', date: '18', fullDateLabel: 'August 18', dayNum: 2, month: 'current', dayOfYear: 230 },
      { name: 'WED', date: '19', fullDateLabel: 'August 19', dayNum: 3, month: 'current', dayOfYear: 231 },
      { name: 'THU', date: '20', fullDateLabel: 'August 20', dayNum: 4, month: 'current', dayOfYear: 232 },
      { name: 'FRI', date: '21', fullDateLabel: 'August 21', dayNum: 5, month: 'current', dayOfYear: 233 },
      { name: 'SAT', date: '22', fullDateLabel: 'August 22', dayNum: 6, month: 'current', dayOfYear: 234 },
      { name: 'SUN', date: '23', fullDateLabel: 'August 23', dayNum: 7, month: 'current', dayOfYear: 235 },
    ]
  },
  {
    weekNum: 35,
    label: 'W35',
    days: [
      { name: 'MON', date: '24', fullDateLabel: 'August 24', dayNum: 1, month: 'current', dayOfYear: 236 },
      { name: 'TUE', date: '25', fullDateLabel: 'August 25', dayNum: 2, month: 'current', dayOfYear: 237 },
      { name: 'WED', date: '26', fullDateLabel: 'August 26', dayNum: 3, month: 'current', dayOfYear: 238 },
      { name: 'THU', date: '27', fullDateLabel: 'August 27', dayNum: 4, month: 'current', dayOfYear: 239 },
      { name: 'FRI', date: '28', fullDateLabel: 'August 28', dayNum: 5, month: 'current', dayOfYear: 240 },
      { name: 'SAT', date: '29', fullDateLabel: 'August 29', dayNum: 6, month: 'current', dayOfYear: 241 },
      { name: 'SUN', date: '30', fullDateLabel: 'August 30', dayNum: 7, month: 'current', dayOfYear: 242 },
    ]
  },
  {
    weekNum: 36,
    label: 'W36',
    days: [
      { name: 'MON', date: '31', fullDateLabel: 'August 31', dayNum: 1, month: 'current', dayOfYear: 243 },
      { name: 'TUE', date: '1',  fullDateLabel: 'September 1', dayNum: 2, month: 'next', dayOfYear: 244 },
      { name: 'WED', date: '2',  fullDateLabel: 'September 2', dayNum: 3, month: 'next', dayOfYear: 245 },
      { name: 'THU', date: '3',  fullDateLabel: 'September 3', dayNum: 4, month: 'next', dayOfYear: 246 },
      { name: 'FRI', date: '4',  fullDateLabel: 'September 4', dayNum: 5, month: 'next', dayOfYear: 247 },
      { name: 'SAT', date: '5',  fullDateLabel: 'September 5', dayNum: 6, month: 'next', dayOfYear: 248 },
      { name: 'SUN', date: '6',  fullDateLabel: 'September 6', dayNum: 7, month: 'next', dayOfYear: 249 },
    ]
  }
];

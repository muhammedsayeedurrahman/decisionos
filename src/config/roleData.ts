import { Role } from './roles';
import { WorkTask } from '@/components/dashboard/tabs/MyWorkChecklist';
import { Meeting } from '@/components/dashboard/tabs/MeetingNotes';
import { Asset } from '@/components/dashboard/tabs/FinanceLedger';

export const SHARED_ASSETS: Asset[] = [
  { name: 'Automatic Weaving Loom #3', type: 'Machinery', value: 34500, date: '2024-02-12' },
  { name: 'Steam Boiler Unit B', type: 'Utilities', value: 12000, date: '2023-09-05' },
  { name: 'Chemical Dyeing Mixing Tank', type: 'Production Equipment', value: 8500, date: '2025-01-10' },
];

interface BriefContent {
  variant?: 'red' | 'blue' | 'yellow' | 'green';
  label: string;
  text: string;
}

interface CaptureCopy {
  title: string;
  buttonLabel: string;
}

interface RoleData {
  myWorkTasks: WorkTask[];
  myWorkPlaceholder: string;
  aiPlaceholder: string;
  aiRespond: (query: string) => string;
  meetings: Meeting[];
  extractTasks: (id: number) => string[];
  captureCopy: CaptureCopy;
  brief?: BriefContent;
  myWorkAddToast: string;
  meetingsToast: string;
}

export const ROLE_DATA: Record<Role, RoleData> = {
  owner: {
    myWorkTasks: [
      { id: 1, text: 'Review loom output logs for dyeing defect patterns', done: false, priority: 'HIGH' },
      { id: 2, text: 'Finalize monthly Gujarat Cottons vendor contract', done: true, priority: 'MEDIUM' },
      { id: 3, text: 'Check outstanding cash reserve balance against Runway forecast', done: false, priority: 'HIGH' },
    ],
    myWorkPlaceholder: 'Add floor checklist task...',
    aiPlaceholder: 'Type directories check...',
    aiRespond: (q) => {
      const lower = q.toLowerCase();
      if (lower.includes('orders') || lower.includes('cotton')) {
        return '> Scan completed: 2 active cotton contracts found.\n- Westside Retail: 10,000m weave contract (Negotiation stage)\n- Reliance Trends: 5,000m polyester-blend weave (Contract Review stage)';
      }
      if (lower.includes('defect') || lower.includes('loom')) {
        return '> Warning diagnostics:\n- Loom #3 calibration: Warp tension check resolved 1 day ago.\n- Dyeing chemical batch PO-4891 flagged with 0.5% spool wastage check.';
      }
      if (lower.includes('runway') || lower.includes('finance')) {
        return '> Financial runway forecast:\n- Current Cash Reserve: $84,200 (sufficient for 14 weeks operational overhead)\n- Pending Payables: $14,200 Gujarat Cottons PO yarn invoice.';
      }
      return `> DecisionOS AI scans results for "${q}":\nAll parameters within optimal bounds. No recent warning flags reported.`;
    },
    meetings: [
      {
        id: 1,
        title: 'Delhi Cotton Mills Vendor Pitch',
        date: '2 days ago',
        transcript: 'Rajesh (Owner): We must pitch a high quality product. Amit, get samples of premium cotton-nylon weave ready.\nAmit (Production): We have color dye batches ready on Loom #3.\nPriya (Sales): I will schedule a sales review call this Friday to arrange sample delivery.',
      },
      {
        id: 2,
        title: 'Loom Floor Safety Briefing',
        date: '1 week ago',
        transcript: 'Amit: Calibration check on Loom #3 completed. Warp tension is steady at 4.2N.\nOperators: Ready to begin production run for Gujarat Cottons lot.',
      },
    ],
    extractTasks: (id) => id === 1
      ? ['Amit Verma: Arrange premium cotton-nylon fabric samples', 'Priya Nair: Schedule sales review call this Friday to hand off DCM pitch']
      : ['Amit Verma: Record calibration details for Loom #3 daily'],
    captureCopy: { title: 'Document Scan Upload', buttonLabel: 'Upload & Analyze Invoice' },
    myWorkAddToast: 'New personal task added.',
    meetingsToast: 'Extracted operational directives.',
  },
  sales: {
    myWorkTasks: [
      { id: 1, text: 'Contact FabIndia Crafts to review sample feedback', done: false, priority: 'HIGH' },
      { id: 2, text: 'Submit Reliance Trends contract to Owner for review', done: false, priority: 'MEDIUM' },
      { id: 3, text: 'Schedule sales review meeting this Friday', done: true, priority: 'LOW' },
    ],
    myWorkPlaceholder: 'Add new sales target...',
    aiPlaceholder: 'Search sales quotes...',
    aiRespond: (q) => {
      const lower = q.toLowerCase();
      if (lower.includes('quote') || lower.includes('sales') || lower.includes('mumbai')) {
        return '> Active quotation files:\n- Mumbai Retailer: 50 cotton shirts quote (pending Wednesday follow-up).\n- Delhi Retailer: Revised quote request (due Friday).';
      }
      if (lower.includes('contract') || lower.includes('trends')) {
        return '> Contracts state:\n- Reliance Trends: 5,000m weave blend PO contract awaiting Owner authorization.';
      }
      return `> Sales search files for "${q}":\nNo outstanding sales alerts found.`;
    },
    meetings: [
      {
        id: 1,
        title: 'Delhi Cotton Mills Vendor Pitch',
        date: '2 days ago',
        transcript: 'Rajesh (Owner): We must pitch a high quality product. Amit, get samples of premium cotton-nylon weave ready.\nAmit (Production): We have color dye batches ready on Loom #3.\nPriya (Sales): I will schedule a sales review call this Friday to arrange sample delivery.',
      },
    ],
    extractTasks: () => ['Priya Nair: Schedule sales review call this Friday to hand off DCM pitch'],
    captureCopy: { title: 'Logs Scan Upload', buttonLabel: 'Upload customer log' },
    brief: {
      label: 'Active quotations',
      text: 'Quotation preparation parameters are tracked on Decision Desk cards. Keep updated with customer feedback logs.',
    },
    myWorkAddToast: 'New sales task added.',
    meetingsToast: 'Sales action items parsed.',
  },
  production: {
    myWorkTasks: [
      { id: 1, text: 'Calibrate warp tensions on Loom #3', done: false, priority: 'MEDIUM' },
      { id: 2, text: 'Mix chemical color dye batches for Westside PO-4890', done: false, priority: 'HIGH' },
      { id: 3, text: 'Dispatch sample blend roll for FabIndia review', done: true, priority: 'MEDIUM' },
    ],
    myWorkPlaceholder: 'Add floor checklist task...',
    aiPlaceholder: 'Search loom floor logs...',
    aiRespond: (q) => {
      const lower = q.toLowerCase();
      if (lower.includes('calibration') || lower.includes('defect') || lower.includes('loom')) {
        return '> Diagnostics scan Loom #3:\n- Spindle alignment friction check completed.\n- Defect patterns on organic cotton: 0.1% wastage check.';
      }
      if (lower.includes('dye') || lower.includes('color')) {
        return '> Dyeing chemicals status:\n- Indigo chemical dye spools PO-4891: Low stock warning.';
      }
      return `> Production records for "${q}":\nNo warnings found.`;
    },
    meetings: [
      {
        id: 2,
        title: 'Loom Floor Safety Briefing',
        date: '1 week ago',
        transcript: 'Amit: Calibration check on Loom #3 completed. Warp tension is steady at 4.2N.\nOperators: Ready to begin production run.',
      },
    ],
    extractTasks: () => ['Amit Verma: Record calibration details for Loom #3 daily'],
    captureCopy: { title: 'Floor logs Upload', buttonLabel: 'Upload floor telemetry logs' },
    brief: {
      label: 'Floor Briefing',
      text: 'Calibration spools and warp thread metrics are tracked on floor cards. Keep updated with daily checklists.',
    },
    myWorkAddToast: 'New production task added.',
    meetingsToast: 'Production action items parsed.',
  },
  finance: {
    myWorkTasks: [
      { id: 1, text: 'File quarterly GST advance tax return', done: false, priority: 'HIGH' },
      { id: 2, text: 'Verify packaging invoice from Ravi Kumar', done: false, priority: 'MEDIUM' },
      { id: 3, text: 'Release payment of INR 15,000 to Kumar Fabrics', done: true, priority: 'HIGH' },
    ],
    myWorkPlaceholder: 'Add ledger task...',
    aiPlaceholder: 'Search finance ledger logs...',
    aiRespond: (q) => {
      const lower = q.toLowerCase();
      if (lower.includes('invoice') || lower.includes('outstanding') || lower.includes('payables')) {
        return '> Outstanding ledger invoices:\n- Gujarat Cottons PO: $14,200 (pending approval check).\n- Ravi Kumar Packaging: $4,100 (waiting validation review).';
      }
      if (lower.includes('tax') || lower.includes('timeline')) {
        return '> Tax directives:\n- GST quarterly filing: $3,500 advance request logged.';
      }
      return `> Ledger logs for "${q}":\nNo anomalies found.`;
    },
    meetings: [
      {
        id: 3,
        title: 'Q3 Finance Runway Forecast Review',
        date: '2 weeks ago',
        transcript: 'Sunita (Finance): Advance tax payroll invoice of $3,500 has been reviewed.\nRajesh: Approved. Send it to the board for authorization.',
      },
    ],
    extractTasks: () => ['Sunita Rao: Authorize payroll invoice advance of $3,500'],
    captureCopy: { title: 'Invoice Scan Upload', buttonLabel: 'Upload invoice scan' },
    brief: {
      variant: 'yellow',
      label: 'Tax Filing Timeline',
      text: 'Quarterly advance tax return is finalized. Payroll invoice requests released once cash validation completes.',
    },
    myWorkAddToast: 'New finance task added.',
    meetingsToast: 'Finance action items parsed.',
  },
};

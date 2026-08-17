export interface TeamMember {
  name: string;
  role: string;
  email: string;
  color: string;
  phone: string;
}

// Shared across all four dashboards — previously duplicated verbatim in
// finance/owner/production/sales page.tsx.
export const TEAM: TeamMember[] = [
  { name: "Rajesh Sharma", role: "OWNER", email: "owner@sharma.com", color: "bg-brand-red", phone: "+91 98765 43210" },
  { name: "Priya Nair", role: "SALES MANAGER", email: "sales@sharma.com", color: "bg-brand-blue", phone: "+91 98765 43211" },
  { name: "Amit Verma", role: "PRODUCTION CHIEF", email: "production@sharma.com", color: "bg-green-600", phone: "+91 98765 43212" },
  { name: "Sunita Rao", role: "FINANCE CONTROLLER", email: "finance@sharma.com", color: "bg-brand-yellow", phone: "+91 98765 43213" }
];

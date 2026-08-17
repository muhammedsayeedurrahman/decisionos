import { TaskCard, HandoffItem } from '@/utils/sharedState';

/**
 * Demo data for Sharma Textiles Pvt Ltd
 * This data is loaded only in development mode.
 * Production mode starts with empty state.
 */

export const DEMO_CARDS: TaskCard[] = [
  {
    id: 1,
    title: "Prepare quotation for Mumbai retailer",
    subtext: "Priya is tasked with preparing a quotation for 50 cotton shirts for the Mumbai retailer and following up by Wednesday.",
    type: "TASK",
    source: "TEXT",
    detailsCount: 1,
    category: "CUSTOMER",
    assignedTo: "sales"
  },
  {
    id: 2,
    title: "Produce 100 pieces of cotton-nylon fabric for customer",
    subtext: "Start production of 100 pieces of cotton-nylon fabric (paruthakattu) for a customer order.",
    type: "TASK",
    source: "VOICE",
    detailsCount: 2,
    category: "CUSTOMER",
    assignedTo: "production"
  },
  {
    id: 3,
    title: "Develop new cotton-nylon combination product",
    subtext: "The production team needs to develop a new product using a cotton-nylon combination, and a presentation should be prepared for Sadhu (likely a stakeholder or client).",
    type: "TASK",
    source: "VOICE",
    detailsCount: 2,
    category: "CUSTOMER",
    assignedTo: "production"
  },
  {
    id: 4,
    title: "Presentation to be prepared for Delhi Cotton Mills vendor meeting",
    subtext: "Prepare an 8-slide 'About Us' presentation for a meeting with Delhi Cotton Mills in 2 days. The presentation is to be delivered by the Sales Manager and should highlight company advantages.",
    type: "TASK",
    source: "TEXT",
    detailsCount: 1,
    category: "SUPPLIER",
    assignedTo: "sales"
  },
  {
    id: 5,
    title: "Send revised prices to all customers tomorrow",
    subtext: "Founder wants revised pricing to be prepared and sent to all customers tomorrow, based on updated vendor pricing already received.",
    type: "TASK",
    source: "VOICE",
    detailsCount: 2,
    category: "CUSTOMER",
    assignedTo: "sales"
  },
  {
    id: 6,
    title: "No actionable directive provided.",
    subtext: "No actionable directive provided.",
    type: "REMINDER",
    source: "TEXT",
    category: "OTHER",
    assignedTo: "owner"
  },
  {
    id: 7,
    title: "No actionable directive provided.",
    subtext: "No actionable directive provided.",
    type: "REMINDER",
    source: "TEXT",
    category: "OTHER",
    assignedTo: "owner"
  },
  {
    id: 8,
    title: "Revised quote to Deli Retailer by Friday",
    subtext: "Sales team to send a revised quote to Delhi Retailer by Friday. Finance team to clear the packaging invoice. Priya to prepare two quotations immediately, with finance team supporting.",
    type: "TASK",
    source: "VOICE",
    detailsCount: 4,
    category: "CUSTOMER",
    assignedTo: "sales"
  },
  {
    id: 9,
    title: "Schedule a production review meeting this Friday.",
    subtext: "Schedule a production review meeting this Friday.",
    type: "TASK",
    source: "TEXT",
    category: "OTHER",
    assignedTo: "production"
  },
  {
    id: 10,
    title: "Increase all sales prices by 3%",
    subtext: "Due to a 4-5% increase in procurement costs, the founder has decided to raise all sales prices by 3%. The finance team is to prepare a draft communication and the sales team is to...",
    type: "TASK",
    source: "VOICE",
    detailsCount: 3,
    category: "PAYMENT",
    assignedTo: "finance"
  },
  {
    id: 11,
    title: "Sales invoice from Ravi kumar to Tanmy sharma for 1028.97 INR, dated 2026-05-22, paid in full.",
    subtext: "IMG_6190.jpeg",
    type: "INVOICE",
    source: "UPLOAD",
    category: "INVOICE",
    assignedTo: "finance"
  },
  {
    id: 12,
    title: "Approve INR 15,000 Payment to Kumar Fabrics",
    subtext: "Approve a payment of INR 15,000 to Kumar Fabrics for the yellow silk lot.",
    type: "APPROVAL",
    source: "TEXT",
    category: "PAYMENT",
    assignedTo: "finance"
  }
];

export const DEMO_HANDOFFS: HandoffItem[] = [
  {
    id: "sales_handoff",
    title: "Follow-up: Arrange samples of your existing fabric or finished products to showcase your manufacturing standards",
    description: "Handed off by Rajesh Sharma on 'Meeting with Delhi Cotton Mills – Vendor Introduction (Day after tomorrow)'. Context: I need sales team support.",
    instruction: "On step: Arrange samples of your existing fabric or finished products to showcase your manufacturing standards",
    status: "pending",
    replyText: ""
  },
  {
    id: "production_handoff",
    title: "Follow-up: Once payment is processed, collect the payment confirmation and share it with the supplier",
    description: "Handed off by Rajesh Sharma on 'Follow up on packaging invoice clearance'. Context: Production team",
    instruction: "On step: Once payment is processed, collect the payment confirmation and share it with the supplier",
    status: "pending",
    replyText: ""
  }
];

export const DEMO_NOTIFICATIONS = { owner: 4, sales: 7, production: 3, finance: 5 };

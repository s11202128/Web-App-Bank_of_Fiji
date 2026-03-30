const requirementsData = {
  userStories: [
    { id: "US-1", priority: "High", story: "As a customer, I want to transfer money online so I can pay people quickly." },
    { id: "US-2", priority: "High", story: "As a customer, I want OTP verification for high-value transfers so my funds are secure." },
    { id: "US-3", priority: "High", story: "As a customer, I want manual and scheduled bill payments so recurring bills are automated." },
    { id: "US-4", priority: "High", story: "As a customer, I want to view and download statements on demand so I can track finances." },
    { id: "US-5", priority: "Medium", story: "As a bank admin, I want configurable savings interest rates so policy changes are reflected quickly." },
    { id: "US-6", priority: "Medium", story: "As a bank admin, I want annual interest summaries sent to FRCS so compliance is met." },
    { id: "US-7", priority: "Medium", story: "As a customer, I want to receive SMS notifications on money received and bill processing." },
    { id: "US-8", priority: "Low", story: "As a customer, I want to apply for loans online so I do not visit a branch for initial application." },
  ],
  conflictsAndTradeOffs: [
    {
      conflict: "Strong security (OTP on more transactions) vs low friction UX",
      tradeOff: "OTP enforced only for high-value threshold transfers, adjustable in backend config.",
    },
    {
      conflict: "Fast transfer processing vs anti-fraud verification steps",
      tradeOff: "Normal transfers are instant; high-value transfers move to pending until OTP verified.",
    },
    {
      conflict: "Tax withholding accuracy vs customer profile completeness",
      tradeOff: "Apply withholding by default for missing TIN/non-resident and allow later adjustments in future phase.",
    },
    {
      conflict: "Prototype delivery speed vs full accounting precision",
      tradeOff: "Interest uses simplified annual calculation in prototype; daily accrual can be implemented later.",
    },
  ],
  highPriorityPrototypes: [
    "Money transfer with OTP",
    "Manual/scheduled bill payment",
    "On-demand statement viewing and download",
    "Notifications flow",
  ],
};

module.exports = requirementsData;

const DELIVERY_TYPES = [
  { label: "Door", value: "Door" },
  { label: "Godown", value: "Godown" },
  { label: "Against Consignee Copy", value: "Against Consignee Copy" },
];
const PAY_TYPES = [
  { label: "ToPay", value: "ToPay" },
  { label: "Paid", value: "Paid" },
  { label: "TBB", value: "TBB" },
  { label: "FOC", value: "FOC" },
];
const TO_BILLED = [
  { label: "Consignor", value: "Consignor" },
  { label: "Consignee", value: "Consignee" },
];
const SERVICE_TAX_BY = [
  { label: "Consignor", value: "Consignor" },
  { label: "Consignee", value: "Consignee" },
  { label: "Transporter", value: "Transporter" },
];
const PAY_MODE = [
  { label: "By Cash", value: "By Cash" },
  { label: "By Cheque", value: "By Cheque" },
];

const PAYMENT_MODES = [
  { label: "Cash", value: "Cash" },
  { label: "Cheque", value: "Cheque" },
  { label: "NEFT/RTGS", value: "NEFT/RTGS" },
  { label: "Online banking", value: "Online banking" },
];

const PRINTERS = [
  "Epson LQ-300+",
  "Epson LX-300+",
  "Epson LX-300+II",
  "TVS MPS 250 Champion",
];

module.exports = {
  DELIVERY_TYPES,
  PAYMENT_MODES,
  PAY_MODE,
  SERVICE_TAX_BY,
  TO_BILLED,
  PAY_TYPES,
  PRINTERS,
};

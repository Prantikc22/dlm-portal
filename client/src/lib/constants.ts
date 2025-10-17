export const INDUSTRIES = [
  {
    id: 'mechanical_manufacturing',
    name: 'Mechanical Manufacturing',
    description: 'CNC, Sheet Metal, Injection Molding',
    icon: 'fas fa-cog',
  },
  {
    id: 'electronics_electrical',
    name: 'Electronics & Electrical',
    description: 'PCB, Assembly, Testing',
    icon: 'fas fa-microchip',
  },
  {
    id: 'packaging_printing',
    name: 'Packaging & Printing',
    description: 'Corrugated, Labels, Flexible',
    icon: 'fas fa-box',
  },
  {
    id: 'textile_leather',
    name: 'Textile & Leather',
    description: 'Cut & Sew, Embroidery, Leather',
    icon: 'fas fa-cut',
  },
  {
    id: 'construction_infrastructure',
    name: 'Construction & Infrastructure',
    description: 'Steel, Prefab, Joinery',
    icon: 'fas fa-building',
  },
];

export const RFQ_STATUS_COLORS = {
  draft: 'bg-gray-100 text-gray-800',
  submitted: 'bg-blue-100 text-blue-800',
  under_review: 'bg-yellow-100 text-yellow-800',
  invited: 'bg-purple-100 text-purple-800',
  offers_published: 'bg-green-100 text-green-800',
  accepted: 'bg-emerald-100 text-emerald-800',
  in_production: 'bg-orange-100 text-orange-800',
  inspection: 'bg-indigo-100 text-indigo-800',
  shipped: 'bg-cyan-100 text-cyan-800',
  delivered: 'bg-green-100 text-green-800',
  closed: 'bg-gray-100 text-gray-800',
  cancelled: 'bg-red-100 text-red-800',
};

export const ORDER_STATUS_COLORS = {
  created: 'bg-blue-100 text-blue-800',
  deposit_paid: 'bg-green-100 text-green-800',
  production: 'bg-orange-100 text-orange-800',
  inspection: 'bg-purple-100 text-purple-800',
  shipped: 'bg-cyan-100 text-cyan-800',
  delivered: 'bg-emerald-100 text-emerald-800',
  closed: 'bg-gray-100 text-gray-800',
  cancelled: 'bg-red-100 text-red-800',
};

export const UNITS = [
  { value: 'pcs', label: 'Pieces' },
  { value: 'sets', label: 'Sets' },
  { value: 'meters', label: 'Meters' },
  { value: 'sqm', label: 'Square Meters' },
  { value: 'kg', label: 'Kilograms' },
];

export const PRIORITIES = [
  { value: 'standard', label: 'Standard' },
  { value: 'premium', label: 'Premium' },
  { value: 'fast_track', label: 'Fast Track' },
];

export const TOLERANCES = [
  { value: '±0.1mm', label: '±0.1mm (High Precision)' },
  { value: '±0.2mm', label: '±0.2mm (Standard)' },
  { value: '±0.5mm', label: '±0.5mm (General)' },
  { value: '±1.0mm', label: '±1.0mm (Rough)' },
];

export const SURFACE_FINISHES = [
  { value: 'anodize', label: 'Anodizing' },
  { value: 'powder_coat', label: 'Powder Coating' },
  { value: 'electroplate', label: 'Electroplating' },
  { value: 'painting', label: 'Painting' },
  { value: 'heat_treat', label: 'Heat Treatment' },
  { value: 'polishing', label: 'Polishing' },
];

export const INSPECTION_TYPES = [
  { value: 'none', label: 'None' },
  { value: 'basic', label: 'Basic Dimensional' },
  { value: 'advanced', label: 'Advanced CMM' },
  { value: 'lab_test', label: 'Lab Testing' },
];

export const PACKAGING_TYPES = [
  { value: 'standard', label: 'Standard' },
  { value: 'custom_printed', label: 'Custom Printed' },
  { value: 'protective_foam', label: 'Protective Foam' },
];

// Add-ons: Metal finishing options
export const FINISHING_OPTIONS = [
  { value: 'none', label: 'None' },
  { value: 'anodizing', label: 'Anodizing' },
  { value: 'powder_coating', label: 'Powder Coating' },
  { value: 'plating_nickel', label: 'Plating - Nickel' },
  { value: 'plating_chrome', label: 'Plating - Chrome' },
  { value: 'plating_zinc', label: 'Plating - Zinc' },
];

// Add-ons: Heat treatment options
export const HEAT_TREATMENT_TYPES = [
  { value: 'none', label: 'None' },
  { value: 'case_hardening', label: 'Case Hardening' },
  { value: 'nitriding', label: 'Nitriding' },
  { value: 'tempering', label: 'Tempering' },
  { value: 'normalizing', label: 'Normalizing' },
  { value: 'annealing', label: 'Annealing' },
];

// Add-ons: Compliance/Certification options
export const CERTIFICATION_TYPES = [
  { value: 'none', label: 'None' },
  { value: 'ppap', label: 'PPAP' },
  { value: 'cmm_report', label: 'CMM Report' },
  { value: 'ce', label: 'CE' },
  { value: 'rohs', label: 'RoHS' },
  { value: 'reach', label: 'REACH' },
  { value: 'coa', label: 'Custom COA' },
];

// Add-ons: Component sourcing & kitting
export const SOURCING_PACKAGING_OPTIONS = [
  { value: 'reels', label: 'Reels' },
  { value: 'cut_tape', label: 'Cut Tape' },
  { value: 'trays', label: 'Trays' },
  { value: 'bags', label: 'Bags' },
  { value: 'kits', label: 'Kits' },
];

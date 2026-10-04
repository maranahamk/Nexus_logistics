import {
  Shipment,
  ShipmentStatus,
  ServiceTier,
  DestinationZone,
  PackageSpecs,
  PricingBreakdown,
  MilestoneEvent,
  AdminMetrics,
  PaymentDetails,
  PaymentGateway,
  PaymentMethod,
} from '../types/logistics';

const STORAGE_KEY = 'nexus_logistics_shipments_v1';
const SESSION_STORAGE_KEY = 'nexus_admin_session_v2';
const ADMIN_CREDENTIALS = [
  { email: 'dispatcher@nexuslogistics.com', pass: 'admin2026', pin: '8921', role: 'Operations Dispatcher' },
  { email: 'zundayclinton@gmail.com', pass: 'admin2026', pin: '8921', role: 'Chief Logistics Officer' },
];

export const ZONE_NAMES: Record<DestinationZone, string> = {
  domestic: 'Domestic (Same Country)',
  north_america: 'North America (US / Canada / Mexico)',
  europe: 'Europe (EU / UK / Schengen)',
  asia_pacific: 'Asia-Pacific (Japan, Singapore, Australia, etc.)',
  middle_east: 'Middle East (UAE, Saudi Arabia, Qatar)',
  latin_america: 'Latin America (Brazil, Argentina, Chile)',
  africa: 'Africa (South Africa, Kenya, Nigeria, Ghana)',
};

export const ZONE_MULTIPLIERS: Record<DestinationZone, number> = {
  domestic: 1.0,
  north_america: 1.25,
  europe: 1.45,
  asia_pacific: 1.65,
  middle_east: 1.55,
  latin_america: 1.7,
  africa: 1.8,
};

export const TIER_CONFIG: Record<
  ServiceTier,
  { name: string; baseCost: number; ratePerKg: number; estDays: string; speedTag: string }
> = {
  express_air: {
    name: 'Express Air Priority',
    baseCost: 45.0,
    ratePerKg: 7.5,
    estDays: '1 - 2 Business Days',
    speedTag: 'Next Flight Out',
  },
  standard_freight: {
    name: 'Standard Worldwide Freight',
    baseCost: 28.0,
    ratePerKg: 4.8,
    estDays: '3 - 5 Business Days',
    speedTag: 'Commercial Air/Sea',
  },
  economy_ground: {
    name: 'Economy Ground & Overland',
    baseCost: 16.0,
    ratePerKg: 2.9,
    estDays: '6 - 9 Business Days',
    speedTag: 'Cost-Optimized',
  },
};

export function calculateShippingCost(
  specs: PackageSpecs,
  zone: DestinationZone,
  tier: ServiceTier
): PricingBreakdown {
  const config = TIER_CONFIG[tier];
  const zoneMultiplier = ZONE_MULTIPLIERS[zone] || 1.0;

  // Volumetric weight: (L * W * H) / 5000
  const dimWeightKg = (specs.dimensions.length * specs.dimensions.width * specs.dimensions.height) / 5000;
  const billableWeightKg = Math.max(specs.weightKg, dimWeightKg);

  const baseCost = config.baseCost;
  const weightCost = billableWeightKg * config.ratePerKg;
  const zoneSurcharge = (baseCost + weightCost) * (zoneMultiplier - 1.0);

  // Insurance is 1.2% of declared value if requested
  const insuranceCost = specs.requiresInsurance ? Math.max(12.0, specs.declaredValueUSD * 0.012) : 0;

  // Fuel & handling surcharge: 7.5%
  const subtotal = baseCost + weightCost + zoneSurcharge + insuranceCost;
  const fuelSurcharge = subtotal * 0.075;

  const totalCost = Math.round((subtotal + fuelSurcharge) * 100) / 100;

  return {
    baseCost: Math.round(baseCost * 100) / 100,
    weightCost: Math.round(weightCost * 100) / 100,
    zoneSurcharge: Math.round(zoneSurcharge * 100) / 100,
    insuranceCost: Math.round(insuranceCost * 100) / 100,
    fuelSurcharge: Math.round(fuelSurcharge * 100) / 100,
    totalCost,
  };
}

export function generateTrackingNumber(): string {
  const part1 = Math.floor(1000 + Math.random() * 9000);
  const part2 = Math.floor(1000 + Math.random() * 9000);
  return `NEX-${part1}-${part2}`;
}

const SEED_SHIPMENTS: Shipment[] = [
  {
    id: 'NEX-9847-2931',
    waybillNumber: 'AWB-8902-3104',
    sender: {
      name: 'Elena Rostova',
      company: 'Apex BioPharm Logistics',
      email: 'elena@apexbio.com',
      phone: '+1 (415) 890-2194',
      country: 'United States',
      city: 'San Francisco, CA',
      address: '400 Mission St, Suite 1900',
      postalCode: '94105',
    },
    receiver: {
      name: 'Hiroshi Tanaka',
      company: 'Cyberport Research Center',
      email: 'h.tanaka@cyberport.jp',
      phone: '+81 3 5555 0192',
      country: 'Japan',
      destinationZone: 'asia_pacific',
      city: 'Tokyo',
      address: '2-11-3 Meguro, Meguro-ku',
      postalCode: '153-0063',
    },
    packageSpecs: {
      type: 'fragile_box',
      weightKg: 4.2,
      dimensions: { length: 35, width: 25, height: 20 },
      declaredValueUSD: 1450.0,
      isFragile: true,
      requiresInsurance: true,
    },
    serviceTier: 'express_air',
    pricing: {
      baseCost: 45.0,
      weightCost: 31.5,
      zoneSurcharge: 49.73,
      insuranceCost: 17.4,
      fuelSurcharge: 10.77,
      totalCost: 154.4,
    },
    payment: {
      gateway: 'paystack',
      method: 'card',
      reference: 'PSTK-AWB-8902-3104',
      transactionId: 'TXN_PSTK_91028301',
      amountUSD: 154.4,
      currency: 'USD',
      paidAt: '2026-09-28T09:14:15Z',
      customerEmail: 'elena@apexbio.com',
      status: 'paid',
      channelDetails: 'Visa Card ending in •••• 4242',
    },
    status: 'delivered',
    createdAt: '2026-09-28T09:15:00Z',
    estimatedDelivery: '2026-10-01T14:00:00Z',
    actualDelivery: '2026-10-01T13:42:00Z',
    currentLocation: 'Tokyo Narita Final Dispatch Hub (Delivered)',
    carrierVehicle: 'Courier Van #88-TYO',
    deliveryInstructions: 'Direct handoff to laboratory security reception. Cleanroom code: #8921.',
    bookedBy: 'client@nexusfreight.com',
    timeline: [
      {
        id: 'evt_1',
        status: 'order_created',
        location: 'San Francisco Digital Booking Terminal, USA',
        timestamp: '2026-09-28T09:15:00Z',
        title: 'Shipment Registered & Waybill Issued',
        description: 'Electronic export manifest transmitted. Air Waybill generated.',
      },
      {
        id: 'evt_2',
        status: 'picked_up',
        location: 'San Francisco Bay Area Dispatch Depot, USA',
        timestamp: '2026-09-28T14:30:00Z',
        title: 'Package Collected by Courier',
        description: 'Package scanned and secured into temperature-controlled container.',
      },
      {
        id: 'evt_3',
        status: 'facility_sorted',
        location: 'SFO International Air Cargo Gateway, USA',
        timestamp: '2026-09-28T22:10:00Z',
        title: 'Sorted & Cleared for Air Cargo Flight',
        description: 'Security X-ray scan complete. Manifest approved by US Customs.',
      },
      {
        id: 'evt_4',
        status: 'in_transit',
        location: 'Pacific Air Transit Corridor',
        timestamp: '2026-09-29T11:00:00Z',
        title: 'Departed on Cargo Flight NX-902',
        description: 'Direct air transport SFO -> NRT (Flight Altitude: 37,000 ft).',
      },
      {
        id: 'evt_5',
        status: 'customs_cleared',
        location: 'Tokyo Narita Air Cargo Terminal (NRT), Japan',
        timestamp: '2026-09-30T16:45:00Z',
        title: 'Customs Clearance Completed',
        description: 'Import duty verification processed without exception.',
      },
      {
        id: 'evt_6',
        status: 'out_for_delivery',
        location: 'Tokyo Meguro Local Distribution Center, Japan',
        timestamp: '2026-10-01T08:30:00Z',
        title: 'Out for Priority Delivery',
        description: 'Package loaded into Courier Van #88-TYO with driver K. Sato.',
      },
      {
        id: 'evt_7',
        status: 'delivered',
        location: 'Tokyo Meguro Destination Address, Japan',
        timestamp: '2026-10-01T13:42:00Z',
        title: 'Delivered & Signed',
        description: 'Package delivered in pristine condition. Signed by: H. Tanaka.',
        courierNote: 'Signature captured on mobile terminal. Handed directly to recipient.',
      },
    ],
  },
  {
    id: 'NEX-7241-9034',
    waybillNumber: 'AWB-5519-7801',
    sender: {
      name: 'Marcus Chen',
      company: 'Frankfurt Semiconductor GMBH',
      email: 'm.chen@frankfurtsemi.de',
      phone: '+49 69 9876 5432',
      country: 'Germany',
      city: 'Frankfurt',
      address: 'Mainzer Landstraße 180',
      postalCode: '60327',
    },
    receiver: {
      name: 'Dr. Oliver Sterling',
      company: 'Cambridge Advanced Quantum Labs',
      email: 'o.sterling@cambridge.ac.uk',
      phone: '+44 1223 760000',
      country: 'United Kingdom',
      destinationZone: 'europe',
      city: 'Cambridge',
      address: 'J.J. Thomson Avenue, West Cambridge Site',
      postalCode: 'CB3 0HE',
    },
    packageSpecs: {
      type: 'standard_parcel',
      weightKg: 8.5,
      dimensions: { length: 40, width: 30, height: 25 },
      declaredValueUSD: 3800.0,
      isFragile: true,
      requiresInsurance: true,
    },
    serviceTier: 'express_air',
    pricing: {
      baseCost: 45.0,
      weightCost: 63.75,
      zoneSurcharge: 48.94,
      insuranceCost: 45.6,
      fuelSurcharge: 15.25,
      totalCost: 218.54,
    },
    payment: {
      gateway: 'paystack',
      method: 'bank_transfer',
      reference: 'PSTK-AWB-5519-7801',
      transactionId: 'TXN_BNK_49102914',
      amountUSD: 218.54,
      currency: 'USD',
      paidAt: '2026-10-01T11:18:40Z',
      customerEmail: 'm.chen@frankfurtsemi.de',
      status: 'paid',
      channelDetails: 'Direct Interbank Virtual Transfer (Providus Bank)',
    },
    status: 'in_transit',
    createdAt: '2026-10-01T11:20:00Z',
    estimatedDelivery: '2026-10-04T16:00:00Z',
    currentLocation: 'EuroCargo Logistics Tunnel Hub, Calais',
    carrierVehicle: 'Intercity Cargo Shuttle NX-301',
    deliveryInstructions: 'Direct delivery to Gate 3 Receiving Bay. Ring intercom #12.',
    bookedBy: 'client@nexusfreight.com',
    timeline: [
      {
        id: 'evt_1',
        status: 'order_created',
        location: 'Frankfurt Operations Portal, Germany',
        timestamp: '2026-10-01T11:20:00Z',
        title: 'Booking Confirmed & Manifest Logged',
        description: 'Standard customs documentation registered under EORI #DE981042.',
      },
      {
        id: 'evt_2',
        status: 'picked_up',
        location: 'Frankfurt Regional Freight Depot, Germany',
        timestamp: '2026-10-01T16:00:00Z',
        title: 'Picked up from Shipper Facility',
        description: 'Barcoded and verified by Courier Unit 4.',
      },
      {
        id: 'evt_3',
        status: 'facility_sorted',
        location: 'FRA-Central Air & Rail Sorting Complex, Germany',
        timestamp: '2026-10-02T02:45:00Z',
        title: 'Automated High-Speed Sorting Completed',
        description: 'Assigned to North Sea Express Transit Route.',
      },
      {
        id: 'evt_4',
        status: 'in_transit',
        location: 'EuroCargo Logistics Tunnel Hub, Calais',
        timestamp: '2026-10-02T19:30:00Z',
        title: 'In Transit to UK Freight Gateway',
        description: 'Transiting through Eurotunnel Cargo Terminal under active seal #9841.',
      },
    ],
  },
  {
    id: 'NEX-4182-5519',
    waybillNumber: 'AWB-2041-9923',
    sender: {
      name: 'Sophia Williams',
      company: 'OmniTrade Chicago Corp',
      email: 'swilliams@omnitrade.io',
      phone: '+1 (312) 555-8910',
      country: 'United States',
      city: 'Chicago, IL',
      address: '233 S Wacker Dr, Floor 44',
      postalCode: '60606',
    },
    receiver: {
      name: 'Alexander Sterling',
      company: 'Madison Avenue Capital',
      email: 'asterling@madisoncap.com',
      phone: '+1 (212) 555-4029',
      country: 'United States',
      destinationZone: 'domestic',
      city: 'New York, NY',
      address: '375 Park Ave, Suite 2800',
      postalCode: '10152',
    },
    packageSpecs: {
      type: 'document',
      weightKg: 1.1,
      dimensions: { length: 30, width: 22, height: 4 },
      declaredValueUSD: 500.0,
      isFragile: false,
      requiresInsurance: false,
    },
    serviceTier: 'standard_freight',
    pricing: {
      baseCost: 28.0,
      weightCost: 5.28,
      zoneSurcharge: 0.0,
      insuranceCost: 0.0,
      fuelSurcharge: 2.5,
      totalCost: 35.78,
    },
    payment: {
      gateway: 'flutterwave',
      method: 'card',
      reference: 'FLW-AWB-2041-9923',
      transactionId: 'TXN_FLW_88201948',
      amountUSD: 35.78,
      currency: 'USD',
      paidAt: '2026-10-02T07:58:10Z',
      customerEmail: 'swilliams@omnitrade.io',
      status: 'paid',
      channelDetails: 'Mastercard ending in •••• 5521',
    },
    status: 'out_for_delivery',
    createdAt: '2026-10-02T08:00:00Z',
    estimatedDelivery: '2026-10-03T17:00:00Z',
    currentLocation: 'Midtown Manhattan Delivery Zone, NY',
    carrierVehicle: 'Electric Delivery Van #NYC-42',
    deliveryInstructions: 'Leave with front desk concierge on 28th floor. Signature requested.',
    bookedBy: 'client@nexusfreight.com',
    timeline: [
      {
        id: 'evt_1',
        status: 'order_created',
        location: 'Chicago Downtown Logistics Center, USA',
        timestamp: '2026-10-02T08:00:00Z',
        title: 'Priority Document Envelope Registered',
        description: 'Electronic AWB created and assigned priority handling.',
      },
      {
        id: 'evt_2',
        status: 'facility_sorted',
        location: 'O’Hare Central Sorting Hub (ORD), USA',
        timestamp: '2026-10-02T13:10:00Z',
        title: 'Sorted & Dispatched for Overnight Transit',
        description: 'Transferred to ORD -> JFK overnight freighter flight.',
      },
      {
        id: 'evt_3',
        status: 'in_transit',
        location: 'JFK Air Freight Station, New York, USA',
        timestamp: '2026-10-03T03:30:00Z',
        title: 'Arrived at Destination Airport Hub',
        description: 'Processed through automated conveyor inspection.',
      },
      {
        id: 'evt_4',
        status: 'out_for_delivery',
        location: 'Midtown Manhattan Courier Depot, USA',
        timestamp: '2026-10-03T07:45:00Z',
        title: 'Out for Immediate Delivery',
        description: 'Loaded onto Courier Van #NYC-42 with driver Dave Miller.',
        courierNote: 'Expected arrival window: 11:30 AM - 1:00 PM EST.',
      },
    ],
  },
  {
    id: 'NEX-6310-8422',
    waybillNumber: 'AWB-7729-1049',
    sender: {
      name: 'Amara Al-Mansoor',
      company: 'Dubai Pearl Logistics',
      email: 'amara@dubaipearl.ae',
      phone: '+971 4 312 8900',
      country: 'United Arab Emirates',
      city: 'Dubai',
      address: 'Sheikh Zayed Road, DIFC Tower 1',
      postalCode: '506543',
    },
    receiver: {
      name: 'Kwame Mensah',
      company: 'Accra Innovation District',
      email: 'kwame@accratech.gh',
      phone: '+233 24 456 7890',
      country: 'Ghana',
      destinationZone: 'africa',
      city: 'Accra',
      address: 'Independence Ave, Ridge',
      postalCode: 'GA-019-2041',
    },
    packageSpecs: {
      type: 'freight_pallet',
      weightKg: 42.0,
      dimensions: { length: 80, width: 60, height: 50 },
      declaredValueUSD: 5200.0,
      isFragile: false,
      requiresInsurance: true,
    },
    serviceTier: 'standard_freight',
    pricing: {
      baseCost: 28.0,
      weightCost: 201.6,
      zoneSurcharge: 183.68,
      insuranceCost: 62.4,
      fuelSurcharge: 35.68,
      totalCost: 511.36,
    },
    payment: {
      gateway: 'flutterwave',
      method: 'ussd',
      reference: 'FLW-AWB-7729-1049',
      transactionId: 'TXN_USSD_38102941',
      amountUSD: 511.36,
      currency: 'USD',
      paidAt: '2026-10-02T13:57:30Z',
      customerEmail: 'amara@dubaipearl.ae',
      status: 'paid',
      channelDetails: 'USSD Dial (*737* GTBank Session #1049)',
    },
    status: 'facility_sorted',
    createdAt: '2026-10-02T14:00:00Z',
    estimatedDelivery: '2026-10-07T18:00:00Z',
    currentLocation: 'Dubai Al Maktoum Cargo Hub (DWC), UAE',
    carrierVehicle: 'Heavy Freight Cargo Pallet Station #4',
    deliveryInstructions: 'Forklift required at receiving warehouse.',
    bookedBy: 'client@nexusfreight.com',
    timeline: [
      {
        id: 'evt_1',
        status: 'order_created',
        location: 'Dubai Cargo Terminal, UAE',
        timestamp: '2026-10-02T14:00:00Z',
        title: 'Commercial Cargo Manifest Created',
        description: 'Freight booking approved for West Africa air corridor.',
      },
      {
        id: 'evt_2',
        status: 'facility_sorted',
        location: 'Dubai Al Maktoum Cargo Hub (DWC), UAE',
        timestamp: '2026-10-02T22:30:00Z',
        title: 'Palletized & Scheduled for Departure',
        description: 'Cargo pallet consolidated and weighed. Awaiting departure on Flight EK-941.',
      },
    ],
  },
  {
    id: 'NEX-1904-7731',
    waybillNumber: 'AWB-3310-8842',
    sender: {
      name: 'Lars Nygård',
      company: 'Oslo Maritime Components',
      email: 'lars@oslomaritime.no',
      phone: '+47 22 89 00 11',
      country: 'Norway',
      city: 'Oslo',
      address: 'Aker Brygge 14',
      postalCode: '0250',
    },
    receiver: {
      name: 'Camila Hernandez',
      company: 'Valparaiso Marine Services',
      email: 'c.hernandez@valpomarine.cl',
      phone: '+56 32 290 8412',
      country: 'Chile',
      destinationZone: 'latin_america',
      city: 'Valparaíso',
      address: 'Avenida Errázuriz 1040',
      postalCode: '2340000',
    },
    packageSpecs: {
      type: 'heavy_cargo',
      weightKg: 24.5,
      dimensions: { length: 65, width: 45, height: 35 },
      declaredValueUSD: 2400.0,
      isFragile: false,
      requiresInsurance: true,
    },
    serviceTier: 'economy_ground',
    pricing: {
      baseCost: 16.0,
      weightCost: 71.05,
      zoneSurcharge: 60.94,
      insuranceCost: 28.8,
      fuelSurcharge: 13.26,
      totalCost: 190.05,
    },
    payment: {
      gateway: 'paystack',
      method: 'card',
      reference: 'PSTK-AWB-3310-8842',
      transactionId: 'TXN_PSTK_77201942',
      amountUSD: 190.05,
      currency: 'USD',
      paidAt: '2026-09-29T09:58:00Z',
      customerEmail: 'lars@oslomaritime.no',
      status: 'paid',
      channelDetails: 'Visa Card ending in •••• 1092',
    },
    status: 'exception_delayed',
    createdAt: '2026-09-29T10:00:00Z',
    estimatedDelivery: '2026-10-08T18:00:00Z',
    currentLocation: 'Santiago Intermodal Customs Inspection Depot, Chile',
    carrierVehicle: 'Intermodal Freight Unit #CL-77',
    deliveryInstructions: 'Contact port agent upon arrival at dock 4.',
    bookedBy: 'client@nexusfreight.com',
    timeline: [
      {
        id: 'evt_1',
        status: 'order_created',
        location: 'Oslo Digital Terminal, Norway',
        timestamp: '2026-09-29T10:00:00Z',
        title: 'Export Shipment Initialized',
        description: 'Air Waybill issued with Norwegian maritime tariff codes.',
      },
      {
        id: 'evt_2',
        status: 'picked_up',
        location: 'Oslo Port Depot, Norway',
        timestamp: '2026-09-29T15:00:00Z',
        title: 'Picked up from Facility',
        description: 'Secured for overland transport to European hub.',
      },
      {
        id: 'evt_3',
        status: 'in_transit',
        location: 'Atlantic Cargo Transit Line',
        timestamp: '2026-10-01T04:00:00Z',
        title: 'In International Transit',
        description: 'In transit via Frankfurt -> Santiago cargo flight.',
      },
      {
        id: 'evt_4',
        status: 'exception_delayed',
        location: 'Santiago Intermodal Customs Inspection Depot, Chile',
        timestamp: '2026-10-02T17:15:00Z',
        title: 'Customs Clearance Pending - Document Verification',
        description: 'National customs authorities requested secondary commercial invoice check.',
        courierNote: 'Local customs broker assigned. Resolution estimated within 24 hours.',
      },
    ],
  },
];

type Listener = () => void;

class LogisticsStore {
  private listeners: Set<Listener> = new Set();

  constructor() {
    this.init();
  }

  private init() {
    if (!localStorage.getItem(STORAGE_KEY)) {
      this.resetToDefaultSeed();
    }
  }

  public resetToDefaultSeed() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(SEED_SHIPMENTS));
    this.notify();
  }

  public subscribe(listener: Listener): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  private notify() {
    this.listeners.forEach((cb) => cb());
  }

  public getShipments(): Shipment[] {
    try {
      const data = localStorage.getItem(STORAGE_KEY);
      if (!data) return SEED_SHIPMENTS;
      const parsed: Shipment[] = JSON.parse(data);
      return parsed.map((s, idx) => ({
        ...s,
        payment: s.payment || {
          gateway: (idx % 2 === 0 ? 'paystack' : 'flutterwave') as PaymentGateway,
          method: (idx % 3 === 0 ? 'card' : idx % 3 === 1 ? 'bank_transfer' : 'ussd') as PaymentMethod,
          reference: `PSTK-AWB-${900000 + idx * 1234}`,
          transactionId: `TXN_${Date.now()}_${idx}`,
          amountUSD: s.pricing.totalCost,
          currency: 'USD',
          paidAt: s.createdAt,
          customerEmail: s.sender.email,
          status: 'paid' as const,
          channelDetails: idx % 3 === 0 ? 'Visa Card ending in •••• 4242' : idx % 3 === 1 ? 'Direct Virtual Bank Transfer' : 'USSD Dial (*737*)',
        },
      }));
    } catch {
      return SEED_SHIPMENTS;
    }
  }

  public getShipmentById(id: string): Shipment | undefined {
    const cleanId = id.trim().toUpperCase();
    return this.getShipments().find(
      (s) => s.id.toUpperCase() === cleanId || s.waybillNumber.toUpperCase() === cleanId
    );
  }

  public createShipment(
    data: Omit<Shipment, 'id' | 'waybillNumber' | 'createdAt' | 'status' | 'timeline'>
  ): Shipment {
    const shipments = this.getShipments();
    const id = generateTrackingNumber();
    const waybillNumber = `AWB-${Math.floor(1000 + Math.random() * 9000)}-${Math.floor(1000 + Math.random() * 9000)}`;
    const now = new Date().toISOString();

    const initialEvent: MilestoneEvent = {
      id: `evt_${Date.now()}`,
      status: 'order_created',
      location: `${data.sender.city}, ${data.sender.country}`,
      timestamp: now,
      title: 'Shipment Registered & Escrow Settled',
      description: `Electronic booking confirmed. Payment of $${data.pricing.totalCost.toFixed(2)} USD successfully verified via ${data.payment.gateway === 'paystack' ? 'Paystack' : 'Flutterwave'} (${data.payment.channelDetails}). Service Tier: ${TIER_CONFIG[data.serviceTier].name}.`,
    };

    const newShipment: Shipment = {
      ...data,
      id,
      waybillNumber,
      status: 'order_created',
      createdAt: now,
      currentLocation: `${data.sender.city} Origin Center`,
      timeline: [initialEvent],
    };

    shipments.unshift(newShipment);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(shipments));
    this.notify();
    return newShipment;
  }

  public updateShipmentStatus(
    id: string,
    newStatus: ShipmentStatus,
    location: string,
    note?: string
  ): Shipment {
    const shipments = this.getShipments();
    const index = shipments.findIndex((s) => s.id.toUpperCase() === id.trim().toUpperCase());
    if (index === -1) throw new Error(`Shipment with ID ${id} not found.`);

    const shipment = shipments[index];
    const prevStatus = shipment.status;
    shipment.status = newStatus;
    shipment.currentLocation = location || shipment.currentLocation;

    if (newStatus === 'delivered' && !shipment.actualDelivery) {
      shipment.actualDelivery = new Date().toISOString();
    }

    const titleMap: Record<ShipmentStatus, string> = {
      order_created: 'Order Registered in Dispatch Network',
      picked_up: 'Package Picked Up by Courier',
      facility_sorted: 'Processed & Sorted at Regional Logistics Hub',
      customs_cleared: 'Customs Clearance Processed',
      in_transit: 'In Transit on Main Haul Route',
      out_for_delivery: 'Out for Final Delivery with Courier',
      delivered: 'Successfully Delivered & Signed',
      exception_delayed: 'Operational Exception / Transit Hold',
      cancelled: 'Shipment Cancelled by Shipper',
    };

    const newMilestone: MilestoneEvent = {
      id: `evt_${Date.now()}`,
      status: newStatus,
      location: location || shipment.currentLocation,
      timestamp: new Date().toISOString(),
      title: titleMap[newStatus] || `Status updated to ${newStatus}`,
      description: note || `Package status updated from ${prevStatus.replace('_', ' ')} to ${newStatus.replace('_', ' ')}.`,
      courierNote: note,
    };

    shipment.timeline.unshift(newMilestone);
    shipments[index] = shipment;

    localStorage.setItem(STORAGE_KEY, JSON.stringify(shipments));
    this.notify();
    return shipment;
  }

  public updateDeliveryInstructions(id: string, instructions: string): void {
    const shipments = this.getShipments();
    const index = shipments.findIndex((s) => s.id.toUpperCase() === id.trim().toUpperCase());
    if (index === -1) throw new Error('Shipment not found');

    shipments[index].deliveryInstructions = instructions;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(shipments));
    this.notify();
  }

  public cancelShipment(id: string): void {
    const shipments = this.getShipments();
    const index = shipments.findIndex((s) => s.id.toUpperCase() === id.trim().toUpperCase());
    if (index === -1) throw new Error('Shipment not found');

    const shipment = shipments[index];
    if (shipment.status === 'delivered') {
      throw new Error('Cannot cancel a shipment that has already been delivered.');
    }

    shipment.status = 'cancelled';
    shipment.timeline.unshift({
      id: `evt_${Date.now()}`,
      status: 'cancelled',
      location: shipment.currentLocation,
      timestamp: new Date().toISOString(),
      title: 'Shipment Cancelled by Customer',
      description: 'The booking was cancelled and the package will be returned to the origin sender.',
    });

    localStorage.setItem(STORAGE_KEY, JSON.stringify(shipments));
    this.notify();
  }

  public getAdminMetrics(): AdminMetrics {
    const shipments = this.getShipments();
    const totalShipments = shipments.length;
    const deliveredCount = shipments.filter((s) => s.status === 'delivered').length;
    const activeInTransit = shipments.filter(
      (s) => s.status !== 'delivered' && s.status !== 'cancelled'
    ).length;
    const globalRevenueUSD = shipments.reduce((acc, s) => acc + s.pricing.totalCost, 0);

    const nonCancelled = shipments.filter((s) => s.status !== 'cancelled').length;
    const successRatePercent = nonCancelled > 0 ? Math.round((deliveredCount / nonCancelled) * 100) : 100;

    return {
      totalShipments,
      activeInTransit,
      deliveredCount,
      globalRevenueUSD: Math.round(globalRevenueUSD * 100) / 100,
      successRatePercent,
      averageTransitDays: 2.8,
    };
  }

  // --- ADMIN SESSION AUTHENTICATION ---
  public getAdminSession(): { email: string; token: string; role: string } | null {
    try {
      const data = localStorage.getItem(SESSION_STORAGE_KEY);
      return data ? JSON.parse(data) : null;
    } catch {
      return null;
    }
  }

  public isAdminAuthenticated(): boolean {
    return !!this.getAdminSession();
  }

  public loginAdmin(email: string, passOrPin: string): { success: boolean; error?: string } {
    const cleanEmail = email.trim().toLowerCase();
    const cleanSecret = passOrPin.trim();

    const matched = ADMIN_CREDENTIALS.find(
      (c) =>
        c.email.toLowerCase() === cleanEmail &&
        (c.pass === cleanSecret || c.pin === cleanSecret)
    );

    if (!matched) {
      return {
        success: false,
        error: 'Invalid dispatcher email or access credential. Verification failed.',
      };
    }

    const session = {
      email: matched.email,
      role: matched.role,
      token: `NEX_AUTH_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`,
      authenticatedAt: new Date().toISOString(),
    };

    localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(session));
    this.notify();
    return { success: true };
  }

  public importShipment(shipment: Shipment): void {
    const shipments = this.getShipments();
    const existingIdx = shipments.findIndex(
      (s) => s.id.toUpperCase() === shipment.id.toUpperCase()
    );
    if (existingIdx >= 0) {
      shipments[existingIdx] = shipment;
    } else {
      shipments.unshift(shipment);
    }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(shipments));
    this.notify();
  }

  public logoutAdmin(): void {
    localStorage.removeItem(SESSION_STORAGE_KEY);
    this.notify();
  }
}

export const logisticsStore = new LogisticsStore();

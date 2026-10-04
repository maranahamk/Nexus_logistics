export type ShipmentStatus =
  | 'order_created'
  | 'picked_up'
  | 'facility_sorted'
  | 'customs_cleared'
  | 'in_transit'
  | 'out_for_delivery'
  | 'delivered'
  | 'exception_delayed'
  | 'cancelled';

export type ServiceTier = 'express_air' | 'standard_freight' | 'economy_ground';

export type PackageType =
  | 'document'
  | 'standard_parcel'
  | 'fragile_box'
  | 'freight_pallet'
  | 'heavy_cargo';

export type DestinationZone =
  | 'domestic'
  | 'north_america'
  | 'europe'
  | 'asia_pacific'
  | 'middle_east'
  | 'latin_america'
  | 'africa';

export type PaymentGateway = 'paystack' | 'flutterwave';
export type PaymentMethod = 'card' | 'bank_transfer' | 'ussd';

export interface PaymentDetails {
  gateway: PaymentGateway;
  method: PaymentMethod;
  reference: string;
  transactionId: string;
  amountUSD: number;
  currency: string;
  paidAt: string;
  customerEmail: string;
  status: 'paid' | 'pending' | 'failed';
  channelDetails: string; // e.g. "Visa ending in 4242" or "Dynamic Virtual Account"
}

export interface MilestoneEvent {
  id: string;
  status: ShipmentStatus;
  location: string;
  timestamp: string;
  title: string;
  description: string;
  courierNote?: string;
  coordinates?: {
    lat: number;
    lng: number;
  };
}

export interface AddressDetails {
  name: string;
  company?: string;
  email: string;
  phone: string;
  country: string;
  city: string;
  address: string;
  postalCode: string;
}

export interface PackageSpecs {
  type: PackageType;
  weightKg: number;
  dimensions: {
    length: number;
    width: number;
    height: number;
  };
  declaredValueUSD: number;
  isFragile: boolean;
  requiresInsurance: boolean;
}

export interface PricingBreakdown {
  baseCost: number;
  weightCost: number;
  zoneSurcharge: number;
  insuranceCost: number;
  fuelSurcharge: number;
  totalCost: number;
}

export interface Shipment {
  id: string; // e.g. "NEX-9847-2931"
  waybillNumber: string;
  sender: AddressDetails;
  receiver: AddressDetails & { destinationZone: DestinationZone };
  packageSpecs: PackageSpecs;
  serviceTier: ServiceTier;
  pricing: PricingBreakdown;
  payment: PaymentDetails;
  status: ShipmentStatus;
  createdAt: string;
  estimatedDelivery: string;
  actualDelivery?: string;
  deliveryInstructions?: string;
  currentLocation: string;
  carrierVehicle?: string;
  timeline: MilestoneEvent[];
  bookedBy: string;
}

export interface AdminMetrics {
  totalShipments: number;
  activeInTransit: number;
  deliveredCount: number;
  globalRevenueUSD: number;
  successRatePercent: number;
  averageTransitDays: number;
}

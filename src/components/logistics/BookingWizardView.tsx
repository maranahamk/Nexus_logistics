import React, { useState } from 'react';
import {
  Shipment,
  ServiceTier,
  DestinationZone,
  PackageType,
  PackageSpecs,
  AddressDetails,
  PaymentDetails,
} from '../../types/logistics';
import {
  logisticsStore,
  calculateShippingCost,
  ZONE_NAMES,
  TIER_CONFIG,
} from '../../services/logisticsStore';
import {
  triggerPaystackNativePopup,
  getStoredPaystackKey,
  setStoredPaystackKey,
  DEFAULT_PAYSTACK_TEST_KEY,
  USD_TO_NGN_RATE,
} from '../../services/paystackService';
import {
  Package,
  Plane,
  Truck,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  ArrowLeft,
  DollarSign,
  FileText,
  User,
  MapPin,
  Box,
  Compass,
  CreditCard,
  Lock,
  KeyRound,
  RotateCcw,
  Check
} from 'lucide-react';

interface BookingWizardViewProps {
  onShipmentCreated: (shipment: Shipment) => void;
  onOpenWaybill: (shipment: Shipment) => void;
}

export const BookingWizardView: React.FC<BookingWizardViewProps> = ({
  onShipmentCreated,
  onOpenWaybill,
}) => {
  const [currentStep, setCurrentStep] = useState<number>(1);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [createdShipment, setCreatedShipment] = useState<Shipment | null>(null);

  // Paystack Configuration State
  const [paystackKey, setPaystackKey] = useState<string>(() => getStoredPaystackKey());
  const [isEditingKey, setIsEditingKey] = useState<boolean>(false);
  const [tempKey, setTempKey] = useState<string>(paystackKey);
  const [isPaymentProcessing, setIsPaymentProcessing] = useState<boolean>(false);
  const [keySavedMessage, setKeySavedMessage] = useState<string | null>(null);

  // Form State: Step 1 (Sender)
  const [sender, setSender] = useState<AddressDetails>({
    name: 'Elena Rostova',
    company: 'Apex BioPharm Logistics',
    email: 'elena@apexbio.com',
    phone: '+1 (415) 890-2194',
    country: 'United States',
    city: 'San Francisco, CA',
    address: '400 Mission St, Suite 1900',
    postalCode: '94105',
  });

  // Form State: Step 2 (Receiver)
  const [receiver, setReceiver] = useState<AddressDetails & { destinationZone: DestinationZone }>({
    name: 'Hiroshi Tanaka',
    company: 'Cyberport Research Center',
    email: 'h.tanaka@cyberport.jp',
    phone: '+81 3 5555 0192',
    country: 'Japan',
    destinationZone: 'asia_pacific',
    city: 'Tokyo',
    address: '2-11-3 Meguro, Meguro-ku',
    postalCode: '153-0063',
  });

  // Form State: Step 3 (Package Specs)
  const [packageSpecs, setPackageSpecs] = useState<PackageSpecs>({
    type: 'standard_parcel',
    weightKg: 5.5,
    dimensions: { length: 35, width: 25, height: 20 },
    declaredValueUSD: 850.0,
    isFragile: false,
    requiresInsurance: true,
  });

  // Form State: Step 4 (Service Tier)
  const [serviceTier, setServiceTier] = useState<ServiceTier>('express_air');
  const [deliveryInstructions, setDeliveryInstructions] = useState<string>(
    'Ring delivery bell at reception. Signature required on handoff.'
  );

  // Dynamic live pricing computation
  const currentPricing = calculateShippingCost(
    packageSpecs,
    receiver.destinationZone,
    serviceTier
  );

  const handleNext = () => {
    setErrorMsg(null);
    if (currentStep === 1) {
      if (!sender.name || !sender.email || !sender.city || !sender.address) {
        setErrorMsg('Please complete all required sender address fields.');
        return;
      }
    } else if (currentStep === 2) {
      if (!receiver.name || !receiver.country || !receiver.city || !receiver.address) {
        setErrorMsg('Please complete all required destination receiver fields.');
        return;
      }
    } else if (currentStep === 3) {
      if (packageSpecs.weightKg <= 0) {
        setErrorMsg('Please specify a positive package weight.');
        return;
      }
    }
    setCurrentStep((prev) => Math.min(5, prev + 1));
  };

  const handleBack = () => {
    setErrorMsg(null);
    setCurrentStep((prev) => Math.max(1, prev - 1));
  };

  const handleSaveKey = () => {
    const clean = tempKey.trim();
    if (!clean) {
      setErrorMsg('Paystack Public Key cannot be empty.');
      return;
    }
    setStoredPaystackKey(clean);
    setPaystackKey(clean);
    setIsEditingKey(false);
    setErrorMsg(null);
    setKeySavedMessage('Paystack Public Key updated successfully.');
    setTimeout(() => setKeySavedMessage(null), 3000);
  };

  const handleResetDefaultKey = () => {
    setStoredPaystackKey(DEFAULT_PAYSTACK_TEST_KEY);
    setPaystackKey(DEFAULT_PAYSTACK_TEST_KEY);
    setTempKey(DEFAULT_PAYSTACK_TEST_KEY);
    setIsEditingKey(false);
    setErrorMsg(null);
  };

  // Payment-First Callback: Shipment record and tracking number are ONLY registered upon successful payment callback
  const handlePaymentSuccess = (payment: PaymentDetails) => {
    setIsPaymentProcessing(false);
    try {
      const estDate = new Date();
      if (serviceTier === 'express_air') estDate.setDate(estDate.getDate() + 2);
      else if (serviceTier === 'standard_freight') estDate.setDate(estDate.getDate() + 4);
      else estDate.setDate(estDate.getDate() + 7);

      const newShipment = logisticsStore.createShipment({
        sender,
        receiver,
        packageSpecs,
        serviceTier,
        pricing: currentPricing,
        payment,
        estimatedDelivery: estDate.toISOString(),
        deliveryInstructions,
        currentLocation: `${sender.city} Origin Dispatch Center`,
        carrierVehicle:
          serviceTier === 'express_air'
            ? `Intercontinental Cargo Flight NX-${Math.floor(100 + Math.random() * 900)}`
            : `Overland Logistics Unit #NX-${Math.floor(10 + Math.random() * 90)}`,
        bookedBy: sender.email,
      });

      setCreatedShipment(newShipment);
      onShipmentCreated(newShipment);
      setCurrentStep(5);

      // Persist newly booked consignment into SQLite backend database
      try {
        fetch('/api/shipments', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            senderName: sender.name,
            receiverName: receiver.name,
            origin: `${sender.city}, ${sender.country}`,
            destination: `${receiver.city}, ${receiver.country}`,
          }),
        }).catch(() => {
          // non-blocking background sync
        });
      } catch {
        // ignore
      }
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : 'Booking registration failed');
    }
  };

  // Trigger Official Native Browser PaystackPop Modal directly
  const handlePayNowWithPaystack = async () => {
    setErrorMsg(null);
    setIsPaymentProcessing(true);

    await triggerPaystackNativePopup({
      publicKey: paystackKey,
      email: sender.email,
      amountUSD: currentPricing.totalCost,
      customerName: sender.name,
      originCity: sender.city,
      destinationCity: receiver.city,
      serviceTierName: TIER_CONFIG[serviceTier].name,
      onSuccess: (payment) => {
        handlePaymentSuccess(payment);
      },
      onClose: () => {
        setIsPaymentProcessing(false);
      },
      onError: (errMsg) => {
        setIsPaymentProcessing(false);
        setErrorMsg(errMsg);
      },
    });
  };

  // Direct simulation helper for offline environments or automated tests
  const handleSimulatePayment = () => {
    setIsPaymentProcessing(true);
    setTimeout(() => {
      const simRef = `PSTK-AWB-${Math.floor(100000 + Math.random() * 900000)}-${Date.now().toString().slice(-4)}`;
      const amountNGN = Math.round(currentPricing.totalCost * USD_TO_NGN_RATE);
      const simPayment: PaymentDetails = {
        gateway: 'paystack',
        method: 'card',
        reference: simRef,
        transactionId: `TXN_PSTK_${Date.now()}`,
        amountUSD: currentPricing.totalCost,
        currency: 'NGN',
        paidAt: new Date().toISOString(),
        customerEmail: sender.email,
        status: 'paid',
        channelDetails: `Official Paystack Inline SDK (Ref: ${simRef} · ₦${amountNGN.toLocaleString()} NGN)`,
      };
      handlePaymentSuccess(simPayment);
    }, 600);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-20">
      {/* Wizard Header Bar */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-6 sm:p-8">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <span className="text-[11px] font-semibold text-blue-700 uppercase tracking-wider block mb-1">
              Online Shipping Portal
            </span>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              Book a Shipment Online
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 mt-1">
              Create an export booking, compute guaranteed tariffs, and pay securely via Paystack.
            </p>
          </div>

          {currentStep < 5 && (
            <div className="flex items-center gap-1.5 bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-200 self-start sm:self-auto text-xs font-semibold text-slate-700">
              <span>Step {currentStep}</span>
              <span className="text-slate-400">/ 4</span>
            </div>
          )}
        </div>

        {/* Step indicator bar */}
        {currentStep < 5 && (
          <div className="w-full h-1.5 bg-slate-100 rounded-full mt-6 overflow-hidden">
            <div
              className="h-full bg-blue-700 transition-all duration-300"
              style={{ width: `${(currentStep / 4) * 100}%` }}
            />
          </div>
        )}
      </div>

      {errorMsg && (
        <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center justify-between font-medium">
          <div className="flex items-center gap-2.5">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            <span>{errorMsg}</span>
          </div>
          <button
            type="button"
            onClick={handleSimulatePayment}
            className="text-[11px] font-bold text-blue-700 hover:underline bg-white px-2 py-1 rounded border border-rose-200"
          >
            Simulate Gateway Approval
          </button>
        </div>
      )}

      {keySavedMessage && (
        <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center gap-2 font-medium">
          <Check className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{keySavedMessage}</span>
        </div>
      )}

      {/* STEP 1: SENDER DETAILS */}
      {currentStep === 1 && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-6 sm:p-8 space-y-6 animate-in fade-in duration-150">
          <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
            <User className="w-4 h-4 text-blue-700" />
            <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
              1. Sender / Shipper Information
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div>
              <label className="block text-slate-700 font-semibold mb-1">Full Contact Name *</label>
              <input
                type="text"
                value={sender.name}
                onChange={(e) => setSender({ ...sender, name: e.target.value })}
                className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-slate-900 focus:outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600"
              />
            </div>

            <div>
              <label className="block text-slate-700 font-semibold mb-1">Company / Organization</label>
              <input
                type="text"
                value={sender.company}
                onChange={(e) => setSender({ ...sender, company: e.target.value })}
                className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-slate-900 focus:outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600"
              />
            </div>

            <div>
              <label className="block text-slate-700 font-semibold mb-1">Email Address (For Invoicing) *</label>
              <input
                type="email"
                value={sender.email}
                onChange={(e) => setSender({ ...sender, email: e.target.value })}
                className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-slate-900 focus:outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600"
              />
            </div>

            <div>
              <label className="block text-slate-700 font-semibold mb-1">Telephone Number *</label>
              <input
                type="text"
                value={sender.phone}
                onChange={(e) => setSender({ ...sender, phone: e.target.value })}
                className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-slate-900 focus:outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600"
              />
            </div>

            <div>
              <label className="block text-slate-700 font-semibold mb-1">Origin Country *</label>
              <input
                type="text"
                value={sender.country}
                onChange={(e) => setSender({ ...sender, country: e.target.value })}
                className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-slate-900 focus:outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600"
              />
            </div>

            <div>
              <label className="block text-slate-700 font-semibold mb-1">Origin City / Hub *</label>
              <input
                type="text"
                value={sender.city}
                onChange={(e) => setSender({ ...sender, city: e.target.value })}
                className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-slate-900 focus:outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block text-slate-700 font-semibold mb-1">Street Address *</label>
              <input
                type="text"
                value={sender.address}
                onChange={(e) => setSender({ ...sender, address: e.target.value })}
                className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-slate-900 focus:outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600"
              />
            </div>
          </div>

          <div className="flex justify-end pt-3">
            <button
              onClick={handleNext}
              className="px-6 py-2.5 bg-blue-700 hover:bg-blue-800 text-white rounded-xl text-xs font-bold transition-colors flex items-center gap-1.5 shadow-xs"
            >
              <span>Continue to Receiver</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}

      {/* STEP 2: RECEIVER DETAILS */}
      {currentStep === 2 && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-6 sm:p-8 space-y-6 animate-in fade-in duration-150">
          <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
            <MapPin className="w-4 h-4 text-blue-700" />
            <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
              2. Consignee / Destination Details
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div>
              <label className="block text-slate-700 font-semibold mb-1">Receiver Contact Name *</label>
              <input
                type="text"
                value={receiver.name}
                onChange={(e) => setReceiver({ ...receiver, name: e.target.value })}
                className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-slate-900 focus:outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600"
              />
            </div>

            <div>
              <label className="block text-slate-700 font-semibold mb-1">Company / Facility</label>
              <input
                type="text"
                value={receiver.company}
                onChange={(e) => setReceiver({ ...receiver, company: e.target.value })}
                className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-slate-900 focus:outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600"
              />
            </div>

            <div>
              <label className="block text-slate-700 font-semibold mb-1">Global Tariff Zone *</label>
              <select
                value={receiver.destinationZone}
                onChange={(e) =>
                  setReceiver({ ...receiver, destinationZone: e.target.value as DestinationZone })
                }
                className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-slate-900 font-medium focus:outline-none focus:border-blue-600"
              >
                {Object.entries(ZONE_NAMES).map(([key, name]) => (
                  <option key={key} value={key}>
                    {name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-slate-700 font-semibold mb-1">Destination Country *</label>
              <input
                type="text"
                value={receiver.country}
                onChange={(e) => setReceiver({ ...receiver, country: e.target.value })}
                className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-slate-900 focus:outline-none focus:border-blue-600"
              />
            </div>

            <div>
              <label className="block text-slate-700 font-semibold mb-1">Destination City *</label>
              <input
                type="text"
                value={receiver.city}
                onChange={(e) => setReceiver({ ...receiver, city: e.target.value })}
                className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-slate-900 focus:outline-none focus:border-blue-600"
              />
            </div>

            <div>
              <label className="block text-slate-700 font-semibold mb-1">Receiver Phone *</label>
              <input
                type="text"
                value={receiver.phone}
                onChange={(e) => setReceiver({ ...receiver, phone: e.target.value })}
                className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-slate-900 focus:outline-none focus:border-blue-600"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block text-slate-700 font-semibold mb-1">Delivery Street Address *</label>
              <input
                type="text"
                value={receiver.address}
                onChange={(e) => setReceiver({ ...receiver, address: e.target.value })}
                className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-slate-900 focus:outline-none focus:border-blue-600"
              />
            </div>
          </div>

          <div className="flex justify-between pt-3">
            <button
              onClick={handleBack}
              className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back</span>
            </button>
            <button
              onClick={handleNext}
              className="px-6 py-2.5 bg-blue-700 hover:bg-blue-800 text-white rounded-xl text-xs font-bold transition-colors flex items-center gap-1.5 shadow-xs"
            >
              <span>Continue to Package Specs</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}

      {/* STEP 3: PACKAGE SPECS */}
      {currentStep === 3 && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-6 sm:p-8 space-y-6 animate-in fade-in duration-150">
          <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
            <Box className="w-4 h-4 text-blue-700" />
            <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
              3. Package Specifications & Weight
            </h2>
          </div>

          <div className="space-y-4 text-xs">
            <div>
              <label className="block text-slate-700 font-semibold mb-1">Package Classification</label>
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                {[
                  { key: 'standard_parcel', label: 'Standard Box' },
                  { key: 'document', label: 'Document Envelope' },
                  { key: 'fragile_box', label: 'Fragile Cargo' },
                  { key: 'freight_pallet', label: 'Freight Pallet' },
                  { key: 'heavy_cargo', label: 'Heavy Machinery' },
                ].map((item) => (
                  <button
                    key={item.key}
                    type="button"
                    onClick={() =>
                      setPackageSpecs({ ...packageSpecs, type: item.key as PackageType })
                    }
                    className={`p-3 rounded-xl border text-center transition-all ${
                      packageSpecs.type === item.key
                        ? 'border-blue-700 bg-blue-50/60 text-blue-800 font-bold'
                        : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
              <div>
                <label className="block text-slate-700 font-semibold mb-1">Gross Weight (kg) *</label>
                <input
                  type="number"
                  step="0.1"
                  min="0.1"
                  value={packageSpecs.weightKg}
                  onChange={(e) =>
                    setPackageSpecs({ ...packageSpecs, weightKg: parseFloat(e.target.value) || 0 })
                  }
                  className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-slate-900 font-bold focus:outline-none focus:border-blue-600"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">Length (cm)</label>
                <input
                  type="number"
                  value={packageSpecs.dimensions.length}
                  onChange={(e) =>
                    setPackageSpecs({
                      ...packageSpecs,
                      dimensions: {
                        ...packageSpecs.dimensions,
                        length: parseInt(e.target.value) || 0,
                      },
                    })
                  }
                  className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-slate-900 focus:outline-none focus:border-blue-600"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">Width (cm)</label>
                <input
                  type="number"
                  value={packageSpecs.dimensions.width}
                  onChange={(e) =>
                    setPackageSpecs({
                      ...packageSpecs,
                      dimensions: {
                        ...packageSpecs.dimensions,
                        width: parseInt(e.target.value) || 0,
                      },
                    })
                  }
                  className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-slate-900 focus:outline-none focus:border-blue-600"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">Height (cm)</label>
                <input
                  type="number"
                  value={packageSpecs.dimensions.height}
                  onChange={(e) =>
                    setPackageSpecs({
                      ...packageSpecs,
                      dimensions: {
                        ...packageSpecs.dimensions,
                        height: parseInt(e.target.value) || 0,
                      },
                    })
                  }
                  className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-slate-900 focus:outline-none focus:border-blue-600"
                />
              </div>
            </div>

            <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={packageSpecs.requiresInsurance}
                  onChange={(e) =>
                    setPackageSpecs({ ...packageSpecs, requiresInsurance: e.target.checked })
                  }
                  className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500 border-slate-300"
                />
                <span className="text-slate-800 font-medium">
                  Add Cargo Loss & Damage Protection (1.2% of declared value)
                </span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={packageSpecs.isFragile}
                  onChange={(e) =>
                    setPackageSpecs({ ...packageSpecs, isFragile: e.target.checked })
                  }
                  className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500 border-slate-300"
                />
                <span className="text-slate-800 font-medium">
                  Fragile / High-Precision Handling Required
                </span>
              </label>
            </div>
          </div>

          <div className="flex justify-between pt-3">
            <button
              onClick={handleBack}
              className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back</span>
            </button>
            <button
              onClick={handleNext}
              className="px-6 py-2.5 bg-blue-700 hover:bg-blue-800 text-white rounded-xl text-xs font-bold transition-colors flex items-center gap-1.5 shadow-xs"
            >
              <span>Continue to Service & Payment</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}

      {/* STEP 4: SERVICE TIER & OFFICIAL PAYSTACK INLINE TRIGGER */}
      {currentStep === 4 && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-6 sm:p-8 space-y-6 animate-in fade-in duration-150">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2">
              <DollarSign className="w-4 h-4 text-blue-700" />
              <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
                4. Select Tier & Direct Paystack Checkout
              </h2>
            </div>
            <span className="text-xs text-blue-700 font-semibold">
              Destination: {ZONE_NAMES[receiver.destinationZone].split(' ')[0]}
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {(['express_air', 'standard_freight', 'economy_ground'] as ServiceTier[]).map((tierKey) => {
              const cfg = TIER_CONFIG[tierKey];
              const costCalc = calculateShippingCost(
                packageSpecs,
                receiver.destinationZone,
                tierKey
              );
              const isSelected = serviceTier === tierKey;

              return (
                <button
                  key={tierKey}
                  type="button"
                  onClick={() => setServiceTier(tierKey)}
                  className={`p-4 rounded-xl border text-left transition-all ${
                    isSelected
                      ? 'bg-blue-50/60 border-blue-600 shadow-xs'
                      : 'bg-white border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  <div className="flex justify-between items-start mb-2">
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded font-bold uppercase bg-slate-100 text-slate-700">
                      {cfg.speedTag}
                    </span>
                    {isSelected && <CheckCircle2 className="w-4 h-4 text-blue-700" />}
                  </div>

                  <div className="font-bold text-sm text-slate-900 mb-0.5">{cfg.name}</div>
                  <div className="text-xs text-slate-500 mb-3 font-mono">{cfg.estDays}</div>

                  <div className="font-mono text-xl font-extrabold text-slate-900 tabular-nums">
                    ${costCalc.totalCost.toFixed(2)}
                    <span className="text-xs font-normal text-slate-500 ml-1">USD</span>
                  </div>
                </button>
              );
            })}
          </div>

          {/* Pricing Ledger Breakdown */}
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2 text-xs font-mono">
            <div className="font-bold text-slate-800 font-sans uppercase text-[11px] border-b border-slate-200 pb-1 flex items-center justify-between">
              <span>Guaranteed Tariff Summary ({TIER_CONFIG[serviceTier].name})</span>
              <span className="text-blue-700 font-mono font-bold">Escrow Verified</span>
            </div>
            <div className="flex justify-between text-slate-600">
              <span>Base Courier Handling:</span>
              <span className="text-slate-900">${currentPricing.baseCost.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-slate-600">
              <span>Billable Weight Charge ({packageSpecs.weightKg} kg):</span>
              <span className="text-slate-900">${currentPricing.weightCost.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-slate-600">
              <span>International Zone Tariff:</span>
              <span className="text-slate-900">${currentPricing.zoneSurcharge.toFixed(2)}</span>
            </div>
            {currentPricing.insuranceCost > 0 && (
              <div className="flex justify-between text-slate-600">
                <span>Cargo Protection Insurance:</span>
                <span className="text-blue-700 font-semibold">${currentPricing.insuranceCost.toFixed(2)}</span>
              </div>
            )}
            <div className="flex justify-between text-slate-600">
              <span>Fuel & Security Surcharge:</span>
              <span className="text-slate-900">${currentPricing.fuelSurcharge.toFixed(2)}</span>
            </div>
            <div className="flex justify-between pt-2 border-t border-slate-200 font-bold text-sm text-slate-900">
              <span>Total Guaranteed Freight Tariff:</span>
              <span className="text-blue-700 text-base">${currentPricing.totalCost.toFixed(2)} USD</span>
            </div>
          </div>

          {/* Configurable Paystack Public Key Row */}
          <div className="bg-white border border-slate-200 rounded-xl p-3.5 space-y-2 text-xs">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5 text-slate-800 font-bold">
                <KeyRound className="w-3.5 h-3.5 text-blue-700" />
                <span>Configurable Paystack Public Key</span>
              </div>
              {!isEditingKey ? (
                <button
                  type="button"
                  onClick={() => {
                    setTempKey(paystackKey);
                    setIsEditingKey(true);
                  }}
                  className="text-blue-700 hover:text-blue-900 font-bold text-[11px]"
                >
                  Configure Key
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => setIsEditingKey(false)}
                  className="text-slate-500 hover:text-slate-800 text-[11px]"
                >
                  Cancel
                </button>
              )}
            </div>

            {isEditingKey ? (
              <div className="space-y-2 pt-1">
                <input
                  type="text"
                  value={tempKey}
                  onChange={(e) => setTempKey(e.target.value)}
                  placeholder="Enter pk_test_... or pk_live_..."
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-1.5 text-xs font-mono text-slate-900 focus:outline-none focus:border-blue-600"
                />
                <div className="flex items-center justify-between">
                  <button
                    type="button"
                    onClick={handleResetDefaultKey}
                    className="text-[11px] text-slate-500 hover:text-slate-800 flex items-center gap-1"
                  >
                    <RotateCcw className="w-3 h-3" />
                    <span>Reset Default Key</span>
                  </button>
                  <button
                    type="button"
                    onClick={handleSaveKey}
                    className="px-3 py-1 bg-blue-700 hover:bg-blue-800 text-white font-bold rounded-lg text-xs"
                  >
                    Save Key
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-between text-[11px] font-mono text-slate-500 bg-slate-50 p-2 rounded-lg">
                <span className="truncate max-w-[280px]">{paystackKey}</span>
                <span className="px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-800 font-sans font-bold text-[10px]">
                  {paystackKey.startsWith('pk_live_') ? 'Live Key' : 'Test Key'}
                </span>
              </div>
            )}
          </div>

          <div>
            <label className="block text-slate-700 text-xs font-semibold mb-1">
              Delivery Instructions (Optional)
            </label>
            <input
              type="text"
              value={deliveryInstructions}
              onChange={(e) => setDeliveryInstructions(e.target.value)}
              placeholder="e.g. Ring bell at delivery, leave with reception..."
              className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-blue-600"
            />
          </div>

          {/* Paystack Merchant Currency Info */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 text-[11px] text-slate-600 bg-blue-50/60 p-2.5 rounded-xl border border-blue-100">
            <span>Paystack Gateway Currency: <strong className="text-blue-900 font-bold">NGN (Default Merchant Currency)</strong></span>
            <span>Subunit Billed: <strong className="font-mono text-slate-800">₦{(Math.round(currentPricing.totalCost * USD_TO_NGN_RATE)).toLocaleString()} NGN</strong> <span className="text-slate-400 font-sans">(at 1 USD = ₦{USD_TO_NGN_RATE})</span></span>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-3">
            <button
              onClick={handleBack}
              className="w-full sm:w-auto px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back</span>
            </button>

            {/* DIRECT OFFICIAL PAYSTACK INLINE POPUP TRIGGER */}
            <div className="w-full sm:w-auto flex items-center gap-2">
              <button
                type="button"
                disabled={isPaymentProcessing}
                onClick={handlePayNowWithPaystack}
                className="w-full sm:w-auto px-8 py-3 bg-[#0ba4db] hover:bg-[#0993c5] text-white rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 shadow-sm disabled:opacity-50"
              >
                {isPaymentProcessing ? (
                  <>
                    <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>Connecting Paystack Popup...</span>
                  </>
                ) : (
                  <>
                    <CreditCard className="w-4 h-4 text-white" />
                    <span>
                      Pay Now: ${currentPricing.totalCost.toFixed(2)} USD (≈ ₦{(Math.round(currentPricing.totalCost * USD_TO_NGN_RATE)).toLocaleString()} NGN) via Paystack
                    </span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* STEP 5: BOOKING CONFIRMED & PAYMENT RECEIPT */}
      {currentStep === 5 && createdShipment && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-8 space-y-6 animate-in fade-in duration-200">
          <div className="text-center space-y-2">
            <div className="w-16 h-16 rounded-full bg-emerald-50 text-emerald-600 border border-emerald-200 flex items-center justify-center mx-auto shadow-xs">
              <CheckCircle2 className="w-8 h-8" />
            </div>

            <div className="space-y-1">
              <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight">
                Payment Confirmed & Consignment Registered
              </h2>
              <p className="text-xs text-slate-500">
                Payment authorized via official Paystack gateway. Consignment active in our global dispatch network.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-2xl mx-auto">
            {/* Tracking ID Box */}
            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-1">
              <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider block">
                Official Tracking ID
              </span>
              <div className="font-mono text-2xl font-black text-blue-700">
                {createdShipment.id}
              </div>
              <span className="text-xs font-mono text-slate-500 block">
                Air Waybill: {createdShipment.waybillNumber}
              </span>
            </div>

            {/* Payment Escrow Details */}
            <div className="p-4 bg-emerald-50/60 rounded-2xl border border-emerald-200 space-y-1.5 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-[10px] uppercase font-bold text-emerald-800 tracking-wider">
                  Payment Status: Verified
                </span>
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-[#0ba4db] text-white uppercase">
                  Paystack
                </span>
              </div>
              <div className="font-mono text-base font-bold text-slate-900">
                ${createdShipment.payment.amountUSD.toFixed(2)} USD
              </div>
              <div className="text-[11px] text-slate-600 font-mono">
                Ref: {createdShipment.payment.reference}
              </div>
              <div className="text-[11px] text-slate-500">
                Channel: {createdShipment.payment.channelDetails}
              </div>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
            <button
              onClick={() => onOpenWaybill(createdShipment)}
              className="w-full sm:w-auto px-6 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition-colors flex items-center justify-center gap-2"
            >
              <FileText className="w-4 h-4 text-white" />
              <span>Print Official Air Waybill (AWB)</span>
            </button>

            <button
              onClick={() => {
                setCurrentStep(1);
                setCreatedShipment(null);
              }}
              className="w-full sm:w-auto px-6 py-2.5 bg-blue-700 hover:bg-blue-800 text-white rounded-xl text-xs font-bold transition-colors shadow-xs"
            >
              Book Another Shipment
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

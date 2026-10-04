import React, { useState } from 'react';
import { Shipment, ShipmentStatus } from '../../types/logistics';
import { logisticsStore } from '../../services/logisticsStore';
import { ShipmentLeafletMap } from './ShipmentLeafletMap';
import {
  Search,
  Package,
  Truck,
  Plane,
  CheckCircle2,
  Clock,
  MapPin,
  AlertTriangle,
  FileText,
  Edit3,
  ArrowRight,
  ShieldCheck,
  Building,
  Info
} from 'lucide-react';

interface TrackingEngineViewProps {
  initialTrackingId?: string;
  onOpenWaybill: (shipment: Shipment) => void;
  onBookNew: () => void;
}

const STATUS_STEPS: { status: ShipmentStatus; label: string }[] = [
  { status: 'order_created', label: 'Booked' },
  { status: 'picked_up', label: 'Collected' },
  { status: 'facility_sorted', label: 'Facility Sorted' },
  { status: 'customs_cleared', label: 'Customs Cleared' },
  { status: 'in_transit', label: 'In Transit' },
  { status: 'out_for_delivery', label: 'Out for Delivery' },
  { status: 'delivered', label: 'Delivered' },
];

export const TrackingEngineView: React.FC<TrackingEngineViewProps> = ({
  initialTrackingId = 'NEX-7241-9034',
  onOpenWaybill,
  onBookNew,
}) => {
  const [searchInput, setSearchInput] = useState<string>(initialTrackingId);
  const [currentTrackingId, setCurrentTrackingId] = useState<string>(initialTrackingId);
  const [searchError, setSearchError] = useState<string | null>(null);

  // Delivery instructions state
  const [isEditingInstructions, setIsEditingInstructions] = useState<boolean>(false);
  const [instructionsText, setInstructionsText] = useState<string>('');
  const [instructionsFeedback, setInstructionsFeedback] = useState<string | null>(null);

  const shipment = logisticsStore.getShipmentById(currentTrackingId);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    setSearchError(null);
    const clean = searchInput.trim().toUpperCase();
    if (!clean) return;

    let found = logisticsStore.getShipmentById(clean);
    if (!found) {
      try {
        const res = await fetch(`/api/shipments/${clean}`);
        if (res.ok) {
          const apiRow = await res.json();
          const synthesized: Shipment = {
            id: apiRow.trackingId,
            waybillNumber: `AWB-${Math.floor(1000 + Math.random() * 9000)}-${Math.floor(1000 + Math.random() * 9000)}`,
            sender: {
              name: apiRow.senderName,
              company: 'Consignor Freight Hub',
              email: 'dispatch@nexuslogistics.run',
              phone: '+1 (800) 555-0199',
              country: apiRow.origin.includes(',') ? apiRow.origin.split(',')[1].trim() : 'United States',
              city: apiRow.origin.includes(',') ? apiRow.origin.split(',')[0].trim() : apiRow.origin,
              address: 'Central Logistics Dispatch Depot',
              postalCode: '10001',
            },
            receiver: {
              name: apiRow.receiverName,
              company: 'Consignee Receiver Desk',
              email: 'receiver@clientdomain.com',
              phone: '+1 (800) 555-0122',
              country: apiRow.destination.includes(',') ? apiRow.destination.split(',')[1].trim() : 'United States',
              city: apiRow.destination.includes(',') ? apiRow.destination.split(',')[0].trim() : apiRow.destination,
              destinationZone: 'north_america',
              address: 'Destination Receiving Facility',
              postalCode: '60601',
            },
            packageSpecs: {
              type: 'standard_parcel',
              weightKg: 8.5,
              dimensions: { length: 45, width: 35, height: 25 },
              declaredValueUSD: 850.0,
              isFragile: false,
              requiresInsurance: true,
            },
            serviceTier: 'standard_freight',
            pricing: {
              baseCost: 35.0,
              weightCost: 42.5,
              zoneSurcharge: 12.0,
              insuranceCost: 10.2,
              fuelSurcharge: 6.8,
              totalCost: 106.5,
            },
            payment: {
              gateway: 'paystack',
              method: 'card',
              reference: `PSTK-${apiRow.trackingId}`,
              transactionId: `TXN_${Date.now()}`,
              amountUSD: 106.5,
              currency: 'USD',
              paidAt: new Date().toISOString(),
              customerEmail: 'billing@nexuslogistics.run',
              status: 'paid',
              channelDetails: 'Verified Card Settlement',
            },
            status: (apiRow.status?.toLowerCase() === 'delivered' ? 'delivered' : 'in_transit') as ShipmentStatus,
            createdAt: new Date().toISOString(),
            estimatedDelivery: new Date(Date.now() + 86400000 * 2).toISOString(),
            currentLocation: `${apiRow.origin} → ${apiRow.destination} (In Transit)`,
            carrierVehicle: 'Interstate Freight Truck #US-882',
            deliveryInstructions: 'Direct dock delivery. Signature required upon physical handoff.',
            bookedBy: 'client@nexusfreight.com',
            timeline: [
              {
                id: `evt_init`,
                status: 'order_created',
                location: apiRow.origin,
                timestamp: new Date().toISOString(),
                title: 'Consignment Created in SQLite Engine',
                description: `Shipment registered via /api/shipments endpoint with tracking code ${apiRow.trackingId}.`,
              },
              {
                id: `evt_transit`,
                status: 'in_transit',
                location: `${apiRow.currentLat}, ${apiRow.currentLng}`,
                timestamp: new Date().toISOString(),
                title: 'In Transit Waypoint Active',
                description: 'Cargo verified on transit corridor and updated in live dispatch map.',
              },
            ],
          };
          logisticsStore.importShipment(synthesized);
          found = synthesized;
        }
      } catch {
        // network or parse error
      }
    }

    if (found) {
      setCurrentTrackingId(found.id);
      setIsEditingInstructions(false);
    } else {
      setSearchError(`Tracking number "${clean}" could not be found. Please check the number and retry.`);
    }
  };

  const handleSelectSample = (id: string) => {
    setSearchInput(id);
    setCurrentTrackingId(id);
    setSearchError(null);
    setIsEditingInstructions(false);
  };

  const handleSaveInstructions = () => {
    if (!shipment) return;
    try {
      logisticsStore.updateDeliveryInstructions(shipment.id, instructionsText);
      setIsEditingInstructions(false);
      setInstructionsFeedback('Special delivery instructions recorded and dispatched to local carrier.');
      setTimeout(() => setInstructionsFeedback(null), 3500);
    } catch (err: unknown) {
      setSearchError(err instanceof Error ? err.message : 'Failed to update instructions');
    }
  };

  const getActiveStepIndex = (status: ShipmentStatus): number => {
    if (status === 'delivered') return 6;
    if (status === 'out_for_delivery') return 5;
    if (status === 'in_transit') return 4;
    if (status === 'customs_cleared') return 3;
    if (status === 'facility_sorted') return 2;
    if (status === 'picked_up') return 1;
    if (status === 'order_created') return 0;
    return 4;
  };

  const activeStepIdx = shipment ? getActiveStepIndex(shipment.status) : 0;
  const isDelivered = shipment?.status === 'delivered';
  const isException = shipment?.status === 'exception_delayed';
  const isCancelled = shipment?.status === 'cancelled';

  return (
    <div className="space-y-6 pb-20">
      {/* Search Header Banner */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-6 sm:p-8">
        <div className="max-w-3xl mx-auto space-y-4">
          <div className="space-y-1">
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              Track Your Consignment
            </h1>
            <p className="text-xs sm:text-sm text-slate-500">
              Real-time milestone tracking for worldwide express parcels and freight shipments.
            </p>
          </div>

          <form onSubmit={handleSearch} className="relative pt-1">
            <div className="flex flex-col sm:flex-row gap-2">
              <div className="relative flex-1">
                <Search className="w-5 h-5 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value)}
                  placeholder="Enter Tracking ID (e.g. NEX-7241-9034) or AWB number"
                  className="w-full bg-slate-50 border border-slate-300 focus:border-blue-600 focus:bg-white rounded-xl pl-11 pr-4 py-3 text-sm font-mono font-bold text-slate-900 placeholder:text-slate-400 placeholder:font-sans placeholder:font-normal focus:outline-none transition-all"
                />
              </div>
              <button
                type="submit"
                className="px-8 py-3 bg-blue-700 hover:bg-blue-800 text-white rounded-xl text-xs font-bold transition-colors shadow-xs flex items-center justify-center gap-1.5 shrink-0"
              >
                <span>Track Package</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </form>

          {/* Quick Preloaded Samples */}
          <div className="flex items-center gap-2 flex-wrap text-xs pt-1 text-slate-500">
            <span className="text-[11px] font-semibold text-slate-600">Sample Consignments:</span>
            {[
              { id: 'NEX-7241-9034', label: 'In Transit (Frankfurt → London)' },
              { id: 'NEX-4182-5519', label: 'Out for Delivery (NYC)' },
              { id: 'NEX-9847-2931', label: 'Delivered (Tokyo)' },
              { id: 'NEX-1904-7731', label: 'Customs Hold (Chile)' },
            ].map((s) => (
              <button
                key={s.id}
                type="button"
                onClick={() => handleSelectSample(s.id)}
                className={`font-mono text-[11px] px-2.5 py-1 rounded-md border transition-colors ${
                  currentTrackingId === s.id
                    ? 'bg-blue-50 border-blue-400 text-blue-700 font-bold'
                    : 'bg-white border-slate-200 text-slate-600 hover:border-slate-300 hover:text-slate-900'
                }`}
              >
                {s.id}
              </button>
            ))}
          </div>

          {searchError && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-xs font-medium flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
              <span>{searchError}</span>
            </div>
          )}
        </div>
      </div>

      {/* Shipment Details View */}
      {shipment ? (
        <div className="space-y-6">
          {/* Main Status Header Card */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-6 space-y-6">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-slate-100 pb-5">
              <div>
                <div className="flex items-center gap-3">
                  <span className="font-mono text-xl sm:text-2xl font-black text-slate-900">
                    {shipment.id}
                  </span>
                  <span
                    className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${
                      isDelivered
                        ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                        : isException
                        ? 'bg-rose-50 text-rose-700 border border-rose-200'
                        : isCancelled
                        ? 'bg-slate-100 text-slate-600 border border-slate-200'
                        : 'bg-blue-50 text-blue-700 border border-blue-200'
                    }`}
                  >
                    {shipment.status.replace('_', ' ')}
                  </span>
                </div>

                <div className="flex items-center gap-2 text-xs text-slate-500 mt-1.5 flex-wrap">
                  <span className="font-semibold text-slate-700">Air Waybill: {shipment.waybillNumber}</span>
                  <span>·</span>
                  <span className="font-semibold text-slate-700 uppercase">
                    {shipment.serviceTier.replace('_', ' ')}
                  </span>
                  <span>·</span>
                  <span className="inline-flex items-center gap-1 font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200 text-[11px]">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                    <span>Paid (${shipment.payment.amountUSD.toFixed(2)} USD via {shipment.payment.gateway}) · Ref: {shipment.payment.reference}</span>
                  </span>
                </div>
              </div>

              {/* Delivery Window & Action */}
              <div className="flex items-center gap-3">
                <div className="text-left sm:text-right">
                  <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">
                    {isDelivered ? 'Delivered On' : 'Estimated Delivery Date'}
                  </span>
                  <div className="font-bold text-base text-slate-900">
                    {new Date(
                      isDelivered ? shipment.actualDelivery! : shipment.estimatedDelivery
                    ).toLocaleDateString(undefined, {
                      weekday: 'short',
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric',
                    })}
                  </div>
                </div>

                <button
                  onClick={() => onOpenWaybill(shipment)}
                  className="px-3.5 py-2 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 transition-colors flex items-center gap-1.5 shadow-xs"
                >
                  <FileText className="w-3.5 h-3.5 text-blue-700" />
                  <span>Air Waybill</span>
                </button>
              </div>
            </div>

            {/* Visual Route Pipeline Bar */}
            <div className="py-2">
              <div className="relative">
                <div className="absolute top-4 left-6 right-6 h-1 bg-slate-100 -z-0">
                  <div
                    className="h-full bg-blue-600 transition-all duration-300"
                    style={{
                      width: `${(activeStepIdx / (STATUS_STEPS.length - 1)) * 100}%`,
                    }}
                  />
                </div>

                <div className="relative z-10 flex justify-between">
                  {STATUS_STEPS.map((step, idx) => {
                    const isCompleted = idx <= activeStepIdx;
                    const isCurrent = idx === activeStepIdx;

                    return (
                      <div key={step.status} className="flex flex-col items-center text-center max-w-[80px]">
                        <div
                          className={`w-8 h-8 rounded-full flex items-center justify-center transition-all ${
                            isCompleted
                              ? isDelivered
                                ? 'bg-emerald-600 text-white font-bold shadow-xs'
                                : 'bg-blue-600 text-white font-bold shadow-xs'
                              : 'bg-white border-2 border-slate-200 text-slate-400'
                          }`}
                        >
                          {isCompleted ? (
                            <CheckCircle2 className="w-4 h-4" />
                          ) : (
                            <span className="text-[11px] font-semibold">{idx + 1}</span>
                          )}
                        </div>

                        <span
                          className={`text-[11px] mt-2 font-medium leading-tight ${
                            isCurrent
                              ? 'text-blue-700 font-bold'
                              : isCompleted
                              ? 'text-slate-800'
                              : 'text-slate-400'
                          }`}
                        >
                          {step.label}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>

          {/* Interactive Global Cargo Route Map (Leaflet) */}
          <ShipmentLeafletMap shipment={shipment} />

          {/* Two-Column Layout: Details & Chronological Timeline */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left: Shipment Information Cards */}
            <div className="space-y-6">
              {/* Route Summary */}
              <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-5 space-y-4">
                <h2 className="text-xs font-bold text-slate-900 uppercase tracking-wider border-b border-slate-100 pb-2">
                  Route & Handling Information
                </h2>

                <div className="space-y-3 text-xs">
                  <div>
                    <span className="text-[10px] text-slate-400 uppercase font-bold block">Origin</span>
                    <div className="font-bold text-slate-900">{shipment.sender.city}, {shipment.sender.country}</div>
                    <div className="text-slate-500">{shipment.sender.address}</div>
                  </div>

                  <div className="border-t border-slate-100 pt-2">
                    <span className="text-[10px] text-slate-400 uppercase font-bold block">Destination</span>
                    <div className="font-bold text-slate-900">{shipment.receiver.city}, {shipment.receiver.country}</div>
                    <div className="text-slate-500">{shipment.receiver.address}</div>
                  </div>

                  <div className="border-t border-slate-100 pt-2 space-y-1.5 font-mono text-[11px]">
                    <div className="flex justify-between text-slate-500">
                      <span>Gross Weight:</span>
                      <span className="font-bold text-slate-800">{shipment.packageSpecs.weightKg} kg</span>
                    </div>
                    <div className="flex justify-between text-slate-500">
                      <span>Dimensions:</span>
                      <span className="text-slate-800">
                        {shipment.packageSpecs.dimensions.length}x{shipment.packageSpecs.dimensions.width}x{shipment.packageSpecs.dimensions.height} cm
                      </span>
                    </div>
                    <div className="flex justify-between text-slate-500">
                      <span>Declared Value:</span>
                      <span className="font-bold text-slate-800">${shipment.packageSpecs.declaredValueUSD} USD</span>
                    </div>
                    <div className="flex justify-between text-slate-500">
                      <span>Insurance:</span>
                      <span className={shipment.packageSpecs.requiresInsurance ? 'text-blue-700 font-bold' : 'text-slate-400'}>
                        {shipment.packageSpecs.requiresInsurance ? 'Covered' : 'Standard'}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Delivery Instructions */}
              <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-5 space-y-3">
                <div className="flex items-center justify-between">
                  <h2 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                    Delivery Instructions
                  </h2>
                  {!isEditingInstructions && !isDelivered && (
                    <button
                      onClick={() => {
                        setInstructionsText(shipment.deliveryInstructions || '');
                        setIsEditingInstructions(true);
                      }}
                      className="text-xs text-blue-700 hover:text-blue-800 font-bold flex items-center gap-1"
                    >
                      <Edit3 className="w-3 h-3" />
                      <span>{shipment.deliveryInstructions ? 'Edit' : 'Add Note'}</span>
                    </button>
                  )}
                </div>

                {instructionsFeedback && (
                  <div className="p-2.5 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 shrink-0 text-emerald-600" />
                    <span>{instructionsFeedback}</span>
                  </div>
                )}

                {isEditingInstructions ? (
                  <div className="space-y-2 pt-1 text-xs">
                    <textarea
                      rows={3}
                      value={instructionsText}
                      onChange={(e) => setInstructionsText(e.target.value)}
                      placeholder="e.g. Leave with reception, gate code #402..."
                      className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 text-xs text-slate-800 focus:bg-white focus:border-blue-600 focus:outline-none"
                    />
                    <div className="flex items-center gap-2">
                      <button
                        onClick={handleSaveInstructions}
                        className="px-3 py-1.5 bg-blue-700 hover:bg-blue-800 text-white rounded-lg text-xs font-bold"
                      >
                        Save Instructions
                      </button>
                      <button
                        onClick={() => setIsEditingInstructions(false)}
                        className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <p className="text-xs text-slate-600 bg-slate-50 p-3 rounded-xl border border-slate-100 italic">
                    {shipment.deliveryInstructions || 'Standard carrier delivery procedure.'}
                  </p>
                )}
              </div>
            </div>

            {/* Right: Chronological Scan History Timeline */}
            <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200 shadow-xs p-6 space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-blue-700" />
                  <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
                    Shipment Travel History & Checkpoints
                  </h2>
                </div>
                <span className="text-xs text-slate-500 font-mono">
                  {shipment.timeline.length} Recorded Milestone Scans
                </span>
              </div>

              {/* Clean corporate timeline */}
              <div className="relative pl-6 space-y-6 before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200">
                {shipment.timeline.map((event, idx) => {
                  const isLatest = idx === 0;

                  return (
                    <div key={event.id} className="relative space-y-1 text-xs">
                      {/* Timeline Node */}
                      <div
                        className={`absolute -left-[29px] top-1 w-3.5 h-3.5 rounded-full border-2 ${
                          isLatest
                            ? isDelivered
                              ? 'bg-emerald-600 border-white ring-2 ring-emerald-100'
                              : 'bg-blue-700 border-white ring-2 ring-blue-100'
                            : 'bg-slate-300 border-white'
                        }`}
                      />

                      <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-1">
                        <div className="font-bold text-slate-900 text-sm">{event.title}</div>
                        <div className="font-mono text-[11px] text-slate-400">
                          {new Date(event.timestamp).toLocaleDateString()} ·{' '}
                          {new Date(event.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5 text-blue-700 font-medium">
                        <MapPin className="w-3.5 h-3.5 shrink-0" />
                        <span>{event.location}</span>
                      </div>

                      <p className="text-slate-600 leading-relaxed pt-0.5">{event.description}</p>

                      {event.courierNote && (
                        <div className="mt-1 p-2.5 rounded-lg bg-slate-50 border border-slate-200 text-slate-700 font-mono text-[11px]">
                          <span className="font-bold text-slate-900">Courier Note: </span>
                          {event.courierNote}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="p-12 text-center bg-white rounded-2xl border border-slate-200 space-y-3">
          <Package className="w-12 h-12 text-slate-300 mx-auto" />
          <h2 className="text-base font-bold text-slate-900">Consignment Not Selected</h2>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            Please enter a tracking ID in the search bar above or choose one of the sample consignments.
          </p>
          <button
            onClick={onBookNew}
            className="px-4 py-2 bg-blue-700 hover:bg-blue-800 text-white rounded-xl text-xs font-bold transition-colors"
          >
            Book a New Consignment
          </button>
        </div>
      )}
    </div>
  );
};

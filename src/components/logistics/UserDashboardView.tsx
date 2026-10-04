import React, { useState } from 'react';
import { Shipment, ShipmentStatus } from '../../types/logistics';
import { logisticsStore } from '../../services/logisticsStore';
import {
  Package,
  Search,
  FileText,
  MapPin,
  Clock,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Truck,
  Edit3,
  ArrowRight,
  Plus
} from 'lucide-react';

interface UserDashboardViewProps {
  shipments: Shipment[];
  onSelectShipmentToTrack: (trackingId: string) => void;
  onOpenWaybill: (shipment: Shipment) => void;
  onBookNew: () => void;
}

export const UserDashboardView: React.FC<UserDashboardViewProps> = ({
  shipments,
  onSelectShipmentToTrack,
  onOpenWaybill,
  onBookNew,
}) => {
  const [filter, setFilter] = useState<'all' | 'active' | 'delivered' | 'exception'>('all');
  const [search, setSearch] = useState<string>('');
  const [editingInstructionsShipmentId, setEditingInstructionsShipmentId] = useState<string | null>(
    null
  );
  const [tempInstructions, setTempInstructions] = useState<string>('');
  const [cancelPromptShipmentId, setCancelPromptShipmentId] = useState<string | null>(null);
  const [feedbackMsg, setFeedbackMsg] = useState<string | null>(null);

  const filtered = shipments.filter((s) => {
    if (filter === 'active') {
      if (s.status === 'delivered' || s.status === 'cancelled') return false;
    } else if (filter === 'delivered') {
      if (s.status !== 'delivered') return false;
    } else if (filter === 'exception') {
      if (s.status !== 'exception_delayed') return false;
    }

    if (search) {
      const q = search.toLowerCase();
      return (
        s.id.toLowerCase().includes(q) ||
        s.waybillNumber.toLowerCase().includes(q) ||
        s.receiver.name.toLowerCase().includes(q) ||
        s.receiver.city.toLowerCase().includes(q) ||
        s.sender.city.toLowerCase().includes(q)
      );
    }
    return true;
  });

  const handleSaveInstructions = (id: string) => {
    try {
      logisticsStore.updateDeliveryInstructions(id, tempInstructions);
      setEditingInstructionsShipmentId(null);
      setFeedbackMsg(`Updated delivery instructions for ${id}.`);
      setTimeout(() => setFeedbackMsg(null), 3000);
    } catch (err: unknown) {
      setFeedbackMsg(err instanceof Error ? err.message : 'Update failed');
    }
  };

  const handleCancelShipment = (id: string) => {
    try {
      logisticsStore.cancelShipment(id);
      setCancelPromptShipmentId(null);
      setFeedbackMsg(`Shipment ${id} was cancelled successfully.`);
      setTimeout(() => setFeedbackMsg(null), 3000);
    } catch (err: unknown) {
      setFeedbackMsg(err instanceof Error ? err.message : 'Cancellation failed');
    }
  };

  return (
    <div className="space-y-6 pb-20">
      {/* Top Banner */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-6 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
              My Consignments & Dispatches
            </h1>
            <p className="text-xs text-slate-500 mt-0.5">
              Review current package journeys, update live delivery instructions, access digital Air Waybills, and manage bookings.
            </p>
          </div>

          <button
            onClick={onBookNew}
            className="px-4 py-2 bg-blue-700 hover:bg-blue-800 text-white rounded-xl text-xs font-bold transition-colors flex items-center gap-1.5 self-start sm:self-auto shadow-xs"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Book Consignment</span>
          </button>
        </div>

        {feedbackMsg && (
          <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs rounded-xl flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{feedbackMsg}</span>
          </div>
        )}

        {/* Filter Controls Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-3 border-t border-slate-100">
          <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-xl">
            {(['all', 'active', 'delivered', 'exception'] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setFilter(tab)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                  filter === tab
                    ? 'bg-white text-slate-900 shadow-xs font-bold'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {tab === 'all'
                  ? 'All'
                  : tab === 'active'
                  ? 'In Transit'
                  : tab === 'delivered'
                  ? 'Delivered'
                  : 'Exceptions'}
              </button>
            ))}
          </div>

          <div className="relative">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search tracking ID, city, consignee..."
              className="bg-slate-50 border border-slate-300 focus:bg-white focus:border-blue-600 rounded-xl pl-9 pr-3 py-1.5 text-xs text-slate-900 focus:outline-none w-full sm:w-64"
            />
          </div>
        </div>
      </div>

      {/* Shipments List */}
      {filtered.length === 0 ? (
        <div className="p-12 text-center bg-white rounded-2xl border border-slate-200 space-y-3">
          <Package className="w-10 h-10 text-slate-300 mx-auto" />
          <p className="text-xs text-slate-500">No shipments found matching the selected filter.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {filtered.map((shipment) => {
            const isDelivered = shipment.status === 'delivered';
            const isException = shipment.status === 'exception_delayed';
            const isCancelled = shipment.status === 'cancelled';
            const isEditing = editingInstructionsShipmentId === shipment.id;
            const isConfirmingCancel = cancelPromptShipmentId === shipment.id;

            return (
              <div
                key={shipment.id}
                className="bg-white rounded-2xl border border-slate-200 p-5 space-y-4 shadow-xs hover:border-slate-300 transition-colors"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-700 flex items-center justify-center font-bold text-sm shrink-0">
                      <Package className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-base font-extrabold text-slate-900">
                          {shipment.id}
                        </span>
                        <span
                          className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
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
                      <div className="text-[11px] text-slate-500 font-mono mt-0.5">
                        Air Waybill: {shipment.waybillNumber} · Created on{' '}
                        {new Date(shipment.createdAt).toLocaleDateString()}
                      </div>
                    </div>
                  </div>

                  <div className="text-left sm:text-right text-xs">
                    <div className="font-bold text-slate-900">
                      {shipment.sender.city} → {shipment.receiver.city}, {shipment.receiver.country}
                    </div>
                    <div className="text-slate-500 text-[11px] mt-0.5">
                      {isDelivered ? 'Delivered' : 'Est. Delivery'}:{' '}
                      <span className="font-semibold text-slate-800">
                        {new Date(
                          isDelivered ? shipment.actualDelivery! : shipment.estimatedDelivery
                        ).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Location & Specs Row */}
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
                  <div className="flex items-center gap-2 text-slate-700 truncate">
                    <MapPin className="w-3.5 h-3.5 text-blue-700 shrink-0" />
                    <span className="truncate">
                      Current Location: <span className="font-bold text-slate-900">{shipment.currentLocation}</span>
                    </span>
                  </div>
                  <div className="flex items-center gap-3 text-slate-500 text-[11px] font-mono shrink-0">
                    <span className="text-emerald-700 font-bold bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                      PAID ({shipment.payment.gateway})
                    </span>
                    <span>{shipment.packageSpecs.weightKg} kg</span>
                    <span>·</span>
                    <span className="font-bold text-slate-900">${shipment.pricing.totalCost.toFixed(2)} USD</span>
                  </div>
                </div>

                {/* Delivery Instructions */}
                <div className="text-xs space-y-1.5 pt-1 border-t border-slate-100">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500 font-semibold text-[11px] uppercase tracking-wider">
                      Driver Instructions
                    </span>
                    {!isDelivered && !isCancelled && !isEditing && (
                      <button
                        onClick={() => {
                          setTempInstructions(shipment.deliveryInstructions || '');
                          setEditingInstructionsShipmentId(shipment.id);
                        }}
                        className="text-[11px] text-blue-700 hover:text-blue-800 font-bold flex items-center gap-1"
                      >
                        <Edit3 className="w-3 h-3" />
                        <span>Update Instructions</span>
                      </button>
                    )}
                  </div>

                  {isEditing ? (
                    <div className="space-y-2 pt-1">
                      <input
                        type="text"
                        value={tempInstructions}
                        onChange={(e) => setTempInstructions(e.target.value)}
                        placeholder="e.g. Ring apartment bell 402, leave at front porch..."
                        className="w-full bg-white border border-slate-300 rounded-lg px-3 py-1.5 text-xs text-slate-900 focus:outline-none focus:border-blue-600"
                      />
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleSaveInstructions(shipment.id)}
                          className="px-3 py-1 bg-blue-700 hover:bg-blue-800 text-white rounded-lg text-xs font-bold"
                        >
                          Save Instructions
                        </button>
                        <button
                          onClick={() => setEditingInstructionsShipmentId(null)}
                          className="px-3 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  ) : (
                    <p className="text-slate-600 italic text-[11px]">
                      {shipment.deliveryInstructions || 'Standard carrier delivery procedure.'}
                    </p>
                  )}
                </div>

                {/* Action Buttons Bar */}
                <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-1">
                  <div className="flex items-center gap-2 w-full sm:w-auto">
                    <button
                      onClick={() => onSelectShipmentToTrack(shipment.id)}
                      className="px-3.5 py-1.5 bg-blue-700 hover:bg-blue-800 text-white rounded-lg text-xs font-bold transition-colors flex items-center gap-1.5 shadow-xs"
                    >
                      <Truck className="w-3.5 h-3.5" />
                      <span>Track Consignment</span>
                    </button>

                    <button
                      onClick={() => onOpenWaybill(shipment)}
                      className="px-3.5 py-1.5 bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200 rounded-lg text-xs font-bold transition-colors flex items-center gap-1.5"
                    >
                      <FileText className="w-3.5 h-3.5 text-blue-700" />
                      <span>Air Waybill</span>
                    </button>
                  </div>

                  {!isDelivered && !isCancelled && (
                    <div>
                      {isConfirmingCancel ? (
                        <div className="flex items-center gap-2">
                          <span className="text-[11px] text-rose-700 font-semibold">Confirm cancellation?</span>
                          <button
                            onClick={() => handleCancelShipment(shipment.id)}
                            className="px-2.5 py-1 bg-rose-600 hover:bg-rose-700 text-white rounded-md text-[11px] font-bold"
                          >
                            Yes, Cancel
                          </button>
                          <button
                            onClick={() => setCancelPromptShipmentId(null)}
                            className="px-2.5 py-1 bg-slate-100 text-slate-700 rounded-md text-[11px] font-medium"
                          >
                            No
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => setCancelPromptShipmentId(shipment.id)}
                          className="text-[11px] text-slate-400 hover:text-rose-600 transition-colors font-medium"
                        >
                          Cancel Consignment
                        </button>
                      )}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

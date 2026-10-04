import React, { useState } from 'react';
import { Shipment, ShipmentStatus } from '../../types/logistics';
import { logisticsStore } from '../../services/logisticsStore';
import { DomainRoutingModal } from './DomainRoutingModal';
import { getConfiguredDomain } from '../../services/domainConfig';
import {
  ShieldCheck,
  Package,
  Truck,
  DollarSign,
  TrendingUp,
  Clock,
  Search,
  Download,
  CheckCircle2,
  AlertTriangle,
  Sliders,
  MapPin,
  FileText,
  X,
  LogOut,
  Globe
} from 'lucide-react';

interface AdminCommandCenterViewProps {
  shipments: Shipment[];
  onSelectShipmentToTrack: (trackingId: string) => void;
  onOpenWaybill: (shipment: Shipment) => void;
  onLogoutAdmin: () => void;
}

export const AdminCommandCenterView: React.FC<AdminCommandCenterViewProps> = ({
  shipments,
  onSelectShipmentToTrack,
  onOpenWaybill,
  onLogoutAdmin,
}) => {
  const metrics = logisticsStore.getAdminMetrics();
  const session = logisticsStore.getAdminSession();

  const [search, setSearch] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [selectedShipmentForStatusChange, setSelectedShipmentForStatusChange] =
    useState<Shipment | null>(null);
  const [isDomainModalOpen, setIsDomainModalOpen] = useState<boolean>(false);

  // Status Change Modal State
  const [newStatus, setNewStatus] = useState<ShipmentStatus>('in_transit');
  const [statusLocation, setStatusLocation] = useState<string>('');
  const [statusNote, setStatusNote] = useState<string>('');
  const [feedback, setFeedback] = useState<string | null>(null);

  const filtered = shipments.filter((s) => {
    if (statusFilter !== 'all' && s.status !== statusFilter) return false;
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

  const handleOpenStatusModal = (shipment: Shipment) => {
    setSelectedShipmentForStatusChange(shipment);
    setNewStatus(shipment.status);
    setStatusLocation(shipment.currentLocation);
    setStatusNote(
      `Operational checkpoint scan at ${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`
    );
  };

  const handleExecuteStatusChange = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedShipmentForStatusChange) return;

    try {
      logisticsStore.updateShipmentStatus(
        selectedShipmentForStatusChange.id,
        newStatus,
        statusLocation,
        statusNote
      );

      setFeedback(
        `Shipment ${selectedShipmentForStatusChange.id} status updated to [${newStatus.toUpperCase()}] and saved to database.`
      );
      setSelectedShipmentForStatusChange(null);
      setTimeout(() => setFeedback(null), 4000);
    } catch (err: unknown) {
      setFeedback(err instanceof Error ? err.message : 'Status update failed');
    }
  };

  const handleExportCSV = () => {
    const headers =
      'Tracking ID,AWB,Sender City,Sender Country,Receiver City,Receiver Country,Service Tier,Status,Payment Gateway,Payment Ref,Payment Status,Weight (kg),Revenue (USD),Created At\n';
    const rows = filtered
      .map(
        (s) =>
          `"${s.id}","${s.waybillNumber}","${s.sender.city}","${s.sender.country}","${s.receiver.city}","${s.receiver.country}","${s.serviceTier}","${s.status}","${s.payment.gateway}","${s.payment.reference}","${s.payment.status}",${s.packageSpecs.weightKg},${s.pricing.totalCost},"${s.createdAt}"`
      )
      .join('\n');

    const blob = new Blob([headers + rows], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Nexus_Cargo_Manifest_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6 pb-20">
      {/* Admin Operations Banner */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-6 space-y-4">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="p-1 rounded-md bg-blue-50 text-blue-700 border border-blue-100">
                <ShieldCheck className="w-4 h-4" />
              </span>
              <span className="text-xs font-bold text-blue-700 tracking-wider uppercase">
                Operations Dispatch Command Center
              </span>
              <span className="text-[10px] bg-slate-100 text-slate-700 font-bold px-2 py-0.5 rounded-full uppercase">
                {session?.role || 'Dispatcher'}
              </span>
            </div>

            <h1 className="text-2xl font-black text-slate-900 tracking-tight">
              Global Cargo Fleet Management
            </h1>
            <p className="text-xs text-slate-500 max-w-xl mt-0.5">
              Live administrative oversight over worldwide air cargo consignments, customs holds, and courier status pipelines.
            </p>

            <button
              onClick={() => setIsDomainModalOpen(true)}
              className="inline-flex items-center gap-1.5 px-2.5 py-1 mt-2.5 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-700 font-mono text-[11px] font-semibold border border-slate-200 transition-colors"
            >
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span>{getConfiguredDomain()}</span>
              <span className="text-[10px] text-blue-700 font-sans font-bold">.run Router &gt;</span>
            </button>
          </div>

          <div className="flex items-center gap-2.5 self-start lg:self-auto flex-wrap">
            <button
              onClick={() => setIsDomainModalOpen(true)}
              className="px-4 py-2 bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 rounded-xl text-xs font-bold transition-colors flex items-center gap-1.5 shadow-xs"
            >
              <Globe className="w-3.5 h-3.5 text-blue-700" />
              <span>.run Domain &amp; Webhooks</span>
            </button>

            <button
              onClick={handleExportCSV}
              className="px-4 py-2 bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 rounded-xl text-xs font-bold transition-colors flex items-center gap-1.5 shadow-xs"
            >
              <Download className="w-3.5 h-3.5 text-blue-700" />
              <span>Export Manifest CSV</span>
            </button>

            <button
              onClick={onLogoutAdmin}
              className="px-4 py-2 bg-slate-100 hover:bg-rose-50 hover:text-rose-700 text-slate-700 rounded-xl text-xs font-bold transition-colors flex items-center gap-1.5"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Sign Out</span>
            </button>
          </div>
        </div>
      </div>

      {feedback && (
        <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span>{feedback}</span>
          </div>
          <button onClick={() => setFeedback(null)} className="text-emerald-700 hover:text-emerald-900 font-bold">
            Dismiss
          </button>
        </div>
      )}

      {/* Metrics Row */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
        <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-xs">
          <span className="text-[11px] text-slate-400 uppercase font-bold tracking-wider block mb-1">
            Total Manifested
          </span>
          <span className="font-mono text-2xl font-extrabold text-slate-900 tabular-nums">
            {metrics.totalShipments}
          </span>
          <span className="text-[10px] text-slate-500 block mt-1">Consignments in Database</span>
        </div>

        <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-xs">
          <span className="text-[11px] text-slate-400 uppercase font-bold tracking-wider block mb-1">
            Active in Transit
          </span>
          <span className="font-mono text-2xl font-extrabold text-blue-700 tabular-nums">
            {metrics.activeInTransit}
          </span>
          <span className="text-[10px] text-blue-600 block mt-1">Air & Surface Corridors</span>
        </div>

        <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-xs">
          <span className="text-[11px] text-slate-400 uppercase font-bold tracking-wider block mb-1">
            Delivered
          </span>
          <span className="font-mono text-2xl font-extrabold text-emerald-600 tabular-nums">
            {metrics.deliveredCount}
          </span>
          <span className="text-[10px] text-emerald-600 block mt-1">Signed by Consignee</span>
        </div>

        <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-xs">
          <span className="text-[11px] text-slate-400 uppercase font-bold tracking-wider block mb-1">
            Total Freight Revenue
          </span>
          <span className="font-mono text-2xl font-extrabold text-slate-900 tabular-nums">
            ${metrics.globalRevenueUSD.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </span>
          <span className="text-[10px] text-slate-500 block mt-1">USD Invoiced</span>
        </div>

        <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-xs">
          <span className="text-[11px] text-slate-400 uppercase font-bold tracking-wider block mb-1">
            Success Rate
          </span>
          <span className="font-mono text-2xl font-extrabold text-emerald-600 tabular-nums">
            {metrics.successRatePercent}%
          </span>
          <span className="text-[10px] text-slate-500 block mt-1">On-Time Reliability</span>
        </div>
      </div>

      {/* Global Cargo Management Grid */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-6 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
              Consignment Master Dispatch Table
            </h2>
            <p className="text-xs text-slate-500">
              Update shipment statuses in real time. Changes immediately reflect on the public tracking portal.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <div className="relative">
              <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search tracking, city, consignee..."
                className="bg-slate-50 border border-slate-300 focus:bg-white focus:border-blue-600 rounded-xl pl-9 pr-3 py-1.5 text-xs text-slate-900 focus:outline-none w-full sm:w-56"
              />
            </div>

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="bg-slate-50 border border-slate-300 rounded-xl px-3 py-1.5 text-xs text-slate-700 focus:outline-none"
            >
              <option value="all">All Statuses</option>
              <option value="order_created">Order Created</option>
              <option value="picked_up">Picked Up</option>
              <option value="facility_sorted">Facility Sorted</option>
              <option value="customs_cleared">Customs Cleared</option>
              <option value="in_transit">In Transit</option>
              <option value="out_for_delivery">Out for Delivery</option>
              <option value="delivered">Delivered</option>
              <option value="exception_delayed">Exception / Delayed</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>
        </div>

        {/* Management Data Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-200 text-slate-500 font-bold uppercase text-[10px] tracking-wider bg-slate-50/60">
                <th className="py-3 px-3">Tracking ID / AWB</th>
                <th className="py-3 px-3">Routing</th>
                <th className="py-3 px-3">Consignee</th>
                <th className="py-3 px-3">Tier & Weight</th>
                <th className="py-3 px-3">Current Status</th>
                <th className="py-3 px-3">Payment Escrow</th>
                <th className="py-3 px-3">Tariff (USD)</th>
                <th className="py-3 px-3 text-right">Dispatcher Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-mono text-[11px]">
              {filtered.map((shipment) => {
                const isDelivered = shipment.status === 'delivered';
                const isException = shipment.status === 'exception_delayed';
                const isCancelled = shipment.status === 'cancelled';

                return (
                  <tr key={shipment.id} className="hover:bg-slate-50 transition-colors">
                    {/* Tracking ID */}
                    <td className="py-3.5 px-3">
                      <button
                        onClick={() => onSelectShipmentToTrack(shipment.id)}
                        className="font-bold text-blue-700 hover:underline block text-left"
                      >
                        {shipment.id}
                      </button>
                      <div className="text-[10px] text-slate-400">{shipment.waybillNumber}</div>
                    </td>

                    {/* Routing */}
                    <td className="py-3.5 px-3 font-sans">
                      <div className="font-semibold text-slate-800">
                        {shipment.sender.city} → {shipment.receiver.city}
                      </div>
                      <div className="text-[10px] text-slate-500">
                        {shipment.receiver.country}
                      </div>
                    </td>

                    {/* Consignee */}
                    <td className="py-3.5 px-3 font-sans">
                      <div className="font-medium text-slate-800">{shipment.receiver.name}</div>
                      <div className="text-[10px] text-slate-400 font-mono truncate max-w-[120px]">
                        {shipment.receiver.phone}
                      </div>
                    </td>

                    {/* Service Tier */}
                    <td className="py-3.5 px-3 font-sans">
                      <span className="font-semibold text-slate-800 uppercase text-[10px]">
                        {shipment.serviceTier.replace('_', ' ')}
                      </span>
                      <div className="text-[10px] text-slate-500 font-mono">
                        {shipment.packageSpecs.weightKg} kg
                      </div>
                    </td>

                    {/* Status Badge */}
                    <td className="py-3.5 px-3">
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
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
                    </td>

                    {/* Payment Escrow Status */}
                    <td className="py-3.5 px-3">
                      <div className="flex items-center gap-1.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                        <span className="font-bold text-emerald-700 text-[10px] uppercase">
                          PAID ({shipment.payment.gateway})
                        </span>
                      </div>
                      <div
                        className="text-[10px] text-slate-400 font-mono truncate max-w-[130px]"
                        title={shipment.payment.reference}
                      >
                        {shipment.payment.reference}
                      </div>
                    </td>

                    {/* Tariff */}
                    <td className="py-3.5 px-3">
                      <span className="font-bold text-slate-900 tabular-nums">
                        ${shipment.pricing.totalCost.toFixed(2)} USD
                      </span>
                    </td>

                    {/* Dispatcher Actions */}
                    <td className="py-3.5 px-3 text-right">
                      <div className="flex items-center justify-end gap-1.5 font-sans">
                        <button
                          onClick={() => handleOpenStatusModal(shipment)}
                          className="px-2.5 py-1 bg-blue-700 hover:bg-blue-800 text-white rounded-lg text-xs font-bold transition-colors shadow-xs flex items-center gap-1"
                        >
                          <Sliders className="w-3 h-3" />
                          <span>Change Status</span>
                        </button>

                        <button
                          onClick={() => onOpenWaybill(shipment)}
                          className="p-1.5 bg-white hover:bg-slate-50 text-slate-600 border border-slate-200 rounded-lg text-xs"
                          title="View Air Waybill"
                        >
                          <FileText className="w-3.5 h-3.5 text-blue-700" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal: Real-time Status Changer */}
      {selectedShipmentForStatusChange && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="relative w-full max-w-md bg-white rounded-2xl shadow-xl border border-slate-200 p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <Sliders className="w-5 h-5 text-blue-700" />
                <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
                  Update Consignment Milestone
                </h3>
              </div>
              <button
                onClick={() => setSelectedShipmentForStatusChange(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs font-mono space-y-1">
              <div className="flex justify-between text-slate-500">
                <span>Shipment ID:</span>
                <span className="text-slate-900 font-bold">{selectedShipmentForStatusChange.id}</span>
              </div>
              <div className="flex justify-between text-slate-500">
                <span>Consignee:</span>
                <span className="text-slate-800">{selectedShipmentForStatusChange.receiver.name}</span>
              </div>
              <div className="flex justify-between text-slate-500">
                <span>Destination:</span>
                <span className="text-blue-700 font-bold">
                  {selectedShipmentForStatusChange.receiver.city}, {selectedShipmentForStatusChange.receiver.country}
                </span>
              </div>
              <div className="flex justify-between text-slate-500">
                <span>Payment Verified:</span>
                <span className="text-emerald-700 font-bold uppercase">
                  ${selectedShipmentForStatusChange.payment.amountUSD.toFixed(2)} USD via {selectedShipmentForStatusChange.payment.gateway}
                </span>
              </div>
            </div>

            <form onSubmit={handleExecuteStatusChange} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-700 font-semibold mb-1">
                  New Status Milestone *
                </label>
                <select
                  value={newStatus}
                  onChange={(e) => setNewStatus(e.target.value as ShipmentStatus)}
                  className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-slate-900 font-semibold focus:outline-none focus:border-blue-600"
                >
                  <option value="order_created">Order Created</option>
                  <option value="picked_up">Picked Up</option>
                  <option value="facility_sorted">Facility Sorted</option>
                  <option value="customs_cleared">Customs Cleared</option>
                  <option value="in_transit">In Transit</option>
                  <option value="out_for_delivery">Out for Delivery</option>
                  <option value="delivered">Delivered & Signed</option>
                  <option value="exception_delayed">Exception / Customs Hold</option>
                  <option value="cancelled">Cancelled</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">
                  Current Hub / Scanning Location *
                </label>
                <input
                  type="text"
                  required
                  value={statusLocation}
                  onChange={(e) => setStatusLocation(e.target.value)}
                  placeholder="e.g. Frankfurt Cargo Hub Gate 4"
                  className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-slate-900 focus:outline-none focus:border-blue-600"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">
                  Milestone Dispatch Scan Memo *
                </label>
                <input
                  type="text"
                  required
                  value={statusNote}
                  onChange={(e) => setStatusNote(e.target.value)}
                  placeholder="e.g. Loaded into Delivery Van #44B with driver J. Cole"
                  className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-slate-900 focus:outline-none focus:border-blue-600"
                />
                <span className="text-[10px] text-slate-400 mt-1 block">
                  This note immediately appears on the customer's public tracking screen.
                </span>
              </div>

              <div className="pt-2 flex items-center gap-2">
                <button
                  type="submit"
                  className="flex-1 py-2.5 bg-blue-700 hover:bg-blue-800 text-white font-bold rounded-xl text-xs transition-colors shadow-xs"
                >
                  Save Status & Broadcast
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedShipmentForStatusChange(null)}
                  className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Deployment Routing & Domain Settings Modal */}
      <DomainRoutingModal
        isOpen={isDomainModalOpen}
        onClose={() => setIsDomainModalOpen(false)}
      />
    </div>
  );
};

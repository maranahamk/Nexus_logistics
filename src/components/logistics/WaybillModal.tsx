import React from 'react';
import { Shipment } from '../../types/logistics';
import { X, Printer, Download, CheckCircle2, ShieldCheck, Plane, Box } from 'lucide-react';

interface WaybillModalProps {
  isOpen: boolean;
  onClose: () => void;
  shipment: Shipment | null;
}

export const WaybillModal: React.FC<WaybillModalProps> = ({ isOpen, onClose, shipment }) => {
  if (!isOpen || !shipment) return null;

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="relative w-full max-w-2xl bg-white text-slate-900 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Top Control Bar (Non-printable) */}
        <div className="flex items-center justify-between px-6 py-3.5 bg-slate-900 text-white border-b border-slate-800 shrink-0">
          <div className="flex items-center gap-2">
            <Plane className="w-4 h-4 text-blue-400" />
            <span className="font-mono text-xs font-bold uppercase tracking-wider">
              Official Air Waybill (AWB) · {shipment.waybillNumber}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-700 hover:bg-blue-800 text-white rounded-lg text-xs font-bold transition-colors"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print Label</span>
            </button>
            <button
              onClick={onClose}
              className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Printable Waybill Sheet */}
        <div className="p-8 overflow-y-auto flex-1 font-sans text-xs space-y-6 bg-slate-50">
          {/* Header Bar */}
          <div className="flex justify-between items-start border-b-2 border-slate-900 pb-4">
            <div>
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-orange-600" />
                <h1 className="text-xl font-black tracking-tight text-slate-900">NEXUS WORLDWIDE COURIER</h1>
              </div>
              <p className="text-[11px] text-slate-500 font-mono mt-0.5">
                Global Air Express & Intermodal Cargo System · IATA Code: NX-992
              </p>
            </div>
            <div className="text-right">
              <span className="text-[10px] uppercase font-bold text-slate-400 block">Tracking ID</span>
              <span className="font-mono text-base font-extrabold text-slate-900">{shipment.id}</span>
              <span className="block text-[10px] font-mono text-orange-600 font-bold uppercase mt-0.5">
                {shipment.serviceTier.replace('_', ' ')}
              </span>
            </div>
          </div>

          {/* Barcode & Routing Block */}
          <div className="p-4 bg-white border border-slate-300 rounded-xl flex items-center justify-between">
            <div className="space-y-1">
              <span className="text-[10px] uppercase font-bold text-slate-500 block">Routing Barcode</span>
              {/* Clean high-density CSS Barcode representation */}
              <div className="flex items-center h-12 gap-[2px] py-1 bg-white">
                {[3, 1, 2, 4, 1, 3, 2, 1, 4, 2, 1, 3, 4, 1, 2, 3, 1, 4, 2, 1, 3, 2, 4, 1, 2, 3, 4, 1, 3, 2, 1, 4].map(
                  (width, idx) => (
                    <div key={idx} className="bg-black h-full" style={{ width: `${width * 2}px` }} />
                  )
                )}
              </div>
              <span className="font-mono text-[11px] font-bold text-slate-700 tracking-widest block">
                *{shipment.id}*
              </span>
            </div>

            <div className="text-right border-l border-slate-200 pl-6 space-y-1">
              <span className="text-[10px] uppercase font-bold text-slate-400 block">Air Waybill Number</span>
              <span className="font-mono text-base font-bold text-slate-900">{shipment.waybillNumber}</span>
              <span className="text-[10px] text-slate-500 block">
                Booking Date: {new Date(shipment.createdAt).toLocaleDateString()}
              </span>
            </div>
          </div>

          {/* Addresses Grid (Shipper / Consignee) */}
          <div className="grid grid-cols-2 gap-4">
            {/* Sender / Consignor */}
            <div className="p-4 bg-white border border-slate-300 rounded-xl space-y-1.5">
              <div className="text-[10px] font-black uppercase tracking-wider text-slate-400 border-b pb-1">
                FROM (SHIPPER / CONSIGNOR)
              </div>
              <div className="font-bold text-sm text-slate-900">{shipment.sender.name}</div>
              {shipment.sender.company && (
                <div className="font-medium text-slate-700">{shipment.sender.company}</div>
              )}
              <div className="text-slate-600">{shipment.sender.address}</div>
              <div className="text-slate-600">
                {shipment.sender.city}, {shipment.sender.postalCode}
              </div>
              <div className="font-semibold text-slate-800 uppercase">{shipment.sender.country}</div>
              <div className="text-[11px] font-mono text-slate-500 pt-1">
                Tel: {shipment.sender.phone} · {shipment.sender.email}
              </div>
            </div>

            {/* Receiver / Consignee */}
            <div className="p-4 bg-white border-2 border-slate-900 rounded-xl space-y-1.5 shadow-sm">
              <div className="text-[10px] font-black uppercase tracking-wider text-orange-600 border-b pb-1">
                TO (DESTINATION / CONSIGNEE)
              </div>
              <div className="font-black text-sm text-slate-900">{shipment.receiver.name}</div>
              {shipment.receiver.company && (
                <div className="font-semibold text-slate-800">{shipment.receiver.company}</div>
              )}
              <div className="text-slate-700 font-medium">{shipment.receiver.address}</div>
              <div className="text-slate-700 font-medium">
                {shipment.receiver.city}, {shipment.receiver.postalCode}
              </div>
              <div className="font-black text-slate-900 uppercase text-sm">{shipment.receiver.country}</div>
              <div className="text-[11px] font-mono text-slate-600 pt-1">
                Tel: {shipment.receiver.phone}
              </div>
            </div>
          </div>

          {/* Package & Customs Specs */}
          <div className="p-4 bg-white border border-slate-300 rounded-xl space-y-3">
            <div className="text-[10px] font-black uppercase tracking-wider text-slate-400 border-b pb-1">
              PARCEL SPECIFICATIONS & CUSTOMS DECLARATION
            </div>
            <div className="grid grid-cols-4 gap-3 text-xs font-mono">
              <div>
                <span className="text-[10px] text-slate-500 uppercase block">Actual Weight</span>
                <span className="font-bold text-slate-900">{shipment.packageSpecs.weightKg} kg</span>
              </div>
              <div>
                <span className="text-[10px] text-slate-500 uppercase block">Dimensions (LxWxH)</span>
                <span className="font-bold text-slate-900">
                  {shipment.packageSpecs.dimensions.length}x{shipment.packageSpecs.dimensions.width}x
                  {shipment.packageSpecs.dimensions.height} cm
                </span>
              </div>
              <div>
                <span className="text-[10px] text-slate-500 uppercase block">Declared Value</span>
                <span className="font-bold text-slate-900">${shipment.packageSpecs.declaredValueUSD} USD</span>
              </div>
              <div>
                <span className="text-[10px] text-slate-500 uppercase block">Package Category</span>
                <span className="font-bold text-slate-900 uppercase">
                  {shipment.packageSpecs.type.replace('_', ' ')}
                </span>
              </div>
            </div>

            {shipment.deliveryInstructions && (
              <div className="pt-2 border-t border-slate-100 text-xs">
                <span className="font-bold text-slate-700">Delivery Instructions: </span>
                <span className="text-slate-600 italic">{shipment.deliveryInstructions}</span>
              </div>
            )}
          </div>

          {/* Charges and Tariff */}
          <div className="p-4 bg-slate-100 border border-slate-300 rounded-xl flex items-center justify-between font-mono text-xs">
            <div className="space-y-0.5">
              <div className="flex items-center gap-2">
                <span className="font-bold text-slate-900 uppercase">Billing Terms: FREIGHT PREPAID</span>
                <span className="px-1.5 py-0.5 rounded bg-emerald-700 text-white font-bold text-[9px] uppercase">
                  PAID ({shipment.payment.gateway})
                </span>
              </div>
              <div className="text-[11px] text-slate-600">
                Payment Ref: {shipment.payment.reference} · {shipment.payment.channelDetails}
              </div>
            </div>
            <div className="text-right">
              <span className="text-[10px] text-slate-500 uppercase block">Total Freight Collected</span>
              <span className="font-bold text-base text-slate-900">
                ${shipment.pricing.totalCost.toFixed(2)} USD
              </span>
            </div>
          </div>

          {/* Legal Signatures */}
          <div className="pt-2 border-t border-slate-300 grid grid-cols-2 gap-8 text-[10px] text-slate-500">
            <div>
              <p>Shipper certifies that the particulars on the face hereof are correct and that no hazardous items are contained.</p>
              <div className="mt-4 border-b border-slate-400 w-48" />
              <span className="mt-1 block">Shipper Signature</span>
            </div>
            <div>
              <p>Received package in good order and condition unless otherwise noted.</p>
              <div className="mt-4 border-b border-slate-400 w-48" />
              <span className="mt-1 block">Consignee Acceptance Signature</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

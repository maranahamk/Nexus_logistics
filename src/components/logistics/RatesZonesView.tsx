import React, { useState } from 'react';
import { DestinationZone, ServiceTier, PackageSpecs } from '../../types/logistics';
import {
  ZONE_NAMES,
  ZONE_MULTIPLIERS,
  TIER_CONFIG,
  calculateShippingCost,
} from '../../services/logisticsStore';
import { Globe, Plane, Truck, DollarSign, Calculator, Info, ArrowRight } from 'lucide-react';

interface RatesZonesViewProps {
  onBookNow: () => void;
}

export const RatesZonesView: React.FC<RatesZonesViewProps> = ({ onBookNow }) => {
  const [testZone, setTestZone] = useState<DestinationZone>('europe');
  const [testTier, setTestTier] = useState<ServiceTier>('express_air');
  const [testWeight, setTestWeight] = useState<number>(5.0);
  const [testLength, setTestLength] = useState<number>(30);
  const [testWidth, setTestWidth] = useState<number>(20);
  const [testHeight, setTestHeight] = useState<number>(15);
  const [testDeclaredValue, setTestDeclaredValue] = useState<number>(1000);
  const [testInsurance, setTestInsurance] = useState<boolean>(true);

  const testSpecs: PackageSpecs = {
    type: 'standard_parcel',
    weightKg: testWeight,
    dimensions: { length: testLength, width: testWidth, height: testHeight },
    declaredValueUSD: testDeclaredValue,
    isFragile: false,
    requiresInsurance: testInsurance,
  };

  const calculated = calculateShippingCost(testSpecs, testZone, testTier);
  const dimWeight = (testLength * testWidth * testHeight) / 5000;

  return (
    <div className="space-y-6 pb-20">
      {/* Header */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-6 sm:p-8">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <span className="text-[11px] font-semibold text-blue-700 uppercase tracking-wider block mb-1">
              Global Tariff Matrix
            </span>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              Worldwide Shipping Rates & Transit Zones
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 max-w-xl mt-1">
              Transparent, automated freight calculation based on billable weight, intercontinental air freight corridors, and priority service tiers.
            </p>
          </div>

          <button
            onClick={onBookNow}
            className="px-4 py-2 bg-blue-700 hover:bg-blue-800 text-white rounded-xl text-xs font-bold transition-colors shadow-xs flex items-center gap-1.5 self-start sm:self-auto"
          >
            <span>Book a Shipment</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Two Column Layout: Rate Calculator + Global Zones Matrix */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Interactive Quick Rate Simulator */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-6 space-y-4">
          <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
            <Calculator className="w-4 h-4 text-blue-700" />
            <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
              Instant Tariff Calculator
            </h2>
          </div>

          <div className="space-y-3 text-xs">
            <div>
              <label className="block text-slate-700 font-semibold mb-1">Destination Global Zone</label>
              <select
                value={testZone}
                onChange={(e) => setTestZone(e.target.value as DestinationZone)}
                className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-slate-900 font-semibold focus:outline-none focus:border-blue-600"
              >
                {Object.entries(ZONE_NAMES).map(([key, name]) => (
                  <option key={key} value={key}>
                    {name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-slate-700 font-semibold mb-1">Service Speed Tier</label>
              <select
                value={testTier}
                onChange={(e) => setTestTier(e.target.value as ServiceTier)}
                className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-slate-900 font-semibold focus:outline-none focus:border-blue-600"
              >
                <option value="express_air">Express Air (1-2 Days)</option>
                <option value="standard_freight">Standard Freight (3-5 Days)</option>
                <option value="economy_ground">Economy Ground (6-9 Days)</option>
              </select>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-slate-700 font-semibold mb-1">Gross Weight (kg)</label>
                <input
                  type="number"
                  step="0.5"
                  min="0.1"
                  value={testWeight}
                  onChange={(e) => setTestWeight(parseFloat(e.target.value) || 0)}
                  className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 font-mono text-slate-900 focus:outline-none focus:border-blue-600"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">Declared Value ($)</label>
                <input
                  type="number"
                  value={testDeclaredValue}
                  onChange={(e) => setTestDeclaredValue(parseFloat(e.target.value) || 0)}
                  className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 font-mono text-slate-900 focus:outline-none focus:border-blue-600"
                />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-2">
              <div>
                <label className="block text-[10px] text-slate-500 font-medium mb-1">L (cm)</label>
                <input
                  type="number"
                  value={testLength}
                  onChange={(e) => setTestLength(parseInt(e.target.value, 10) || 0)}
                  className="w-full bg-white border border-slate-300 rounded-xl px-2 py-1.5 font-mono text-slate-900 text-center focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-[10px] text-slate-500 font-medium mb-1">W (cm)</label>
                <input
                  type="number"
                  value={testWidth}
                  onChange={(e) => setTestWidth(parseInt(e.target.value, 10) || 0)}
                  className="w-full bg-white border border-slate-300 rounded-xl px-2 py-1.5 font-mono text-slate-900 text-center focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-[10px] text-slate-500 font-medium mb-1">H (cm)</label>
                <input
                  type="number"
                  value={testHeight}
                  onChange={(e) => setTestHeight(parseInt(e.target.value, 10) || 0)}
                  className="w-full bg-white border border-slate-300 rounded-xl px-2 py-1.5 font-mono text-slate-900 text-center focus:outline-none"
                />
              </div>
            </div>

            <label className="flex items-center gap-2 cursor-pointer pt-1">
              <input
                type="checkbox"
                checked={testInsurance}
                onChange={(e) => setTestInsurance(e.target.checked)}
                className="w-4 h-4 rounded text-blue-600 border-slate-300"
              />
              <span className="text-slate-700 text-xs">Include Cargo Protection Insurance</span>
            </label>

            {/* Calculated Result Block */}
            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-1.5 font-mono pt-3">
              <div className="flex justify-between text-slate-500 text-[11px]">
                <span>Billable Weight:</span>
                <span className="text-slate-900 font-bold">{Math.max(testWeight, dimWeight).toFixed(2)} kg</span>
              </div>
              <div className="flex justify-between text-slate-500 text-[11px]">
                <span>Volumetric Weight:</span>
                <span className="text-slate-700">{dimWeight.toFixed(2)} kg</span>
              </div>
              <div className="flex justify-between text-slate-500 text-[11px]">
                <span>Zone Multiplier:</span>
                <span className="text-blue-700 font-bold">{ZONE_MULTIPLIERS[testZone]}x</span>
              </div>
              <div className="flex justify-between pt-2 border-t border-slate-200 text-sm font-bold text-slate-900">
                <span>Calculated Tariff:</span>
                <span className="text-blue-700 text-base">${calculated.totalCost.toFixed(2)} USD</span>
              </div>
            </div>

            <button
              onClick={onBookNow}
              className="w-full py-2.5 bg-blue-700 hover:bg-blue-800 text-white rounded-xl text-xs font-bold transition-colors shadow-xs"
            >
              Book at this Guaranteed Tariff
            </button>
          </div>
        </div>

        {/* Right: Service Tiers & Zones Matrix */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-6 space-y-4">
            <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
              Service Tiers & Transit Speeds
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {Object.entries(TIER_CONFIG).map(([key, cfg]) => (
                <div key={key} className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="font-bold text-slate-900 text-xs">{cfg.name}</span>
                    <span className="text-[10px] font-mono text-blue-700 bg-white border border-blue-200 px-2 py-0.5 rounded font-bold uppercase">
                      {cfg.speedTag}
                    </span>
                  </div>
                  <div className="font-mono text-lg font-black text-slate-900">${cfg.baseCost} Base</div>
                  <div className="text-slate-500 text-xs font-mono">
                    +${cfg.ratePerKg}/kg billable weight
                  </div>
                  <div className="text-emerald-700 text-xs font-semibold pt-1 border-t border-slate-200">
                    Est: {cfg.estDays}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-6 space-y-4">
            <div className="flex items-center gap-2">
              <Globe className="w-4 h-4 text-blue-700" />
              <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
                International Coverage Zones & Multipliers
              </h2>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-200 text-slate-500 font-bold uppercase text-[10px] tracking-wider bg-slate-50">
                    <th className="py-2.5 px-3">Zone Code</th>
                    <th className="py-2.5 px-3">Geographic Territory</th>
                    <th className="py-2.5 px-3">Zone Multiplier</th>
                    <th className="py-2.5 px-3">Customs Clearance</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-mono text-[11px]">
                  {Object.entries(ZONE_NAMES).map(([key, name]) => (
                    <tr key={key} className="hover:bg-slate-50">
                      <td className="py-2.5 px-3 text-blue-700 font-bold uppercase">{key}</td>
                      <td className="py-2.5 px-3 font-sans text-slate-900 font-medium">{name}</td>
                      <td className="py-2.5 px-3 font-bold text-slate-800">
                        {ZONE_MULTIPLIERS[key as DestinationZone]}x
                      </td>
                      <td className="py-2.5 px-3 font-sans text-slate-500">
                        {key === 'domestic' ? 'Exempt' : 'Pre-cleared Electronic EDI'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="p-3 bg-blue-50/50 rounded-xl border border-blue-100 text-[11px] text-slate-600 flex items-start gap-2">
              <Info className="w-4 h-4 text-blue-700 shrink-0 mt-0.5" />
              <span>
                IATA Volumetric Weight Formula: If (Length x Width x Height in cm) / 5000 exceeds actual weight, the shipment is billed on volumetric weight per international aviation cargo standards.
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

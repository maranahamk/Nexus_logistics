/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { Shipment } from './types/logistics';
import { logisticsStore } from './services/logisticsStore';
import { Navbar } from './components/logistics/Navbar';
import { TrackingEngineView } from './components/logistics/TrackingEngineView';
import { BookingWizardView } from './components/logistics/BookingWizardView';
import { UserDashboardView } from './components/logistics/UserDashboardView';
import { AdminCommandCenterView } from './components/logistics/AdminCommandCenterView';
import { AdminLoginView } from './components/logistics/AdminLoginView';
import { RatesZonesView } from './components/logistics/RatesZonesView';
import { WaybillModal } from './components/logistics/WaybillModal';

export default function App() {
  const [activeTab, setActiveTab] = useState<
    'track' | 'book' | 'dashboard' | 'admin' | 'rates' | 'admin_login'
  >('track');
  const [isAdmin, setIsAdmin] = useState<boolean>(() => logisticsStore.isAdminAuthenticated());
  const [shipments, setShipments] = useState<Shipment[]>(() => logisticsStore.getShipments());
  const [activeTrackId, setActiveTrackId] = useState<string>('NEX-7241-9034');
  const [selectedWaybillShipment, setSelectedWaybillShipment] = useState<Shipment | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage((current) => (current === msg ? null : current));
    }, 4000);
  };

  useEffect(() => {
    const unsubscribe = logisticsStore.subscribe(() => {
      setShipments(logisticsStore.getShipments());
      setIsAdmin(logisticsStore.isAdminAuthenticated());
    });
    return () => unsubscribe();
  }, []);

  const handleSelectShipmentToTrack = (trackingId: string) => {
    setActiveTrackId(trackingId);
    setActiveTab('track');
  };

  const handleShipmentCreated = (newShipment: Shipment) => {
    setActiveTrackId(newShipment.id);
    showToast(`Shipment ${newShipment.id} successfully registered in system! Air Waybill generated.`);
  };

  const handleAdminAuthSuccess = () => {
    setIsAdmin(true);
    setActiveTab('admin');
    showToast('Security Clearance Granted: Authenticated as Operations Dispatcher.');
  };

  const handleLogoutAdmin = () => {
    logisticsStore.logoutAdmin();
    setIsAdmin(false);
    setActiveTab('track');
    showToast('Signed out of Operations Dispatch. Returned to Public Client Portal.');
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 flex flex-col font-sans selection:bg-blue-600 selection:text-white">
      {/* Top Corporate Navigation */}
      <Navbar
        activeTab={activeTab}
        onSelectTab={(tab) => {
          if (tab === 'admin' && !isAdmin) {
            setActiveTab('admin_login');
          } else {
            setActiveTab(tab);
          }
        }}
        isAdmin={isAdmin}
        onLogoutAdmin={handleLogoutAdmin}
      />

      {/* Corporate Notification Toast */}
      {toastMessage && (
        <div className="fixed top-20 right-6 z-50 p-4 rounded-xl bg-slate-900 border border-slate-800 text-white text-xs font-semibold shadow-xl animate-in slide-in-from-top-2 duration-200 flex items-center gap-2.5">
          <span className="w-2 h-2 rounded-full bg-blue-400 animate-ping" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Main Viewport Content */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 pt-6">
        {activeTab === 'track' && (
          <TrackingEngineView
            initialTrackingId={activeTrackId}
            onOpenWaybill={(s) => setSelectedWaybillShipment(s)}
            onBookNew={() => setActiveTab('book')}
          />
        )}

        {activeTab === 'book' && (
          <BookingWizardView
            onShipmentCreated={handleShipmentCreated}
            onOpenWaybill={(s) => setSelectedWaybillShipment(s)}
          />
        )}

        {activeTab === 'dashboard' && (
          <UserDashboardView
            shipments={shipments}
            onSelectShipmentToTrack={handleSelectShipmentToTrack}
            onOpenWaybill={(s) => setSelectedWaybillShipment(s)}
            onBookNew={() => setActiveTab('book')}
          />
        )}

        {activeTab === 'rates' && <RatesZonesView onBookNow={() => setActiveTab('book')} />}

        {activeTab === 'admin_login' && (
          <AdminLoginView
            onLoginSuccess={handleAdminAuthSuccess}
            onCancel={() => setActiveTab('track')}
          />
        )}

        {activeTab === 'admin' &&
          (isAdmin ? (
            <AdminCommandCenterView
              shipments={shipments}
              onSelectShipmentToTrack={handleSelectShipmentToTrack}
              onOpenWaybill={(s) => setSelectedWaybillShipment(s)}
              onLogoutAdmin={handleLogoutAdmin}
            />
          ) : (
            <AdminLoginView
              onLoginSuccess={handleAdminAuthSuccess}
              onCancel={() => setActiveTab('track')}
            />
          ))}
      </main>

      {/* Digital Air Waybill Modal */}
      <WaybillModal
        isOpen={!!selectedWaybillShipment}
        onClose={() => setSelectedWaybillShipment(null)}
        shipment={selectedWaybillShipment}
      />

      {/* Clean Corporate Logistics Footer */}
      <footer className="mt-auto border-t border-slate-200 bg-white py-8 px-6 text-xs text-slate-500">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-7 h-7 rounded-lg bg-blue-700 flex items-center justify-center text-white font-extrabold text-xs shadow-xs">
              NX
            </div>
            <div>
              <span className="font-extrabold text-slate-900 text-sm tracking-tight font-mono">NEXUS_LOGISTICS</span>
              <span className="mx-2 text-slate-300">|</span>
              <span className="text-slate-600">Global Priority Air Freight & Intermodal Courier Network</span>
            </div>
          </div>

          <div className="flex items-center gap-4 text-xs">
            <span className="text-slate-600 font-medium">IATA & FIATA Certified Carrier</span>
            <span className="text-slate-300">|</span>
            <span className="text-emerald-700 font-semibold flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block" />
              <span>Global Dispatch Nominal (220+ Countries)</span>
            </span>
          </div>
        </div>
      </footer>
    </div>
  );
}

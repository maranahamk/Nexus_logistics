import React, { useState, useEffect } from 'react';
import {
  getDomainRoutingInfo,
  setConfiguredDomain,
  resetConfiguredDomain,
  verifyDomainHealth,
  DomainRoutingInfo,
  DEFAULT_RUN_DOMAIN,
} from '../../services/domainConfig';
import {
  Globe,
  Server,
  Webhook,
  CheckCircle2,
  AlertCircle,
  Copy,
  Check,
  RefreshCw,
  ExternalLink,
  ShieldCheck,
  Layers,
  Activity,
  X,
  Radio,
  Sliders,
  Terminal
} from 'lucide-react';

interface DomainRoutingModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const DomainRoutingModal: React.FC<DomainRoutingModalProps> = ({ isOpen, onClose }) => {
  const [routing, setRouting] = useState<DomainRoutingInfo>(() => getDomainRoutingInfo());
  const [isEditing, setIsEditing] = useState<boolean>(false);
  const [customDomainInput, setCustomDomainInput] = useState<string>(routing.canonicalDomain);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [testResult, setTestResult] = useState<{
    tested: boolean;
    loading: boolean;
    success?: boolean;
    latencyMs?: number;
    error?: string;
  }>({ tested: false, loading: false });
  const [saveSuccess, setSaveSuccess] = useState<boolean>(false);

  useEffect(() => {
    if (isOpen) {
      const current = getDomainRoutingInfo();
      setRouting(current);
      setCustomDomainInput(current.canonicalDomain);
      runHealthCheck();
    }
  }, [isOpen]);

  const runHealthCheck = async () => {
    setTestResult({ tested: false, loading: true });
    const res = await verifyDomainHealth();
    setTestResult({
      tested: true,
      loading: false,
      success: res.success,
      latencyMs: res.latencyMs,
      error: res.error,
    });
  };

  const handleCopy = (text: string, keyName: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(keyName);
    setTimeout(() => setCopiedKey(null), 2500);
  };

  const handleSaveDomain = () => {
    const clean = customDomainInput.trim().toLowerCase().replace(/^https?:\/\//, '').replace(/\/$/, '');
    if (!clean) return;
    setConfiguredDomain(clean);
    const updated = getDomainRoutingInfo();
    setRouting(updated);
    setIsEditing(false);
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 3000);
    runHealthCheck();
  };

  const handleResetDefault = () => {
    resetConfiguredDomain();
    const updated = getDomainRoutingInfo();
    setRouting(updated);
    setCustomDomainInput(DEFAULT_RUN_DOMAIN);
    setIsEditing(false);
    runHealthCheck();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="relative w-full max-w-2xl bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="bg-slate-900 text-white px-6 py-4 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center font-bold text-white shadow-xs">
              <Globe className="w-4 h-4" />
            </div>
            <div>
              <div className="font-extrabold text-sm tracking-tight flex items-center gap-2">
                <span>Deployment Routing & Domain Settings</span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-slate-800 text-emerald-400 font-bold border border-slate-700 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  <span>.run Subdomain Active</span>
                </span>
              </div>
              <div className="text-[11px] text-slate-400">
                Incoming traffic router, Paystack webhook endpoints, and API gateways
              </div>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto flex-1 space-y-6 text-xs">
          {saveSuccess && (
            <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-800 text-xs flex items-center gap-2 font-medium">
              <Check className="w-4 h-4 text-emerald-600" />
              <span>Deployment routing domain updated and saved to local configuration!</span>
            </div>
          )}

          {/* Canonical Domain Control */}
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-slate-800 font-bold">
                <Server className="w-4 h-4 text-blue-700" />
                <span>Canonical .run Domain Configuration</span>
              </div>
              {!isEditing ? (
                <button
                  type="button"
                  onClick={() => setIsEditing(true)}
                  className="text-blue-700 hover:text-blue-800 font-bold text-[11px]"
                >
                  Configure Domain
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => setIsEditing(false)}
                  className="text-slate-500 hover:text-slate-800 text-[11px]"
                >
                  Cancel
                </button>
              )}
            </div>

            {isEditing ? (
              <div className="space-y-2 pt-1">
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={customDomainInput}
                    onChange={(e) => setCustomDomainInput(e.target.value)}
                    placeholder="e.g. nexus-logistics.run or cargo.nexus-logistics.run"
                    className="flex-1 bg-white border border-slate-300 rounded-lg px-3 py-2 text-xs font-mono text-slate-900 focus:outline-none focus:border-blue-600"
                  />
                  <button
                    type="button"
                    onClick={handleSaveDomain}
                    className="px-4 py-2 bg-blue-700 hover:bg-blue-800 text-white font-bold rounded-lg text-xs shadow-xs"
                  >
                    Save
                  </button>
                </div>
                <div className="flex justify-between items-center text-[11px] text-slate-500">
                  <span>Enter any .run subdomain or vanity domain</span>
                  <button
                    type="button"
                    onClick={handleResetDefault}
                    className="text-slate-600 hover:text-blue-700 underline"
                  >
                    Reset to {DEFAULT_RUN_DOMAIN}
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-between bg-white p-3 rounded-lg border border-slate-200">
                <div className="space-y-0.5">
                  <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">
                    Active Canonical Host
                  </span>
                  <div className="font-mono text-sm font-extrabold text-blue-700 flex items-center gap-1.5">
                    <span>https://{routing.canonicalDomain}</span>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => handleCopy(`https://${routing.canonicalDomain}`, 'canonical')}
                  className="px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors"
                >
                  {copiedKey === 'canonical' ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-600" />
                      <span className="text-emerald-700 font-bold">Copied</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      <span>Copy URL</span>
                    </>
                  )}
                </button>
              </div>
            )}
          </div>

          {/* Webhook Configuration Block */}
          <div className="bg-white border border-slate-200 rounded-xl p-4 space-y-3 shadow-2xs">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-slate-800 font-bold">
                <Webhook className="w-4 h-4 text-emerald-600" />
                <span>Paystack Webhook Listener Endpoint</span>
              </div>
              <span className="text-[10px] font-mono font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 px-2 py-0.5 rounded">
                HTTP POST
              </span>
            </div>

            <p className="text-[11px] text-slate-600 leading-relaxed">
              Register this webhook URL in your Paystack Dashboard (<strong>Settings &gt; API Keys &amp; Webhooks &gt; Live/Test Webhook URL</strong>). 
              The Nexus router validates incoming <code className="bg-slate-100 px-1 py-0.5 rounded font-mono text-slate-800">x-paystack-signature</code> headers to reconcile payments and issue Air Waybills.
            </p>

            <div className="flex items-center justify-between bg-slate-50 p-2.5 rounded-lg border border-slate-200 font-mono text-[11px]">
              <span className="text-slate-800 font-semibold truncate mr-2 select-all">
                {routing.paystackWebhookUrl}
              </span>
              <button
                type="button"
                onClick={() => handleCopy(routing.paystackWebhookUrl, 'webhook')}
                className="px-2.5 py-1 bg-white hover:bg-slate-100 border border-slate-300 rounded text-slate-700 font-sans font-bold text-xs flex items-center gap-1 shrink-0 shadow-2xs"
              >
                {copiedKey === 'webhook' ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-600" />
                    <span className="text-emerald-700">Copied</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    <span>Copy Webhook</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* API Endpoints Catalog */}
          <div className="bg-white border border-slate-200 rounded-xl p-4 space-y-3 shadow-2xs">
            <div className="flex items-center gap-2 text-slate-800 font-bold">
              <Terminal className="w-4 h-4 text-blue-700" />
              <span>Public REST API Endpoints Matrix</span>
            </div>

            <div className="space-y-2 text-xs">
              <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-200 flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-1.5 font-mono text-[11px]">
                    <span className="px-1.5 py-0.5 bg-blue-100 text-blue-800 rounded font-bold text-[9px]">GET</span>
                    <span className="font-semibold text-slate-800">/api/health</span>
                  </div>
                  <span className="text-[10px] text-slate-500">Router status, uptime, and host routing verification</span>
                </div>
                <button
                  type="button"
                  onClick={() => handleCopy(routing.healthEndpoint, 'health')}
                  className="text-slate-500 hover:text-slate-800 text-[11px] flex items-center gap-1 font-semibold"
                >
                  {copiedKey === 'health' ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                  <span>{copiedKey === 'health' ? 'Copied' : 'Copy'}</span>
                </button>
              </div>

              <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-200 flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-1.5 font-mono text-[11px]">
                    <span className="px-1.5 py-0.5 bg-blue-100 text-blue-800 rounded font-bold text-[9px]">GET</span>
                    <span className="font-semibold text-slate-800">/api/shipments?id=&#123;tracking_id&#125;</span>
                  </div>
                  <span className="text-[10px] text-slate-500">Consignment lookup and milestone checkpoint queries</span>
                </div>
                <button
                  type="button"
                  onClick={() => handleCopy(routing.trackingApiEndpoint, 'tracking')}
                  className="text-slate-500 hover:text-slate-800 text-[11px] flex items-center gap-1 font-semibold"
                >
                  {copiedKey === 'tracking' ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                  <span>{copiedKey === 'tracking' ? 'Copied' : 'Copy'}</span>
                </button>
              </div>

              <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-200 flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-1.5 font-mono text-[11px]">
                    <span className="px-1.5 py-0.5 bg-blue-100 text-blue-800 rounded font-bold text-[9px]">GET</span>
                    <span className="font-semibold text-slate-800">/api/config/domain</span>
                  </div>
                  <span className="text-[10px] text-slate-500">Deployment routing metadata, capabilities, and subdomains</span>
                </div>
                <button
                  type="button"
                  onClick={() => handleCopy(`${routing.apiBaseUrl}/config/domain`, 'config')}
                  className="text-slate-500 hover:text-slate-800 text-[11px] flex items-center gap-1 font-semibold"
                >
                  {copiedKey === 'config' ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                  <span>{copiedKey === 'config' ? 'Copied' : 'Copy'}</span>
                </button>
              </div>
            </div>
          </div>

          {/* Subdomains & Virtual Host Routing */}
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-2">
            <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider block">
              Supported .run Subdomain Routing
            </span>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 font-mono text-[11px]">
              <div className="p-2 bg-white rounded border border-slate-200">
                <span className="text-slate-400 block text-[9px]">API GATEWAY</span>
                <span className="font-bold text-blue-700">{routing.supportedSubdomains.api}</span>
              </div>
              <div className="p-2 bg-white rounded border border-slate-200">
                <span className="text-slate-400 block text-[9px]">TRACKING PORTAL</span>
                <span className="font-bold text-blue-700">{routing.supportedSubdomains.tracking}</span>
              </div>
              <div className="p-2 bg-white rounded border border-slate-200">
                <span className="text-slate-400 block text-[9px]">WEBHOOK INGEST</span>
                <span className="font-bold text-emerald-700">{routing.supportedSubdomains.webhooks}</span>
              </div>
            </div>
          </div>

          {/* Live Connectivity Test Bar */}
          <div className="p-4 bg-blue-50/60 border border-blue-100 rounded-xl flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <Activity className="w-4 h-4 text-blue-700 shrink-0" />
              <div>
                <span className="font-bold text-slate-900 block">Router Health & Latency Probe</span>
                <span className="text-[11px] text-slate-600">
                  {testResult.loading ? (
                    'Probing /api/health endpoint...'
                  ) : testResult.success ? (
                    <span className="text-emerald-700 font-semibold flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>Router Healthy (Round-trip: {testResult.latencyMs}ms)</span>
                    </span>
                  ) : (
                    <span>Test live HTTP routing status</span>
                  )}
                </span>
              </div>
            </div>

            <button
              type="button"
              disabled={testResult.loading}
              onClick={runHealthCheck}
              className="px-3 py-1.5 bg-blue-700 hover:bg-blue-800 text-white rounded-lg font-bold text-xs flex items-center gap-1 shadow-xs disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${testResult.loading ? 'animate-spin' : ''}`} />
              <span>Probe Route</span>
            </button>
          </div>
        </div>

        {/* Footer */}
        <div className="bg-slate-50 border-t border-slate-200 px-6 py-3 flex items-center justify-between text-[11px] text-slate-500 shrink-0">
          <div className="flex items-center gap-1.5">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
            <span>Automatic TLS/SSL Termination Enforced on .run Domains</span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-lg transition-colors"
          >
            Close Settings
          </button>
        </div>
      </div>
    </div>
  );
};

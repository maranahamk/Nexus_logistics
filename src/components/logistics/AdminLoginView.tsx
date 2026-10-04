import React, { useState } from 'react';
import { logisticsStore } from '../../services/logisticsStore';
import { ShieldCheck, Lock, ArrowRight, AlertCircle, KeyRound, CheckCircle2 } from 'lucide-react';

interface AdminLoginViewProps {
  onLoginSuccess: () => void;
  onCancel: () => void;
}

export const AdminLoginView: React.FC<AdminLoginViewProps> = ({ onLoginSuccess, onCancel }) => {
  const [email, setEmail] = useState<string>('dispatcher@nexuslogistics.com');
  const [password, setPassword] = useState<string>('admin2026');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setIsSubmitting(true);

    setTimeout(() => {
      const res = logisticsStore.loginAdmin(email, password);
      setIsSubmitting(false);

      if (res.success) {
        onLoginSuccess();
      } else {
        setErrorMsg(res.error || 'Access Denied: Invalid credentials.');
      }
    }, 400);
  };

  const handleAutofill = (testEmail: string, testPass: string) => {
    setEmail(testEmail);
    setPassword(testPass);
    setErrorMsg(null);
  };

  return (
    <div className="py-12 px-4 max-w-md mx-auto">
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-8 space-y-6">
        {/* Header */}
        <div className="text-center space-y-2">
          <div className="w-12 h-12 rounded-xl bg-blue-50 border border-blue-100 text-blue-700 flex items-center justify-center mx-auto shadow-xs">
            <Lock className="w-6 h-6" />
          </div>
          <h1 className="text-xl font-extrabold text-slate-900 tracking-tight">
            Operations Staff Portal
          </h1>
          <p className="text-xs text-slate-500">
            Sign in with your authorized dispatcher email and master password or PIN to access global cargo controls.
          </p>
        </div>

        {errorMsg && (
          <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
            <span className="font-medium">{errorMsg}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          <div>
            <label className="block text-slate-700 font-semibold mb-1.5">
              Dispatcher / Staff Email
            </label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="e.g. dispatcher@nexuslogistics.com"
              className="w-full bg-white border border-slate-300 focus:border-blue-600 focus:ring-1 focus:ring-blue-600 rounded-xl px-3.5 py-2.5 text-slate-900 text-xs font-medium placeholder-slate-400 focus:outline-none transition-colors"
            />
          </div>

          <div>
            <label className="block text-slate-700 font-semibold mb-1.5">
              Access Password or 4-Digit PIN
            </label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter password or 4-digit PIN"
              className="w-full bg-white border border-slate-300 focus:border-blue-600 focus:ring-1 focus:ring-blue-600 rounded-xl px-3.5 py-2.5 text-slate-900 text-xs font-medium placeholder-slate-400 focus:outline-none transition-colors"
            />
          </div>

          {/* Quick Credential Test Helper */}
          <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-1.5 text-[11px] text-slate-600">
            <span className="font-semibold text-slate-800 block">Authorized Dispatch Credentials:</span>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => handleAutofill('dispatcher@nexuslogistics.com', 'admin2026')}
                className="px-2 py-1 rounded bg-white hover:bg-slate-100 border border-slate-200 text-slate-700 font-mono text-[10px] transition-colors"
              >
                dispatcher@nexuslogistics.com / admin2026
              </button>
              <button
                type="button"
                onClick={() => handleAutofill('zundayclinton@gmail.com', '8921')}
                className="px-2 py-1 rounded bg-white hover:bg-slate-100 border border-slate-200 text-slate-700 font-mono text-[10px] transition-colors"
              >
                PIN: 8921
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full py-3 bg-blue-700 hover:bg-blue-800 text-white font-bold rounded-xl text-xs transition-colors flex items-center justify-center gap-2 shadow-xs disabled:opacity-50"
          >
            {isSubmitting ? (
              <span>Verifying Authorization...</span>
            ) : (
              <>
                <KeyRound className="w-4 h-4" />
                <span>Sign In to Dispatch Console</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>

          <button
            type="button"
            onClick={onCancel}
            className="w-full py-2.5 bg-white hover:bg-slate-50 text-slate-600 border border-slate-200 rounded-xl text-xs font-semibold transition-colors"
          >
            Return to Public Tracking
          </button>
        </form>

        <div className="pt-2 border-t border-slate-100 text-center text-[11px] text-slate-400">
          Nexus Worldwide Logistics Enterprise Security Policy
        </div>
      </div>
    </div>
  );
};

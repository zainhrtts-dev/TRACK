import React, { useState } from 'react';
import { Key, ShieldAlert, CheckCircle, HelpCircle, ArrowRight, ExternalLink } from 'lucide-react';

interface ApiKeyModalProps {
  apiKey: string;
  onSaveKey: (key: string) => void;
  isOpen: boolean;
  onClose: () => void;
}

export default function ApiKeyModal({ apiKey, onSaveKey, isOpen, onClose }: ApiKeyModalProps) {
  const [keyInput, setKeyInput] = useState(apiKey);
  const [showSaved, setShowSaved] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSaveKey(keyInput.trim());
    setShowSaved(true);
    setTimeout(() => {
      setShowSaved(false);
      onClose();
    }, 1500);
  };

  // Referencing the environment variable explicitly to trigger the AI Studio variable loader
  const systemEnvKey = process.env.GOOGLE_MAPS_PLATFORM_KEY || '';

  return (
    <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md z-50 flex items-center justify-center p-4 overflow-y-auto" id="api-key-modal">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        
        {/* Modal Header */}
        <div className="bg-slate-950 px-6 py-4 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Key className="w-5 h-5 text-indigo-400" />
            <h3 className="font-semibold text-slate-100 font-display">Google Maps Integration</h3>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-200 text-sm font-medium transition-colors"
          >
            Close / Use Demo Mode
          </button>
        </div>

        <div className="p-6 space-y-5">
          {/* Status Alert */}
          <div className="bg-slate-950 rounded-xl border border-slate-800 p-4 flex gap-3">
            <ShieldAlert className="w-5 h-5 text-indigo-400 shrink-0 mt-0.5" />
            <div className="text-xs space-y-1">
              <p className="font-semibold text-slate-200">Enabling Live Real-World Google Maps</p>
              <p className="text-slate-400 leading-relaxed">
                By default, this app operates in a high-fidelity **Offline Simulation Mode** with interactive streets, pathways, and geofencing. To swap this for a real Google Map, provide an API key.
              </p>
            </div>
          </div>

          {/* Quick Setup Guide */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1">
              <HelpCircle className="w-3.5 h-3.5 text-slate-400" />
              How to add your API Key:
            </h4>
            
            <div className="space-y-2 text-xs text-slate-300">
              <div className="flex gap-2 bg-slate-950/40 p-2.5 rounded-lg border border-slate-800/40">
                <span className="bg-indigo-950 text-indigo-300 font-bold w-5 h-5 rounded-full flex items-center justify-center shrink-0">1</span>
                <div>
                  <a
                    href="https://console.cloud.google.com/google/maps-apis/start?utm_campaign=gmp-code-assist-ais"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-indigo-400 font-semibold inline-flex items-center gap-1 hover:underline"
                  >
                    Get a Google Maps API Key <ExternalLink className="w-3 h-3" />
                  </a>
                  <p className="text-slate-400 mt-0.5">Ensure Map JavaScript API and Directions API are enabled.</p>
                </div>
              </div>

              <div className="flex gap-2 bg-slate-950/40 p-2.5 rounded-lg border border-slate-800/40">
                <span className="bg-indigo-950 text-indigo-300 font-bold w-5 h-5 rounded-full flex items-center justify-center shrink-0">2</span>
                <div>
                  <p className="font-semibold text-slate-200">Inject into AI Studio Secrets:</p>
                  <p className="text-slate-400 mt-0.5 leading-relaxed">
                    Open **Settings** (⚙️ gear icon, top-right corner of AI Studio) → **Secrets** → Type <code className="bg-slate-950 px-1 py-0.5 rounded text-indigo-300">GOOGLE_MAPS_PLATFORM_KEY</code> → paste key → press **Enter**.
                  </p>
                </div>
              </div>

              <div className="flex gap-2 bg-slate-950/40 p-2.5 rounded-lg border border-slate-800/40">
                <span className="bg-indigo-950 text-indigo-300 font-bold w-5 h-5 rounded-full flex items-center justify-center shrink-0">3</span>
                <div>
                  <p className="font-semibold text-slate-200">Or Paste Directly Below:</p>
                  <p className="text-slate-400 mt-0.5">Paste your key below for immediate sandbox testing without a full rebuild.</p>
                </div>
              </div>
            </div>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-3 pt-2">
            <div className="space-y-1.5">
              <label htmlFor="api-key-input" className="text-xs font-semibold text-slate-300">
                Google Maps API Key
              </label>
              <div className="relative">
                <input
                  id="api-key-input"
                  type="password"
                  placeholder="AIzaSy..."
                  value={keyInput}
                  onChange={(e) => setKeyInput(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-slate-200 placeholder-slate-600 focus:outline-none focus:border-indigo-500 font-mono"
                />
                <Key className="w-4 h-4 text-slate-600 absolute right-4 top-3" />
              </div>
            </div>

            <div className="flex items-center justify-between gap-4 pt-2">
              <div className="text-[11px] text-slate-400">
                {systemEnvKey ? (
                  <span className="text-emerald-400 font-medium flex items-center gap-1">
                    ✓ Environment Key Detected
                  </span>
                ) : (
                  <span>Using local state configuration</span>
                )}
              </div>

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 text-xs font-medium bg-slate-950 hover:bg-slate-800 text-slate-300 rounded-xl border border-slate-800 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={showSaved}
                  className="px-4 py-2 text-xs font-semibold bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl transition-colors shadow-lg flex items-center gap-1.5"
                >
                  {showSaved ? (
                    <>
                      <CheckCircle className="w-3.5 h-3.5 text-white animate-bounce" />
                      Saved!
                    </>
                  ) : (
                    <>
                      Apply Key
                      <ArrowRight className="w-3.5 h-3.5" />
                    </>
                  )}
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

import React, { useState } from 'react';
import { Lock, KeyRound, AlertCircle, Eye, EyeOff } from 'lucide-react';

interface Props {
  onSuccess: () => void;
  onCancel: () => void;
}

// Strong administrator password
const DEFAULT_PASSWORD = 'Stall@Admin#2026';

export const AdminLoginModal: React.FC<Props> = ({ onSuccess, onCancel }) => {
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const storedPass = localStorage.getItem('stall_admin_password') || DEFAULT_PASSWORD;
    if (password === storedPass) {
      setError(false);
      sessionStorage.setItem('stall_admin_authenticated', 'true');
      onSuccess();
    } else {
      setError(true);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/75 backdrop-blur-md animate-fade-in">
      <div className="bg-white rounded-2xl shadow-2xl max-w-sm w-full p-6 border border-slate-200">
        <div className="flex flex-col items-center text-center mb-5">
          <div className="w-12 h-12 rounded-2xl bg-sky-50 border border-sky-100 flex items-center justify-center text-sky-600 mb-3 shadow-xs">
            <Lock className="w-6 h-6" />
          </div>
          <h3 className="text-base font-bold text-slate-900 tracking-tight">Admin Authentication</h3>
          <p className="text-xs text-slate-500 mt-1">
            Enter the administrator passcode to unlock the 3D configurator edit panel.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-[11px] font-semibold text-slate-600 block mb-1">Passcode</label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                autoFocus
                placeholder="Enter password"
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  if (error) setError(false);
                }}
                className={`w-full px-3 py-2 pr-9 bg-slate-50 border rounded-lg text-sm text-slate-900 focus:outline-none focus:ring-2 ${
                  error
                    ? 'border-rose-400 focus:ring-rose-400 bg-rose-50/20'
                    : 'border-slate-300 focus:ring-sky-500'
                }`}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            {error && (
              <div className="flex items-center gap-1.5 mt-1.5 text-[11px] text-rose-600 font-medium">
                <AlertCircle className="w-3.5 h-3.5" />
                <span>Incorrect passcode. Please try again.</span>
              </div>
            )}
          </div>

          <div className="flex items-center gap-2 pt-2">
            <button
              type="button"
              onClick={onCancel}
              className="flex-1 py-2 px-3 rounded-lg text-xs font-semibold text-slate-600 hover:bg-slate-100 border border-slate-200 transition cursor-pointer"
            >
              Cancel (Client View)
            </button>
            <button
              type="submit"
              className="flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg text-xs font-semibold bg-sky-600 hover:bg-sky-700 text-white shadow-sm transition cursor-pointer"
            >
              <KeyRound className="w-3.5 h-3.5" />
              <span>Unlock Panel</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

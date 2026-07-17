import React, { useState, useRef } from 'react';
import { Employee, Location } from '../types';
import { X, UserPlus, Info, Compass, Shield, User, FileText, Lock, Mail, MapPin, Upload, CheckSquare, Square } from 'lucide-react';

interface AddEmployeeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddEmployee: (employee: Employee) => void;
}

const PRESET_AVATARS = [
  { url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80', label: 'Tech Female' },
  { url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80', label: 'Engineer Male' },
  { url: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80', label: 'Courier Female' },
  { url: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80', label: 'Technician Male' },
  { url: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150&auto=format&fit=crop&q=80', label: 'Officer Female' },
  { url: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=150&auto=format&fit=crop&q=80', label: 'Supervisor Male' },
];

export default function AddEmployeeModal({ isOpen, onClose, onAddEmployee }: AddEmployeeModalProps) {
  const [name, setName] = useState('');
  const [role, setRole] = useState('Field Officer');
  const [nic, setNic] = useState('');
  const [employeeCode, setEmployeeCode] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('Staff@123');
  const [areaAssigned, setAreaAssigned] = useState('Sector 4 - Alpha District');
  const [markAttendanceWithGeofenceFace, setMarkAttendanceWithGeofenceFace] = useState(true);
  
  const [selectedAvatar, setSelectedAvatar] = useState(PRESET_AVATARS[0].url);
  const [customAvatar, setCustomAvatar] = useState<string | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [lat, setLat] = useState('37.4220');
  const [lng, setLng] = useState('-122.0841');
  const [batteryLevel, setBatteryLevel] = useState(100);
  const [speed, setSpeed] = useState(5);

  if (!isOpen) return null;

  // File upload logic
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64String = reader.result as string;
        setCustomAvatar(base64String);
        setSelectedAvatar(base64String);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64String = reader.result as string;
        setCustomAvatar(base64String);
        setSelectedAvatar(base64String);
      };
      reader.readAsDataURL(file);
    }
  };

  // Generate a high-fidelity figure-eight loop walking path for simulation
  const generateSimulatedPath = (center: Location): Location[] => {
    const path: Location[] = [];
    const pointsCount = 20;
    for (let i = 0; i < pointsCount; i++) {
      const angle = (i / pointsCount) * 2 * Math.PI;
      // Beautiful figure-eight mathematical trajectory
      const latOffset = 0.0007 * Math.sin(angle);
      const lngOffset = 0.0011 * Math.sin(angle * 2);
      path.push({
        lat: Number((center.lat + latOffset).toFixed(6)),
        lng: Number((center.lng + lngOffset).toFixed(6))
      });
    }
    return path;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    const parsedLat = parseFloat(lat) || 37.4220;
    const parsedLng = parseFloat(lng) || -122.0841;
    const centerLocation = { lat: parsedLat, lng: parsedLng };

    // Generate dynamic walk path
    const walkPath = generateSimulatedPath(centerLocation);

    const newEmployee: Employee = {
      id: `emp_custom_${Date.now()}`,
      name: name.trim(),
      role: role.trim(),
      avatar: selectedAvatar,
      status: 'Off Duty',
      currentLocation: centerLocation,
      lastUpdated: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      batteryLevel,
      isSimulating: false,
      simulatedPath: walkPath,
      currentPathIndex: 0,
      speed,
      checkedIn: false,
      checkInTime: null,
      checkOutTime: null,
      currentGeofenceId: null,
      nic: nic.trim() || `NIC-${Math.floor(100000 + Math.random() * 900000)}`,
      employeeCode: employeeCode.trim() || `EMP-${Math.floor(1000 + Math.random() * 9000)}`,
      email: email.trim() || `${name.trim().toLowerCase().replace(/\s+/g, '')}@company.com`,
      password: password,
      areaAssigned: areaAssigned.trim(),
      permissions: {
        markAttendanceWithGeofenceFace
      },
      hoursWorkedHistory: [],
      batteryHistory: [
        { timestamp: '08:00 AM', batteryLevel: Math.min(100, batteryLevel + 2) },
        { timestamp: '09:00 AM', batteryLevel }
      ]
    };

    onAddEmployee(newEmployee);
    
    // Reset fields
    setName('');
    setRole('Field Officer');
    setNic('');
    setEmployeeCode('');
    setEmail('');
    setPassword('Staff@123');
    setAreaAssigned('Sector 4 - Alpha District');
    setMarkAttendanceWithGeofenceFace(true);
    setSelectedAvatar(PRESET_AVATARS[Math.floor(Math.random() * PRESET_AVATARS.length)].url);
    setCustomAvatar(null);
    setLat('37.4220');
    setLng('-122.0841');
    setBatteryLevel(100);
    setSpeed(5);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200">
      
      <div className="relative w-full max-w-2xl bg-slate-900 border border-slate-800 rounded-3xl shadow-[0_25px_50px_-12px_rgba(0,0,0,0.5)] overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Header bar */}
        <div className="p-5 border-b border-slate-800 bg-slate-950/40 flex justify-between items-center shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="bg-indigo-950 border border-indigo-800 p-2 rounded-xl text-indigo-400">
              <UserPlus className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-display font-bold text-base text-slate-100 font-sans">Add Field Staff Account</h3>
              <p className="text-[10px] text-slate-400 mt-0.5">Register a new field staff device, login credentials, and tracking parameters</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-slate-100 transition-all"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Form */}
        <form onSubmit={handleSubmit} className="flex-grow overflow-y-auto p-6 space-y-5">
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {/* Column 1: Identity & Profile */}
            <div className="space-y-4">
              <h4 className="text-[11px] font-bold text-indigo-400 uppercase tracking-wider flex items-center gap-1.5 border-b border-slate-800/80 pb-1.5">
                <User className="w-4 h-4" /> Personal Information
              </h4>

              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Employee Full Name *</label>
                <div className="relative">
                  <input
                    type="text"
                    required
                    placeholder="e.g. Liam Martinez"
                    value={name}
                    onChange={e => setName(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-850 rounded-xl pl-10 pr-4 py-2 text-xs text-slate-200 focus:outline-none focus:border-indigo-500 font-medium"
                  />
                  <User className="w-4 h-4 text-slate-500 absolute left-3.5 top-2.5" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">NIC / Identity Code *</label>
                  <div className="relative">
                    <input
                      type="text"
                      required
                      placeholder="35202-XXXXXXX-X"
                      value={nic}
                      onChange={e => setNic(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-850 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-indigo-500 font-medium font-mono"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Employee Code *</label>
                  <div className="relative">
                    <input
                      type="text"
                      required
                      placeholder="EMP-8291"
                      value={employeeCode}
                      onChange={e => setEmployeeCode(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-850 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-indigo-500 font-medium font-mono"
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Designation *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Logistics Lead"
                    value={role}
                    onChange={e => setRole(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-850 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-indigo-500 font-medium"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Area Assigned *</label>
                  <div className="relative">
                    <input
                      type="text"
                      required
                      placeholder="Sector 3 - Alpha Area"
                      value={areaAssigned}
                      onChange={e => setAreaAssigned(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-850 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-indigo-500 font-medium"
                    />
                  </div>
                </div>
              </div>

              {/* Profile Photo Upload and Selection */}
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">Profile Picture (Upload or Select)</label>
                
                {/* Drag and Drop Zone */}
                <div 
                  onDragEnter={handleDrag} 
                  onDragOver={handleDrag} 
                  onDragLeave={handleDrag} 
                  onDrop={handleDrop}
                  onClick={() => fileInputRef.current?.click()}
                  className={`border border-dashed rounded-xl p-3 text-center cursor-pointer transition-all flex flex-col items-center justify-center gap-1 ${
                    dragActive 
                      ? 'border-indigo-500 bg-indigo-950/20' 
                      : 'border-slate-800 bg-slate-950/40 hover:bg-slate-950/70 hover:border-slate-700'
                  }`}
                >
                  <input 
                    ref={fileInputRef}
                    type="file" 
                    accept="image/*" 
                    onChange={handleFileChange} 
                    className="hidden" 
                  />
                  {customAvatar ? (
                    <div className="flex items-center gap-3">
                      <img src={customAvatar} alt="custom avatar" className="w-10 h-10 rounded-full object-cover border border-indigo-500" />
                      <div className="text-left">
                        <p className="text-[10px] font-bold text-emerald-400">Custom Photo Loaded</p>
                        <p className="text-[8px] text-slate-400">Click or drag to change</p>
                      </div>
                    </div>
                  ) : (
                    <>
                      <Upload className="w-5 h-5 text-indigo-400 animate-pulse" />
                      <p className="text-[10px] font-semibold text-slate-300">Drag & drop profile picture, or click to browse</p>
                      <p className="text-[8px] text-slate-500 font-mono">Supports PNG, JPG (Auto Crop)</p>
                    </>
                  )}
                </div>

                {/* Preset Options */}
                <div className="mt-3">
                  <p className="text-[8px] font-bold text-slate-500 uppercase tracking-wide mb-1.5">Or Choose from Preset Staff Avatars</p>
                  <div className="grid grid-cols-6 gap-1.5">
                    {PRESET_AVATARS.map((avatar, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => {
                          setCustomAvatar(null);
                          setSelectedAvatar(avatar.url);
                        }}
                        className={`relative rounded-xl aspect-square overflow-hidden border transition-all ${
                          selectedAvatar === avatar.url && !customAvatar ? 'border-indigo-500 scale-105 shadow' : 'border-slate-800 hover:border-slate-600'
                        }`}
                        title={avatar.label}
                      >
                        <img src={avatar.url} className="w-full h-full object-cover" alt="" />
                        {selectedAvatar === avatar.url && !customAvatar && (
                          <span className="absolute inset-0 bg-indigo-600/20" />
                        )}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Column 2: Security, Access Rules, Map Position */}
            <div className="space-y-4">
              <h4 className="text-[11px] font-bold text-indigo-400 uppercase tracking-wider flex items-center gap-1.5 border-b border-slate-800/80 pb-1.5">
                <Lock className="w-4 h-4" /> Credentials & Security Settings
              </h4>

              <div className="grid grid-cols-1 gap-3">
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Login Email Address *</label>
                  <div className="relative">
                    <input
                      type="email"
                      required
                      placeholder="e.g. staff.member@company.com"
                      value={email}
                      onChange={e => setEmail(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-850 rounded-xl pl-10 pr-4 py-2 text-xs text-slate-200 focus:outline-none focus:border-indigo-500 font-medium font-mono"
                    />
                    <Mail className="w-4 h-4 text-slate-500 absolute left-3.5 top-2.5" />
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Set Password *</label>
                  <div className="relative">
                    <input
                      type="password"
                      required
                      placeholder="••••••••"
                      value={password}
                      onChange={e => setPassword(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-850 rounded-xl pl-10 pr-4 py-2 text-xs text-slate-200 focus:outline-none focus:border-indigo-500 font-medium font-mono"
                    />
                    <Lock className="w-4 h-4 text-slate-500 absolute left-3.5 top-2.5" />
                  </div>
                </div>
              </div>

              {/* Attendance Verification Access Toggle */}
              <div className="bg-slate-950/40 p-3 rounded-2xl border border-indigo-950/50 space-y-2">
                <p className="text-[10px] font-bold text-indigo-300 uppercase tracking-wider">Access Permissions</p>
                <button
                  type="button"
                  onClick={() => setMarkAttendanceWithGeofenceFace(prev => !prev)}
                  className="w-full flex items-start gap-3 text-left hover:bg-slate-900/40 p-1.5 rounded-lg transition-all"
                >
                  <div className="mt-0.5 text-indigo-400">
                    {markAttendanceWithGeofenceFace ? (
                      <CheckSquare className="w-4 h-4 text-indigo-400 fill-indigo-400/20" />
                    ) : (
                      <Square className="w-4 h-4 text-slate-600" />
                    )}
                  </div>
                  <div>
                    <span className="text-xs font-semibold text-slate-200 block">Mark Attendance through Geofence Face Verification</span>
                    <span className="text-[9px] text-slate-400 block mt-0.5 leading-snug">
                      Enforce facial biometric scans upon check-in inside assigned geofences to record attendance.
                    </span>
                  </div>
                </button>
              </div>

              {/* Initial Map Placement Section */}
              <div className="bg-slate-950/30 p-3.5 rounded-2xl border border-slate-850/80 space-y-3">
                <p className="text-[10px] font-bold text-indigo-400 uppercase tracking-wider flex items-center gap-1">
                  <Compass className="w-3.5 h-3.5" /> Starting Position
                </p>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-[9px] font-semibold text-slate-500 mb-1">Latitude</label>
                    <input
                      type="number"
                      step="0.0001"
                      required
                      value={lat}
                      onChange={e => setLat(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-850 rounded-lg px-2.5 py-1 text-xs text-slate-300 font-mono focus:outline-none focus:border-indigo-500"
                    />
                  </div>
                  <div>
                    <label className="block text-[9px] font-semibold text-slate-500 mb-1">Longitude</label>
                    <input
                      type="number"
                      step="0.0001"
                      required
                      value={lng}
                      onChange={e => setLng(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-850 rounded-lg px-2.5 py-1 text-xs text-slate-300 font-mono focus:outline-none focus:border-indigo-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-[9px] font-semibold text-slate-500 mb-1">Speed (km/h)</label>
                    <input
                      type="number"
                      min="2"
                      max="40"
                      value={speed}
                      onChange={e => setSpeed(Number(e.target.value))}
                      className="w-full bg-slate-950 border border-slate-850 rounded-lg px-2.5 py-1 text-xs text-slate-300 font-mono focus:outline-none focus:border-indigo-500"
                    />
                  </div>
                  <div>
                    <label className="block text-[9px] font-semibold text-slate-500 mb-1">Battery Level (%)</label>
                    <input
                      type="number"
                      min="5"
                      max="100"
                      value={batteryLevel}
                      onChange={e => setBatteryLevel(Number(e.target.value))}
                      className="w-full bg-slate-950 border border-slate-850 rounded-lg px-2.5 py-1 text-xs text-slate-300 font-mono focus:outline-none focus:border-indigo-500"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 justify-end pt-3 border-t border-slate-800/60">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-300 transition-all"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-xs font-bold text-white shadow-lg shadow-indigo-950/50 flex items-center gap-1.5 transition-all"
            >
              <UserPlus className="w-3.5 h-3.5" />
              Register Staff Account
            </button>
          </div>

        </form>

      </div>

    </div>
  );
}

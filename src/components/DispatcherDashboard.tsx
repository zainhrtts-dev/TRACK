import React, { useState } from 'react';
import { Employee, Geofence, ActivityLog, Alert, Location } from '../types';
import VectorMap from './VectorMap';
import GoogleMapsTrack from './GoogleMapsTrack';
import BatteryDiagnostics from './BatteryDiagnostics';
import { 
  Users, ShieldAlert, Navigation, Search, Filter, Play, Pause, 
  MapPin, AlertCircle, RefreshCw, Layers, CheckCircle2, XCircle, 
  Download, Plus, Settings, Key, AlertTriangle, BatteryMedium, 
  Signal, Info, Compass, Sparkles, ShieldCheck, Lock, Smartphone
} from 'lucide-react';

interface DispatcherDashboardProps {
  employees: Employee[];
  geofences: Geofence[];
  logs: ActivityLog[];
  alerts: Alert[];
  selectedEmployeeId: string | null;
  onSelectEmployee: (id: string) => void;
  onToggleSimulate: (id: string) => void;
  onTriggerSOS: (id: string) => void;
  onAddGeofenceClick: () => void;
  onOpenApiKey: () => void;
  onClearAlerts: () => void;
  apiKey: string;
  useGoogleMaps: boolean;
  onToggleMapMode: () => void;
  simulationSpeed: number;
  onChangeSimSpeed: (speed: number) => void;
  onManualLocClick: () => void;
  interactionMode: 'view' | 'place_employee' | 'create_geofence';
  setInteractionMode: (mode: 'view' | 'place_employee' | 'create_geofence') => void;
  onAddEmployeeClick: () => void;
  onResetPassword?: (id: string, newPassword: string) => void;
  onOpenMobileApp?: () => void;
}

export default function DispatcherDashboard({
  employees,
  geofences,
  logs,
  alerts,
  selectedEmployeeId,
  onSelectEmployee,
  onToggleSimulate,
  onTriggerSOS,
  onAddGeofenceClick,
  onOpenApiKey,
  onClearAlerts,
  apiKey,
  useGoogleMaps,
  onToggleMapMode,
  simulationSpeed,
  onChangeSimSpeed,
  onManualLocClick,
  interactionMode,
  setInteractionMode,
  onAddEmployeeClick,
  onResetPassword,
  onOpenMobileApp,
}: DispatcherDashboardProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [logSearch, setLogSearch] = useState('');
  const [logFilter, setLogFilter] = useState<string>('all');
  const [activeTab, setActiveTab] = useState<'map' | 'logs' | 'battery'>('map');
  const [editingPasswordEmployeeId, setEditingPasswordEmployeeId] = useState<string | null>(null);
  const [newPasswordValue, setNewPasswordValue] = useState<string>('');

  const getLiveHoursStr = (checkInTime: string | null) => {
    if (!checkInTime) return '';
    try {
      const parts = checkInTime.match(/(\d+):(\d+)\s*(AM|PM)/i);
      if (!parts) return '';
      let hrs = parseInt(parts[1], 10);
      const mins = parseInt(parts[2], 10);
      const ampm = parts[3].toUpperCase();
      if (ampm === 'PM' && hrs < 12) hrs += 12;
      if (ampm === 'AM' && hrs === 12) hrs = 0;
      
      const now = new Date();
      const checkInDate = new Date();
      checkInDate.setHours(hrs, mins, 0, 0);
      
      let diffMs = now.getTime() - checkInDate.getTime();
      if (diffMs < 0) {
        // Assume shift spanned midnight
        diffMs += 24 * 60 * 60 * 1000;
      }
      const hrsDiff = diffMs / (1000 * 60 * 60);
      return hrsDiff.toFixed(2);
    } catch (e) {
      return '0.00';
    }
  };

  // Filter employees
  const filteredEmployees = employees.filter(emp =>
    emp.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    emp.role.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Filter activity logs
  const filteredLogs = logs.filter(log => {
    const matchesSearch = log.employeeName.toLowerCase().includes(logSearch.toLowerCase()) ||
      log.message.toLowerCase().includes(logSearch.toLowerCase());
    const matchesFilter = logFilter === 'all' || log.type === logFilter;
    return matchesSearch && matchesFilter;
  });

  // Calculate active statistics
  const totalOnDuty = employees.filter(e => e.status !== 'Off Duty').length;
  const activeSOS = alerts.filter(a => a.type === 'sos').length;
  const totalGeofences = geofences.length;

  const handleExportLogs = () => {
    // Generate simple CSV content
    const headers = 'ID,Employee,Timestamp,Type,Message,Latitude,Longitude\n';
    const rows = logs.map(log => 
      `"${log.id}","${log.employeeName}","${log.timestamp}","${log.type}","${log.message.replace(/"/g, '""')}","${log.location.lat}","${log.location.lng}"`
    ).join('\n');
    
    const blob = new Blob([headers + rows], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.setAttribute('href', url);
    a.setAttribute('download', `geotrack_activity_logs_${new Date().toISOString().split('T')[0]}.csv`);
    a.click();
  };

  const hasValidGmpKey = Boolean(apiKey) && apiKey !== 'YOUR_API_KEY';

  return (
    <div className="w-full flex flex-col min-h-screen bg-slate-950 text-slate-100 font-sans" id="dispatcher-root">
      
      {/* Top Notification Alerts Ticker */}
      {alerts.length > 0 && (
        <div className="bg-red-950/90 border-b border-red-800 text-red-200 text-xs px-6 py-2.5 flex items-center justify-between gap-4 animate-pulse">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
            <span className="font-semibold">ACTIVE ALERTS ({alerts.length}):</span>
            <span className="text-red-300 truncate">
              {alerts[0].employeeName}: {alerts[0].message} ({alerts[0].timestamp})
            </span>
          </div>
          <button
            onClick={onClearAlerts}
            className="bg-red-900 hover:bg-red-800 text-white font-bold px-3 py-1 rounded text-[10px] transition-colors shrink-0"
          >
            Acknowledge & Clear All
          </button>
        </div>
      )}

      {/* Main Dashboard Panel Layout */}
      <div className="flex-grow grid grid-cols-1 lg:grid-cols-12 gap-6 p-6">
        
        {/* Left Hand: Employee and Geofence Lists (lg:col-span-4) */}
        <div className="lg:col-span-4 space-y-6 flex flex-col h-[calc(100vh-140px)]">
          
          {/* Metrics Widget Panel */}
          <div className="grid grid-cols-3 gap-3">
            <div className="bg-slate-900/80 p-3 rounded-2xl border border-slate-800 flex flex-col justify-between shadow-lg">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
                <Users className="w-3.5 h-3.5 text-indigo-400" />
                Active Staff
              </span>
              <p className="text-2xl font-display font-bold text-slate-100 mt-2">
                {totalOnDuty}<span className="text-xs text-slate-500 font-normal">/{employees.length}</span>
              </p>
            </div>
            
            <div className="bg-slate-900/80 p-3 rounded-2xl border border-slate-800 flex flex-col justify-between shadow-lg">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
                <Layers className="w-3.5 h-3.5 text-emerald-400" />
                Geofences
              </span>
              <p className="text-2xl font-display font-bold text-emerald-400 mt-2">
                {totalGeofences}
              </p>
            </div>

            <div className={`p-3 rounded-2xl border flex flex-col justify-between shadow-lg transition-colors ${
              activeSOS > 0 ? 'bg-red-950/40 border-red-800 text-red-100' : 'bg-slate-900/80 border-slate-800 text-slate-100'
            }`}>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
                <ShieldAlert className="w-3.5 h-3.5 text-red-400" />
                SOS Alerts
              </span>
              <p className={`text-2xl font-display font-bold mt-2 ${activeSOS > 0 ? 'text-red-400' : 'text-slate-100'}`}>
                {activeSOS}
              </p>
            </div>
          </div>

          {/* Quick Config Banner */}
          <div className="bg-slate-900 border border-slate-800 p-3.5 rounded-2xl flex items-center justify-between gap-3 shadow-md">
            <div>
              <p className="text-xs font-semibold text-slate-200">Google Maps Integration</p>
              <p className="text-[10px] text-slate-400 mt-0.5">
                {hasValidGmpKey ? '✓ Live map active' : 'Offline demo map active'}
              </p>
            </div>
            <button
              onClick={onOpenApiKey}
              className="flex items-center gap-1 bg-slate-950 hover:bg-slate-800 text-indigo-300 hover:text-white border border-slate-800 text-[10px] px-2.5 py-1.5 rounded-xl transition-all"
            >
              <Key className="w-3 h-3 text-indigo-400" />
              Configure API Key
            </button>
          </div>

          {/* Employee Directory Panel */}
          <div className="bg-slate-900/90 border border-slate-800 rounded-2xl flex flex-col flex-grow shadow-xl overflow-hidden">
            <div className="p-4 border-b border-slate-800 space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="font-display font-bold text-xs text-slate-200 flex items-center gap-1.5 uppercase tracking-wide">
                  <Signal className="w-4 h-4 text-indigo-400" />
                  Live Field Directory
                </h4>
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={onOpenMobileApp}
                    className="flex items-center gap-1 bg-slate-950 hover:bg-slate-800 text-indigo-300 hover:text-white border border-slate-800 text-[10px] font-bold px-2.5 py-1.5 rounded-lg transition-all"
                    title="Launch/Access Mobile App Simulator for Selected Employee"
                  >
                    <Smartphone className="w-3.5 h-3.5 text-indigo-400" /> Mobile App
                  </button>
                  <button
                    type="button"
                    onClick={onAddEmployeeClick}
                    className="flex items-center gap-1 bg-indigo-600 hover:bg-indigo-500 text-white text-[10px] font-bold px-2.5 py-1.5 rounded-lg transition-all shadow"
                  >
                    <Plus className="w-3.5 h-3.5" /> Add Staff
                  </button>
                </div>
              </div>
              <div className="relative">
                <input
                  type="text"
                  placeholder="Search staff, roles, or status..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-4 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
                />
                <Search className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-2.5" />
              </div>
            </div>

            {/* Employee Scrollable List */}
            <div className="flex-grow overflow-y-auto p-2 space-y-1.5">
              {filteredEmployees.length === 0 ? (
                <div className="text-center p-8 text-slate-500 text-xs">
                  No matching staff members found
                </div>
              ) : (
                filteredEmployees.map(emp => {
                  const isSelected = emp.id === selectedEmployeeId;
                  const inFence = emp.currentGeofenceId;
                  const fenceName = geofences.find(g => g.id === emp.currentGeofenceId)?.name;

                  return (
                    <div
                      key={emp.id}
                      onClick={() => onSelectEmployee(emp.id)}
                      className={`p-3 rounded-xl border transition-all duration-200 cursor-pointer ${
                        isSelected 
                          ? 'bg-indigo-950/40 border-indigo-500 shadow-md shadow-indigo-950/20' 
                          : 'bg-slate-950/40 border-slate-800/60 hover:bg-slate-900/60 hover:border-slate-800'
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        {/* Avatar */}
                        <div className="relative shrink-0 mt-0.5">
                          <img src={emp.avatar} alt="" className="w-10 h-10 rounded-full border border-slate-700 object-cover" />
                          <div className={`w-3 h-3 rounded-full absolute -bottom-0.5 -right-0.5 border-2 border-slate-900 ${
                            emp.status === 'Off Duty' ? 'bg-slate-500' :
                            inFence ? 'bg-emerald-500' : 'bg-indigo-500'
                          }`} />
                        </div>

                        {/* Details */}
                        <div className="flex-grow min-w-0">
                          <div className="flex items-center justify-between">
                            <h5 className="font-semibold text-xs text-slate-200 truncate">{emp.name}</h5>
                            <span className="text-[9px] font-mono text-slate-500 flex items-center gap-1">
                              <BatteryMedium className={`w-3.5 h-3.5 ${emp.batteryLevel < 30 ? 'text-red-500' : 'text-slate-400'}`} />
                              {emp.batteryLevel}%
                            </span>
                          </div>
                          <p className="text-[10px] text-slate-400 truncate">{emp.role}</p>

                          {/* Live Status indicator */}
                          <div className="flex items-center justify-between gap-1 mt-2 flex-wrap">
                            <span className={`text-[9px] font-semibold px-2 py-0.5 rounded-full ${
                              emp.status === 'Off Duty' ? 'bg-slate-950 text-slate-400 border border-slate-800' :
                              inFence ? 'bg-emerald-950 text-emerald-300 border border-emerald-800/60' :
                              'bg-indigo-950 text-indigo-300 border border-indigo-800/60'
                            }`}>
                              {emp.status === 'Off Duty' ? 'Off Duty' :
                               inFence ? `Inside: ${fenceName}` : 'Traveling / On Move'}
                            </span>

                            {emp.status !== 'Off Duty' && (
                              <span className="text-[9px] font-mono text-slate-400">
                                {emp.speed > 0 ? `${emp.speed} km/h` : 'Stationary'}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Interactive Controls & Metadata inside Card when expanded/selected */}
                      {isSelected && (
                        <div className="mt-3.5 pt-3 border-t border-slate-800/80 space-y-3 text-[10px] animate-in slide-in-from-top-1 duration-150">
                          
                          {/* Profile details grid */}
                          <div className="grid grid-cols-2 gap-2 bg-slate-950/45 p-2.5 rounded-xl border border-slate-800/60 text-[9px] font-mono text-slate-300" onClick={(e) => e.stopPropagation()}>
                            <div>
                              <span className="text-slate-500 block text-[8px] uppercase tracking-wider font-bold">Employee Code</span>
                              <span className="font-bold text-slate-200">{emp.employeeCode || 'EMP-1004'}</span>
                            </div>
                            <div>
                              <span className="text-slate-500 block text-[8px] uppercase tracking-wider font-bold">NIC Number</span>
                              <span className="font-bold text-slate-200">{emp.nic || '35201-4728192-2'}</span>
                            </div>
                            <div className="col-span-2">
                              <span className="text-slate-500 block text-[8px] uppercase tracking-wider font-bold">Login Email</span>
                              <span className="text-slate-200 block truncate" title={emp.email}>{emp.email || `${emp.name.toLowerCase().replace(/\s+/g, '')}@company.com`}</span>
                            </div>
                            <div className="col-span-2">
                              <span className="text-slate-500 block text-[8px] uppercase tracking-wider font-bold">Area Assigned</span>
                              <span className="text-indigo-300 font-sans font-semibold">{emp.areaAssigned || 'HQ Administrative Area'}</span>
                            </div>
                            <div className="col-span-2 border-t border-slate-800/60 pt-1.5 mt-0.5">
                              <span className="text-slate-500 block text-[8px] uppercase tracking-wider font-bold">Geofence Attendance Verification</span>
                              <span className={`font-sans font-semibold flex items-center gap-1 mt-0.5 ${
                                emp.permissions?.markAttendanceWithGeofenceFace !== false ? 'text-emerald-400' : 'text-amber-400'
                              }`}>
                                <ShieldCheck className="w-3.5 h-3.5 shrink-0" />
                                {emp.permissions?.markAttendanceWithGeofenceFace !== false 
                                  ? 'Enforced with Geofence Face ID' 
                                  : 'Direct Check-In Allowed'}
                              </span>
                            </div>
                          </div>

                          {/* Calculate and display work hours section */}
                          <div className="bg-slate-950/40 border border-slate-800/60 p-2.5 rounded-xl space-y-2" onClick={(e) => e.stopPropagation()}>
                            <span className="text-indigo-400 font-bold block uppercase text-[8px] tracking-wider">Attendance & Calculated Work Hours</span>
                            
                            {/* Current shift stats */}
                            {emp.checkedIn && emp.checkInTime ? (
                              <div className="flex items-center justify-between text-[9px] bg-indigo-950/40 border border-indigo-900/40 p-1.5 rounded-lg text-indigo-200">
                                <span className="flex items-center gap-1 font-sans">
                                  <span className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-ping" />
                                  Active Shift Since {emp.checkInTime}
                                </span>
                                <span className="font-mono font-bold text-indigo-300">
                                  {getLiveHoursStr(emp.checkInTime)} hrs today
                                </span>
                              </div>
                            ) : (
                              <div className="text-slate-500 text-[9px] bg-slate-950/50 p-1.5 rounded-lg border border-slate-900 text-center font-mono">
                                Currently Off Duty (Not Checked In)
                              </div>
                            )}

                            {/* Completed days history table */}
                            <div className="space-y-1 mt-1">
                              <span className="text-[8px] text-slate-500 uppercase tracking-wide font-bold block">Shift Logs Per Day</span>
                              {emp.hoursWorkedHistory && emp.hoursWorkedHistory.length > 0 ? (
                                <div className="space-y-1 max-h-[120px] overflow-y-auto pr-0.5">
                                  {emp.hoursWorkedHistory.map((historyItem, index) => (
                                    <div key={index} className="flex items-center justify-between text-[9px] bg-slate-950 p-1.5 rounded-lg border border-slate-900 font-mono text-slate-300">
                                      <div className="flex flex-col">
                                        <span className="font-bold text-slate-200">{historyItem.date}</span>
                                        <span className="text-[8px] text-slate-500">{historyItem.checkIn} - {historyItem.checkOut}</span>
                                      </div>
                                      <span className="text-emerald-400 font-bold bg-emerald-950/40 px-2 py-0.5 rounded border border-emerald-900/30">
                                        {Number(historyItem.hours).toFixed(2)} hrs
                                      </span>
                                    </div>
                                  ))}
                                </div>
                              ) : (
                                <p className="text-[8px] text-slate-500 font-mono text-center py-1 bg-slate-950/30 rounded border border-slate-900">No completed shifts recorded yet</p>
                              )}
                            </div>
                          </div>

                          {/* Admin: Set / Reset password inline */}
                          <div className="bg-slate-950/40 border border-slate-800/60 p-2.5 rounded-xl space-y-1.5" onClick={(e) => e.stopPropagation()}>
                            <span className="text-slate-400 font-bold block uppercase text-[8px] tracking-wider">Security Credentials & Password Reset</span>
                            {editingPasswordEmployeeId === emp.id ? (
                              <div className="space-y-1.5">
                                <input
                                  type="text"
                                  placeholder="Enter new passcode (e.g. Staff@789)"
                                  value={newPasswordValue}
                                  onChange={(e) => setNewPasswordValue(e.target.value)}
                                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1 text-[9px] font-mono text-slate-200 focus:outline-none focus:border-indigo-500"
                                />
                                <div className="flex gap-1.5 justify-end">
                                  <button
                                    type="button"
                                    onClick={() => setEditingPasswordEmployeeId(null)}
                                    className="px-2 py-1 bg-slate-800 text-slate-400 hover:text-slate-200 rounded text-[8px] font-bold"
                                  >
                                    Cancel
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => {
                                      if (newPasswordValue.trim() && onResetPassword) {
                                        onResetPassword(emp.id, newPasswordValue.trim());
                                        setEditingPasswordEmployeeId(null);
                                      }
                                    }}
                                    className="px-2 py-1 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded text-[8px]"
                                  >
                                    Save New Passcode
                                  </button>
                                </div>
                              </div>
                            ) : (
                              <div className="flex items-center justify-between text-[9px] bg-slate-950/20 p-1.5 rounded-lg border border-slate-900">
                                <div className="font-mono flex items-center gap-1.5">
                                  <Lock className="w-3.5 h-3.5 text-slate-500" />
                                  <span className="text-slate-500">Passcode:</span>
                                  <span className="text-slate-300 font-bold">{emp.password || 'Staff@123'}</span>
                                </div>
                                <button
                                  type="button"
                                  onClick={() => {
                                    setNewPasswordValue(emp.password || 'Staff@123');
                                    setEditingPasswordEmployeeId(emp.id);
                                  }}
                                  className="px-2 py-0.5 bg-slate-900 border border-slate-800 hover:border-slate-700 text-indigo-400 hover:text-indigo-300 font-bold rounded text-[8px]"
                                >
                                  Reset Passcode
                                </button>
                              </div>
                            )}
                          </div>

                          {/* Simulation controls */}
                          {emp.status !== 'Off Duty' && (
                            <div className="pt-2 border-t border-slate-800/60 flex justify-between gap-2" onClick={(e) => e.stopPropagation()}>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  onToggleSimulate(emp.id);
                                }}
                                className={`flex items-center justify-center gap-1 text-[10px] font-bold px-2.5 py-1.5 rounded-lg border transition-all flex-grow ${
                                  emp.isSimulating
                                    ? 'bg-indigo-600 border-indigo-500 hover:bg-indigo-500 text-white animate-pulse'
                                    : 'bg-slate-950 border-slate-800 hover:bg-slate-850 text-slate-300'
                                }`}
                              >
                                {emp.isSimulating ? (
                                  <>
                                    <Pause className="w-3 h-3 fill-current animate-spin" /> Pause Walk
                                  </>
                                ) : (
                                  <>
                                    <Play className="w-3 h-3 fill-current" /> Simulate Path
                                  </>
                                )}
                              </button>

                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  onTriggerSOS(emp.id);
                                }}
                                className="flex items-center justify-center gap-1 text-[10px] font-bold bg-red-950/40 hover:bg-red-900/60 border border-red-800/60 hover:border-red-700 text-red-200 px-2.5 py-1.5 rounded-lg transition-all flex-grow"
                              >
                                <AlertTriangle className="w-3 h-3" /> Test SOS Alarm
                              </button>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>

        {/* Right Hand: Map controls and Feed (lg:col-span-8) */}
        <div className="lg:col-span-8 flex flex-col h-[calc(100vh-140px)] gap-6">
          
          {/* Controls Bar for Simulation */}
          <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl flex flex-wrap items-center justify-between gap-4 shadow-xl">
            
            {/* View Tab selector */}
            <div className="flex gap-1 bg-slate-950 p-1 rounded-xl border border-slate-800">
              <button
                onClick={() => setActiveTab('map')}
                className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-semibold transition-all ${
                  activeTab === 'map' ? 'bg-indigo-600 text-white shadow' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <Compass className="w-3.5 h-3.5" /> Live Map Tracking
              </button>
              <button
                onClick={() => setActiveTab('logs')}
                className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-semibold transition-all ${
                  activeTab === 'logs' ? 'bg-indigo-600 text-white shadow' : 'text-slate-400 hover:text-slate-200'
                }`}
                id="tab-view-logs"
              >
                <Filter className="w-3.5 h-3.5" /> Historical Activity Logs
              </button>
              <button
                onClick={() => setActiveTab('battery')}
                className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-semibold transition-all ${
                  activeTab === 'battery' ? 'bg-indigo-600 text-white shadow' : 'text-slate-400 hover:text-slate-200'
                }`}
                id="tab-view-battery"
              >
                <BatteryMedium className="w-3.5 h-3.5 text-amber-400" /> Battery Diagnostics
              </button>
            </div>

            {/* Active Simulation parameters */}
            {activeTab === 'map' && (
              <div className="flex items-center gap-4 flex-wrap">
                {/* Speed indicator */}
                <div className="flex items-center gap-2">
                  <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Sim Speed:</span>
                  <div className="flex bg-slate-950 rounded-lg p-0.5 border border-slate-800">
                    {[1, 2, 5].map(s => (
                      <button
                        key={s}
                        onClick={() => onChangeSimSpeed(s)}
                        className={`px-2 py-1 text-[10px] font-mono rounded font-semibold ${
                          simulationSpeed === s ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-slate-200'
                        }`}
                      >
                        {s}x
                      </button>
                    ))}
                  </div>
                </div>

                {/* Draw geofence button */}
                <button
                  onClick={onAddGeofenceClick}
                  className="flex items-center gap-1 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs px-3 py-1.5 rounded-xl transition-all shadow-lg shadow-emerald-950/20"
                  id="btn-add-geofence"
                >
                  <Plus className="w-3.5 h-3.5" /> Create Geofence
                </button>

                {/* Map type selector (Google Map vs Vector Map) */}
                {hasValidGmpKey && (
                  <button
                    onClick={onToggleMapMode}
                    className="flex items-center gap-1 bg-slate-950 hover:bg-slate-800 text-slate-300 font-semibold text-xs px-3 py-1.5 rounded-xl border border-slate-800 transition-all"
                  >
                    <Layers className="w-3.5 h-3.5 text-indigo-400" />
                    {useGoogleMaps ? 'Swap to Vector Sim' : 'Swap to Google Map'}
                  </button>
                )}
              </div>
            )}
          </div>

          {/* Tab Content Display */}
          <div className="flex-grow min-h-0">
            {activeTab === 'map' ? (
              <div className="w-full h-full relative">
                {useGoogleMaps && hasValidGmpKey ? (
                  <GoogleMapsTrack
                    apiKey={apiKey}
                    employees={employees}
                    geofences={geofences}
                    selectedEmployeeId={selectedEmployeeId}
                    onSelectEmployee={onSelectEmployee}
                    interactionMode={interactionMode}
                    onMapClick={(loc) => {
                      if (interactionMode === 'place_employee' && selectedEmployeeId) {
                        // Handle employee relocation manually
                        onManualLocClick();
                      }
                    }}
                  />
                ) : (
                  <VectorMap
                    employees={employees}
                    geofences={geofences}
                    selectedEmployeeId={selectedEmployeeId}
                    onSelectEmployee={onSelectEmployee}
                    interactionMode={interactionMode}
                    onMapClick={(loc) => {
                      if (interactionMode === 'place_employee' && selectedEmployeeId) {
                        onManualLocClick();
                      }
                    }}
                  />
                )}
              </div>
            ) : activeTab === 'logs' ? (
              /* Logs Tab View */
              <div className="bg-slate-900 border border-slate-800 rounded-2xl h-full flex flex-col shadow-xl overflow-hidden animate-in fade-in duration-200">
                
                {/* Search / Filter logs */}
                <div className="p-4 border-b border-slate-800 bg-slate-950/50 flex flex-wrap items-center justify-between gap-4">
                  <div className="flex items-center gap-3 flex-grow max-w-md">
                    <div className="relative flex-grow">
                      <input
                        type="text"
                        placeholder="Search logs (e.g. Jenkins, entered...)"
                        value={logSearch}
                        onChange={(e) => setLogSearch(e.target.value)}
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-4 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
                        id="log-search-input"
                      />
                      <Search className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-2.5" />
                    </div>

                    <select
                      value={logFilter}
                      onChange={(e) => setLogFilter(e.target.value)}
                      className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-1.5 text-xs text-slate-300 focus:outline-none focus:border-indigo-500"
                    >
                      <option value="all">All Event Types</option>
                      <option value="check_in">Check Ins</option>
                      <option value="check_out">Check Outs</option>
                      <option value="geofence_enter">Geofence Entries</option>
                      <option value="geofence_exit">Geofence Exits</option>
                      <option value="location_update">Location Updates</option>
                      <option value="critical">Critical/SOS</option>
                    </select>
                  </div>

                  <button
                    onClick={handleExportLogs}
                    className="flex items-center gap-1.5 bg-slate-950 hover:bg-slate-800 border border-slate-800 text-slate-300 font-bold text-xs px-3 py-1.5 rounded-xl transition-colors"
                  >
                    <Download className="w-3.5 h-3.5" /> Export Logs (CSV)
                  </button>
                </div>

                {/* Log list */}
                <div className="flex-grow overflow-y-auto p-4 space-y-2">
                  {filteredLogs.length === 0 ? (
                    <div className="text-center p-12 text-slate-500 text-xs font-mono">
                      No matching log records found. Logs are auto-recorded as simulations run.
                    </div>
                  ) : (
                    filteredLogs.map(log => {
                      const logColors = 
                        log.type === 'check_in' ? 'bg-blue-950 text-blue-300 border-blue-800/40' :
                        log.type === 'check_out' ? 'bg-slate-950 text-slate-400 border-slate-800' :
                        log.type === 'geofence_enter' ? 'bg-emerald-950 text-emerald-300 border-emerald-800/40' :
                        log.type === 'geofence_exit' ? 'bg-amber-950 text-amber-300 border-amber-800/40' :
                        log.type === 'critical' ? 'bg-red-950 text-red-300 border-red-800/40 animate-pulse' :
                        'bg-slate-950 text-slate-300 border-slate-800';

                      return (
                        <div
                          key={log.id}
                          className={`p-3 rounded-xl border flex items-start gap-3 text-xs leading-relaxed transition-all ${logColors}`}
                        >
                          <span className="font-mono text-[10px] text-slate-500 bg-slate-950 px-2 py-0.5 rounded border border-slate-800 shrink-0">
                            {log.timestamp}
                          </span>
                          <div className="flex-grow">
                            <p className="font-medium text-slate-200">
                              <span className="font-semibold">{log.employeeName}</span> — {log.message}
                            </p>
                            <p className="text-[10px] text-slate-400 font-mono mt-1">
                              Location coordinates: {log.location.lat.toFixed(6)}, {log.location.lng.toFixed(6)}
                            </p>
                            {log.selfie && (
                              <div className="mt-2.5 flex items-center gap-3 bg-slate-950/70 p-2 rounded-xl border border-indigo-900/40 w-fit">
                                <img 
                                  src={log.selfie} 
                                  alt="Attendance selfie" 
                                  className="w-12 h-12 rounded-lg object-cover border border-indigo-500/30 shrink-0 shadow-lg" 
                                />
                                <div className="text-[10px]">
                                  <p className="font-bold text-emerald-400 flex items-center gap-1">
                                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" /> Biometrically Authenticated
                                  </p>
                                  <p className="text-slate-400 mt-0.5">Confidence Level: <span className="text-slate-200 font-mono">99.4% match</span></p>
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            ) : (
              /* Battery Diagnostics Tab View */
              <BatteryDiagnostics employees={employees} />
            )}
          </div>
        </div>

      </div>
    </div>
  );
}

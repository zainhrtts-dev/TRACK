import React, { useState, useMemo } from 'react';
import { Employee } from '../types';
import { 
  ResponsiveContainer, LineChart, Line, XAxis, YAxis, 
  CartesianGrid, Tooltip, Legend 
} from 'recharts';
import { 
  Battery, AlertTriangle, CheckCircle2, Zap, ShieldAlert, Filter, 
  Users, RefreshCw, Layers
} from 'lucide-react';

interface BatteryDiagnosticsProps {
  employees: Employee[];
}

export default function BatteryDiagnostics({ employees }: BatteryDiagnosticsProps) {
  // Toggle visibility of employee lines in the chart
  const [visibleEmployees, setVisibleEmployees] = useState<Record<string, boolean>>(() => {
    const initial: Record<string, boolean> = {};
    employees.forEach(emp => {
      initial[emp.id] = true;
    });
    return initial;
  });

  // Time string parser for sorting (e.g., "08:15:23 AM" or "10:30 AM")
  const parseTimeToSeconds = (timeStr: string): number => {
    const match = timeStr.match(/(\d+):(\d+):?(\d+)?\s*(AM|PM)?/i);
    if (!match) return 0;
    let hours = parseInt(match[1], 10);
    const minutes = parseInt(match[2], 10);
    const seconds = match[3] ? parseInt(match[3], 10) : 0;
    const ampm = match[4];
    
    if (ampm) {
      if (ampm.toUpperCase() === 'PM' && hours < 12) hours += 12;
      if (ampm.toUpperCase() === 'AM' && hours === 12) hours = 0;
    }
    return hours * 3600 + minutes * 60 + seconds;
  };

  // Compile and format the data for Recharts
  const chartData = useMemo(() => {
    // 1. Gather all unique timestamps across all employee histories
    const allTimestamps = Array.from(
      new Set(
        employees.flatMap(emp => (emp.batteryHistory || []).map(h => h.timestamp))
      )
    );

    // 2. Sort them chronologically
    const sortedTimestamps = allTimestamps.sort((a, b) => parseTimeToSeconds(a) - parseTimeToSeconds(b));

    // 3. Build data objects for each timestamp
    return sortedTimestamps.map(timestamp => {
      const dataPoint: Record<string, any> = { timestamp };
      
      employees.forEach(emp => {
        const history = emp.batteryHistory || [];
        const exactMatch = history.find(h => h.timestamp === timestamp);
        
        if (exactMatch) {
          dataPoint[emp.name] = exactMatch.batteryLevel;
        } else {
          // Preceding battery level interpolation to prevent chart gaps
          const preceding = history
            .filter(h => parseTimeToSeconds(h.timestamp) <= parseTimeToSeconds(timestamp))
            .sort((a, b) => parseTimeToSeconds(b.timestamp) - parseTimeToSeconds(a.timestamp))[0];
          
          if (preceding) {
            dataPoint[emp.name] = preceding.batteryLevel;
          } else if (history.length > 0) {
            dataPoint[emp.name] = history[0].batteryLevel;
          } else {
            dataPoint[emp.name] = emp.batteryLevel;
          }
        }
      });
      
      return dataPoint;
    });
  }, [employees]);

  // Calculate high-level battery analytics
  const analytics = useMemo(() => {
    const activeStaff = employees.filter(e => e.status !== 'Off Duty');
    const onDutyCount = activeStaff.length;
    
    if (onDutyCount === 0) {
      return {
        avgBattery: 0,
        lowBatteryDevices: 0,
        criticalAlerts: 0,
        lowestBatteryName: 'N/A',
        lowestBatteryValue: 100
      };
    }

    const totalBattery = activeStaff.reduce((sum, e) => sum + e.batteryLevel, 0);
    const avgBattery = Math.round(totalBattery / onDutyCount);
    
    const lowBatteryDevices = activeStaff.filter(e => e.batteryLevel < 50 && e.batteryLevel >= 25).length;
    const criticalAlerts = activeStaff.filter(e => e.batteryLevel < 25).length;
    
    // Find the device with the lowest battery
    let lowestBatteryName = 'N/A';
    let lowestBatteryValue = 101;
    activeStaff.forEach(e => {
      if (e.batteryLevel < lowestBatteryValue) {
        lowestBatteryValue = e.batteryLevel;
        lowestBatteryName = e.name;
      }
    });

    return {
      avgBattery,
      lowBatteryDevices,
      criticalAlerts,
      lowestBatteryName,
      lowestBatteryValue: lowestBatteryValue === 101 ? 0 : lowestBatteryValue
    };
  }, [employees]);

  // Color mapping matching employee IDs
  const getEmployeeColor = (id: string) => {
    switch (id) {
      case 'emp_sarah': return '#6366F1'; // Indigo
      case 'emp_elena': return '#10B981'; // Emerald
      case 'emp_marcus': return '#F59E0B'; // Amber
      case 'emp_david': return '#EC4899'; // Pink
      default: return '#38BDF8'; // Sky
    }
  };

  const handleToggleVisibility = (id: string) => {
    setVisibleEmployees(prev => ({
      ...prev,
      [id]: !prev[id]
    }));
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl h-full flex flex-col shadow-xl overflow-hidden animate-in fade-in duration-200" id="battery-diagnostics-view">
      
      {/* Tab Header Banner */}
      <div className="p-4 border-b border-slate-800 bg-slate-950/40 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h3 className="font-display font-bold text-sm text-slate-200 flex items-center gap-2">
            <Battery className="w-4 h-4 text-indigo-400" />
            Live Battery Diagnostics Panel
          </h3>
          <p className="text-[10px] text-slate-400 mt-0.5">
            Real-time battery discharge telemetry and trend monitoring across all active field devices.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="bg-slate-950 text-indigo-400 font-mono text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded border border-indigo-900/60">
            Recharts Engine Active
          </span>
        </div>
      </div>

      {/* Main Body Grid */}
      <div className="flex-grow overflow-y-auto p-5 space-y-6">
        
        {/* Quick Analytics Widgets */}
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
          
          <div className="bg-slate-950/60 border border-slate-800/80 p-4 rounded-xl flex items-center justify-between shadow-inner">
            <div>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Avg Fleet Charge</span>
              <p className="text-xl font-bold text-slate-200 mt-1">{analytics.avgBattery}%</p>
              <p className="text-[9px] text-slate-500 mt-1">Active staff average</p>
            </div>
            <div className={`p-2.5 rounded-lg ${analytics.avgBattery > 70 ? 'bg-indigo-950 text-indigo-400' : 'bg-amber-950 text-amber-400'}`}>
              <Zap className="w-5 h-5" />
            </div>
          </div>

          <div className="bg-slate-950/60 border border-slate-800/80 p-4 rounded-xl flex items-center justify-between shadow-inner">
            <div>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Lowest Device</span>
              <p className="text-xl font-bold text-amber-500 mt-1 truncate max-w-[120px]" title={analytics.lowestBatteryName}>
                {analytics.lowestBatteryValue}%
              </p>
              <p className="text-[9px] text-slate-500 mt-1 truncate max-w-[120px]">{analytics.lowestBatteryName}</p>
            </div>
            <div className="bg-amber-950/40 text-amber-500 p-2.5 rounded-lg">
              <AlertTriangle className="w-5 h-5" />
            </div>
          </div>

          <div className="bg-slate-950/60 border border-slate-800/80 p-4 rounded-xl flex items-center justify-between shadow-inner">
            <div>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Warning Level (50%)</span>
              <p className="text-xl font-bold text-yellow-500 mt-1">{analytics.lowBatteryDevices}</p>
              <p className="text-[9px] text-slate-500 mt-1">Requires standard charge</p>
            </div>
            <div className="bg-yellow-950/40 text-yellow-500 p-2.5 rounded-lg">
              <Battery className="w-5 h-5 text-yellow-400" />
            </div>
          </div>

          <div className="bg-slate-950/60 border border-slate-800/80 p-4 rounded-xl flex items-center justify-between shadow-inner">
            <div>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Critical Alarm (25%)</span>
              <p className="text-xl font-bold text-red-500 mt-1">{analytics.criticalAlerts}</p>
              <p className="text-[9px] text-slate-500 mt-1">Immediate dispatch needed</p>
            </div>
            <div className="bg-red-950/40 text-red-500 p-2.5 rounded-lg">
              <ShieldAlert className="w-5 h-5 text-red-400" />
            </div>
          </div>

        </div>

        {/* Content Layout: Left Chart, Right Toggles */}
        <div className="grid grid-cols-1 xl:grid-cols-4 gap-6">
          
          {/* Left Column: Recharts Trend Line Chart (xl:col-span-3) */}
          <div className="xl:col-span-3 bg-slate-950 border border-slate-850 p-4 rounded-2xl shadow-lg flex flex-col justify-between">
            <div className="flex items-center justify-between mb-4 px-2">
              <div>
                <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider">Discharge Rate Visualization</h4>
                <p className="text-[9px] text-slate-500 mt-0.5">X-Axis: Simulation Timestamp | Y-Axis: Battery Level %</p>
              </div>
              <div className="flex items-center gap-1.5 text-[10px] text-slate-400 font-mono bg-slate-900 border border-slate-800 px-2.5 py-1 rounded-lg">
                <RefreshCw className="w-3 h-3 text-indigo-400 animate-spin" />
                <span>Live Telemetry Stream</span>
              </div>
            </div>

            {/* Recharts responsive component */}
            <div className="w-full h-[280px]">
              {chartData.length === 0 ? (
                <div className="w-full h-full flex flex-col items-center justify-center text-slate-600 font-mono text-xs gap-2">
                  <Battery className="w-8 h-8 text-slate-750" />
                  <span>Waiting for initial battery logs to compile...</span>
                </div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart
                    data={chartData}
                    margin={{ top: 10, right: 15, left: -25, bottom: 0 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="#1E293B" vertical={false} />
                    <XAxis 
                      dataKey="timestamp" 
                      stroke="#64748B" 
                      fontSize={8} 
                      tickLine={false}
                      axisLine={false}
                    />
                    <YAxis 
                      stroke="#64748B" 
                      fontSize={9} 
                      domain={[0, 100]} 
                      tickLine={false}
                      axisLine={false}
                    />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: '#0F172A',
                        border: '1px solid #334155',
                        borderRadius: '12px',
                        padding: '10px 14px',
                        fontSize: '11px',
                        color: '#F8FAFC'
                      }}
                    />
                    <Legend 
                      verticalAlign="top" 
                      height={36} 
                      iconSize={8}
                      iconType="circle"
                      wrapperStyle={{
                        fontSize: '10px',
                        paddingBottom: '10px'
                      }}
                    />
                    {employees.map(emp => {
                      if (!visibleEmployees[emp.id]) return null;
                      return (
                        <Line
                          key={emp.id}
                          type="monotone"
                          dataKey={emp.name}
                          stroke={getEmployeeColor(emp.id)}
                          strokeWidth={2.5}
                          dot={false}
                          activeDot={{ r: 6, stroke: '#0F172A', strokeWidth: 2 }}
                          animationDuration={400}
                        />
                      );
                    })}
                  </LineChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>

          {/* Right Column: Toggle Visibility Options */}
          <div className="bg-slate-950/40 border border-slate-850 p-4 rounded-2xl flex flex-col shadow-inner">
            <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider mb-3 flex items-center gap-1.5">
              <Filter className="w-3.5 h-3.5 text-indigo-400" />
              Toggle Line Visibility
            </h4>
            <p className="text-[10px] text-slate-500 mb-4 leading-normal">
              Click individual check boxes to hide or show battery logs on the telemetry canvas.
            </p>

            <div className="space-y-2 flex-grow overflow-y-auto pr-1">
              {employees.map(emp => {
                const color = getEmployeeColor(emp.id);
                const isVisible = visibleEmployees[emp.id];
                return (
                  <label
                    key={emp.id}
                    className="flex items-center justify-between p-2.5 rounded-xl border border-slate-800/60 bg-slate-950 hover:bg-slate-900 cursor-pointer transition-all"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      {/* Color dot */}
                      <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: color }} />
                      <div className="min-w-0">
                        <p className="text-xs font-semibold text-slate-200 truncate">{emp.name}</p>
                        <p className="text-[9px] text-slate-500 truncate">{emp.role}</p>
                      </div>
                    </div>
                    <input
                      type="checkbox"
                      checked={isVisible}
                      onChange={() => handleToggleVisibility(emp.id)}
                      className="rounded border-slate-800 text-indigo-600 focus:ring-indigo-500 bg-slate-950"
                    />
                  </label>
                );
              })}
            </div>
          </div>

        </div>

        {/* Diagnostics Fleet Overview Table */}
        <div className="bg-slate-950 border border-slate-850 rounded-2xl shadow-xl overflow-hidden">
          <div className="p-4 border-b border-slate-850 bg-slate-950/80">
            <h4 className="text-xs font-bold text-slate-200 uppercase tracking-wider flex items-center gap-1.5">
              <Users className="w-4 h-4 text-emerald-400" />
              Real-time Hardware Status Metrics
            </h4>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-slate-850 bg-slate-900/40 text-slate-400 font-mono text-[10px]">
                  <th className="py-3 px-4 font-semibold uppercase tracking-wider">Employee</th>
                  <th className="py-3 px-4 font-semibold uppercase tracking-wider">Role</th>
                  <th className="py-3 px-4 font-semibold uppercase tracking-wider">Simulation Duty</th>
                  <th className="py-3 px-4 font-semibold uppercase tracking-wider">Charge Level</th>
                  <th className="py-3 px-4 font-semibold uppercase tracking-wider">Health Status</th>
                  <th className="py-3 px-4 font-semibold uppercase tracking-wider">Last Sync</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-850/60">
                {employees.map(emp => {
                  const isLow = emp.batteryLevel < 30;
                  const isWarning = emp.batteryLevel >= 30 && emp.batteryLevel < 60;
                  const statusClass = isLow ? 'text-red-400 bg-red-950/30 border-red-900/40' :
                                      isWarning ? 'text-yellow-400 bg-yellow-950/30 border-yellow-900/40' :
                                      'text-emerald-400 bg-emerald-950/30 border-emerald-900/40';
                  
                  const textLabel = isLow ? '🚨 CRITICAL (Discharging)' :
                                    isWarning ? '⚠️ WARNING (Active Discharge)' :
                                    '✓ HEALTHY (Standby / Normal)';

                  return (
                    <tr key={emp.id} className="hover:bg-slate-900/30 transition-colors">
                      <td className="py-3 px-4 flex items-center gap-3">
                        <img src={emp.avatar} className="w-6 h-6 rounded-full border border-slate-800 object-cover" alt="" />
                        <span className="font-semibold text-slate-200">{emp.name}</span>
                      </td>
                      <td className="py-3 px-4 text-slate-400">{emp.role}</td>
                      <td className="py-3 px-4">
                        <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[9px] font-medium border ${
                          emp.status === 'Off Duty' ? 'bg-slate-900/60 border-slate-800 text-slate-500' :
                          emp.isSimulating ? 'bg-indigo-950/50 border-indigo-800 text-indigo-300' :
                          'bg-amber-950/30 border-amber-800/40 text-amber-300'
                        }`}>
                          {emp.status === 'Off Duty' ? 'Off Duty' :
                           emp.isSimulating ? 'Path Simulation Active' : 'Stationary GPS Sim'}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2">
                          <div className="w-16 bg-slate-800 rounded-full h-1.5 overflow-hidden">
                            <div 
                              className={`h-full rounded-full ${
                                isLow ? 'bg-red-500' : isWarning ? 'bg-yellow-500' : 'bg-indigo-500'
                              }`}
                              style={{ width: `${emp.batteryLevel}%` }}
                            />
                          </div>
                          <span className="font-mono font-bold text-slate-300">{emp.batteryLevel}%</span>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[9px] font-mono border ${statusClass}`}>
                          {textLabel}
                        </span>
                      </td>
                      <td className="py-3 px-4 font-mono text-slate-500">{emp.lastUpdated}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

      </div>

    </div>
  );
}

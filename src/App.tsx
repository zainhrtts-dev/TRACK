import React, { useState, useEffect, useRef } from 'react';
import { Employee, Geofence, ActivityLog, Alert, Location } from './types';
import { DEFAULT_EMPLOYEES, DEFAULT_GEOFENCES, INITIAL_LOGS, getDistanceMeters } from './data';
import DispatcherDashboard from './components/DispatcherDashboard';
import PhoneSimulator from './components/PhoneSimulator';
import GeofenceModal from './components/GeofenceModal';
import ApiKeyModal from './components/ApiKeyModal';
import AddEmployeeModal from './components/AddEmployeeModal';
import { 
  Users, Layers, ShieldAlert, Compass, MapPin, ClipboardList, 
  Settings, Key, AlertCircle, Info, LayoutGrid, Smartphone, 
  HelpCircle, CheckCircle, RefreshCw, Calendar, Clock
} from 'lucide-react';

export default function App() {
  // --- 1. Persistent State Management via LocalStorage ---
  const [employees, setEmployees] = useState<Employee[]>(() => {
    const saved = localStorage.getItem('geotrack_employees');
    return saved ? JSON.parse(saved) : DEFAULT_EMPLOYEES;
  });

  const [geofences, setGeofences] = useState<Geofence[]>(() => {
    const saved = localStorage.getItem('geotrack_geofences');
    return saved ? JSON.parse(saved) : DEFAULT_GEOFENCES;
  });

  const [logs, setLogs] = useState<ActivityLog[]>(() => {
    const saved = localStorage.getItem('geotrack_logs');
    return saved ? JSON.parse(saved) : INITIAL_LOGS;
  });

  const [alerts, setAlerts] = useState<Alert[]>(() => {
    const saved = localStorage.getItem('geotrack_alerts');
    return saved ? JSON.parse(saved) : [];
  });

  const [apiKey, setApiKey] = useState<string>(() => {
    const saved = localStorage.getItem('geotrack_api_key');
    return saved || process.env.GOOGLE_MAPS_PLATFORM_KEY || '';
  });

  // --- 2. Interface UI State ---
  const [viewMode, setViewMode] = useState<'dispatcher' | 'employee'>('dispatcher');
  const [selectedEmployeeId, setSelectedEmployeeId] = useState<string | null>('emp_sarah');
  const [useGoogleMaps, setUseGoogleMaps] = useState<boolean>(true);
  const [simulationSpeed, setSimulationSpeed] = useState<number>(1);
  const [interactionMode, setInteractionMode] = useState<'view' | 'place_employee' | 'create_geofence'>('view');
  const [clickedLocation, setClickedLocation] = useState<Location | null>(null);

  // Modal open states
  const [isGeofenceModalOpen, setIsGeofenceModalOpen] = useState(false);
  const [isApiKeyModalOpen, setIsApiKeyModalOpen] = useState(false);
  const [isAddEmployeeModalOpen, setIsAddEmployeeModalOpen] = useState(false);

  // System dynamic time
  const [systemTime, setSystemTime] = useState(new Date().toLocaleTimeString());

  // Save to localStorage when state changes
  useEffect(() => {
    localStorage.setItem('geotrack_employees', JSON.stringify(employees));
  }, [employees]);

  useEffect(() => {
    localStorage.setItem('geotrack_geofences', JSON.stringify(geofences));
  }, [geofences]);

  useEffect(() => {
    localStorage.setItem('geotrack_logs', JSON.stringify(logs));
  }, [logs]);

  useEffect(() => {
    localStorage.setItem('geotrack_alerts', JSON.stringify(alerts));
  }, [alerts]);

  useEffect(() => {
    localStorage.setItem('geotrack_api_key', apiKey);
  }, [apiKey]);

  // System dynamic clock ticker
  useEffect(() => {
    const timer = setInterval(() => {
      setSystemTime(new Date().toLocaleTimeString());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // --- 3. Core Math Logic: Geofence Verification and Transitions ---
  const checkGeofencesForLocation = (
    loc: Location,
    currentFenceId: string | null,
    empId: string,
    empName: string
  ): { nextFenceId: string | null; logsToCreate: ActivityLog[]; alertsToCreate: Alert[] } => {
    let nextFenceId: string | null = null;
    const logsToCreate: ActivityLog[] = [];
    const alertsToCreate: Alert[] = [];
    const timestamp = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    // Check if employee is currently inside any of the geofences
    for (const fence of geofences) {
      const distance = getDistanceMeters(loc, fence.center);
      if (distance <= fence.radius) {
        nextFenceId = fence.id;
        break;
      }
    }

    // Determine transition status
    if (nextFenceId !== currentFenceId) {
      // 1. Transition: Left an old geofence
      if (currentFenceId) {
        const oldFence = geofences.find(g => g.id === currentFenceId);
        if (oldFence) {
          const exitLog: ActivityLog = {
            id: `log_${Date.now()}_exit`,
            employeeId: empId,
            employeeName: empName,
            timestamp,
            type: 'geofence_exit',
            message: `🏁 Departed Geofence: ${oldFence.name}`,
            geofenceId: oldFence.id,
            location: loc,
          };
          logsToCreate.push(exitLog);

          const exitAlert: Alert = {
            id: `alert_${Date.now()}_exit`,
            employeeId: empId,
            employeeName: empName,
            timestamp,
            type: 'exit',
            message: `Left designated zone: ${oldFence.name}`,
            read: false,
          };
          alertsToCreate.push(exitAlert);
        }
      }

      // 2. Transition: Entered a new geofence
      if (nextFenceId) {
        const newFence = geofences.find(g => g.id === nextFenceId);
        if (newFence) {
          const enterLog: ActivityLog = {
            id: `log_${Date.now()}_enter`,
            employeeId: empId,
            employeeName: empName,
            timestamp,
            type: 'geofence_enter',
            message: `📍 Entered Geofence: ${newFence.name}`,
            geofenceId: newFence.id,
            location: loc,
          };
          logsToCreate.push(enterLog);

          const enterAlert: Alert = {
            id: `alert_${Date.now()}_enter`,
            employeeId: empId,
            employeeName: empName,
            timestamp,
            type: 'enter',
            message: `Entered designated zone: ${newFence.name}`,
            read: false,
          };
          alertsToCreate.push(enterAlert);
        }
      }
    }

    return { nextFenceId, logsToCreate, alertsToCreate };
  };

  // --- 4. Simulation Engine Loop ---
  useEffect(() => {
    // If simulation is paused or set to speed 0, do nothing
    if (simulationSpeed === 0) return;

    // Run calculation tick every 2000ms divided by speed
    const tickInterval = 2000 / simulationSpeed;

    const interval = setInterval(() => {
      setEmployees(prevEmps => {
        return prevEmps.map(emp => {
          // Skip if employee is off duty or doesn't have simulation enabled
          if (emp.status === 'Off Duty' || !emp.isSimulating || emp.simulatedPath.length === 0) {
            return emp;
          }

          // Step index forward
          const nextIndex = (emp.currentPathIndex + 1) % emp.simulatedPath.length;
          const nextLoc = emp.simulatedPath[nextIndex];

          // Compute geofence entries/exits
          const { nextFenceId, logsToCreate, alertsToCreate } = checkGeofencesForLocation(
            nextLoc,
            emp.currentGeofenceId,
            emp.id,
            emp.name
          );

          // Update logs and alerts state
          if (logsToCreate.length > 0) {
            setLogs(prev => [...prev, ...logsToCreate]);
          }
          if (alertsToCreate.length > 0) {
            setAlerts(prev => [alertsToCreate[0], ...prev]); // Prepend new alerts
          }

          // Decrease battery slowly
          const batteryDec = Math.random() > 0.85 ? 1 : 0;
          const nextBattery = Math.max(emp.batteryLevel - batteryDec, 3);

          const timeLabel = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
          const updatedHistory = [...(emp.batteryHistory || [])];
          if (updatedHistory.length >= 20) {
            updatedHistory.shift();
          }
          updatedHistory.push({ timestamp: timeLabel, batteryLevel: nextBattery });

          return {
            ...emp,
            currentLocation: nextLoc,
            currentPathIndex: nextIndex,
            currentGeofenceId: nextFenceId,
            status: nextFenceId ? 'In Geofence' : 'Traveling',
            lastUpdated: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            batteryLevel: nextBattery,
            batteryHistory: updatedHistory,
          };
        });
      });
    }, tickInterval);

    return () => clearInterval(interval);
  }, [simulationSpeed, geofences]);

  // --- 5. Interactive Commands / Handlers ---
  
  // Toggle simulation walking for an employee
  const handleToggleSimulate = (id: string) => {
    setEmployees(prev => prev.map(emp => {
      if (emp.id === id) {
        return { ...emp, isSimulating: !emp.isSimulating };
      }
      return emp;
    }));
  };

  // Trigger simulated SOS
  const handleTriggerSOS = (id: string) => {
    const emp = employees.find(e => e.id === id);
    if (!emp) return;

    const timestamp = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const sosLog: ActivityLog = {
      id: `log_${Date.now()}_sos`,
      employeeId: emp.id,
      employeeName: emp.name,
      timestamp,
      type: 'critical',
      message: `🚨 PANIC ALARM - SOS Button Pressed! Emergency assistance dispatched.`,
      location: emp.currentLocation,
    };

    const sosAlert: Alert = {
      id: `alert_${Date.now()}_sos`,
      employeeId: emp.id,
      employeeName: emp.name,
      timestamp,
      type: 'sos',
      message: '🚨 CRITICAL: Activated Emergency SOS Beacon!',
      read: false,
    };

    setLogs(prev => [...prev, sosLog]);
    setAlerts(prev => [sosAlert, ...prev]);
  };

  // Handle Manual GPS Movement from Phone Controls
  const handleManualMove = (id: string, direction: 'N' | 'S' | 'E' | 'W') => {
    setEmployees(prev => prev.map(emp => {
      if (emp.id !== id) return emp;

      // Coordinate shift sizes (~11 meters)
      const latDelta = 0.0001;
      const lngDelta = 0.00013;

      let nextLat = emp.currentLocation.lat;
      let nextLng = emp.currentLocation.lng;

      if (direction === 'N') nextLat += latDelta;
      if (direction === 'S') nextLat -= latDelta;
      if (direction === 'E') nextLng += lngDelta;
      if (direction === 'W') nextLng -= lngDelta;

      const nextLoc = { lat: nextLat, lng: nextLng };

      // Compute geofencing crossings
      const { nextFenceId, logsToCreate, alertsToCreate } = checkGeofencesForLocation(
        nextLoc,
        emp.currentGeofenceId,
        emp.id,
        emp.name
      );

      // Create logs & alerts
      if (logsToCreate.length > 0) {
        setLogs(prev => [...prev, ...logsToCreate]);
      } else {
        // Log basic coordinate update to activity logs so it reflects immediately
        const updateLog: ActivityLog = {
          id: `log_${Date.now()}_move`,
          employeeId: emp.id,
          employeeName: emp.name,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          type: 'location_update',
          message: `Manually stepped coordinates to Lat: ${nextLat.toFixed(5)}, Lng: ${nextLng.toFixed(5)}`,
          location: nextLoc,
        };
        setLogs(prev => [...prev, updateLog]);
      }

      if (alertsToCreate.length > 0) {
        setAlerts(prev => [alertsToCreate[0], ...prev]);
      }

      return {
        ...emp,
        currentLocation: nextLoc,
        currentGeofenceId: nextFenceId,
        status: nextFenceId ? 'In Geofence' : 'Traveling',
        lastUpdated: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
    }));
  };

  // Handle shift check-in and check-out on phone
  const handleCheckInOut = (id: string, checkIn: boolean, selfieUrl?: string) => {
    const timestamp = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    setEmployees(prev => prev.map(emp => {
      if (emp.id !== id) return emp;

      let hoursDiff = 0;
      let updatedHistory = emp.hoursWorkedHistory ? [...emp.hoursWorkedHistory] : [];

      if (!checkIn && emp.checkInTime) {
        const parseTimeToHours = (tStr: string) => {
          const parts = tStr.match(/(\d+):(\d+)\s*(AM|PM)/i);
          if (!parts) return 0;
          let hrs = parseInt(parts[1], 10);
          const mins = parseInt(parts[2], 10);
          const ampm = parts[3].toUpperCase();
          if (ampm === 'PM' && hrs < 12) hrs += 12;
          if (ampm === 'AM' && hrs === 12) hrs = 0;
          return hrs + mins / 60;
        };

        const inHrs = parseTimeToHours(emp.checkInTime);
        const outHrs = parseTimeToHours(timestamp);
        let diff = outHrs - inHrs;
        if (diff < 0) diff += 24; // Handle shift crossing midnight
        hoursDiff = Number(diff.toFixed(2));

        const currentDateStr = new Date().toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' });
        updatedHistory.push({
          date: currentDateStr,
          checkIn: emp.checkInTime,
          checkOut: timestamp,
          hours: hoursDiff
        });
      }

      const actionLog: ActivityLog = {
        id: `log_${Date.now()}_shift`,
        employeeId: emp.id,
        employeeName: emp.name,
        timestamp,
        type: checkIn ? 'check_in' : 'check_out',
        message: checkIn 
          ? `Biometric Shift Check-In approved. Identity authenticated with 99.4% matching accuracy.` 
          : `Checked out of shift duty. Calculated shift duration: ${hoursDiff} hours.`,
        location: emp.currentLocation,
        selfie: selfieUrl,
      };

      setLogs(prev => [...prev, actionLog]);

      return {
        ...emp,
        checkedIn: checkIn,
        checkInTime: checkIn ? timestamp : null,
        checkOutTime: checkIn ? null : timestamp,
        status: checkIn ? 'Traveling' : 'Off Duty',
        currentGeofenceId: checkIn ? emp.currentGeofenceId : null,
        lastSelfie: selfieUrl || emp.lastSelfie,
        hoursWorkedHistory: updatedHistory,
      };
    }));
  };

  // Create a brand new Geofence
  const handleAddGeofence = (newFence: Omit<Geofence, 'id'>) => {
    const geofenceWithId: Geofence = {
      ...newFence,
      id: `geo_custom_${Date.now()}`,
    };

    setGeofences(prev => [...prev, geofenceWithId]);
    setInteractionMode('view');
    setClickedLocation(null);

    // Add alert log of created zone
    const timestamp = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const log: ActivityLog = {
      id: `log_${Date.now()}_fence_create`,
      employeeId: 'system',
      employeeName: 'HQ System Dispatcher',
      timestamp,
      type: 'location_update',
      message: `🛡️ New Geofence Created: ${newFence.name} with a ${newFence.radius}m boundary.`,
      location: newFence.center,
    };
    setLogs(prev => [...prev, log]);
  };

  const handleAddEmployee = (newEmployee: Employee) => {
    setEmployees(prev => [...prev, newEmployee]);
    
    // Auto-select the newly added employee
    setSelectedEmployeeId(newEmployee.id);

    // Create system log for registration
    const timestamp = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const log: ActivityLog = {
      id: `log_${Date.now()}_emp_reg`,
      employeeId: newEmployee.id,
      employeeName: newEmployee.name,
      timestamp,
      type: 'location_update',
      message: `👤 New Employee Registered: ${newEmployee.name} (${newEmployee.role}) with ${newEmployee.batteryLevel}% battery. Ready for live GPS tracking.`,
      location: newEmployee.currentLocation,
    };
    setLogs(prev => [...prev, log]);
  };

  const handleResetPassword = (id: string, newPassword: string) => {
    setEmployees(prev => prev.map(emp => {
      if (emp.id !== id) return emp;
      
      const timestamp = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      const log: ActivityLog = {
        id: `log_${Date.now()}_pw_reset`,
        employeeId: emp.id,
        employeeName: emp.name,
        timestamp,
        type: 'location_update',
        message: `🔐 Passcode for ${emp.name} has been updated successfully by Admin.`,
        location: emp.currentLocation,
      };
      setLogs(l => [...l, log]);

      return {
        ...emp,
        password: newPassword,
      };
    }));
  };

  // Enable placing a new geofence centered on map click
  const handleTriggerGeofencePlacementMode = () => {
    setInteractionMode('create_geofence');
    setIsGeofenceModalOpen(true);
  };

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col font-sans" id="app-viewport">
      
      {/* Dynamic Header Navbar with statistics */}
      <header className="bg-slate-900 border-b border-slate-800 py-3.5 px-6 shrink-0 flex flex-wrap gap-4 justify-between items-center z-10 shadow-lg">
        <div className="flex items-center gap-2.5">
          <div className="bg-gradient-to-tr from-indigo-600 to-indigo-500 p-2.5 rounded-2xl shadow-lg flex items-center justify-center">
            <Compass className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="font-bold text-base text-slate-100 font-display flex items-center gap-1.5 tracking-tight">
              GeoTrack Pro
              <span className="bg-indigo-950 border border-indigo-800 text-indigo-400 font-mono text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-lg">
                Mobile Live-Tracking
              </span>
            </h1>
            <p className="text-[10px] text-slate-400 mt-0.5">Real-time Employee GPS Coordinates & Geofencing Sentinel</p>
          </div>
        </div>

        {/* Live system clock */}
        <div className="flex items-center gap-3 bg-slate-950 px-3.5 py-1.5 rounded-2xl border border-slate-800/80 font-mono text-slate-300 text-xs shadow-inner">
          <Clock className="w-3.5 h-3.5 text-indigo-400" />
          <span>{systemTime}</span>
        </div>

        {/* Perspective view selector */}
        <div className="flex bg-slate-950 p-1 rounded-2xl border border-slate-850">
          <button
            onClick={() => setViewMode('dispatcher')}
            className={`flex items-center gap-1.5 px-4.5 py-2 rounded-xl text-xs font-semibold transition-all ${
              viewMode === 'dispatcher'
                ? 'bg-indigo-600 text-white shadow shadow-indigo-950/40 font-bold'
                : 'text-slate-400 hover:text-slate-200'
            }`}
            id="toggle-view-dispatcher"
          >
            <LayoutGrid className="w-3.5 h-3.5" />
            <span>🖥️ Manager Console</span>
          </button>
          <button
            onClick={() => setViewMode('employee')}
            className={`flex items-center gap-1.5 px-4.5 py-2 rounded-xl text-xs font-semibold transition-all ${
              viewMode === 'employee'
                ? 'bg-indigo-600 text-white shadow shadow-indigo-950/40 font-bold'
                : 'text-slate-400 hover:text-slate-200'
            }`}
            id="toggle-view-employee"
          >
            <Smartphone className="w-3.5 h-3.5" />
            <span>📱 Employee App Sim</span>
          </button>
        </div>
      </header>

      {/* Main View Area */}
      <main className="flex-grow flex flex-col relative">
        {viewMode === 'dispatcher' ? (
          <DispatcherDashboard
            employees={employees}
            geofences={geofences}
            logs={logs}
            alerts={alerts}
            selectedEmployeeId={selectedEmployeeId}
            onSelectEmployee={setSelectedEmployeeId}
            onToggleSimulate={handleToggleSimulate}
            onTriggerSOS={handleTriggerSOS}
            onAddGeofenceClick={handleTriggerGeofencePlacementMode}
            onOpenApiKey={() => setIsApiKeyModalOpen(true)}
            onClearAlerts={() => setAlerts([])}
            apiKey={apiKey}
            useGoogleMaps={useGoogleMaps}
            onToggleMapMode={() => setUseGoogleMaps(prev => !prev)}
            simulationSpeed={simulationSpeed}
            onChangeSimSpeed={setSimulationSpeed}
            onManualLocClick={() => {}}
            interactionMode={interactionMode}
            setInteractionMode={setInteractionMode}
            onAddEmployeeClick={() => setIsAddEmployeeModalOpen(true)}
            onResetPassword={handleResetPassword}
            onOpenMobileApp={() => setViewMode('employee')}
          />
        ) : (
          <div className="flex-grow flex items-center justify-center py-6">
            <PhoneSimulator
              employees={employees}
              geofences={geofences}
              logs={logs}
              selectedEmployeeId={selectedEmployeeId}
              onSelectEmployee={setSelectedEmployeeId}
              onCheckInOut={handleCheckInOut}
              onManualMove={handleManualMove}
              onToggleSimulate={handleToggleSimulate}
              onTriggerSOS={handleTriggerSOS}
            />
          </div>
        )}
      </main>

      {/* --- Modals Overlay --- */}
      
      {/* Geofence Creator Modal */}
      <GeofenceModal
        isOpen={isGeofenceModalOpen}
        onClose={() => {
          setIsGeofenceModalOpen(false);
          setInteractionMode('view');
        }}
        onAddGeofence={handleAddGeofence}
        clickedLocation={clickedLocation}
      />

      {/* API Key Instructions Modal */}
      <ApiKeyModal
        apiKey={apiKey}
        onSaveKey={setApiKey}
        isOpen={isApiKeyModalOpen}
        onClose={() => setIsApiKeyModalOpen(false)}
      />

      {/* Add Employee Modal */}
      <AddEmployeeModal
        isOpen={isAddEmployeeModalOpen}
        onClose={() => setIsAddEmployeeModalOpen(false)}
        onAddEmployee={handleAddEmployee}
      />

      {/* Footer System Disclaimer */}
      <footer className="bg-slate-900 border-t border-slate-800 text-[10px] text-slate-500 px-6 py-2 flex justify-between shrink-0 select-none">
        <p>© 2026 GeoTrack Pro Ltd. All rights reserved.</p>
        <p className="font-mono">Coordinates System: WGS 84 (EPSG:4326)</p>
      </footer>

    </div>
  );
}

import React, { useState, useEffect, useRef } from 'react';
import { Employee, Geofence, ActivityLog, Location } from '../types';
import { getDistanceMeters } from '../data';
import { 
  Signal, Wifi, Battery, MapPin, Calendar, Clock, Lock, CheckCircle2, 
  Map, History, ClipboardList, ShieldAlert, ArrowUp, ArrowDown, 
  ArrowLeft, ArrowRight, Play, Pause, Power, RotateCw, Sparkles, Navigation,
  Info, Compass, Camera, Scan, UserCheck, Smile, HelpCircle, AlertCircle, AlertTriangle, ShieldCheck
} from 'lucide-react';

interface PhoneSimulatorProps {
  employees: Employee[];
  geofences: Geofence[];
  logs: ActivityLog[];
  selectedEmployeeId: string | null;
  onSelectEmployee: (id: string) => void;
  onCheckInOut: (id: string, checkIn: boolean, selfieUrl?: string) => void;
  onManualMove: (id: string, direction: 'N' | 'S' | 'E' | 'W') => void;
  onToggleSimulate: (id: string) => void;
  onTriggerSOS: (id: string) => void;
}

export default function PhoneSimulator({
  employees,
  geofences,
  logs,
  selectedEmployeeId,
  onSelectEmployee,
  onCheckInOut,
  onManualMove,
  onToggleSimulate,
  onTriggerSOS,
}: PhoneSimulatorProps) {
  const [activeScreen, setActiveScreen] = useState<'home' | 'map' | 'logs'>('home');
  const [phoneTime, setPhoneTime] = useState('09:41 AM');
  const [pushNotification, setPushNotification] = useState<{ title: string; body: string } | null>(null);

  // Biometric Face Verification state
  const [isVerifyingFace, setIsVerifyingFace] = useState(false);
  const [faceVerifyStep, setFaceVerifyStep] = useState<'camera' | 'scanning' | 'success'>('camera');
  const [capturedSelfie, setCapturedSelfie] = useState<string | null>(null);
  const [faceScannerText, setFaceScannerText] = useState('Align face inside the target...');
  const [useSimulatedScan, setUseSimulatedScan] = useState(false);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);

  // Manage video stream
  useEffect(() => {
    let activeStream: MediaStream | null = null;
    if (isVerifyingFace && faceVerifyStep === 'camera' && !useSimulatedScan) {
      navigator.mediaDevices.getUserMedia({ video: { width: 320, height: 320, facingMode: 'user' } })
        .then(s => {
          activeStream = s;
          setStream(s);
          if (videoRef.current) {
            videoRef.current.srcObject = s;
          }
        })
        .catch(err => {
          console.warn('Camera failed to start, falling back to simulated scan:', err);
          setUseSimulatedScan(true);
        });
    }

    return () => {
      if (activeStream) {
        activeStream.getTracks().forEach(track => track.stop());
      }
    };
  }, [isVerifyingFace, faceVerifyStep, useSimulatedScan]);

  // Keep phone clock updated
  useEffect(() => {
    const updateClock = () => {
      const now = new Date();
      let hours = now.getHours();
      const minutes = now.getMinutes().toString().padStart(2, '0');
      const ampm = hours >= 12 ? 'PM' : 'AM';
      hours = hours % 12;
      hours = hours ? hours : 12; // the hour '0' should be '12'
      setPhoneTime(`${hours.toString().padStart(2, '0')}:${minutes} ${ampm}`);
    };
    updateClock();
    const interval = setInterval(updateClock, 30000);
    return () => clearInterval(interval);
  }, []);

  // Sync selected employee or default to first
  const activeEmpId = selectedEmployeeId || (employees.length > 0 ? employees[0].id : null);
  const employee = employees.find(e => e.id === activeEmpId);

  // Trigger push notification inside the simulated phone when a geofence crossing or check-in occurs
  useEffect(() => {
    if (!employee) return;
    
    // Find last log for this employee to see if we should trigger a simulated alert on screen
    const empLogs = logs.filter(l => l.employeeId === employee.id);
    if (empLogs.length > 0) {
      const latest = empLogs[empLogs.length - 1];
      // Only notify if it's recent (simulated push effect)
      if (latest.type === 'geofence_enter' || latest.type === 'geofence_exit' || latest.type === 'critical') {
        const isCritical = latest.type === 'critical';
        setPushNotification({
          title: isCritical ? '🚨 CRITICAL DISPATCH' : '📍 GeoTrack Pro Boundary Crossed',
          body: latest.message,
        });

        const timer = setTimeout(() => {
          setPushNotification(null);
        }, 5000);
        return () => clearTimeout(timer);
      }
    }
  }, [employee?.currentGeofenceId, employee?.checkedIn, logs.length]);

  if (!employee) {
    return (
      <div className="flex items-center justify-center h-96 text-slate-400 text-sm">
        No active employees to simulate.
      </div>
    );
  }

  // Filter logs for this specific employee only
  const myLogs = logs.filter(l => l.employeeId === employee.id).reverse();

  // Handle checking in and out on the phone
  const handleCheckInOutToggle = () => {
    if (!employee.checkedIn) {
      const needsFaceVerify = employee.permissions?.markAttendanceWithGeofenceFace !== false;
      if (needsFaceVerify) {
        setIsVerifyingFace(true);
        setFaceVerifyStep('camera');
        setCapturedSelfie(null);
        setUseSimulatedScan(false);
        setFaceScannerText('Align face inside the target...');
      } else {
        // Direct, instant check-in without biometrics
        onCheckInOut(employee.id, true);
      }
    } else {
      // Check out instantly
      onCheckInOut(employee.id, false);
    }
  };

  // Capture face frame and run biometric scanner simulation
  const handleCaptureFace = () => {
    let base64Photo = '';
    
    if (!useSimulatedScan && videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      canvas.width = 150;
      canvas.height = 150;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        try {
          // Draw square crop
          const size = Math.min(video.videoWidth, video.videoHeight);
          const sx = (video.videoWidth - size) / 2;
          const sy = (video.videoHeight - size) / 2;
          ctx.drawImage(video, sx, sy, size, size, 0, 0, 150, 150);
          base64Photo = canvas.toDataURL('image/jpeg', 0.85);
        } catch (e) {
          console.error('Failed to capture canvas frame, using avatar fallback:', e);
          base64Photo = employee.avatar;
        }
      }
    } else {
      // Fallback: simulated photo styled as blueprint
      base64Photo = employee.avatar;
    }

    setCapturedSelfie(base64Photo);
    setFaceVerifyStep('scanning');
    setFaceScannerText('Reading 128-point facial landmarks...');

    setTimeout(() => {
      setFaceScannerText('Analyzing biometrics & liveness...');
    }, 600);

    setTimeout(() => {
      setFaceScannerText('Matching database hash template...');
    }, 1200);

    setTimeout(() => {
      setFaceScannerText(`✓ Identity Verified: ${employee.name}`);
      setFaceVerifyStep('success');
    }, 1800);

    setTimeout(() => {
      onCheckInOut(employee.id, true, base64Photo);
      setIsVerifyingFace(false);
    }, 2500);
  };

  // Convert geofence coordinates to local mini-map percentages
  const getPercentageCoords = (loc: Location) => {
    // Mountain View box
    const LAT_MIN = 37.4100;
    const LAT_MAX = 37.4300;
    const LNG_MIN = -122.0900;
    const LNG_MAX = -122.0500;

    const xPct = ((loc.lng - LNG_MIN) / (LNG_MAX - LNG_MIN)) * 100;
    // Latitude decreases as Y goes down on screen
    const yPct = (1 - (loc.lat - LAT_MIN) / (LAT_MAX - LAT_MIN)) * 100;

    return { x: xPct, y: yPct };
  };

  const activeLoc = getPercentageCoords(employee.currentLocation);
  const currentFence = geofences.find(g => g.id === employee.currentGeofenceId);

  return (
    <div className="flex flex-col lg:flex-row gap-8 items-center justify-center p-4 w-full" id="phone-sim-root">
      
      {/* 1. Device Selection Panel */}
      <div className="w-full lg:w-60 shrink-0 space-y-4">
        <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl shadow-xl">
          <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3 flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
            Switch Active Phone
          </h4>
          <p className="text-[10px] text-slate-400 mb-4 leading-relaxed">
            Choose which employee's smartphone simulation is displayed in the mock device.
          </p>

          <div className="space-y-2">
            {employees.map(emp => (
              <button
                key={emp.id}
                onClick={() => onSelectEmployee(emp.id)}
                className={`w-full p-2.5 rounded-xl border flex items-center gap-2.5 transition-all text-left ${
                  employee.id === emp.id
                    ? 'bg-indigo-600/20 border-indigo-500 text-slate-100 font-semibold'
                    : 'bg-slate-950/60 border-slate-800/80 hover:bg-slate-900 text-slate-400 hover:text-slate-200'
                }`}
              >
                <img src={emp.avatar} alt="" className="w-6 h-6 rounded-full object-cover shrink-0" />
                <div className="min-w-0">
                  <p className="text-xs truncate">{emp.name}</p>
                  <p className="text-[9px] text-slate-500 truncate">{emp.role}</p>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Dynamic Simulator Instructions */}
        <div className="bg-slate-900/60 border border-slate-800 p-4 rounded-2xl shadow-lg space-y-3">
          <h5 className="text-[10px] font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1">
            <Info className="w-3.5 h-3.5 text-indigo-400" />
            Interactive Testing
          </h5>
          <ul className="text-[10px] text-slate-400 space-y-2 list-disc pl-3">
            <li>Press **North/South/East/West** keypads to manually step coordinates and test crossing circles.</li>
            <li>Press **Simulate Path** to watch automated real-time GPS travel.</li>
            <li>Toggle **Check In** to witness shifts starting or ending in logs.</li>
          </ul>
        </div>
      </div>

      {/* 2. Actual Smartphone Shell */}
      <div className="relative w-[320px] h-[640px] bg-black rounded-[48px] p-3.5 shadow-[0_25px_50px_-12px_rgba(0,0,0,0.8)] border-[6px] border-slate-800 ring-4 ring-slate-900/50 flex flex-col shrink-0 overflow-hidden">
        
        {/* Hardware Notch / Ear Speaker */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-32 h-6 bg-black rounded-b-2xl z-30 flex items-center justify-center gap-1.5">
          <div className="w-12 h-1 bg-slate-800 rounded-full" />
          <div className="w-2.5 h-2.5 bg-slate-950 rounded-full border border-slate-900" />
        </div>

        {/* Screen Content Window */}
        <div className="w-full h-full bg-slate-950 rounded-[38px] overflow-hidden relative flex flex-col pt-6 pb-2 select-none border border-slate-900">
          
          {/* Dynamic Floating Push Notification Overlay */}
          {pushNotification && (
            <div className="absolute top-2 left-3 right-3 bg-slate-900/95 backdrop-blur border border-indigo-500/60 p-3 rounded-2xl z-40 shadow-xl flex items-start gap-2.5 animate-in slide-in-from-top-4 duration-300">
              <div className="bg-indigo-950 p-1.5 rounded-lg">
                <Navigation className="w-4 h-4 text-indigo-400 animate-bounce" />
              </div>
              <div className="min-w-0 flex-grow">
                <p className="font-bold text-[10px] text-slate-100 flex items-center justify-between">
                  {pushNotification.title}
                  <span className="text-[8px] text-slate-500 font-normal">Now</span>
                </p>
                <p className="text-[9px] text-slate-300 mt-0.5 font-sans leading-tight">
                  {pushNotification.body}
                </p>
              </div>
            </div>
          )}

          {/* iOS-Style Top Status Bar */}
          <div className="px-5 py-1.5 flex justify-between items-center text-[10px] font-semibold text-slate-200 z-20 shrink-0">
            <span className="font-mono">{phoneTime}</span>
            <div className="flex items-center gap-1.5">
              <Signal className="w-3.5 h-3.5" />
              <Wifi className="w-3.5 h-3.5" />
              <span className="text-[9px] mr-0.5">{employee.batteryLevel}%</span>
              <Battery className="w-5 h-3.5 fill-current rotate-0" />
            </div>
          </div>

          {/* MAIN INTERNAL SCREEN VIEWS */}
          <div className="flex-grow overflow-hidden flex flex-col px-4 relative pt-2">
            
            {isVerifyingFace ? (
              <div className="flex flex-col h-full justify-between pb-3 text-center select-none animate-in fade-in duration-200">
                <div className="pt-1">
                  <h4 className="font-bold text-[11px] text-indigo-400 uppercase tracking-widest font-display flex items-center justify-center gap-1">
                    <Scan className="w-3.5 h-3.5 text-indigo-400 animate-pulse" />
                    Biometric Scan
                  </h4>
                  <p className="text-[8px] text-slate-400 mt-0.5">Face Match Attendance System</p>
                </div>

                {/* Aperture circular window */}
                <div className="relative w-40 h-40 mx-auto rounded-full border-[3px] border-indigo-500/30 overflow-hidden bg-slate-900 flex items-center justify-center shadow-inner shadow-indigo-950/50">
                  {faceVerifyStep === 'camera' && !useSimulatedScan ? (
                    <>
                      <video
                        ref={videoRef}
                        autoPlay
                        playsInline
                        muted
                        className="w-full h-full object-cover scale-x-[-1]"
                      />
                      <div className="absolute inset-0 border-[12px] border-slate-950/40 rounded-full pointer-events-none" />
                      <div className="absolute inset-2 border border-dashed border-indigo-400/60 rounded-full animate-spin duration-[20s] pointer-events-none" />
                      <div className="absolute inset-6 border border-indigo-500/40 rounded-full pointer-events-none" />
                    </>
                  ) : faceVerifyStep === 'camera' && useSimulatedScan ? (
                    <div className="w-full h-full relative flex flex-col items-center justify-center bg-slate-950 overflow-hidden">
                      <div className="absolute inset-0 bg-[radial-gradient(#1e1b4b_1px,transparent_1px)] bg-[size:8px_8px] opacity-40" />
                      
                      {/* High-tech vector wireframe */}
                      <svg viewBox="0 0 100 100" className="w-24 h-24 text-indigo-500/40 stroke-current stroke-1 fill-none">
                        <path d="M50,15 C62,15 70,28 70,48 C70,68 62,82 50,82 C38,82 30,68 30,48 C30,28 38,15 50,15 Z" />
                        <circle cx="42" cy="45" r="2" className="fill-indigo-400" />
                        <circle cx="58" cy="45" r="2" className="fill-indigo-400" />
                        <path d="M50,52 L50,58 L46,58" />
                        <path d="M44,66 Q50,70 56,66" />
                        <circle cx="50" r="26" cy="50" className="stroke-indigo-500/10 stroke-dasharray-[2,2]" />
                      </svg>

                      {/* Moving laser scan lines */}
                      <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-indigo-400 to-transparent shadow-[0_0_8px_#6366f1] animate-scanner" />
                      <span className="text-[7px] font-mono text-indigo-400 absolute bottom-3 bg-indigo-950/80 px-1.5 py-0.5 rounded border border-indigo-800">
                        SIM_CAMERA_ON
                      </span>
                    </div>
                  ) : (
                    <div className="w-full h-full relative flex items-center justify-center bg-slate-950">
                      <img src={capturedSelfie || employee.avatar} alt="captured" className="w-full h-full object-cover" />
                      <div className="absolute inset-0 bg-indigo-950/10" />
                      
                      {faceVerifyStep === 'scanning' ? (
                        <>
                          <div className="absolute inset-0 border-2 border-indigo-500 animate-pulse" />
                          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-emerald-400 to-transparent shadow-[0_0_8px_#34d399] animate-scanner" />
                          <div className="absolute inset-0 flex items-center justify-center">
                            <span className="bg-indigo-950/90 text-[7px] font-mono text-indigo-300 px-1.5 py-0.5 rounded border border-indigo-700 animate-bounce">
                              Biometrics...
                            </span>
                          </div>
                        </>
                      ) : (
                        <div className="absolute inset-0 bg-emerald-950/70 flex flex-col items-center justify-center animate-in zoom-in-50 duration-200">
                          <ShieldCheck className="w-8 h-8 text-emerald-400 animate-bounce" />
                          <span className="text-[9px] font-bold text-emerald-300 font-display mt-0.5">
                            ACCESS GRANTED
                          </span>
                        </div>
                      )}
                    </div>
                  )}
                  
                  <canvas ref={canvasRef} className="hidden" />
                </div>

                {/* Scanner output console */}
                <div className="bg-slate-900 border border-slate-800 rounded-xl p-2 min-h-[38px] flex items-center justify-center gap-1.5 mx-1">
                  <div className="w-1 h-1 rounded-full bg-indigo-500 animate-ping shrink-0" />
                  <p className="text-[8px] font-mono text-slate-300 leading-tight">
                    {faceScannerText}
                  </p>
                </div>

                {/* Actions inside scanner */}
                <div className="space-y-1.5 px-1 shrink-0">
                  {faceVerifyStep === 'camera' ? (
                    <>
                      <button
                        type="button"
                        onClick={handleCaptureFace}
                        className="w-full py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-[9px] font-bold flex items-center justify-center gap-1 shadow transition-all active:scale-[0.98]"
                      >
                        <Camera className="w-3.5 h-3.5" />
                        Scan & Authenticate
                      </button>
                      <div className="flex justify-between gap-1.5">
                        <button
                          type="button"
                          onClick={() => setUseSimulatedScan(p => !p)}
                          className="flex-grow py-1 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-400 hover:text-slate-200 text-[8px] font-semibold"
                        >
                          {useSimulatedScan ? '🔌 Use Live Camera' : '⚙️ Use High-Tech Sim'}
                        </button>
                        <button
                          type="button"
                          onClick={() => setIsVerifyingFace(false)}
                          className="px-3 py-1 rounded-xl bg-red-950/40 text-red-400 border border-red-900/40 hover:bg-red-950/60 text-[8px] font-semibold"
                        >
                          Cancel
                        </button>
                      </div>
                    </>
                  ) : (
                    <div className="py-2 text-[9px] text-slate-400 font-mono italic animate-pulse">
                      Logging biometric verification...
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <>
                {/* SCREEN 1: HOME DASHBOARD */}
                {activeScreen === 'home' && (
              <div className="flex-col h-full flex justify-between pb-4 space-y-4 overflow-y-auto pr-0.5">
                
                {/* Employee Card Banner */}
                <div className="space-y-3">
                  <div className="bg-gradient-to-br from-slate-900 to-indigo-950/50 p-3.5 rounded-2xl border border-slate-800 shadow-md flex items-center gap-3">
                    <img src={employee.avatar} alt="" className="w-12 h-12 rounded-full border-2 border-indigo-500 object-cover shrink-0 shadow-lg" />
                    <div className="min-w-0">
                      <p className="text-[10px] font-bold text-indigo-400 uppercase tracking-widest font-display">Field Officer</p>
                      <h4 className="font-bold text-xs text-slate-200 truncate">{employee.name}</h4>
                      <p className="text-[9px] text-slate-400 truncate mt-0.5">{employee.role}</p>
                    </div>
                  </div>

                  {/* Tracking safety indicator */}
                  <div className={`p-3 rounded-2xl border flex items-center gap-2.5 ${
                    employee.status === 'Off Duty'
                      ? 'bg-slate-900/60 border-slate-800 text-slate-400'
                      : 'bg-emerald-950/40 border-emerald-800/80 text-emerald-300'
                  }`}>
                    {employee.status === 'Off Duty' ? (
                      <>
                        <Power className="w-4 h-4 text-slate-500 shrink-0" />
                        <div className="text-[9px]">
                          <p className="font-bold">Tracking Offline</p>
                          <p className="text-[8px] text-slate-500">Check in to report location.</p>
                        </div>
                      </>
                    ) : (
                      <>
                        <div className="relative shrink-0 flex items-center justify-center">
                          <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                          <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 absolute animate-ping" />
                        </div>
                        <div className="text-[9px]">
                          <p className="font-bold">Live Tracking Active</p>
                          <p className="text-[8px] text-emerald-500/80">GPS updates streaming securely.</p>
                        </div>
                      </>
                    )}
                  </div>
                </div>

                {/* Main Interactive Check-In Button Area */}
                <div className="flex flex-col items-center justify-center py-4 space-y-4">
                  <button
                    onClick={handleCheckInOutToggle}
                    className={`w-32 h-32 rounded-full flex flex-col items-center justify-center gap-1.5 border-4 transition-all-300 shadow-xl ${
                      employee.checkedIn
                        ? 'bg-red-950/30 border-red-500/80 hover:bg-red-950/40 active:scale-95 text-red-300'
                        : 'bg-indigo-950/30 border-indigo-500/80 hover:bg-indigo-950/40 active:scale-95 text-indigo-300'
                    }`}
                  >
                    <Power className={`w-8 h-8 ${employee.checkedIn ? 'text-red-400' : 'text-indigo-400'}`} />
                    <span className="font-bold text-[11px] uppercase tracking-wider font-display">
                      {employee.checkedIn ? 'Check Out' : 'Check In'}
                    </span>
                    <span className="text-[8px] opacity-70">
                      {employee.checkedIn ? 'End Shift' : 'Start Shift'}
                    </span>
                  </button>

                  <div className="text-center font-mono text-[9px] text-slate-500">
                    {employee.checkedIn ? (
                      <p className="text-emerald-400 font-semibold">On Shift since {employee.checkInTime}</p>
                    ) : (
                      <p>Last checked out at {employee.checkOutTime || '5:00 PM'}</p>
                    )}
                  </div>
                </div>

                {/* Mini Status Grid */}
                <div className="grid grid-cols-2 gap-2 pb-2">
                  <div className="bg-slate-900/60 p-2.5 rounded-xl border border-slate-800 text-center">
                    <p className="text-[8px] text-slate-500 font-bold uppercase tracking-wide">Current Zone</p>
                    <p className="text-[10px] font-semibold text-slate-200 mt-1 truncate">
                      {currentFence ? currentFence.name.split(' ')[0] : 'None (Transit)'}
                    </p>
                  </div>
                  <div className="bg-slate-900/60 p-2.5 rounded-xl border border-slate-800 text-center">
                    <p className="text-[8px] text-slate-500 font-bold uppercase tracking-wide">Duty Mileage</p>
                    <p className="text-[10px] font-mono font-bold text-indigo-400 mt-1">
                      {employee.status === 'Off Duty' ? '0.0 km' : `${(myLogs.length * 0.15).toFixed(2)} km`}
                    </p>
                  </div>
                </div>

              </div>
            )}

            {/* SCREEN 2: MOBILE MAP RADAR */}
            {activeScreen === 'map' && (
              <div className="h-full flex flex-col space-y-3 pb-2">
                <div className="flex items-center justify-between">
                  <h4 className="font-bold text-xs text-slate-200 font-display flex items-center gap-1">
                    <MapPin className="w-3.5 h-3.5 text-indigo-400" />
                    GPS Map Radar
                  </h4>
                  <span className="bg-slate-900 border border-slate-800 text-slate-400 text-[8px] px-2 py-0.5 rounded-lg font-mono">
                    ZOOMED
                  </span>
                </div>

                {/* Smartphone Mini Vector Map Viewport */}
                <div className="flex-grow bg-slate-900 rounded-2xl border border-slate-800 relative overflow-hidden flex items-center justify-center">
                  
                  {/* Grid Lines Overlay */}
                  <div className="absolute inset-0 bg-[linear-gradient(to_right,#1e293b_1px,transparent_1px),linear-gradient(to_bottom,#1e293b_1px,transparent_1px)] bg-[size:16px_16px] opacity-20" />
                  
                  {/* Simulated Geofence Circles */}
                  {geofences.map(fence => {
                    const coords = getPercentageCoords(fence.center);
                    return (
                      <div
                        key={fence.id}
                        className="absolute rounded-full border border-dashed flex items-center justify-center"
                        style={{
                          left: `${coords.x}%`,
                          top: `${coords.y}%`,
                          width: '80px',
                          height: '80px',
                          transform: 'translate(-50%, -50%)',
                          borderColor: fence.color,
                          backgroundColor: `${fence.color}10`,
                        }}
                      >
                        <span className="text-[7px] text-slate-400 bg-slate-950/80 px-1 py-0.5 rounded border border-slate-800 whitespace-nowrap absolute top-1 shadow">
                          {fence.name.split(' ')[0]}
                        </span>
                      </div>
                    );
                  })}

                  {/* Employee Marker Pin on Local Phone Map */}
                  {employee.status !== 'Off Duty' && (
                    <div
                      className="absolute flex flex-col items-center z-10"
                      style={{
                        left: `${activeLoc.x}%`,
                        top: `${activeLoc.y}%`,
                        transform: 'translate(-50%, -50%)',
                      }}
                    >
                      <div className="w-6 h-6 rounded-full border-2 border-indigo-400 bg-indigo-950 flex items-center justify-center shadow-lg relative animate-bounce">
                        <img src={employee.avatar} alt="" className="w-4.5 h-4.5 rounded-full object-cover" />
                      </div>
                      {/* Radar pulsing ring */}
                      <div className="w-8 h-8 rounded-full border border-indigo-500 absolute -bottom-1 animate-pulse-ring opacity-40" />
                    </div>
                  )}

                  {/* Compass HUD */}
                  <div className="absolute bottom-3 right-3 bg-slate-950/80 p-1.5 rounded-full border border-slate-800">
                    <Compass className="w-4 h-4 text-emerald-400" />
                  </div>
                </div>

                {/* Coordinates HUD */}
                <div className="bg-slate-900 border border-slate-800 p-2.5 rounded-xl text-center space-y-1">
                  <p className="text-[8px] text-slate-500 font-bold uppercase tracking-wider">Reported Coordinates</p>
                  <p className="text-[9px] text-slate-300 font-mono">
                    Lat: {employee.currentLocation.lat.toFixed(6)}
                  </p>
                  <p className="text-[9px] text-slate-300 font-mono">
                    Lng: {employee.currentLocation.lng.toFixed(6)}
                  </p>
                </div>
              </div>
            )}

            {/* SCREEN 3: ACTIVITY LOGS */}
            {activeScreen === 'logs' && (
              <div className="h-full flex flex-col space-y-3 pb-2">
                <div className="flex items-center justify-between">
                  <h4 className="font-bold text-xs text-slate-200 font-display flex items-center gap-1">
                    <ClipboardList className="w-3.5 h-3.5 text-indigo-400" />
                    Shift Logbook
                  </h4>
                  <span className="text-[8px] text-slate-500 font-bold uppercase">Today</span>
                </div>

                <div className="flex-grow overflow-y-auto pr-0.5 space-y-1.5">
                  {myLogs.length === 0 ? (
                    <div className="text-center py-12 text-slate-500 text-[10px] font-mono leading-relaxed">
                      No events recorded today. Check in to log activity.
                    </div>
                  ) : (
                    myLogs.map(log => (
                      <div key={log.id} className="bg-slate-900/60 p-2.5 rounded-xl border border-slate-800/80 text-[10px] space-y-1 leading-relaxed">
                        <div className="flex justify-between items-center text-[9px]">
                          <span className="font-semibold text-slate-300">
                            {log.type === 'check_in' ? '✓ Shift Check-In' :
                             log.type === 'check_out' ? '✕ Shift Check-Out' :
                             log.type === 'geofence_enter' ? '📍 Entered Geofence' :
                             log.type === 'geofence_exit' ? '🏁 Left Geofence' :
                             log.type === 'critical' ? '🚨 SOS Triggered' : '🔧 Event Update'}
                          </span>
                          <span className="font-mono text-slate-500">{log.timestamp}</span>
                        </div>
                        <p className="text-slate-400 text-[9px] leading-tight">{log.message}</p>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}

          </>
        )}

      </div>

          {/* iOS-Style Bottom Navigation Tab Bar */}
          <div className="border-t border-slate-900 bg-slate-950 px-6 py-2 flex justify-between items-center text-[9px] font-semibold text-slate-400 shrink-0">
            <button
              onClick={() => setActiveScreen('home')}
              className={`flex flex-col items-center gap-1 ${activeScreen === 'home' ? 'text-indigo-400' : 'hover:text-slate-200'}`}
              id="phone-tab-home"
            >
              <ClipboardList className="w-4 h-4" />
              <span>Shift</span>
            </button>
            <button
              onClick={() => setActiveScreen('map')}
              className={`flex flex-col items-center gap-1 ${activeScreen === 'map' ? 'text-indigo-400' : 'hover:text-slate-200'}`}
              id="phone-tab-map"
            >
              <Map className="w-4 h-4" />
              <span>Map</span>
            </button>
            <button
              onClick={() => setActiveScreen('logs')}
              className={`flex flex-col items-center gap-1 ${activeScreen === 'logs' ? 'text-indigo-400' : 'hover:text-slate-200'}`}
              id="phone-tab-logs"
            >
              <History className="w-4 h-4" />
              <span>Logs</span>
            </button>
          </div>

          {/* iOS Home Bar Indicator */}
          <div className="w-24 h-1 bg-slate-800 rounded-full mx-auto mt-1 shrink-0" />
        </div>
      </div>

      {/* 3. Simulated Device Physical Joystick & Safety Override */}
      <div className="w-full lg:w-72 shrink-0 space-y-4">
        
        {/* Real-time GPS Manual Step Controller */}
        <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl shadow-xl space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
              <Navigation className="w-3.5 h-3.5 text-indigo-400" />
              GPS Step Controller
            </h4>
            <span className="text-[9px] bg-slate-950 text-indigo-400 border border-slate-800 px-1.5 py-0.5 rounded font-mono font-semibold">
              STEPPER
            </span>
          </div>
          <p className="text-[10px] text-slate-400 leading-relaxed">
            Directly move {employee.name}'s GPS coordinate simulation. Cross geofences to trigger immediate alarm log entries!
          </p>

          {/* D-Pad controls */}
          <div className="flex flex-col items-center justify-center py-2">
            <div className="grid grid-cols-3 gap-2 w-36 h-36">
              <div />
              <button
                onClick={() => onManualMove(employee.id, 'N')}
                disabled={employee.status === 'Off Duty'}
                className="bg-slate-950 hover:bg-slate-800 text-indigo-400 border border-slate-800/80 rounded-xl flex items-center justify-center active:bg-indigo-950 hover:text-white hover:border-indigo-500 disabled:opacity-40 transition-colors"
                title="Move North"
                id="btn-move-n"
              >
                <ArrowUp className="w-5 h-5" />
              </button>
              <div />

              <button
                onClick={() => onManualMove(employee.id, 'W')}
                disabled={employee.status === 'Off Duty'}
                className="bg-slate-950 hover:bg-slate-800 text-indigo-400 border border-slate-800/80 rounded-xl flex items-center justify-center active:bg-indigo-950 hover:text-white hover:border-indigo-500 disabled:opacity-40 transition-colors"
                title="Move West"
                id="btn-move-w"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
              <div className="bg-slate-900 border border-slate-800/40 rounded-xl flex items-center justify-center text-[10px] font-bold text-slate-500 font-mono">
                GPS
              </div>
              <button
                onClick={() => onManualMove(employee.id, 'E')}
                disabled={employee.status === 'Off Duty'}
                className="bg-slate-950 hover:bg-slate-800 text-indigo-400 border border-slate-800/80 rounded-xl flex items-center justify-center active:bg-indigo-950 hover:text-white hover:border-indigo-500 disabled:opacity-40 transition-colors"
                title="Move East"
                id="btn-move-e"
              >
                <ArrowRight className="w-5 h-5" />
              </button>

              <div />
              <button
                onClick={() => onManualMove(employee.id, 'S')}
                disabled={employee.status === 'Off Duty'}
                className="bg-slate-950 hover:bg-slate-800 text-indigo-400 border border-slate-800/80 rounded-xl flex items-center justify-center active:bg-indigo-950 hover:text-white hover:border-indigo-500 disabled:opacity-40 transition-colors"
                title="Move South"
                id="btn-move-s"
              >
                <ArrowDown className="w-5 h-5" />
              </button>
              <div />
            </div>
          </div>

          <div className="text-[9px] text-center text-slate-500 leading-tight">
            {employee.status === 'Off Duty' ? (
              <span className="text-red-400 font-semibold">Check-in first to unlock GPS keys.</span>
            ) : (
              <span>Steps lat/lng by approx 10 meters.</span>
            )}
          </div>
        </div>

        {/* SOS Emergency Test Button */}
        {employee.status !== 'Off Duty' && (
          <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl shadow-xl space-y-3">
            <h5 className="text-[10px] font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1">
              <ShieldAlert className="w-3.5 h-3.5 text-red-500" />
              SOS Panic Simulator
            </h5>
            <p className="text-[10px] text-slate-400 leading-relaxed">
              Manually trigger an emergency panic distress signal from this employee's phone to simulate an immediate manager response.
            </p>
            <button
              onClick={() => onTriggerSOS(employee.id)}
              className="w-full bg-red-600 hover:bg-red-500 text-white font-bold text-xs py-2 px-4 rounded-xl shadow-lg shadow-red-950/20 active:scale-95 transition-all flex items-center justify-center gap-1.5"
              id="btn-phone-sos"
            >
              <ShieldAlert className="w-4 h-4" /> Trigger Urgent SOS
            </button>
          </div>
        )}
      </div>

    </div>
  );
}

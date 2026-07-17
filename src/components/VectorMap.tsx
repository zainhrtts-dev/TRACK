import React, { useState } from 'react';
import { Employee, Geofence, Location } from '../types';
import { getDistanceMeters } from '../data';
import { Compass, ZoomIn, ZoomOut, RotateCcw, MapPin, Eye } from 'lucide-react';

interface VectorMapProps {
  employees: Employee[];
  geofences: Geofence[];
  selectedEmployeeId: string | null;
  onSelectEmployee: (id: string) => void;
  onMapClick?: (loc: Location) => void;
  interactionMode: 'view' | 'place_employee' | 'create_geofence';
}

// Bounding box for Mountain View simulation area
const LAT_MIN = 37.4100;
const LAT_MAX = 37.4300;
const LNG_MIN = -122.0900;
const LNG_MAX = -122.0500;

export function gpsToXY(lat: number, lng: number, width: number = 800, height: number = 600) {
  const x = ((lng - LNG_MIN) / (LNG_MAX - LNG_MIN)) * width;
  // Y goes down in SVG, Latitude goes up
  const y = (1 - (lat - LAT_MIN) / (LAT_MAX - LAT_MIN)) * height;
  return { x, y };
}

export function xyToGps(x: number, y: number, width: number = 800, height: number = 600): Location {
  const lng = LNG_MIN + (x / width) * (LNG_MAX - LNG_MIN);
  const lat = LAT_MIN + (1 - y / height) * (LAT_MAX - LAT_MIN);
  return { lat, lng };
}

// Map 1 meter to SVG pixels (lat scale: 600px = 0.02 degrees lat. 1 degree = 111,120 meters)
export function metersToPixels(meters: number): number {
  const degSpan = LAT_MAX - LAT_MIN; // 0.02
  const pxPerDeg = 600 / degSpan; // 30,000 px/deg
  const metersPerDeg = 111120;
  return meters * (pxPerDeg / metersPerDeg); // meters * 0.27
}

export default function VectorMap({
  employees,
  geofences,
  selectedEmployeeId,
  onSelectEmployee,
  onMapClick,
  interactionMode,
}: VectorMapProps) {
  const [zoom, setZoom] = useState<number>(1);
  const [pan, setPan] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });

  const mapWidth = 800;
  const mapHeight = 600;

  const handleMouseDown = (e: React.MouseEvent<SVGSVGElement>) => {
    if (interactionMode !== 'view') return;
    setIsDragging(true);
    setDragStart({ x: e.clientX - pan.x, y: e.clientY - pan.y });
  };

  const handleMouseMove = (e: React.MouseEvent<SVGSVGElement>) => {
    if (!isDragging) return;
    setPan({
      x: e.clientX - dragStart.x,
      y: e.clientY - dragStart.y,
    });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleSvgClick = (e: React.MouseEvent<SVGSVGElement>) => {
    if (isDragging && Math.abs(e.clientX - dragStart.x - pan.x) > 3) return; // ignore dragging clicks
    if (interactionMode === 'view') return;

    const rect = e.currentTarget.getBoundingClientRect();
    // Get mouse coordinate relative to SVG canvas, accounting for zoom and pan
    const clickXRaw = e.clientX - rect.left;
    const clickYRaw = e.clientY - rect.top;

    // Convert screen coordinates back to SVG canvas viewBox coordinates
    const canvasX = ((clickXRaw / rect.width) * mapWidth - pan.x) / zoom;
    const canvasY = ((clickYRaw / rect.height) * mapHeight - pan.y) / zoom;

    if (canvasX >= 0 && canvasX <= mapWidth && canvasY >= 0 && canvasY <= mapHeight) {
      const gpsLocation = xyToGps(canvasX, canvasY, mapWidth, mapHeight);
      if (onMapClick) {
        onMapClick(gpsLocation);
      }
    }
  };

  const resetMap = () => {
    setZoom(1);
    setPan({ x: 0, y: 0 });
  };

  const activeEmployee = employees.find(e => e.id === selectedEmployeeId);

  // Focus map on the selected employee
  const handleFocusEmployee = (emp: Employee) => {
    onSelectEmployee(emp.id);
    const { x, y } = gpsToXY(emp.currentLocation.lat, emp.currentLocation.lng, mapWidth, mapHeight);
    setZoom(1.8);
    setPan({
      x: mapWidth / 2 - x * 1.8,
      y: mapHeight / 2 - y * 1.8,
    });
  };

  return (
    <div className="relative w-full h-full bg-[#0F172A] rounded-2xl overflow-hidden border border-slate-800 shadow-2xl flex flex-col" id="vector-map-root">
      {/* Map Control Bar */}
      <div className="absolute top-4 left-4 z-10 flex flex-wrap gap-2 pointer-events-auto">
        <div className="bg-slate-900/95 backdrop-blur-md px-3 py-1.5 rounded-xl border border-slate-800 flex items-center gap-1 shadow-lg">
          <Compass className="w-4 h-4 text-emerald-400 animate-spin-slow" />
          <span className="text-xs font-semibold text-slate-200">Interactive Map Radar</span>
        </div>

        {interactionMode === 'place_employee' && (
          <div className="bg-blue-900/90 backdrop-blur-md px-3 py-1.5 rounded-xl border border-blue-700 flex items-center gap-2 shadow-lg animate-pulse">
            <MapPin className="w-4 h-4 text-blue-400" />
            <span className="text-xs font-semibold text-blue-100">Click on Map to Move Employee</span>
          </div>
        )}

        {interactionMode === 'create_geofence' && (
          <div className="bg-amber-900/90 backdrop-blur-md px-3 py-1.5 rounded-xl border border-amber-700 flex items-center gap-2 shadow-lg animate-pulse">
            <div className="w-3 h-3 rounded-full border-2 border-amber-400" />
            <span className="text-xs font-semibold text-amber-100">Click to Center New Geofence</span>
          </div>
        )}
      </div>

      <div className="absolute top-4 right-4 z-10 flex flex-col gap-2 pointer-events-auto">
        <button
          onClick={() => setZoom(prev => Math.min(prev + 0.25, 4))}
          className="p-2 bg-slate-900/95 hover:bg-slate-800 text-slate-200 rounded-xl border border-slate-800 shadow-lg transition-colors"
          title="Zoom In"
          id="btn-zoom-in"
        >
          <ZoomIn className="w-4 h-4" />
        </button>
        <button
          onClick={() => setZoom(prev => Math.max(prev - 0.25, 0.75))}
          className="p-2 bg-slate-900/95 hover:bg-slate-800 text-slate-200 rounded-xl border border-slate-800 shadow-lg transition-colors"
          title="Zoom Out"
          id="btn-zoom-out"
        >
          <ZoomOut className="w-4 h-4" />
        </button>
        <button
          onClick={resetMap}
          className="p-2 bg-slate-900/95 hover:bg-slate-800 text-slate-200 rounded-xl border border-slate-800 shadow-lg transition-colors"
          title="Reset Map View"
          id="btn-reset-map"
        >
          <RotateCcw className="w-4 h-4" />
        </button>
      </div>

      {/* Actual Vector Canvas */}
      <div className="w-full flex-grow relative overflow-hidden cursor-crosshair">
        <svg
          viewBox={`0 0 ${mapWidth} ${mapHeight}`}
          className="w-full h-full select-none"
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
          onClick={handleSvgClick}
          id="simulation-svg"
        >
          {/* Transforming Group for Zoom & Pan */}
          <g transform={`translate(${pan.x}, ${pan.y}) scale(${zoom})`}>
            {/* Background Canvas Land */}
            <rect width={mapWidth} height={mapHeight} fill="#0F172A" />

            {/* Parks and Fields */}
            {/* Charleston Park Area */}
            <path
              d="M 50,220 C 120,200 180,240 230,280 L 190,400 C 130,360 80,380 40,320 Z"
              fill="#065F46"
              fillOpacity="0.25"
              stroke="#047857"
              strokeWidth="1"
              strokeDasharray="4 4"
            />
            {/* Googleplex Courtyard */}
            <polygon
              points="140,110 240,90 280,180 170,200"
              fill="#1E3A8A"
              fillOpacity="0.2"
              stroke="#3B82F6"
              strokeWidth="0.5"
            />
            {/* Museum Lawn */}
            <rect
              x="500"
              y="400"
              width="150"
              height="100"
              rx="15"
              fill="#78350F"
              fillOpacity="0.15"
              stroke="#B45309"
              strokeWidth="0.5"
              strokeDasharray="2 2"
            />
            {/* Shoreline Bay Water Area (Top portion) */}
            <path
              d="M 0,0 L 800,0 L 800,80 C 700,90 550,60 400,90 C 250,120 120,70 0,95 Z"
              fill="#1E3A8A"
              fillOpacity="0.4"
              stroke="#2563EB"
              strokeWidth="1.5"
            />

            {/* Simulated Road Grids */}
            {/* Highway 101 */}
            <path
              d="M 0,350 Q 400,280 800,230"
              fill="none"
              stroke="#334155"
              strokeWidth="16"
              strokeLinecap="round"
            />
            <path
              d="M 0,350 Q 400,280 800,230"
              fill="none"
              stroke="#F1F5F9"
              strokeWidth="1.5"
              strokeDasharray="10 8"
              strokeLinecap="round"
              strokeOpacity="0.7"
            />

            {/* Shoreline Blvd (Main Road Connecting Top to Bottom) */}
            <path
              d="M 280,75 L 310,230 L 330,330 L 450,600"
              fill="none"
              stroke="#1E293B"
              strokeWidth="8"
              strokeLinecap="round"
            />
            <path
              d="M 280,75 L 310,230 L 330,330 L 450,600"
              fill="none"
              stroke="#64748B"
              strokeWidth="1"
              strokeDasharray="4 4"
            />

            {/* Charleston Rd (Horizontal Connector) */}
            <path
              d="M 0,250 L 310,230 L 550,210 L 800,200"
              fill="none"
              stroke="#1E293B"
              strokeWidth="6"
            />

            {/* Middlefield Rd (Bottom Connector) */}
            <path
              d="M 0,520 L 415,500 L 800,480"
              fill="none"
              stroke="#1E293B"
              strokeWidth="6"
            />

            {/* Minor streets */}
            <line x1="160" y1="200" x2="160" y2="450" stroke="#1E293B" strokeWidth="4" />
            <line x1="520" y1="210" x2="520" y2="480" stroke="#1E293B" strokeWidth="4" />
            <line x1="520" y1="440" x2="800" y2="440" stroke="#1E293B" strokeWidth="3" />
            <line x1="0" y1="120" x2="280" y2="120" stroke="#1E293B" strokeWidth="3" />

            {/* Simulated Buildings / Clusters */}
            <g opacity="0.6">
              {/* Googleplex Block */}
              <rect x="180" y="110" width="40" height="25" fill="#334155" rx="2" />
              <rect x="230" y="125" width="30" height="40" fill="#334155" rx="2" />
              {/* Museum Area */}
              <polygon points="520,410 570,410 550,450 510,430" fill="#334155" />
              {/* Shopping Area */}
              <rect x="350" y="480" width="50" height="20" fill="#334155" rx="2" />
              <rect x="350" y="510" width="50" height="15" fill="#334155" rx="2" />
            </g>

            {/* Draw Geofences Circles */}
            {geofences.map(fence => {
              const { x, y } = gpsToXY(fence.center.lat, fence.center.lng, mapWidth, mapHeight);
              const pxRadius = metersToPixels(fence.radius);

              return (
                <g key={fence.id}>
                  {/* Outer glowing pulsing ring */}
                  <circle
                    cx={x}
                    cy={y}
                    r={pxRadius}
                    fill="none"
                    stroke={fence.color}
                    strokeWidth="1"
                    strokeOpacity="0.4"
                    className="origin-center"
                    style={{
                      transformOrigin: `${x}px ${y}px`,
                      animation: `pulse-ring 3s cubic-bezier(0.215, 0.61, 0.355, 1) infinite`,
                    }}
                  />
                  {/* Static boundary */}
                  <circle
                    cx={x}
                    cy={y}
                    r={pxRadius}
                    fill={fence.color}
                    fillOpacity="0.08"
                    stroke={fence.color}
                    strokeWidth="2"
                    strokeDasharray="6 4"
                    id={`svg-geofence-${fence.id}`}
                  />
                  {/* Central flag marker / text */}
                  <circle cx={x} cy={y} r="3" fill={fence.color} />
                  <text
                    x={x}
                    y={y - pxRadius - 6}
                    fill="#F1F5F9"
                    fontSize="9"
                    fontWeight="600"
                    textAnchor="middle"
                    className="bg-slate-900 px-1 py-0.5 rounded shadow"
                    style={{ textShadow: '0px 1px 3px rgba(0,0,0,0.9)' }}
                  >
                    {fence.name} ({fence.radius}m)
                  </text>
                </g>
              );
            })}

            {/* Selected Employee's Simulating Path Line */}
            {activeEmployee && activeEmployee.isSimulating && activeEmployee.simulatedPath.length > 0 && (
              <polyline
                points={activeEmployee.simulatedPath
                  .map(p => {
                    const { x, y } = gpsToXY(p.lat, p.lng, mapWidth, mapHeight);
                    return `${x},${y}`;
                  })
                  .join(' ')}
                fill="none"
                stroke="#6366F1"
                strokeWidth="2"
                strokeDasharray="4 4"
                opacity="0.7"
              />
            )}

            {/* Draw Employees Markers */}
            {employees.map(emp => {
              if (emp.status === 'Off Duty') return null;

              const { x, y } = gpsToXY(emp.currentLocation.lat, emp.currentLocation.lng, mapWidth, mapHeight);
              const isSelected = emp.id === selectedEmployeeId;

              // Color based on status
              const statusColor =
                emp.currentGeofenceId ? '#10B981' : // In Geofence -> Green
                emp.status === 'Traveling' ? '#6366F1' : // Traveling -> Purple/Indigo
                '#64748B'; // Gray

              return (
                <g
                  key={emp.id}
                  className="cursor-pointer transition-all duration-300"
                  onClick={(e) => {
                    e.stopPropagation();
                    onSelectEmployee(emp.id);
                  }}
                  id={`svg-employee-${emp.id}`}
                >
                  {/* Selector Ring */}
                  {isSelected && (
                    <circle
                      cx={x}
                      cy={y}
                      r="18"
                      fill="none"
                      stroke="#818CF8"
                      strokeWidth="2"
                      strokeDasharray="3 2"
                      className="origin-center animate-spin"
                      style={{ transformOrigin: `${x}px ${y}px`, animationDuration: '8s' }}
                    />
                  )}

                  {/* Pulsing state ring */}
                  <circle
                    cx={x}
                    cy={y}
                    r="12"
                    fill="none"
                    stroke={statusColor}
                    strokeWidth="1.5"
                    strokeOpacity="0.6"
                    className="origin-center"
                    style={{
                      transformOrigin: `${x}px ${y}px`,
                      animation: `pulse-ring 2s cubic-bezier(0.25, 0, 0, 1) infinite`,
                    }}
                  />

                  {/* Pin Background shape */}
                  <path
                    d={`M ${x} ${y} 
                       C ${x - 10} ${y - 12} ${x - 12} ${y - 24} ${x} ${y - 32} 
                       C ${x + 12} ${y - 24} ${x + 10} ${y - 12} ${x} ${y} Z`}
                    fill={statusColor}
                    stroke="#F8FAFC"
                    strokeWidth="1"
                  />

                  {/* Avatar image clipped in circular mask inside pin */}
                  <g transform={`translate(${x - 8}, ${y - 28})`}>
                    <defs>
                      <clipPath id={`avatar-clip-${emp.id}`}>
                        <circle cx="8" cy="8" r="7.5" />
                      </clipPath>
                    </defs>
                    {/* Circle back */}
                    <circle cx="8" cy="8" r="8" fill="#F8FAFC" />
                    {/* Image */}
                    <image
                      href={emp.avatar}
                      width="16"
                      height="16"
                      clipPath={`url(#avatar-clip-${emp.id})`}
                    />
                  </g>

                  {/* Small Name Card */}
                  <g transform={`translate(${x}, ${y - 38})`}>
                    <rect
                      x="-45"
                      y="-12"
                      width="90"
                      height="14"
                      rx="3"
                      fill="#0F172A"
                      fillOpacity="0.9"
                      stroke={isSelected ? '#818CF8' : '#334155'}
                      strokeWidth="0.75"
                    />
                    <text
                      x="0"
                      y="-2"
                      fill="#F8FAFC"
                      fontSize="7"
                      fontWeight="600"
                      textAnchor="middle"
                    >
                      {emp.name.split(' ')[0]}
                    </text>
                  </g>
                </g>
              );
            })}
          </g>
        </svg>
      </div>

      {/* Map Legend / Selected Card Overlay */}
      <div className="bg-slate-900 border-t border-slate-800 p-3 flex flex-wrap items-center justify-between gap-4 text-xs">
        <div className="flex gap-4 items-center flex-wrap">
          <div className="flex items-center gap-1.5 text-slate-300">
            <span className="w-2.5 h-2.5 rounded-full bg-[#10B981] inline-block"></span>
            <span>Inside Geofence</span>
          </div>
          <div className="flex items-center gap-1.5 text-slate-300">
            <span className="w-2.5 h-2.5 rounded-full bg-[#6366F1] inline-block"></span>
            <span>Traveling/On-Move</span>
          </div>
          <div className="flex items-center gap-1.5 text-slate-300">
            <span className="w-2.5 h-2.5 rounded-full bg-slate-500 inline-block"></span>
            <span>Off Duty</span>
          </div>
        </div>

        {activeEmployee && activeEmployee.status !== 'Off Duty' && (
          <div className="flex items-center gap-3 bg-slate-950 px-3 py-1.5 rounded-xl border border-slate-800 shadow-inner">
            <img src={activeEmployee.avatar} alt="" className="w-6 h-6 rounded-full border border-indigo-400" />
            <div>
              <p className="font-semibold text-slate-100">{activeEmployee.name}</p>
              <p className="text-[10px] text-slate-400 font-mono">
                Lat: {activeEmployee.currentLocation.lat.toFixed(5)}, Lng: {activeEmployee.currentLocation.lng.toFixed(5)}
              </p>
            </div>
            <button
              onClick={() => handleFocusEmployee(activeEmployee)}
              className="flex items-center gap-1 bg-indigo-600 hover:bg-indigo-500 text-white font-medium px-2 py-0.5 rounded text-[10px] transition-colors"
            >
              <Eye className="w-3 h-3" />
              Focus
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

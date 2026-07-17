import React, { useEffect, useRef } from 'react';
import { APIProvider, Map, AdvancedMarker, Pin, useMap } from '@vis.gl/react-google-maps';
import { Employee, Geofence, Location } from '../types';

interface GoogleMapsTrackProps {
  apiKey: string;
  employees: Employee[];
  geofences: Geofence[];
  selectedEmployeeId: string | null;
  onSelectEmployee: (id: string) => void;
  onMapClick?: (loc: Location) => void;
  interactionMode: 'view' | 'place_employee' | 'create_geofence';
}

// Custom Circle component for google maps using native Google Maps API
function GoogleMapsCircle({
  center,
  radius,
  color,
}: {
  center: Location;
  radius: number;
  color: string;
}) {
  const map = useMap();
  const circleRef = useRef<google.maps.Circle | null>(null);

  useEffect(() => {
    if (!map) return;

    // Create a new Circle instance
    const circle = new google.maps.Circle({
      map,
      center,
      radius,
      strokeColor: color,
      strokeOpacity: 0.8,
      strokeWeight: 2,
      fillColor: color,
      fillOpacity: 0.12,
    });

    circleRef.current = circle;

    // Clean up when unmounting
    return () => {
      if (circleRef.current) {
        circleRef.current.setMap(null);
      }
    };
  }, [map, center, radius, color]);

  return null;
}

export default function GoogleMapsTrack({
  apiKey,
  employees,
  geofences,
  selectedEmployeeId,
  onSelectEmployee,
  onMapClick,
  interactionMode,
}: GoogleMapsTrackProps) {
  const map = useMap();
  const activeEmployee = employees.find(e => e.id === selectedEmployeeId);

  // Pan the Google Map to the selected employee's position
  useEffect(() => {
    if (map && activeEmployee && activeEmployee.status !== 'Off Duty') {
      map.panTo(activeEmployee.currentLocation);
      map.setZoom(16);
    }
  }, [map, activeEmployee]);

  const handleMapClick = (e: google.maps.MapMouseEvent) => {
    if (interactionMode === 'view' || !onMapClick || !e.latLng) return;
    const loc: Location = {
      lat: e.latLng.lat(),
      lng: e.latLng.lng(),
    };
    onMapClick(loc);
  };

  return (
    <APIProvider apiKey={apiKey} version="weekly" id="gmp-provider">
      <div className="relative w-full h-full rounded-2xl overflow-hidden border border-slate-800 shadow-2xl" id="google-maps-container">
        <Map
          defaultCenter={{ lat: 37.4220, lng: -122.0841 }}
          defaultZoom={14}
          mapId="DEMO_MAP_ID"
          onClick={handleMapClick}
          internalUsageAttributionIds={['gmp_mcp_codeassist_v1_aistudio']}
          style={{ width: '100%', height: '100%' }}
          gestureHandling="greedy"
          disableDefaultUI={false}
        >
          {/* Render Geofences on Google Maps */}
          {geofences.map(fence => (
            <React.Fragment key={fence.id}>
              <GoogleMapsCircle
                center={fence.center}
                radius={fence.radius}
                color={fence.color}
              />
              <AdvancedMarker position={fence.center}>
                <div className="bg-slate-900/90 text-white text-[10px] px-2 py-0.5 rounded border border-slate-700 whitespace-nowrap -translate-y-12 shadow-lg">
                  <span className="font-semibold" style={{ color: fence.color }}>● </span>
                  {fence.name}
                </div>
              </AdvancedMarker>
            </React.Fragment>
          ))}

          {/* Render Employee Markers on Google Maps */}
          {employees.map(emp => {
            if (emp.status === 'Off Duty') return null;

            const isSelected = emp.id === selectedEmployeeId;
            const statusColor =
              emp.currentGeofenceId ? '#10B981' : // Green inside geofence
              emp.status === 'Traveling' ? '#6366F1' : // Indigo traveling
              '#64748B'; // Gray otherwise

            return (
              <AdvancedMarker
                key={emp.id}
                position={emp.currentLocation}
                onClick={() => onSelectEmployee(emp.id)}
              >
                <div className="flex flex-col items-center select-none cursor-pointer">
                  {/* Name Label */}
                  <div className={`text-[9px] px-2 py-0.5 rounded shadow-md font-semibold text-white whitespace-nowrap transition-all mb-1 ${
                    isSelected ? 'bg-indigo-600 border-indigo-400' : 'bg-slate-900 border-slate-800'
                  } border`}>
                    {emp.name.split(' ')[0]}
                  </div>

                  {/* Marker Circle with Avatar Inside */}
                  <div
                    className="w-10 h-10 rounded-full border-2 bg-slate-900 flex items-center justify-center shadow-lg relative transition-transform duration-300 hover:scale-110"
                    style={{ borderColor: statusColor }}
                  >
                    {/* Pulsing ring inside when selected */}
                    {isSelected && (
                      <div className="absolute inset-0 rounded-full border-2 border-indigo-400 animate-ping opacity-60" />
                    )}

                    {/* Avatar Image */}
                    <img
                      src={emp.avatar}
                      alt=""
                      className="w-8 h-8 rounded-full object-cover"
                      referrerPolicy="no-referrer"
                    />

                    {/* Tiny Status Dot */}
                    <div
                      className="w-2.5 h-2.5 rounded-full absolute -bottom-0.5 -right-0.5 border border-slate-900 shadow-sm"
                      style={{ backgroundColor: statusColor }}
                    />
                  </div>
                </div>
              </AdvancedMarker>
            );
          })}
        </Map>

        {/* Floating Controls Notice */}
        <div className="absolute top-4 left-4 z-10 bg-slate-950/90 backdrop-blur px-3 py-1.5 rounded-xl border border-slate-800 shadow-md text-slate-300 text-xs flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          <span className="font-medium text-slate-200">Google Maps Active</span>
        </div>
      </div>
    </APIProvider>
  );
}

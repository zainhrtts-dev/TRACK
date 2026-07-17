export interface Location {
  lat: number;
  lng: number;
}

export interface Employee {
  id: string;
  name: string;
  role: string;
  avatar: string;
  status: 'On Duty' | 'Off Duty' | 'In Geofence' | 'Traveling';
  currentLocation: Location;
  lastUpdated: string;
  batteryLevel: number;
  batteryHistory?: { timestamp: string; batteryLevel: number }[];
  isSimulating: boolean;
  simulatedPath: Location[];
  currentPathIndex: number;
  speed: number; // km/h
  checkedIn: boolean;
  checkInTime: string | null;
  checkOutTime: string | null;
  currentGeofenceId: string | null;
  lastSelfie?: string;
  nic?: string;
  areaAssigned?: string;
  employeeCode?: string;
  email?: string;
  password?: string;
  permissions?: {
    markAttendanceWithGeofenceFace: boolean;
  };
  hoursWorkedHistory?: { date: string; checkIn: string; checkOut: string | null; hours: number }[];
}

export interface Geofence {
  id: string;
  name: string;
  center: Location;
  radius: number; // in meters
  color: string; // HEX color code
  description: string;
}

export interface ActivityLog {
  id: string;
  employeeId: string;
  employeeName: string;
  timestamp: string;
  type: 'check_in' | 'check_out' | 'geofence_enter' | 'geofence_exit' | 'location_update' | 'critical';
  message: string;
  geofenceId?: string;
  location: Location;
  selfie?: string;
}

export interface Alert {
  id: string;
  employeeId: string;
  employeeName: string;
  timestamp: string;
  type: 'enter' | 'exit' | 'sos' | 'battery';
  message: string;
  read: boolean;
}

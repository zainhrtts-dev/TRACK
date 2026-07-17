import { Employee, Geofence, ActivityLog, Location } from './types';

// Helper function to calculate distance in meters between two points (Haversine formula)
export function getDistanceMeters(loc1: Location, loc2: Location): number {
  const R = 6371e3; // Earth radius in meters
  const phi1 = (loc1.lat * Math.PI) / 180;
  const phi2 = (loc2.lat * Math.PI) / 180;
  const deltaPhi = ((loc2.lat - loc1.lat) * Math.PI) / 180;
  const deltaLambda = ((loc2.lng - loc1.lng) * Math.PI) / 180;

  const a =
    Math.sin(deltaPhi / 2) * Math.sin(deltaPhi / 2) +
    Math.cos(phi1) * Math.cos(phi2) * Math.sin(deltaLambda / 2) * Math.sin(deltaLambda / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c;
}

export const DEFAULT_GEOFENCES: Geofence[] = [
  {
    id: 'geo_googleplex',
    name: 'Main HQ (Googleplex)',
    center: { lat: 37.4220, lng: -122.0841 },
    radius: 220, // meters
    color: '#3B82F6', // Blue
    description: 'Corporate office space and central management building.',
  },
  {
    id: 'geo_charleston_park',
    name: 'Charleston Park & Tech Area',
    center: { lat: 37.4200, lng: -122.0860 },
    radius: 180, // meters
    color: '#10B981', // Green
    description: 'Outdoor recreation and technical testing hub.',
  },
  {
    id: 'geo_museum',
    name: 'Logistics Center (Museum)',
    center: { lat: 37.4143, lng: -122.0768 },
    radius: 200, // meters
    color: '#F59E0B', // Yellow
    description: 'Logistics hub, historic museum, and training center.',
  },
  {
    id: 'geo_shoreline',
    name: 'Shoreline Event Arena',
    center: { lat: 37.4275, lng: -122.0810 },
    radius: 300, // meters
    color: '#EF4444', // Red
    description: 'Large open field for physical deployments and testing.',
  },
];

// High-fidelity paths mapping realistic movements around Mountain View
const SARAH_PATH: Location[] = [
  { lat: 37.4220, lng: -122.0841 }, // Inside Googleplex HQ
  { lat: 37.4215, lng: -122.0845 },
  { lat: 37.4208, lng: -122.0852 },
  { lat: 37.4200, lng: -122.0860 }, // Inside Charleston Park
  { lat: 37.4190, lng: -122.0840 },
  { lat: 37.4175, lng: -122.0815 },
  { lat: 37.4155, lng: -122.0785 },
  { lat: 37.4143, lng: -122.0768 }, // Inside Museum Zone
  { lat: 37.4155, lng: -122.0785 },
  { lat: 37.4175, lng: -122.0815 },
  { lat: 37.4190, lng: -122.0840 },
  { lat: 37.4208, lng: -122.0852 },
  { lat: 37.4215, lng: -122.0845 },
];

const ELENA_PATH: Location[] = [
  { lat: 37.4143, lng: -122.0768 }, // Museum Zone
  { lat: 37.4160, lng: -122.0750 },
  { lat: 37.4190, lng: -122.0720 },
  { lat: 37.4230, lng: -122.0740 },
  { lat: 37.4260, lng: -122.0780 },
  { lat: 37.4275, lng: -122.0810 }, // Inside Shoreline Event Arena
  { lat: 37.4260, lng: -122.0830 },
  { lat: 37.4240, lng: -122.0840 },
  { lat: 37.4220, lng: -122.0841 }, // Googleplex
  { lat: 37.4200, lng: -122.0860 }, // Charleston Park
  { lat: 37.4180, lng: -122.0820 },
  { lat: 37.4160, lng: -122.0790 },
];

const MARCUS_PATH: Location[] = [
  { lat: 37.4200, lng: -122.0860 }, // Charleston Park
  { lat: 37.4204, lng: -122.0855 },
  { lat: 37.4207, lng: -122.0850 },
  { lat: 37.4204, lng: -122.0855 },
  { lat: 37.4200, lng: -122.0860 },
  { lat: 37.4196, lng: -122.0865 },
  { lat: 37.4192, lng: -122.0870 },
  { lat: 37.4196, lng: -122.0865 },
];

export const DEFAULT_EMPLOYEES: Employee[] = [
  {
    id: 'emp_sarah',
    name: 'Sarah Jenkins',
    role: 'Field Systems Engineer',
    avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150',
    status: 'In Geofence',
    currentLocation: { lat: 37.4220, lng: -122.0841 },
    lastUpdated: new Date().toLocaleTimeString(),
    batteryLevel: 94,
    batteryHistory: [
      { timestamp: '08:00 AM', batteryLevel: 100 },
      { timestamp: '08:30 AM', batteryLevel: 99 },
      { timestamp: '09:00 AM', batteryLevel: 98 },
      { timestamp: '09:30 AM', batteryLevel: 96 },
      { timestamp: '10:00 AM', batteryLevel: 95 },
      { timestamp: '10:30 AM', batteryLevel: 94 }
    ],
    isSimulating: true,
    simulatedPath: SARAH_PATH,
    currentPathIndex: 0,
    speed: 5.2, // km/h (walking speed)
    checkedIn: true,
    checkInTime: '08:15 AM',
    checkOutTime: null,
    currentGeofenceId: 'geo_googleplex',
    nic: '35201-8291823-3',
    employeeCode: 'EMP-1001',
    email: 'sarah.j@geotrack.com',
    password: 'Sarah@123',
    areaAssigned: 'Sector 1 - Googleplex HQ',
    permissions: {
      markAttendanceWithGeofenceFace: true,
    },
    hoursWorkedHistory: [
      { date: 'Jul 14, 2026', checkIn: '08:00 AM', checkOut: '05:30 PM', hours: 9.5 },
      { date: 'Jul 15, 2026', checkIn: '08:15 AM', checkOut: '05:00 PM', hours: 8.75 }
    ],
  },
  {
    id: 'emp_elena',
    name: 'Elena Rodriguez',
    role: 'Logistics & Delivery Driver',
    avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150',
    status: 'In Geofence',
    currentLocation: { lat: 37.4143, lng: -122.0768 },
    lastUpdated: new Date().toLocaleTimeString(),
    batteryLevel: 81,
    batteryHistory: [
      { timestamp: '08:00 AM', batteryLevel: 92 },
      { timestamp: '08:30 AM', batteryLevel: 89 },
      { timestamp: '09:00 AM', batteryLevel: 87 },
      { timestamp: '09:30 AM', batteryLevel: 85 },
      { timestamp: '10:00 AM', batteryLevel: 82 },
      { timestamp: '10:30 AM', batteryLevel: 81 }
    ],
    isSimulating: true,
    simulatedPath: ELENA_PATH,
    currentPathIndex: 0,
    speed: 42.5, // km/h (driving speed)
    checkedIn: true,
    checkInTime: '07:45 AM',
    checkOutTime: null,
    currentGeofenceId: 'geo_museum',
    nic: '35201-9281726-4',
    employeeCode: 'EMP-1002',
    email: 'elena.r@geotrack.com',
    password: 'Elena@123',
    areaAssigned: 'Sector 2 - Logistics Route',
    permissions: {
      markAttendanceWithGeofenceFace: true,
    },
    hoursWorkedHistory: [
      { date: 'Jul 14, 2026', checkIn: '07:30 AM', checkOut: '04:00 PM', hours: 8.5 },
      { date: 'Jul 15, 2026', checkIn: '07:45 AM', checkOut: '05:15 PM', hours: 9.5 }
    ],
  },
  {
    id: 'emp_marcus',
    name: 'Marcus Chen',
    role: 'On-Site IT Technician',
    avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150', // Use a valid avatar if needed, but let's keep original
    status: 'In Geofence',
    currentLocation: { lat: 37.4200, lng: -122.0860 },
    lastUpdated: new Date().toLocaleTimeString(),
    batteryLevel: 45,
    batteryHistory: [
      { timestamp: '08:00 AM', batteryLevel: 58 },
      { timestamp: '08:30 AM', batteryLevel: 54 },
      { timestamp: '09:00 AM', batteryLevel: 51 },
      { timestamp: '09:30 AM', batteryLevel: 49 },
      { timestamp: '10:00 AM', batteryLevel: 47 },
      { timestamp: '10:30 AM', batteryLevel: 45 }
    ],
    isSimulating: false,
    simulatedPath: MARCUS_PATH,
    currentPathIndex: 0,
    speed: 0, // static
    checkedIn: true,
    checkInTime: '09:00 AM',
    checkOutTime: null,
    currentGeofenceId: 'geo_charleston_park',
    nic: '35201-3829182-1',
    employeeCode: 'EMP-1003',
    email: 'marcus.c@geotrack.com',
    password: 'Marcus@123',
    areaAssigned: 'Sector 3 - Tech Park',
    permissions: {
      markAttendanceWithGeofenceFace: false,
    },
    hoursWorkedHistory: [
      { date: 'Jul 14, 2026', checkIn: '09:00 AM', checkOut: '06:00 PM', hours: 9.0 },
      { date: 'Jul 15, 2026', checkIn: '08:55 AM', checkOut: '05:30 PM', hours: 8.58 }
    ],
  },
  {
    id: 'emp_david',
    name: 'David Kim',
    role: 'Operations Coordinator',
    avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150',
    status: 'Off Duty',
    currentLocation: { lat: 37.4120, lng: -122.0550 },
    lastUpdated: new Date().toLocaleTimeString(),
    batteryLevel: 100,
    batteryHistory: [
      { timestamp: '08:00 AM', batteryLevel: 100 },
      { timestamp: '08:30 AM', batteryLevel: 100 },
      { timestamp: '09:00 AM', batteryLevel: 100 },
      { timestamp: '09:30 AM', batteryLevel: 100 },
      { timestamp: '10:00 AM', batteryLevel: 100 },
      { timestamp: '10:30 AM', batteryLevel: 100 }
    ],
    isSimulating: false,
    simulatedPath: [],
    currentPathIndex: 0,
    speed: 0,
    checkedIn: false,
    checkInTime: null,
    checkOutTime: '05:00 PM',
    currentGeofenceId: null,
    nic: '35201-4728192-2',
    employeeCode: 'EMP-1004',
    email: 'david.k@geotrack.com',
    password: 'David@123',
    areaAssigned: 'Sector 4 - Operations Office',
    permissions: {
      markAttendanceWithGeofenceFace: true,
    },
    hoursWorkedHistory: [
      { date: 'Jul 14, 2026', checkIn: '08:00 AM', checkOut: '05:00 PM', hours: 9.0 },
      { date: 'Jul 15, 2026', checkIn: '08:00 AM', checkOut: '05:00 PM', hours: 9.0 }
    ],
  },
];

export const INITIAL_LOGS: ActivityLog[] = [
  {
    id: 'log_1',
    employeeId: 'emp_elena',
    employeeName: 'Elena Rodriguez',
    timestamp: '07:45 AM',
    type: 'check_in',
    message: 'Elena Rodriguez checked in for duty.',
    location: { lat: 37.4143, lng: -122.0768 },
  },
  {
    id: 'log_2',
    employeeId: 'emp_elena',
    employeeName: 'Elena Rodriguez',
    timestamp: '07:46 AM',
    type: 'geofence_enter',
    message: 'Entered Geofence: Logistics Center (Museum)',
    geofenceId: 'geo_museum',
    location: { lat: 37.4143, lng: -122.0768 },
  },
  {
    id: 'log_3',
    employeeId: 'emp_sarah',
    employeeName: 'Sarah Jenkins',
    timestamp: '08:15 AM',
    type: 'check_in',
    message: 'Sarah Jenkins checked in for duty.',
    location: { lat: 37.4220, lng: -122.0841 },
  },
  {
    id: 'log_4',
    employeeId: 'emp_sarah',
    employeeName: 'Sarah Jenkins',
    timestamp: '08:16 AM',
    type: 'geofence_enter',
    message: 'Entered Geofence: Main HQ (Googleplex)',
    geofenceId: 'geo_googleplex',
    location: { lat: 37.4220, lng: -122.0841 },
  },
  {
    id: 'log_5',
    employeeId: 'emp_marcus',
    employeeName: 'Marcus Chen',
    timestamp: '09:00 AM',
    type: 'check_in',
    message: 'Marcus Chen checked in for duty.',
    location: { lat: 37.4200, lng: -122.0860 },
  },
  {
    id: 'log_6',
    employeeId: 'emp_marcus',
    employeeName: 'Marcus Chen',
    timestamp: '09:01 AM',
    type: 'geofence_enter',
    message: 'Entered Geofence: Charleston Park & Tech Area',
    geofenceId: 'geo_charleston_park',
    location: { lat: 37.4200, lng: -122.0860 },
  },
];

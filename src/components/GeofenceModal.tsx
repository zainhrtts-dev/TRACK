import React, { useState } from 'react';
import { Geofence, Location } from '../types';
import { Plus, X, Globe, Eye, MapPin, Check } from 'lucide-react';

interface GeofenceModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddGeofence: (fence: Omit<Geofence, 'id'>) => void;
  clickedLocation: Location | null;
}

const COLOR_PRESETS = [
  { name: 'Blue', value: '#3B82F6', text: 'bg-blue-500' },
  { name: 'Green', value: '#10B981', text: 'bg-emerald-500' },
  { name: 'Amber', value: '#F59E0B', text: 'bg-amber-500' },
  { name: 'Red', value: '#EF4444', text: 'bg-red-500' },
  { name: 'Purple', value: '#8B5CF6', text: 'bg-purple-500' },
  { name: 'Pink', value: '#EC4899', text: 'bg-pink-500' },
];

export default function GeofenceModal({ isOpen, onClose, onAddGeofence, clickedLocation }: GeofenceModalProps) {
  const [name, setName] = useState('');
  const [radius, setRadius] = useState<number>(200);
  const [lat, setLat] = useState<string>(clickedLocation ? clickedLocation.lat.toString() : '37.4220');
  const [lng, setLng] = useState<string>(clickedLocation ? clickedLocation.lng.toString() : '-122.0841');
  const [color, setColor] = useState('#3B82F6');
  const [description, setDescription] = useState('');

  // Update fields if clickedLocation changes
  React.useEffect(() => {
    if (clickedLocation) {
      setLat(clickedLocation.lat.toFixed(6));
      setLng(clickedLocation.lng.toFixed(6));
    }
  }, [clickedLocation]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    onAddGeofence({
      name: name.trim(),
      center: {
        lat: parseFloat(lat),
        lng: parseFloat(lng),
      },
      radius: radius,
      color: color,
      description: description.trim() || 'Custom designated zone.',
    });

    // Reset Form
    setName('');
    setRadius(200);
    setDescription('');
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4" id="geofence-modal">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="bg-slate-950 px-6 py-4 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-5 h-5 rounded-full border-2 border-emerald-400 flex items-center justify-center">
              <Plus className="w-3.5 h-3.5 text-emerald-400" />
            </div>
            <h3 className="font-semibold text-slate-100 font-display">Define Geofence Zone</h3>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-200">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          
          {/* Name */}
          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-300">Zone Name</label>
            <input
              type="text"
              placeholder="e.g. West Warehouse, Client Site B"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 placeholder-slate-600 focus:outline-none focus:border-indigo-500"
              id="geo-input-name"
            />
          </div>

          {/* Coordinates Grid */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-300 flex items-center gap-1">
                <MapPin className="w-3 h-3 text-slate-400" />
                Latitude
              </label>
              <input
                type="number"
                step="0.000001"
                value={lat}
                onChange={(e) => setLat(e.target.value)}
                required
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-indigo-500 font-mono"
                id="geo-input-lat"
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-300 flex items-center gap-1">
                <MapPin className="w-3 h-3 text-slate-400" />
                Longitude
              </label>
              <input
                type="number"
                step="0.000001"
                value={lng}
                onChange={(e) => setLng(e.target.value)}
                required
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-indigo-500 font-mono"
                id="geo-input-lng"
              />
            </div>
          </div>

          {clickedLocation && (
            <p className="text-[10px] text-emerald-400 font-medium">
              ✓ Loaded coordinate from map selection.
            </p>
          )}

          {/* Radius range */}
          <div className="space-y-1">
            <div className="flex justify-between items-center text-xs">
              <label className="font-semibold text-slate-300">Geofence Radius</label>
              <span className="font-mono font-bold text-indigo-400">{radius} meters</span>
            </div>
            <input
              type="range"
              min="50"
              max="1000"
              step="25"
              value={radius}
              onChange={(e) => setRadius(parseInt(e.target.value))}
              className="w-full accent-indigo-500 bg-slate-950 h-1.5 rounded-lg appearance-none cursor-pointer border border-slate-800"
              id="geo-input-radius"
            />
            <div className="flex justify-between text-[9px] text-slate-500">
              <span>50m (Tight site)</span>
              <span>1000m (City area)</span>
            </div>
          </div>

          {/* Color theme presets */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-300">Zone Visual Color</label>
            <div className="flex gap-2">
              {COLOR_PRESETS.map((preset) => (
                <button
                  key={preset.value}
                  type="button"
                  onClick={() => setColor(preset.value)}
                  className={`w-8 h-8 rounded-full flex items-center justify-center transition-all ${preset.text} border-2 ${
                    color === preset.value ? 'border-white scale-110 shadow-lg' : 'border-transparent hover:scale-105'
                  }`}
                  title={preset.name}
                >
                  {color === preset.value && <Check className="w-4 h-4 text-white" />}
                </button>
              ))}
            </div>
          </div>

          {/* Description */}
          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-300">Zone Notes / Instructions</label>
            <textarea
              placeholder="e.g. Check-in mandatory on arrival. Report delays to dispatch."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={2}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 placeholder-slate-600 focus:outline-none focus:border-indigo-500 resize-none"
            />
          </div>

          {/* Action buttons */}
          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-medium bg-slate-950 hover:bg-slate-800 text-slate-300 rounded-xl border border-slate-800 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-xs font-semibold bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl transition-colors shadow-lg"
              id="btn-create-geofence-submit"
            >
              Create Geofence
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

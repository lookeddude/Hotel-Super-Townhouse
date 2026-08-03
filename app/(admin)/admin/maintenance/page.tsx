'use client';

import { useEffect, useState, useCallback } from 'react';
import { Wrench, CheckCircle2, Loader2, RefreshCw, AlertTriangle, BedDouble } from 'lucide-react';
import { useSupabase } from '@/providers/SupabaseProvider';
import { useAuth } from '@/providers/AuthProvider';
import { toast } from 'sonner';

const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string }> = {
  maintenance:     { label: 'In Maintenance', color: 'text-orange-700', bg: 'bg-orange-50 border-orange-200' },
  out_of_service:  { label: 'Out of Service', color: 'text-red-700',    bg: 'bg-red-50 border-red-200' },
  available:       { label: 'Fixed ✓',        color: 'text-green-700',  bg: 'bg-green-50 border-green-200' },
};

export default function MaintenancePage() {
  const { supabase } = useSupabase();
  const { profile }  = useAuth();
  const [rooms, setRooms]         = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filter, setFilter]       = useState<string>('maintenance');
  const [notes, setNotes]         = useState<Record<string, string>>({});

  const load = useCallback(async () => {
    setIsLoading(true);
    const db = supabase as any;
    let q = db.from('rooms')
      .select('id, room_number, floor, wing, status, notes, last_maintained_at, room_types(name)')
      .is('deleted_at', null)
      .order('room_number', { ascending: true });
    if (filter !== 'all') q = q.eq('status', filter);
    const { data } = await q;
    setRooms(data ?? []);
    setIsLoading(false);
  }, [supabase, filter]);

  useEffect(() => { load(); }, [load]);

  const markFixed = async (roomId: string, roomNumber: string) => {
    const db   = supabase as any;
    const note = notes[roomId] ?? '';
    const { error } = await db.from('rooms').update({
      status:             'available',
      notes:              note || null,
      last_maintained_at: new Date().toISOString(),
    }).eq('id', roomId);
    if (error) { toast.error(`Failed to update room: ${error.message}`); return; }
    toast.success(`Room ${roomNumber} marked as fixed and available!`);
    setNotes(p => { const n = { ...p }; delete n[roomId]; return n; });

    // 📣 Notify via SECURITY DEFINER RPC (bypasses notifications RLS)
    const staffName = profile?.fullName ?? 'Maintenance staff';
    await db.rpc('notify_staff_completion', {
      p_type:       'staff_assignment',
      p_title:      `✅ Room ${roomNumber} — Maintenance Complete`,
      p_body:       `${staffName} fixed Room ${roomNumber}. Room is now available.${note ? ` Notes: ${note}` : ''}`,
      p_action_url: '/admin/rooms',
      p_priority:   'normal',
      p_metadata:   { roomId, status: 'available' },
    });
    load();
  };

  const markOutOfService = async (roomId: string, roomNumber: string) => {
    const db = supabase as any;
    const { error } = await db.from('rooms').update({ status: 'out_of_service' }).eq('id', roomId);
    if (error) { toast.error(`Failed to update: ${error.message}`); return; }
    toast.success(`Room ${roomNumber} marked as out of service`);

    // 📣 Notify via SECURITY DEFINER RPC (bypasses notifications RLS)
    const staffName = profile?.fullName ?? 'Maintenance staff';
    await db.rpc('notify_staff_completion', {
      p_type:       'admin_alert',
      p_title:      `🚨 Room ${roomNumber} — Out of Service`,
      p_body:       `${staffName} marked Room ${roomNumber} as Out of Service. Manual review required.`,
      p_action_url: '/admin/rooms',
      p_priority:   'high',
      p_metadata:   { roomId, status: 'out_of_service' },
    });
    load();
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="font-heading font-bold text-headline-md text-on-surface">🔧 Maintenance</h1>
          <p className="text-body-sm text-on-surface-variant mt-1">Track and resolve room maintenance issues</p>
        </div>
        <button onClick={load} className="flex items-center gap-2 px-4 py-2 border border-outline-variant rounded-lg text-sm hover:bg-surface transition-colors">
          <RefreshCw size={14} /> Refresh
        </button>
      </div>

      {/* Filter tabs */}
      <div className="flex gap-2 flex-wrap">
        {[
          { key: 'maintenance',    label: '🔧 In Maintenance' },
          { key: 'out_of_service', label: '🚫 Out of Service' },
          { key: 'all',            label: '📋 All Rooms' },
        ].map(tab => (
          <button key={tab.key} onClick={() => setFilter(tab.key)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${filter === tab.key ? 'bg-primary text-white' : 'bg-white border border-outline-variant text-on-surface-variant hover:bg-surface'}`}>
            {tab.label}
          </button>
        ))}
      </div>

      {/* Rooms */}
      {isLoading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 size={28} className="animate-spin text-primary" />
        </div>
      ) : rooms.length === 0 ? (
        <div className="bg-white rounded-xl border border-outline-variant py-20 text-center">
          <CheckCircle2 size={40} className="mx-auto text-green-500 mb-3" />
          <p className="font-semibold text-on-surface">No maintenance issues!</p>
          <p className="text-sm text-on-surface-variant mt-1">All rooms are in good condition.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {rooms.map((room) => {
            const cfg = STATUS_CONFIG[room.status] ?? STATUS_CONFIG['maintenance'];
            return (
              <div key={room.id} className={`bg-white rounded-xl border-2 p-5 space-y-4 ${cfg.bg}`}>
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <Wrench size={16} className={cfg.color} />
                      <span className="font-bold text-lg text-on-surface">Room {room.room_number}</span>
                    </div>
                    <p className="text-xs text-on-surface-variant">Floor {room.floor} {room.wing ? `• Wing ${room.wing}` : ''}</p>
                    <p className="text-xs text-on-surface-variant">{room.room_types?.name}</p>
                  </div>
                  <span className={`text-xs font-semibold px-2 py-1 rounded-full ${cfg.color} ${cfg.bg} border`}>
                    {cfg.label}
                  </span>
                </div>

                {room.notes && (
                  <div className="bg-white/60 rounded-lg px-3 py-2 text-xs text-on-surface-variant border border-white">
                    📝 {room.notes}
                  </div>
                )}

                {room.last_maintained_at && (
                  <p className="text-xs text-on-surface-variant">
                    Last maintained: {new Date(room.last_maintained_at).toLocaleDateString('en-IN')}
                  </p>
                )}

                {/* Resolution notes */}
                {room.status === 'maintenance' && (
                  <div className="space-y-2">
                    <textarea
                      placeholder="Add resolution notes (optional)..."
                      value={notes[room.id] ?? ''}
                      onChange={(e) => setNotes(p => ({ ...p, [room.id]: e.target.value }))}
                      rows={2}
                      className="w-full px-3 py-2 text-xs border border-outline-variant rounded-lg bg-white resize-none outline-none focus:border-primary"
                    />
                    <div className="grid grid-cols-2 gap-2">
                      <button onClick={() => markFixed(room.id, room.room_number)}
                        className="flex items-center justify-center gap-1.5 py-2 bg-green-600 text-white text-xs font-semibold rounded-lg hover:bg-green-700 transition-colors">
                        <CheckCircle2 size={13} /> Mark Fixed
                      </button>
                      <button onClick={() => markOutOfService(room.id, room.room_number)}
                        className="flex items-center justify-center gap-1.5 py-2 bg-red-600 text-white text-xs font-semibold rounded-lg hover:bg-red-700 transition-colors">
                        <AlertTriangle size={13} /> Out of Service
                      </button>
                    </div>
                  </div>
                )}

                {room.status === 'out_of_service' && (
                  <button onClick={() => markFixed(room.id, room.room_number)}
                    className="w-full flex items-center justify-center gap-1.5 py-2 bg-green-600 text-white text-xs font-semibold rounded-lg hover:bg-green-700 transition-colors">
                    <CheckCircle2 size={13} /> Mark as Available
                  </button>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

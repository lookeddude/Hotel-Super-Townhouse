'use client';

import { useEffect, useState, useCallback } from 'react';
import { CheckCircle2, Clock, Loader2, RefreshCw, BedDouble } from 'lucide-react';
import { useSupabase } from '@/providers/SupabaseProvider';
import { useAuth } from '@/providers/AuthProvider';
import { toast } from 'sonner';

type CleaningStatus = 'dirty' | 'in_progress' | 'clean' | 'inspected';

const STATUS_CONFIG: Record<CleaningStatus, { label: string; color: string; bg: string }> = {
  dirty:       { label: 'Needs Cleaning',  color: 'text-red-700',    bg: 'bg-red-50 border-red-200' },
  in_progress: { label: 'In Progress',     color: 'text-yellow-700', bg: 'bg-yellow-50 border-yellow-200' },
  clean:       { label: 'Clean',           color: 'text-green-700',  bg: 'bg-green-50 border-green-200' },
  inspected:   { label: 'Inspected ✓',    color: 'text-blue-700',   bg: 'bg-blue-50 border-blue-200' },
};

export default function HousekeepingPage() {
  const { supabase } = useSupabase();
  const { profile }  = useAuth();
  const [rooms, setRooms]         = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filter, setFilter]       = useState<CleaningStatus | 'all'>('dirty');

  // Always fetch ALL rooms — filter is applied client-side so KPI counts stay correct
  const load = useCallback(async () => {
    setIsLoading(true);
    const db = supabase as any;
    const { data, error } = await db
      .from('rooms')
      .select('id, room_number, floor, wing, cleaning_status, status, room_types(name)')
      .is('deleted_at', null)
      .order('room_number', { ascending: true });
    if (error) console.error('[housekeeping] load error:', error.message);
    setRooms(data ?? []);
    setIsLoading(false);
  }, [supabase]);

  useEffect(() => { load(); }, [load]);

  const updateStatus = async (roomId: string, status: CleaningStatus, roomNumber?: string) => {
    const db = supabase as any;
    const updates: any = { cleaning_status: status };
    if (status === 'clean' || status === 'inspected') {
      updates.last_cleaned_at = new Date().toISOString();
    }
    const { error } = await db.from('rooms').update(updates).eq('id', roomId);
    if (error) {
      toast.error(`Failed to update: ${error.message}`);
      return;
    }
    toast.success(`Room marked as ${STATUS_CONFIG[status].label}`);

    // 📣 Only notify on final step: 'inspected' = room is ready for guests
    if (status === 'inspected') {
      const staffName = profile?.fullName ?? 'Housekeeping staff';
      await db.rpc('notify_staff_completion', {
        p_type:       'staff_assignment',
        p_title:      `✅ Room ${roomNumber ?? roomId} — Ready for Guests`,
        p_body:       `${staffName} has cleaned and inspected Room ${roomNumber ?? roomId}. Room is ready for the next guest.`,
        p_action_url: '/admin/rooms',
        p_priority:   'normal',
        p_metadata:   { roomId, status },
      });
    }
    load();
  };

  // KPI counts from full dataset; display list filtered client-side
  const counts = rooms.reduce((acc: any, r: any) => {
    acc[r.cleaning_status] = (acc[r.cleaning_status] ?? 0) + 1;
    return acc;
  }, {});
  const displayRooms = filter === 'all' ? rooms : rooms.filter(r => r.cleaning_status === filter);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="font-heading font-bold text-headline-md text-on-surface">🧹 Housekeeping</h1>
          <p className="text-body-sm text-on-surface-variant mt-1">Manage room cleaning tasks</p>
        </div>
        <button onClick={load} className="flex items-center gap-2 px-4 py-2 border border-outline-variant rounded-lg text-sm hover:bg-surface transition-colors">
          <RefreshCw size={14} /> Refresh
        </button>
      </div>

      {/* Status KPIs */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {(['dirty', 'in_progress', 'clean', 'inspected'] as CleaningStatus[]).map((s) => (
          <button key={s} onClick={() => setFilter(s === filter ? 'all' : s)}
            className={`p-4 rounded-xl border text-left transition-all ${filter === s ? STATUS_CONFIG[s].bg + ' ring-2 ring-primary/40' : 'bg-white border-outline-variant hover:bg-surface'}`}>
            <p className={`text-2xl font-bold ${filter === s ? STATUS_CONFIG[s].color : 'text-on-surface'}`}>{counts[s] ?? 0}</p>
            <p className="text-xs text-on-surface-variant mt-0.5">{STATUS_CONFIG[s].label}</p>
          </button>
        ))}
      </div>

      {/* Room Cards */}
      {isLoading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 size={28} className="animate-spin text-primary" />
        </div>
      ) : displayRooms.length === 0 ? (
        <div className="bg-white rounded-xl border border-outline-variant py-20 text-center">
          <CheckCircle2 size={40} className="mx-auto text-green-500 mb-3" />
          <p className="font-semibold text-on-surface">All rooms are clean!</p>
          <p className="text-sm text-on-surface-variant mt-1">No rooms need attention right now.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {displayRooms.map((room) => {
            const cs = (room.cleaning_status ?? 'dirty') as CleaningStatus;
            const cfg = STATUS_CONFIG[cs];
            return (
              <div key={room.id} className={`bg-white rounded-xl border-2 p-4 space-y-3 transition-all ${cfg.bg}`}>
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <BedDouble size={16} className={cfg.color} />
                      <span className="font-bold text-lg text-on-surface">Room {room.room_number}</span>
                    </div>
                    <p className="text-xs text-on-surface-variant">Floor {room.floor} {room.wing ? `• Wing ${room.wing}` : ''}</p>
                    <p className="text-xs text-on-surface-variant">{room.room_types?.name}</p>
                  </div>
                  <span className={`text-xs font-semibold px-2 py-1 rounded-full ${cfg.color} ${cfg.bg} border`}>
                    {cfg.label}
                  </span>
                </div>

                {/* Action buttons */}
                <div className="grid grid-cols-2 gap-2">
                  {cs === 'dirty' && (
                    <button onClick={() => updateStatus(room.id, 'in_progress', room.room_number)}
                      className="col-span-2 flex items-center justify-center gap-1.5 py-2 bg-yellow-500 text-white text-xs font-semibold rounded-lg hover:bg-yellow-600 transition-colors">
                      <Clock size={13} /> Start Cleaning
                    </button>
                  )}
                  {cs === 'in_progress' && (
                    <button onClick={() => updateStatus(room.id, 'clean', room.room_number)}
                      className="col-span-2 flex items-center justify-center gap-1.5 py-2 bg-green-600 text-white text-xs font-semibold rounded-lg hover:bg-green-700 transition-colors">
                      <CheckCircle2 size={13} /> Mark as Clean
                    </button>
                  )}
                  {cs === 'clean' && (
                    <button onClick={() => updateStatus(room.id, 'inspected', room.room_number)}
                      className="col-span-2 flex items-center justify-center gap-1.5 py-2 bg-blue-600 text-white text-xs font-semibold rounded-lg hover:bg-blue-700 transition-colors">
                      <CheckCircle2 size={13} /> Mark Inspected
                    </button>
                  )}
                  {cs === 'inspected' && (
                    <p className="col-span-2 text-center text-xs text-green-600 font-medium py-1">✓ Ready for guests</p>
                  )}
                  {cs !== 'dirty' && (
                    <button onClick={() => updateStatus(room.id, 'dirty', room.room_number)}
                      className="col-span-2 text-xs text-on-surface-variant hover:text-error text-center py-1 transition-colors">
                      Reset to Dirty
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

'use client';

import { useEffect, useState, useCallback } from 'react';
import { Plus, Search, Edit2, Trash2, RefreshCcw, BedDouble, CheckCircle, AlertCircle, Wrench } from 'lucide-react';
import { useSupabase } from '@/providers/SupabaseProvider';
import { getRooms, getRoomStats, getRoomTypes, updateRoom, deleteRoom, createRoom } from '@/services/roomService';
import { toast } from 'sonner';

type RoomStatus = 'available' | 'occupied' | 'reserved' | 'maintenance' | 'out_of_service';

const STATUS_CONFIG: Record<RoomStatus, { label: string; color: string }> = {
  available: { label: 'Available', color: 'bg-green-100 text-green-700' },
  occupied: { label: 'Occupied', color: 'bg-blue-100 text-blue-700' },
  reserved: { label: 'Reserved', color: 'bg-yellow-100 text-yellow-700' },
  maintenance: { label: 'Maintenance', color: 'bg-orange-100 text-orange-700' },
  out_of_service: { label: 'Out of Service', color: 'bg-red-100 text-red-700' },
};

const INPUT_CLS = 'w-full px-3 py-2 border border-outline-variant rounded-lg text-sm focus:outline-none focus:border-primary';

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1">
      <label className="text-xs font-medium text-on-surface">{label}</label>
      {children}
    </div>
  );
}

export default function AdminRoomsPage() {
  const { supabase } = useSupabase();
  const [rooms, setRooms] = useState<any[]>([]);
  const [roomTypes, setRoomTypes] = useState<any[]>([]);
  const [stats, setStats] = useState({ total: 0, available: 0, occupied: 0, maintenance: 0 });
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingRoom, setEditingRoom] = useState<any>(null);
  const [totalCount, setTotalCount] = useState(0);

  const loadData = useCallback(async () => {
    setIsLoading(true);
    try {
      const [roomsResult, statsResult, typesResult] = await Promise.all([
        getRooms(supabase, { status: filterStatus || undefined, search: search || undefined }),
        getRoomStats(supabase),
        getRoomTypes(supabase),
      ]);
      setRooms(roomsResult.data ?? []);
      setTotalCount(roomsResult.count ?? 0);
      setStats(statsResult);
      setRoomTypes(typesResult.data ?? []);
    } catch {
      toast.error('Failed to load room data');
    } finally {
      setIsLoading(false);
    }
  }, [supabase, search, filterStatus]);

  useEffect(() => { loadData(); }, [loadData]);

  const handleStatusChange = async (id: string, status: string) => {
    const { error } = await updateRoom(supabase, id, { status });
    if (error) { toast.error('Failed to update status'); return; }
    toast.success('Room status updated');
    loadData();
  };

  const handleDelete = async (id: string, roomNumber: string) => {
    if (!confirm(`Delete room ${roomNumber}? This action is irreversible.`)) return;
    const { error } = await deleteRoom(supabase, id);
    if (error) { toast.error('Failed to delete room'); return; }
    toast.success(`Room ${roomNumber} deleted`);
    loadData();
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-heading text-headline-md text-on-surface">Room Management</h1>
          <p className="text-body-sm text-on-surface-variant mt-1">{totalCount} rooms total</p>
        </div>
        <div className="flex gap-3">
          <button onClick={loadData} disabled={isLoading} className="p-2 border border-outline-variant rounded-lg hover:bg-surface transition-colors">
            <RefreshCcw size={16} className={isLoading ? 'animate-spin' : ''} />
          </button>
          <button onClick={() => { setEditingRoom(null); setShowModal(true); }} className="flex items-center gap-2 px-4 py-2 bg-primary text-white text-sm font-semibold rounded-lg hover:bg-primary-dark transition-colors">
            <Plus size={16} />Add Room
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Total Rooms', value: stats.total, color: 'text-on-surface' },
          { label: 'Available', value: stats.available, color: 'text-green-600' },
          { label: 'Occupied', value: stats.occupied, color: 'text-blue-600' },
          { label: 'Maintenance', value: stats.maintenance, color: 'text-orange-600' },
        ].map((s) => (
          <div key={s.label} className="bg-white rounded-lg border border-outline-variant p-4">
            <p className={`font-heading font-bold text-2xl ${s.color}`}>{isLoading ? '—' : s.value}</p>
            <p className="text-caption text-on-surface-variant mt-1">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant" />
          <input type="search" placeholder="Search room number..." value={search} onChange={(e) => setSearch(e.target.value)} className="w-full pl-9 pr-4 py-2.5 border border-outline-variant rounded-lg text-sm focus:outline-none focus:border-primary" />
        </div>
        <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)} className="px-4 py-2.5 border border-outline-variant rounded-lg text-sm focus:outline-none focus:border-primary bg-white min-w-[160px]">
          <option value="">All Statuses</option>
          {Object.entries(STATUS_CONFIG).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
        </select>
      </div>

      {/* Table */}
      <div className="bg-white rounded-lg border border-outline-variant overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm min-w-[700px]" role="table">
            <thead className="bg-surface border-b border-outline-variant">
              <tr>
                {['Room #', 'Type', 'Floor', 'Capacity', 'Base Price', 'Status', 'Actions'].map((col) => (
                  <th key={col} className="px-4 py-3 text-left text-xs font-semibold text-on-surface-variant" scope="col">{col}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-outline-variant">
              {isLoading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i}>{Array.from({ length: 7 }).map((_, j) => <td key={j} className="px-4 py-3"><div className="h-4 bg-surface rounded animate-pulse" /></td>)}</tr>
                ))
              ) : rooms.length === 0 ? (
                <tr><td colSpan={7} className="py-16 text-center text-on-surface-variant text-sm">
                  {search || filterStatus ? 'No rooms match your filters' : 'No rooms found. Add your first room.'}
                </td></tr>
              ) : rooms.map((room) => {
                const status = (room.status ?? 'available') as RoomStatus;
                const cfg = STATUS_CONFIG[status] ?? STATUS_CONFIG.available;
                const price = room.override_price || room.room_types?.base_price || 0;
                return (
                  <tr key={room.id} className="hover:bg-surface/50 transition-colors">
                    <td className="px-4 py-3 font-semibold text-on-surface">{room.room_number}</td>
                    <td className="px-4 py-3 text-on-surface-variant">{room.room_types?.name ?? '—'}</td>
                    <td className="px-4 py-3 text-on-surface-variant">Floor {room.floor ?? 1}</td>
                    <td className="px-4 py-3 text-on-surface-variant">{room.room_types?.max_occupancy ?? '—'} guests</td>
                    <td className="px-4 py-3 font-medium text-on-surface">₹{Number(price).toLocaleString('en-IN')}</td>
                    <td className="px-4 py-3">
                      <select
                        value={status}
                        onChange={(e) => handleStatusChange(room.id, e.target.value)}
                        className={`text-xs font-medium px-2 py-1 rounded-full border-0 cursor-pointer ${cfg.color}`}
                      >
                        {Object.entries(STATUS_CONFIG).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
                      </select>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <button onClick={() => { setEditingRoom(room); setShowModal(true); }} className="p-1.5 rounded hover:bg-surface text-on-surface-variant hover:text-primary transition-colors" aria-label={`Edit room ${room.room_number}`}><Edit2 size={14} /></button>
                        <button onClick={() => handleDelete(room.id, room.room_number)} className="p-1.5 rounded hover:bg-red-50 text-on-surface-variant hover:text-error transition-colors" aria-label={`Delete room ${room.room_number}`}><Trash2 size={14} /></button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {showModal && (
        <RoomModal
          room={editingRoom}
          roomTypes={roomTypes}
          supabase={supabase}
          onClose={() => setShowModal(false)}
          onSaved={() => { setShowModal(false); loadData(); }}
        />
      )}
    </div>
  );
}

function RoomModal({ room, roomTypes, supabase, onClose, onSaved }: any) {
  const isEdit = !!room;
  const [form, setForm] = useState({
    room_number: room?.room_number ?? '',
    room_type_id: room?.room_type_id ?? (roomTypes[0]?.id ?? ''),
    floor: room?.floor ?? 1,
    override_price: room?.override_price ?? '',
    status: room?.status ?? 'available',
    description: room?.description ?? '',
    notes: room?.notes ?? '',
    is_featured: room?.is_featured ?? false,
  });
  const [isSaving, setIsSaving] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    const payload = {
      ...form,
      floor: Number(form.floor),
      override_price: form.override_price ? Number(form.override_price) : null,
    };
    const { error } = isEdit
      ? await updateRoom(supabase, room.id, payload)
      : await createRoom(supabase, payload);
    if (error) { toast.error(error.message); setIsSaving(false); return; }
    toast.success(isEdit ? 'Room updated' : 'Room created');
    onSaved();
  };

  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="bg-white rounded-xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-outline-variant flex items-center justify-between">
          <h2 className="font-heading font-semibold text-lg">{isEdit ? 'Edit Room' : 'Add New Room'}</h2>
          <button onClick={onClose} className="text-on-surface-variant hover:text-on-surface text-2xl leading-none">×</button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <Field label="Room Number *">
              <input required value={form.room_number} onChange={(e) => setForm(p => ({ ...p, room_number: e.target.value }))} className={INPUT_CLS} placeholder="e.g. 101" />
            </Field>
            <Field label="Room Type *">
              <select required value={form.room_type_id} onChange={(e) => setForm(p => ({ ...p, room_type_id: e.target.value }))} className={INPUT_CLS}>
                {roomTypes.map((t: any) => <option key={t.id} value={t.id}>{t.name}</option>)}
              </select>
            </Field>
            <Field label="Floor">
              <input type="number" min={1} value={form.floor} onChange={(e) => setForm(p => ({ ...p, floor: e.target.value }))} className={INPUT_CLS} />
            </Field>
            <Field label="Override Price/Night (₹)">
              <input type="number" min={0} value={form.override_price} onChange={(e) => setForm(p => ({ ...p, override_price: e.target.value }))} className={INPUT_CLS} placeholder="Leave blank for room type price" />
            </Field>
            <Field label="Status">
              <select value={form.status} onChange={(e) => setForm(p => ({ ...p, status: e.target.value }))} className={INPUT_CLS}>
                {Object.entries(STATUS_CONFIG).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
              </select>
            </Field>
          </div>
          <Field label="Description">
            <textarea value={form.description} onChange={(e) => setForm(p => ({ ...p, description: e.target.value }))} className={INPUT_CLS + ' resize-none'} rows={3} />
          </Field>
          <Field label="Notes (internal only)">
            <input value={form.notes} onChange={(e) => setForm(p => ({ ...p, notes: e.target.value }))} className={INPUT_CLS} />
          </Field>
          <label className="flex items-center gap-2 cursor-pointer">
            <input type="checkbox" checked={form.is_featured} onChange={(e) => setForm(p => ({ ...p, is_featured: e.target.checked }))} className="accent-primary w-4 h-4" />
            <span className="text-sm text-on-surface">Featured room</span>
          </label>
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="flex-1 py-2.5 border border-outline-variant rounded-lg text-sm hover:bg-surface">Cancel</button>
            <button type="submit" disabled={isSaving} className="flex-1 py-2.5 bg-primary text-white text-sm font-semibold rounded-lg hover:bg-primary-dark disabled:opacity-60">
              {isSaving ? 'Saving…' : isEdit ? 'Update Room' : 'Create Room'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

'use client';

import { useEffect, useState, useCallback } from 'react';
import { Plus, Search, Edit2, Trash2, RefreshCcw } from 'lucide-react';
import { useSupabase } from '@/providers/SupabaseProvider';
import { getRooms, getRoomStats, getRoomTypes, updateRoom, deleteRoom, createRoom } from '@/services/roomService';
import { toast } from 'sonner';

const INPUT_CLS =
  'w-full px-3 py-2 border border-outline-variant rounded-lg text-sm focus:outline-none focus:border-primary';

// ─── Types ────────────────────────────────────────────────────────────────────

type Room = any;
type RoomType = any;
type RoomStats = any;

// ─── Helpers ──────────────────────────────────────────────────────────────────

function slugify(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-');
}

// ─── Default form states ───────────────────────────────────────────────────────

const defaultRoomForm = {
  room_number: '',
  room_type_id: '',
  floor: '',
  override_price: '',
  status: 'available',
  description: '',
  notes: '',
  is_featured: false,
};

const defaultRoomTypeForm = {
  name: '',
  slug: '',
  description: '',
  base_price: '',
  weekend_price: '',
  bed_type: 'Double',
  size_sqft: '',
  max_adults: 2,
  max_children: 0,
  view_type: '',
  image_url: '',
  images: [] as string[],
  amenities: '',
  breakfast_included: false,
  is_active: true,
};

// ═══════════════════════════════════════════════════════════════════════════════
// MAIN PAGE COMPONENT
// ═══════════════════════════════════════════════════════════════════════════════

export default function RoomsPage() {
  const { supabase } = useSupabase();

  // ── Tab state ────────────────────────────────────────────────────────────────
  const [activeTab, setActiveTab] = useState<'rooms' | 'types'>('rooms');

  // ── Individual Rooms state ────────────────────────────────────────────────────
  const [rooms, setRooms] = useState<Room[]>([]);
  const [roomStats, setRoomStats] = useState<RoomStats>(null);
  const [roomTypes, setRoomTypes] = useState<RoomType[]>([]);
  const [roomsLoading, setRoomsLoading] = useState(true);
  const [roomSearch, setRoomSearch] = useState('');
  const [roomStatusFilter, setRoomStatusFilter] = useState('all');

  const [showRoomModal, setShowRoomModal] = useState(false);
  const [editingRoom, setEditingRoom] = useState<Room | null>(null);
  const [roomForm, setRoomForm] = useState(defaultRoomForm);
  const [roomSaving, setRoomSaving] = useState(false);

  // ── Room Types state ───────────────────────────────────────────────────────────
  const [roomTypesList, setRoomTypesList] = useState<RoomType[]>([]);
  const [typesLoading, setTypesLoading] = useState(true);

  const [showTypeModal, setShowTypeModal] = useState(false);
  const [editingType, setEditingType] = useState<RoomType | null>(null);
  const [typeForm, setTypeForm] = useState(defaultRoomTypeForm);
  const [typeSaving, setTypeSaving] = useState(false);

  // ─── Fetch helpers ─────────────────────────────────────────────────────────────

  const loadRooms = useCallback(async () => {
    setRoomsLoading(true);
    try {
      const [roomsData, statsData, typesData] = await Promise.all([
        getRooms(supabase),
        getRoomStats(supabase),
        getRoomTypes(supabase),
      ]);
      setRooms((roomsData as any)?.data || roomsData || []);
      setRoomStats(statsData as any);
      setRoomTypes((typesData as any)?.data || typesData || []);
    } catch (_e) {
      toast.error('Failed to load rooms');
    } finally {
      setRoomsLoading(false);
    }
  }, [supabase]);

  const loadRoomTypes = useCallback(async () => {
    setTypesLoading(true);
    try {
      const { data, error } = await supabase
        .from('room_types')
        .select('*')
        .order('name');
      if (error) throw error;
      setRoomTypesList(data || []);
    } catch (e) {
      toast.error('Failed to load room types');
    } finally {
      setTypesLoading(false);
    }
  }, [supabase]);

  useEffect(() => {
    loadRooms();
    loadRoomTypes();
  }, [loadRooms, loadRoomTypes]);

  // ─── Individual Room handlers ──────────────────────────────────────────────────

  const filteredRooms = rooms.filter((r) => {
    const matchSearch =
      !roomSearch ||
      r.room_number?.toString().includes(roomSearch) ||
      r.room_types?.name?.toLowerCase().includes(roomSearch.toLowerCase());
    const matchStatus =
      roomStatusFilter === 'all' || r.status === roomStatusFilter;
    return matchSearch && matchStatus;
  });

  function openAddRoom() {
    setEditingRoom(null);
    setRoomForm(defaultRoomForm);
    setShowRoomModal(true);
  }

  function openEditRoom(room: Room) {
    setEditingRoom(room);
    setRoomForm({
      room_number: room.room_number ?? '',
      room_type_id: room.room_type_id ?? '',
      floor: room.floor ?? '',
      override_price: room.override_price ?? '',
      status: room.status ?? 'available',
      description: room.description ?? '',
      notes: room.notes ?? '',
      is_featured: room.is_featured ?? false,
    });
    setShowRoomModal(true);
  }

  async function handleRoomSave() {
    if (!roomForm.room_number || !roomForm.room_type_id) {
      toast.error('Room number and type are required');
      return;
    }
    setRoomSaving(true);
    try {
      const payload = {
        room_number: roomForm.room_number,
        room_type_id: roomForm.room_type_id,
        floor: roomForm.floor ? Number(roomForm.floor) : null,
        override_price: roomForm.override_price ? Number(roomForm.override_price) : null,
        status: roomForm.status,
        description: roomForm.description || null,
        notes: roomForm.notes || null,
        is_featured: roomForm.is_featured,
      };
      if (editingRoom) {
        await updateRoom(supabase, editingRoom.id, payload);
        toast.success('Room updated');
      } else {
        await createRoom(supabase, payload);
        toast.success('Room created');
      }
      setShowRoomModal(false);
      loadRooms();
    } catch (e: any) {
      toast.error(e?.message || 'Failed to save room');
    } finally {
      setRoomSaving(false);
    }
  }

  async function handleRoomDelete(id: string) {
    if (!confirm('Delete this room? This action cannot be undone.')) return;
    try {
      await deleteRoom(supabase, id);
      toast.success('Room deleted');
      loadRooms();
    } catch (_e: any) {
      toast.error('Failed to delete room');
    }
  }

  // ─── Room Type handlers ────────────────────────────────────────────────────────

  function openAddType() {
    setEditingType(null);
    setTypeForm(defaultRoomTypeForm);
    setShowTypeModal(true);
  }

  function openEditType(rt: RoomType) {
    setEditingType(rt);
    setTypeForm({
      name: rt.name ?? '',
      slug: rt.slug ?? '',
      description: rt.description ?? '',
      base_price: rt.base_price ?? '',
      weekend_price: rt.weekend_price ?? '',
      bed_type: rt.bed_type ?? 'Double',
      size_sqft: rt.size_sqft ?? '',
      max_adults: rt.max_adults ?? 2,
      max_children: rt.max_children ?? 0,
      view_type: rt.view_type ?? '',
      image_url: rt.image_url ?? '',
      images: rt.images ?? (rt.image_url ? [rt.image_url] : []),
      amenities: Array.isArray(rt.amenities) ? rt.amenities.join(', ') : (rt.amenities ?? ''),
      breakfast_included: rt.breakfast_included ?? false,
      is_active: rt.is_active ?? true,
    });
    setShowTypeModal(true);
  }

  function handleTypeFormChange(field: string, value: any) {
    setTypeForm((prev) => {
      const updated = { ...prev, [field]: value };
      if (field === 'name' && !editingType) {
        updated.slug = slugify(value);
      }
      return updated;
    });
  }

  async function handleTypeSave() {
    if (!typeForm.name || !typeForm.base_price) {
      toast.error('Name and base price are required');
      return;
    }
    setTypeSaving(true);
    try {
      // ── Core columns — guaranteed to exist in every room_types table ──
      const corePayload = {
        name:         typeForm.name,
        slug:         typeForm.slug || slugify(typeForm.name),
        description:  typeForm.description || null,
        base_price:   Number(typeForm.base_price),
        max_occupancy: Number(typeForm.max_adults) + Number(typeForm.max_children),
        is_active:    typeForm.is_active,
        image_url:    typeForm.images?.[0] || null,
      };

      // ── Extra columns — only exist after running the ALTER TABLE SQL ──
      const extraPayload = {
        weekend_price:      typeForm.weekend_price ? Number(typeForm.weekend_price) : null,
        bed_type:           typeForm.bed_type || null,
        size_sqft:          typeForm.size_sqft ? Number(typeForm.size_sqft) : null,
        max_adults:         Number(typeForm.max_adults),
        max_children:       Number(typeForm.max_children),
        max_occupancy:      Number(typeForm.max_adults) + Number(typeForm.max_children),
        view_type:          typeForm.view_type || null,
        image_url:          typeForm.images?.[0] || null,
        images:             typeForm.images?.filter(Boolean) ?? [],
        amenities:          typeForm.amenities || null,
        breakfast_included: typeForm.breakfast_included,
        is_active:          typeForm.is_active,
      };
      // Try with all fields first, fall back to core only if columns missing
      const fullPayload = { ...corePayload, ...extraPayload };
      let saveError: any = null;

      if (editingType) {
        const { error } = await supabase.from('room_types').update(fullPayload as any).eq('id', editingType.id);
        saveError = error;
      } else {
        const { error } = await supabase.from('room_types').insert(fullPayload as any);
        saveError = error;
      }

      // If column-missing error → retry with core columns only
      if (saveError) {
        const isColumnError =
          saveError.message?.includes('column') ||
          saveError.message?.includes('schema cache') ||
          saveError.code === '42703';

        if (isColumnError) {
          let fallbackError: any = null;
          if (editingType) {
            const { error } = await supabase.from('room_types').update(corePayload as any).eq('id', editingType.id);
            fallbackError = error;
          } else {
            const { error } = await supabase.from('room_types').insert(corePayload as any);
            fallbackError = error;
          }
          if (fallbackError) throw fallbackError;
          toast.success(`Room type ${editingType ? 'updated' : 'created'}! Run the ALTER TABLE SQL in Supabase to unlock extra fields.`, { duration: 6000 });
        } else {
          throw saveError;
        }
      } else {
        toast.success(`Room type ${editingType ? 'updated' : 'created'} successfully!`);
      }

      setShowTypeModal(false);
      loadRoomTypes();
      loadRooms();
    } catch (e: any) {
      toast.error(e?.message || 'Failed to save room type');
    } finally {
      setTypeSaving(false);
    }
  }


  async function handleTypeDelete(rt: RoomType) {
    if (!confirm(`Delete room type "${rt.name}"? This cannot be undone.`)) return;
    try {
      const { error } = await supabase.from('room_types').delete().eq('id', rt.id);
      if (error) throw error;
      toast.success('Room type deleted');
      loadRoomTypes();
    } catch (e: any) {
      toast.error(e?.message || 'Failed to delete room type');
    }
  }

  async function handleTypeToggleActive(rt: RoomType) {
    try {
      const { error } = await supabase
        .from('room_types')
        .update({ is_active: !rt.is_active })
        .eq('id', rt.id);
      if (error) throw error;
      toast.success(rt.is_active ? 'Room type deactivated' : 'Room type activated');
      loadRoomTypes();
    } catch (e: any) {
      toast.error(e?.message || 'Failed to toggle status');
    }
  }

  // ─── Status badge helper ──────────────────────────────────────────────────────

  function statusBadge(status: string) {
    const map: Record<string, string> = {
      available: 'bg-green-100 text-green-700',
      occupied: 'bg-blue-100 text-blue-700',
      maintenance: 'bg-yellow-100 text-yellow-700',
      cleaning: 'bg-purple-100 text-purple-700',
      blocked: 'bg-red-100 text-red-700',
    };
    return (
      <span
        className={`px-2 py-0.5 rounded-full text-xs font-medium ${map[status] ?? 'bg-gray-100 text-gray-600'}`}
      >
        {status}
      </span>
    );
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // RENDER
  // ─────────────────────────────────────────────────────────────────────────────

  return (
    <div className="p-6 space-y-6">
      {/* ── Page Header ── */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-on-surface">Rooms Management</h1>
          <p className="text-sm text-on-surface-variant mt-0.5">
            Manage individual rooms and room types
          </p>
        </div>
        <button
          onClick={() => { loadRooms(); loadRoomTypes(); }}
          className="flex items-center gap-2 px-3 py-2 text-sm border border-outline-variant rounded-lg hover:bg-surface text-on-surface-variant"
        >
          <RefreshCcw size={14} />
          Refresh
        </button>
      </div>

      {/* ── Stats Row (only on rooms tab) ── */}
      {activeTab === 'rooms' && roomStats && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: 'Total Rooms', value: roomStats.total ?? 0 },
            { label: 'Available', value: roomStats.available ?? 0 },
            { label: 'Occupied', value: roomStats.occupied ?? 0 },
            { label: 'Maintenance', value: roomStats.maintenance ?? 0 },
          ].map((s) => (
            <div key={s.label} className="bg-white border border-outline-variant rounded-lg p-4">
              <p className="text-xs text-on-surface-variant">{s.label}</p>
              <p className="text-2xl font-bold text-on-surface mt-1">{s.value}</p>
            </div>
          ))}
        </div>
      )}

      {/* ── Tabs ── */}
      <div className="bg-white border border-outline-variant rounded-lg overflow-hidden">
        <div className="flex border-b border-outline-variant">
          {(['rooms', 'types'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-6 py-3 text-sm font-medium transition-colors ${
                activeTab === tab
                  ? 'border-b-2 border-primary text-primary bg-surface'
                  : 'text-on-surface-variant hover:text-on-surface hover:bg-surface'
              }`}
            >
              {tab === 'rooms' ? 'Individual Rooms' : 'Room Types'}
            </button>
          ))}
        </div>

        {/* ════════════════════════════════════════
            TAB 1 — Individual Rooms
            ════════════════════════════════════════ */}
        {activeTab === 'rooms' && (
          <div className="p-5 space-y-4">
            {/* Toolbar */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <div className="flex items-center gap-3 flex-1">
                <div className="relative flex-1 max-w-xs">
                  <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant" />
                  <input
                    type="text"
                    placeholder="Search rooms…"
                    value={roomSearch}
                    onChange={(e) => setRoomSearch(e.target.value)}
                    className={`${INPUT_CLS} pl-8`}
                  />
                </div>
                <select
                  value={roomStatusFilter}
                  onChange={(e) => setRoomStatusFilter(e.target.value)}
                  className={INPUT_CLS + ' w-auto'}
                >
                  <option value="all">All Statuses</option>
                  <option value="available">Available</option>
                  <option value="occupied">Occupied</option>
                  <option value="maintenance">Maintenance</option>
                  <option value="cleaning">Cleaning</option>
                  <option value="blocked">Blocked</option>
                </select>
              </div>
              <button
                onClick={openAddRoom}
                className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg text-sm font-medium hover:bg-primary-dark transition-colors"
              >
                <Plus size={16} />
                Add Room
              </button>
            </div>

            {/* Table */}
            {roomsLoading ? (
              <div className="text-center py-12 text-on-surface-variant text-sm">Loading rooms…</div>
            ) : filteredRooms.length === 0 ? (
              <div className="text-center py-12 text-on-surface-variant text-sm">No rooms found.</div>
            ) : (
              <div className="overflow-x-auto rounded-lg border border-outline-variant">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-surface border-b border-outline-variant">
                      {['Room #', 'Type', 'Floor', 'Capacity', 'Base Price', 'Status', 'Actions'].map(
                        (h) => (
                          <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-on-surface-variant">
                            {h}
                          </th>
                        )
                      )}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-outline-variant">
                    {filteredRooms.map((room) => (
                      <tr key={room.id} className="hover:bg-surface transition-colors">
                        <td className="px-4 py-3 font-medium text-on-surface">{room.room_number}</td>
                        <td className="px-4 py-3 text-on-surface-variant">
                          {room.room_types?.name ?? '—'}
                        </td>
                        <td className="px-4 py-3 text-on-surface-variant">
                          {room.floor != null ? `Floor ${room.floor}` : '—'}
                        </td>
                        <td className="px-4 py-3 text-on-surface-variant">
                          {room.room_types?.max_occupancy != null
                            ? `${room.room_types.max_occupancy} guests`
                            : '—'}
                        </td>
                        <td className="px-4 py-3 text-on-surface-variant">
                          {room.override_price != null
                            ? `₹${Number(room.override_price).toLocaleString()}`
                            : room.room_types?.base_price != null
                            ? `₹${Number(room.room_types.base_price).toLocaleString()}`
                            : '—'}
                        </td>
                        <td className="px-4 py-3">{statusBadge(room.status)}</td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => openEditRoom(room)}
                              className="p-1.5 rounded hover:bg-blue-50 text-blue-600 transition-colors"
                              title="Edit"
                            >
                              <Edit2 size={14} />
                            </button>
                            <button
                              onClick={() => handleRoomDelete(room.id)}
                              className="p-1.5 rounded hover:bg-red-50 text-red-500 transition-colors"
                              title="Delete"
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* ════════════════════════════════════════
            TAB 2 — Room Types
            ════════════════════════════════════════ */}
        {activeTab === 'types' && (
          <div className="p-5 space-y-4">
            {/* Toolbar */}
            <div className="flex items-center justify-between">
              <p className="text-sm text-on-surface-variant">
                {roomTypesList.length} room type{roomTypesList.length !== 1 ? 's' : ''}
              </p>
              <button
                onClick={openAddType}
                className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg text-sm font-medium hover:bg-primary-dark transition-colors"
              >
                <Plus size={16} />
                Add Room Type
              </button>
            </div>

            {/* Grid */}
            {typesLoading ? (
              <div className="text-center py-12 text-on-surface-variant text-sm">
                Loading room types…
              </div>
            ) : roomTypesList.length === 0 ? (
              <div className="text-center py-12 text-on-surface-variant text-sm">
                No room types yet. Click 'Add Room Type' to create one.
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                {roomTypesList.map((rt) => (
                  <RoomTypeCard
                    key={rt.id}
                    rt={rt}
                    onEdit={() => openEditType(rt)}
                    onDelete={() => handleTypeDelete(rt)}
                    onToggle={() => handleTypeToggleActive(rt)}
                  />
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* ════════════════════════════════════════
          MODAL — Add / Edit Room
          ════════════════════════════════════════ */}
      {showRoomModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-lg mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-5 border-b border-outline-variant">
              <h2 className="text-base font-semibold text-on-surface">
                {editingRoom ? 'Edit Room' : 'Add New Room'}
              </h2>
              <button
                onClick={() => setShowRoomModal(false)}
                className="text-on-surface-variant hover:text-on-surface text-xl leading-none"
              >
                ×
              </button>
            </div>
            <div className="p-5 space-y-4">
              {/* Room Number */}
              <div>
                <label className="block text-xs font-medium text-on-surface-variant mb-1">
                  Room Number <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={roomForm.room_number}
                  onChange={(e) => setRoomForm((p) => ({ ...p, room_number: e.target.value }))}
                  className={INPUT_CLS}
                  placeholder="e.g. 101"
                />
              </div>

              {/* Room Type */}
              <div>
                <label className="block text-xs font-medium text-on-surface-variant mb-1">
                  Room Type <span className="text-red-500">*</span>
                </label>
                <select
                  value={roomForm.room_type_id}
                  onChange={(e) => setRoomForm((p) => ({ ...p, room_type_id: e.target.value }))}
                  className={INPUT_CLS}
                >
                  <option value="">Select a room type…</option>
                  {roomTypes.map((rt: any) => (
                    <option key={rt.id} value={rt.id}>
                      {rt.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Floor & Override Price */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-on-surface-variant mb-1">Floor</label>
                  <input
                    type="number"
                    value={roomForm.floor}
                    onChange={(e) => setRoomForm((p) => ({ ...p, floor: e.target.value }))}
                    className={INPUT_CLS}
                    placeholder="e.g. 2"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-on-surface-variant mb-1">
                    Override Price ₹
                  </label>
                  <input
                    type="number"
                    value={roomForm.override_price}
                    onChange={(e) => setRoomForm((p) => ({ ...p, override_price: e.target.value }))}
                    className={INPUT_CLS}
                    placeholder="Leave blank for type price"
                  />
                </div>
              </div>

              {/* Status */}
              <div>
                <label className="block text-xs font-medium text-on-surface-variant mb-1">Status</label>
                <select
                  value={roomForm.status}
                  onChange={(e) => setRoomForm((p) => ({ ...p, status: e.target.value }))}
                  className={INPUT_CLS}
                >
                  <option value="available">Available</option>
                  <option value="occupied">Occupied</option>
                  <option value="maintenance">Maintenance</option>
                  <option value="cleaning">Cleaning</option>
                  <option value="blocked">Blocked</option>
                </select>
              </div>

              {/* Description */}
              <div>
                <label className="block text-xs font-medium text-on-surface-variant mb-1">Description</label>
                <textarea
                  value={roomForm.description}
                  onChange={(e) => setRoomForm((p) => ({ ...p, description: e.target.value }))}
                  className={INPUT_CLS}
                  rows={2}
                  placeholder="Optional room description"
                />
              </div>

              {/* Notes */}
              <div>
                <label className="block text-xs font-medium text-on-surface-variant mb-1">Notes</label>
                <textarea
                  value={roomForm.notes}
                  onChange={(e) => setRoomForm((p) => ({ ...p, notes: e.target.value }))}
                  className={INPUT_CLS}
                  rows={2}
                  placeholder="Internal notes"
                />
              </div>

              {/* Is Featured */}
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="is_featured"
                  checked={roomForm.is_featured}
                  onChange={(e) => setRoomForm((p) => ({ ...p, is_featured: e.target.checked }))}
                  className="w-4 h-4 accent-primary"
                />
                <label htmlFor="is_featured" className="text-sm text-on-surface cursor-pointer">
                  Featured room
                </label>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 p-5 border-t border-outline-variant">
              <button
                onClick={() => setShowRoomModal(false)}
                className="px-4 py-2 text-sm border border-outline-variant rounded-lg text-on-surface-variant hover:bg-surface"
              >
                Cancel
              </button>
              <button
                onClick={handleRoomSave}
                disabled={roomSaving}
                className="px-4 py-2 text-sm bg-primary text-white rounded-lg font-medium hover:bg-primary-dark disabled:opacity-50"
              >
                {roomSaving ? 'Saving…' : editingRoom ? 'Update Room' : 'Create Room'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ════════════════════════════════════════
          MODAL — Add / Edit Room Type
          ════════════════════════════════════════ */}
      {showTypeModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-5 border-b border-outline-variant">
              <h2 className="text-base font-semibold text-on-surface">
                {editingType ? 'Edit Room Type' : 'Add Room Type'}
              </h2>
              <button
                onClick={() => setShowTypeModal(false)}
                className="text-on-surface-variant hover:text-on-surface text-xl leading-none"
              >
                ×
              </button>
            </div>

            <div className="p-5 space-y-4">
              {/* Name & Slug */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-on-surface-variant mb-1">
                    Room Type Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={typeForm.name}
                    onChange={(e) => handleTypeFormChange('name', e.target.value)}
                    className={INPUT_CLS}
                    placeholder="e.g. Deluxe Suite"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-on-surface-variant mb-1">
                    URL Slug
                  </label>
                  <input
                    type="text"
                    value={typeForm.slug}
                    onChange={(e) => handleTypeFormChange('slug', e.target.value)}
                    className={INPUT_CLS}
                    placeholder="auto-generated"
                  />
                </div>
              </div>

              {/* Description */}
              <div>
                <label className="block text-xs font-medium text-on-surface-variant mb-1">
                  Description
                </label>
                <textarea
                  value={typeForm.description}
                  onChange={(e) => handleTypeFormChange('description', e.target.value)}
                  className={INPUT_CLS}
                  rows={3}
                  placeholder="Describe this room type…"
                />
              </div>

              {/* Base Price & Weekend Price */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-on-surface-variant mb-1">
                    Base Price/Night ₹ <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    value={typeForm.base_price}
                    onChange={(e) => handleTypeFormChange('base_price', e.target.value)}
                    className={INPUT_CLS}
                    placeholder="e.g. 3500"
                    min={0}
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-on-surface-variant mb-1">
                    Weekend Price/Night ₹
                  </label>
                  <input
                    type="number"
                    value={typeForm.weekend_price}
                    onChange={(e) => handleTypeFormChange('weekend_price', e.target.value)}
                    className={INPUT_CLS}
                    placeholder="Optional"
                    min={0}
                  />
                </div>
              </div>

              {/* Bed Type & Size */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-on-surface-variant mb-1">
                    Bed Type
                  </label>
                  <select
                    value={typeForm.bed_type}
                    onChange={(e) => handleTypeFormChange('bed_type', e.target.value)}
                    className={INPUT_CLS}
                  >
                    {['Single', 'Double', 'Queen', 'King', 'Twin', 'Bunk', 'Sofa Bed'].map((b) => (
                      <option key={b} value={b}>
                        {b}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-on-surface-variant mb-1">
                    Room Size sq ft
                  </label>
                  <input
                    type="number"
                    value={typeForm.size_sqft}
                    onChange={(e) => handleTypeFormChange('size_sqft', e.target.value)}
                    className={INPUT_CLS}
                    placeholder="e.g. 350"
                    min={0}
                  />
                </div>
              </div>

              {/* Adults, Children, Occupancy */}
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-medium text-on-surface-variant mb-1">
                    Max Adults
                  </label>
                  <input
                    type="number"
                    value={typeForm.max_adults}
                    onChange={(e) => handleTypeFormChange('max_adults', Number(e.target.value))}
                    className={INPUT_CLS}
                    min={1}
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-on-surface-variant mb-1">
                    Max Children
                  </label>
                  <input
                    type="number"
                    value={typeForm.max_children}
                    onChange={(e) => handleTypeFormChange('max_children', Number(e.target.value))}
                    className={INPUT_CLS}
                    min={0}
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-on-surface-variant mb-1">
                    Max Occupancy
                  </label>
                  <input
                    type="number"
                    value={Number(typeForm.max_adults) + Number(typeForm.max_children)}
                    readOnly
                    className={INPUT_CLS + ' bg-surface cursor-not-allowed'}
                  />
                </div>
              </div>

              {/* View Type */}
              <div>
                <label className="block text-xs font-medium text-on-surface-variant mb-1">
                  View Type
                </label>
                <input
                  type="text"
                  value={typeForm.view_type}
                  onChange={(e) => handleTypeFormChange('view_type', e.target.value)}
                  className={INPUT_CLS}
                  placeholder="e.g. Pool View, Mountain View"
                />
              </div>

              {/* Multiple Images */}
              <div className="col-span-1 sm:col-span-2 space-y-2">
                <label className="text-xs font-medium text-on-surface block">Room Images (add multiple URLs for slideshow)</label>
                {(typeForm.images ?? []).map((url: string, idx: number) => (
                  <div key={idx} className="flex gap-2 items-center">
                    <input
                      type="url"
                      value={url}
                      onChange={(e) => {
                        const updated = [...(typeForm.images ?? [])];
                        updated[idx] = e.target.value;
                        setTypeForm((p: any) => ({ ...p, images: updated }));
                      }}
                      className={INPUT_CLS}
                      placeholder={idx === 0 ? 'Main photo URL (shown as cover)' : `Extra photo ${idx + 1} URL`}
                    />
                    {idx === 0 ? (
                      <span className="text-xs text-on-surface-variant whitespace-nowrap w-12 text-center">Main</span>
                    ) : (
                      <button
                        type="button"
                        onClick={() => {
                          const updated = (typeForm.images ?? []).filter((_: string, i: number) => i !== idx);
                          setTypeForm((p: any) => ({ ...p, images: updated }));
                        }}
                        className="w-12 h-9 text-error hover:bg-red-50 rounded flex items-center justify-center flex-shrink-0"
                      >
                        ✕
                      </button>
                    )}
                  </div>
                ))}
                {(typeForm.images ?? []).length < 8 && (
                  <button
                    type="button"
                    onClick={() => setTypeForm((p: any) => ({ ...p, images: [...(p.images ?? []), ''] }))}
                    className="text-xs text-primary hover:underline flex items-center gap-1 mt-1"
                  >
                    + Add another photo
                  </button>
                )}
                {(typeForm.images ?? []).length === 0 && (
                  <button
                    type="button"
                    onClick={() => setTypeForm((p: any) => ({ ...p, images: [''] }))}
                    className="text-xs text-primary hover:underline"
                  >
                    + Add photo URL
                  </button>
                )}
              </div>

              {/* Amenities */}
              <div>
                <label className="block text-xs font-medium text-on-surface-variant mb-1">
                  Amenities{' '}
                  <span className="text-on-surface-variant font-normal">(comma separated)</span>
                </label>
                <input
                  type="text"
                  value={typeForm.amenities}
                  onChange={(e) => handleTypeFormChange('amenities', e.target.value)}
                  className={INPUT_CLS}
                  placeholder="WiFi, AC, TV, Balcony"
                />
              </div>

              {/* Checkboxes */}
              <div className="flex items-center gap-6">
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="breakfast_included"
                    checked={typeForm.breakfast_included}
                    onChange={(e) => handleTypeFormChange('breakfast_included', e.target.checked)}
                    className="w-4 h-4 accent-primary"
                  />
                  <label htmlFor="breakfast_included" className="text-sm text-on-surface cursor-pointer">
                    Breakfast Included
                  </label>
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="type_is_active"
                    checked={typeForm.is_active}
                    onChange={(e) => handleTypeFormChange('is_active', e.target.checked)}
                    className="w-4 h-4 accent-primary"
                  />
                  <label htmlFor="type_is_active" className="text-sm text-on-surface cursor-pointer">
                    Active / visible on website
                  </label>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 p-5 border-t border-outline-variant">
              <button
                onClick={() => setShowTypeModal(false)}
                className="px-4 py-2 text-sm border border-outline-variant rounded-lg text-on-surface-variant hover:bg-surface"
              >
                Cancel
              </button>
              <button
                onClick={handleTypeSave}
                disabled={typeSaving}
                className="px-4 py-2 text-sm bg-primary text-white rounded-lg font-medium hover:bg-primary-dark disabled:opacity-50"
              >
                {typeSaving ? 'Saving…' : editingType ? 'Update Room Type' : 'Create Room Type'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// ROOM TYPE CARD SUB-COMPONENT
// ═══════════════════════════════════════════════════════════════════════════════

interface RoomTypeCardProps {
  rt: RoomType;
  onEdit: () => void;
  onDelete: () => void;
  onToggle: () => void;
}

function RoomTypeCard({ rt, onEdit, onDelete, onToggle }: RoomTypeCardProps) {
  const amenitiesArr: string[] = Array.isArray(rt.amenities)
    ? rt.amenities
    : rt.amenities
    ? rt.amenities.split(',').map((a: string) => a.trim())
    : [];

  return (
    <div className="bg-white border border-outline-variant rounded-lg p-4 space-y-3 hover:shadow-sm transition-shadow">
      {/* Header */}
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-on-surface text-sm truncate">{rt.name}</h3>
          {rt.slug && (
            <p className="text-xs text-on-surface-variant mt-0.5 truncate">/{rt.slug}</p>
          )}
        </div>
        <span
          className={`shrink-0 px-2 py-0.5 rounded-full text-xs font-medium ${
            rt.is_active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'
          }`}
        >
          {rt.is_active ? 'Active' : 'Inactive'}
        </span>
      </div>

      {/* Description */}
      {rt.description && (
        <p className="text-xs text-on-surface-variant line-clamp-2">{rt.description}</p>
      )}

      {/* Details grid */}
      <div className="grid grid-cols-2 gap-x-4 gap-y-1.5 text-xs">
        <div>
          <span className="text-on-surface-variant">Base Price</span>
          <span className="ml-1 font-medium text-on-surface">
            ₹{Number(rt.base_price).toLocaleString()}
          </span>
        </div>
        {rt.weekend_price && (
          <div>
            <span className="text-on-surface-variant">Weekend</span>
            <span className="ml-1 font-medium text-on-surface">
              ₹{Number(rt.weekend_price).toLocaleString()}
            </span>
          </div>
        )}
        {rt.bed_type && (
          <div>
            <span className="text-on-surface-variant">Bed</span>
            <span className="ml-1 font-medium text-on-surface">{rt.bed_type}</span>
          </div>
        )}
        {rt.size_sqft && (
          <div>
            <span className="text-on-surface-variant">Size</span>
            <span className="ml-1 font-medium text-on-surface">{rt.size_sqft} sq ft</span>
          </div>
        )}
        <div>
          <span className="text-on-surface-variant">Adults</span>
          <span className="ml-1 font-medium text-on-surface">{rt.max_adults ?? '—'}</span>
        </div>
        <div>
          <span className="text-on-surface-variant">Children</span>
          <span className="ml-1 font-medium text-on-surface">{rt.max_children ?? 0}</span>
        </div>
        {rt.max_occupancy != null && (
          <div>
            <span className="text-on-surface-variant">Max Occ.</span>
            <span className="ml-1 font-medium text-on-surface">{rt.max_occupancy}</span>
          </div>
        )}
        {rt.view_type && (
          <div className="col-span-2">
            <span className="text-on-surface-variant">View</span>
            <span className="ml-1 font-medium text-on-surface">{rt.view_type}</span>
          </div>
        )}
      </div>

      {/* Amenities */}
      {amenitiesArr.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {amenitiesArr.slice(0, 5).map((a: string) => (
            <span
              key={a}
              className="px-1.5 py-0.5 bg-surface border border-outline-variant rounded text-xs text-on-surface-variant"
            >
              {a}
            </span>
          ))}
          {amenitiesArr.length > 5 && (
            <span className="px-1.5 py-0.5 text-xs text-on-surface-variant">
              +{amenitiesArr.length - 5} more
            </span>
          )}
        </div>
      )}

      {/* Flags */}
      {rt.breakfast_included && (
        <p className="text-xs text-green-600 font-medium">✓ Breakfast Included</p>
      )}

      {/* Actions */}
      <div className="flex items-center gap-2 pt-1 border-t border-outline-variant">
        <button
          onClick={onEdit}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs border border-outline-variant rounded-lg text-on-surface hover:bg-surface transition-colors"
        >
          <Edit2 size={12} />
          Edit
        </button>
        <button
          onClick={onToggle}
          className={`flex items-center gap-1.5 px-3 py-1.5 text-xs border rounded-lg transition-colors ${
            rt.is_active
              ? 'border-yellow-300 text-yellow-700 hover:bg-yellow-50'
              : 'border-green-300 text-green-700 hover:bg-green-50'
          }`}
        >
          {rt.is_active ? 'Deactivate' : 'Activate'}
        </button>
        <button
          onClick={onDelete}
          className="ml-auto flex items-center gap-1.5 px-3 py-1.5 text-xs border border-red-200 rounded-lg text-red-500 hover:bg-red-50 transition-colors"
        >
          <Trash2 size={12} />
          Delete
        </button>
      </div>
    </div>
  );
}

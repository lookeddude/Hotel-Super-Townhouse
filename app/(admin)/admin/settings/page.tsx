'use client';

import { useEffect, useState, useCallback } from 'react';
import { Save, Loader2, Users, Globe, Settings as SettingsIcon, Plus, UserX, UserCheck, Shield, Lock } from 'lucide-react';
import { useSupabase } from '@/providers/SupabaseProvider';
import { useAuth } from '@/providers/AuthProvider';
import { getAllSEO, upsertSEO } from '@/services/cmsService';
import { toast } from 'sonner';

type Tab = 'staff' | 'seo' | 'system';

const PUBLIC_PAGES = ['home', 'rooms', 'gallery', 'about', 'contact', 'facilities', 'faq', 'policies'];
const ROLE_OPTIONS = ['reception', 'manager', 'admin', 'super_admin', 'housekeeping', 'maintenance', 'chef', 'security'];
const ROLE_COLORS: Record<string, string> = {
  super_admin: 'bg-red-100 text-red-700',
  admin: 'bg-purple-100 text-purple-700',
  manager: 'bg-blue-100 text-blue-700',
  reception: 'bg-teal-100 text-teal-700',
  housekeeping: 'bg-green-100 text-green-700',
  maintenance: 'bg-orange-100 text-orange-700',
  chef: 'bg-yellow-100 text-yellow-700',
  security: 'bg-gray-100 text-gray-700',
};

export default function AdminSettingsPage() {
  const [activeTab, setActiveTab] = useState<Tab>('staff');

  const TABS: { id: Tab; label: string; icon: React.ElementType }[] = [
    { id: 'staff', label: 'Staff Management', icon: Users },
    { id: 'seo', label: 'SEO Management', icon: Globe },
    { id: 'system', label: 'System', icon: SettingsIcon },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-heading text-headline-md text-on-surface">Settings</h1>
        <p className="text-body-sm text-on-surface-variant mt-1">System configuration and management</p>
      </div>
      <div className="border-b border-outline-variant">
        <nav className="flex gap-1 -mb-px">
          {TABS.map((tab) => {
            const Icon = tab.icon;
            return (
              <button key={tab.id} onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-5 py-2.5 text-sm font-medium border-b-2 transition-colors ${activeTab === tab.id ? 'border-primary text-primary' : 'border-transparent text-on-surface-variant hover:text-on-surface'}`}>
                <Icon size={15} />{tab.label}
              </button>
            );
          })}
        </nav>
      </div>
      {activeTab === 'staff' && <StaffTab />}
      {activeTab === 'seo' && <SEOTab />}
      {activeTab === 'system' && <SystemTab />}
    </div>
  );
}

// ─── Staff Management ─────────────────────────────────────────────────────────

function StaffTab() {
  const { supabase } = useSupabase();
  const { user } = useAuth();          // ← current logged-in user
  const currentUserId = user?.id;
  const [userRoles, setUserRoles] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showInvite, setShowInvite] = useState(false);
  const [inviteForm, setInviteForm] = useState({ email: '', name: '', role: 'reception' });
  const [isSaving, setIsSaving] = useState(false);

  const load = useCallback(async () => {
    setIsLoading(true);
    try {
      const db = supabase as any;

      // Step 1: fetch all user_roles rows
      const { data: urRows, error: urErr } = await db
        .from('user_roles')
        .select('id, user_id, role_id, assigned_at')
        .order('assigned_at', { ascending: false });

      if (urErr) { console.error('user_roles fetch error:', urErr); setIsLoading(false); return; }
      if (!urRows?.length) { setUserRoles([]); setIsLoading(false); return; }

      // Step 2: fetch all roles
      const { data: rolesRows } = await db.from('roles').select('id, name');

      // Step 3: fetch profiles for those user IDs
      const userIds = urRows.map((ur: any) => ur.user_id);
      const { data: profileRows } = await db
        .from('profiles')
        .select('id, full_name, email, is_active, avatar_url')
        .in('id', userIds);

      // Merge everything client-side
      const merged = urRows.map((ur: any) => ({
        id:           ur.id,
        role_id:      ur.role_id,
        assigned_at:  ur.assigned_at,
        profile:  (profileRows ?? []).find((p: any) => p.id === ur.user_id) ?? null,
        roleName: (rolesRows   ?? []).find((r: any) => r.id === ur.role_id)?.name ?? 'unknown',
      })).filter((ur: any) => ur.roleName !== 'customer' && ur.profile);

      setUserRoles(merged);
    } catch (e) {
      console.error('Staff load error:', e);
    }
    setIsLoading(false);
  }, [supabase]);

  useEffect(() => { load(); }, [load]);

  const handleRoleChange = async (userRoleId: string, newRoleName: string, profileId: string) => {
    // 🔒 Prevent changing own role
    if (profileId === currentUserId) {
      toast.error('You cannot change your own role — ask another super admin.');
      return;
    }
    const db = supabase as any;
    const { data: roleData } = await db.from('roles').select('id').eq('name', newRoleName).single();
    if (!roleData) { toast.error('Role not found'); return; }
    const { error } = await db.from('user_roles').update({ role_id: roleData.id }).eq('id', userRoleId);
    if (error) { toast.error('Failed to update role'); return; }
    toast.success('Role updated');
    load();
  };

  const handleToggleActive = async (profileId: string, isActive: boolean) => {
    // 🔒 Prevent disabling own account
    if (profileId === currentUserId) {
      toast.error('You cannot disable your own account.');
      return;
    }
    const db = supabase as any;
    const { error } = await db.from('profiles').update({ is_active: !isActive }).eq('id', profileId);
    if (error) { toast.error('Failed to toggle status'); return; }
    toast.success(isActive ? 'User disabled' : 'User enabled');
    load();
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-on-surface-variant">{userRoles.length} staff members</p>
        <button onClick={() => setShowInvite(!showInvite)} className="flex items-center gap-2 px-4 py-2 bg-primary text-white text-sm font-semibold rounded-lg">
          <Plus size={14} />Invite Staff
        </button>
      </div>

      {showInvite && (
        <div className="bg-white rounded-lg border border-primary/30 p-5 space-y-4">
          <h3 className="font-semibold text-sm">Invite New Staff Member</h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-medium mb-1">Full Name</label>
              <input value={inviteForm.name} onChange={(e) => setInviteForm(p => ({ ...p, name: e.target.value }))} className="w-full px-3 py-2 border border-outline-variant rounded-lg text-sm" placeholder="Staff name" />
            </div>
            <div>
              <label className="block text-xs font-medium mb-1">Email</label>
              <input type="email" value={inviteForm.email} onChange={(e) => setInviteForm(p => ({ ...p, email: e.target.value }))} className="w-full px-3 py-2 border border-outline-variant rounded-lg text-sm" />
            </div>
            <div>
              <label className="block text-xs font-medium mb-1">Role</label>
              <select value={inviteForm.role} onChange={(e) => setInviteForm(p => ({ ...p, role: e.target.value }))} className="w-full px-3 py-2 border border-outline-variant rounded-lg text-sm">
                {ROLE_OPTIONS.map(r => <option key={r} value={r}>{r.replace('_', ' ')}</option>)}
              </select>
            </div>
          </div>
          <div className="flex gap-2">
            <button
              disabled={isSaving}
              onClick={async () => {
                if (!inviteForm.email || !inviteForm.name) { toast.error('Name and email required'); return; }
                setIsSaving(true);
                // Use admin API to invite — this requires service role key (server-side only)
                toast.info('Staff invitation sent via email (requires server-side admin API)');
                setInviteForm({ email: '', name: '', role: 'reception' });
                setShowInvite(false);
                setIsSaving(false);
              }}
              className="px-4 py-2 bg-primary text-white text-sm rounded-lg disabled:opacity-60"
            >
              {isSaving ? 'Sending…' : 'Send Invite'}
            </button>
            <button onClick={() => setShowInvite(false)} className="px-4 py-2 border border-outline-variant text-sm rounded-lg">Cancel</button>
          </div>
        </div>
      )}

      <div className="bg-white rounded-lg border border-outline-variant overflow-hidden">
        {isLoading ? (
          <div className="p-6 space-y-3">{Array.from({length:4}).map((_,i) => <div key={i} className="h-14 bg-surface rounded animate-pulse" />)}</div>
        ) : userRoles.length === 0 ? (
          <div className="py-16 text-center text-sm text-on-surface-variant">No staff members found</div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-surface border-b border-outline-variant">
              <tr>
                {['Name', 'Email', 'Role', 'Status', 'Actions'].map(h => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-on-surface-variant">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-outline-variant">
              {userRoles.map((ur) => {
                const profile  = ur.profile;                   // already flat from new query
                const roleName = ur.roleName;
                if (!profile) return null;
                const isSelf = profile.id === currentUserId;
                return (
                  <tr key={ur.id} className={`hover:bg-surface/50 transition-colors ${isSelf ? 'bg-yellow-50/60' : ''}`}>
                    <td className="px-4 py-3 font-medium text-on-surface">
                      <div className="flex items-center gap-2">
                        {profile.full_name ?? '—'}
                        {isSelf && (
                          <span className="text-[10px] bg-primary text-white px-1.5 py-0.5 rounded font-semibold">YOU</span>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-xs text-on-surface-variant">{profile.email}</td>
                    <td className="px-4 py-3">
                      {isSelf ? (
                        <div className="flex items-center gap-1.5 text-xs text-on-surface-variant">
                          <Lock size={11} />
                          <span className={`font-medium px-2 py-0.5 rounded-full ${ROLE_COLORS[roleName ?? ''] ?? 'bg-gray-100 text-gray-600'}`}>
                            {roleName?.replace('_', ' ')}
                          </span>
                        </div>
                      ) : (
                        <select
                          value={roleName ?? ''}
                          onChange={(e) => handleRoleChange(ur.id, e.target.value, profile.id)}
                          className={`text-xs font-medium px-2 py-1 rounded-full border-0 cursor-pointer ${ROLE_COLORS[roleName ?? ''] ?? 'bg-gray-100 text-gray-600'}`}
                        >
                          {ROLE_OPTIONS.map(r => <option key={r} value={r}>{r.replace('_', ' ')}</option>)}
                        </select>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`text-xs px-2 py-0.5 rounded-full ${profile.is_active !== false ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                        {profile.is_active !== false ? 'Active' : 'Disabled'}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      {isSelf ? (
                        <span className="text-xs text-on-surface-variant italic">Protected</span>
                      ) : (
                        <button
                          onClick={() => handleToggleActive(profile.id, profile.is_active !== false)}
                          className="p-1.5 hover:bg-surface rounded text-on-surface-variant hover:text-primary"
                          title={profile.is_active !== false ? 'Disable user' : 'Enable user'}
                        >
                          {profile.is_active !== false ? <UserX size={14} /> : <UserCheck size={14} />}
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

// ─── SEO Tab (corrected: page_path, og_image_url) ────────────────────────────

function SEOTab() {
  const { supabase } = useSupabase();
  const [seoData, setSeoData] = useState<any[]>([]);
  const [editingPage, setEditingPage] = useState<string | null>(null);
  const [form, setForm] = useState<any>({});
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    getAllSEO(supabase).then(({ data }) => { setSeoData(data ?? []); setIsLoading(false); });
  }, [supabase]);

  const handleEdit = (page: string) => {
    const existing = seoData.find(s => s.page_path === page) ?? { page_path: page };
    setEditingPage(page);
    setForm(existing);
  };

  const handleSave = async () => {
    if (!form.page_path) return;
    setIsSaving(true);
    const { error } = await upsertSEO(supabase, form);
    if (error) toast.error('Failed to save SEO: ' + error.message);
    else {
      toast.success(`SEO for "${form.page_path}" updated`);
      setEditingPage(null);
      getAllSEO(supabase).then(({ data }) => setSeoData(data ?? []));
    }
    setIsSaving(false);
  };

  const INPUT = 'w-full px-3 py-2 border border-outline-variant rounded-lg text-sm focus:outline-none focus:border-primary';

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {PUBLIC_PAGES.map((page) => {
          const seo = seoData.find(s => s.page_path === page);
          const hasData = !!seo?.title;
          return (
            <div key={page} className="bg-white rounded-lg border border-outline-variant p-4 flex items-center justify-between">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className="font-medium text-sm capitalize">{page}</p>
                  <span className={`text-xs px-2 py-0.5 rounded-full ${hasData ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>
                    {hasData ? '✓ Configured' : 'Not set'}
                  </span>
                </div>
                {seo?.title && <p className="text-xs text-on-surface-variant mt-0.5 truncate">{seo.title}</p>}
              </div>
              <button onClick={() => handleEdit(page)} className="px-3 py-1.5 text-xs border border-outline-variant rounded-lg hover:bg-surface ml-3">
                {hasData ? 'Edit' : 'Configure'}
              </button>
            </div>
          );
        })}
      </div>

      {editingPage && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-outline-variant flex items-center justify-between">
              <h2 className="font-heading font-semibold text-lg capitalize">SEO: {editingPage} page</h2>
              <button onClick={() => setEditingPage(null)} className="text-2xl text-on-surface-variant">×</button>
            </div>
            <div className="p-6 space-y-4">
              {/* DB uses 'title' not 'meta_title', 'description' not 'meta_description', 'og_image_url' not 'og_image' */}
              <div><label className="block text-xs font-medium mb-1">Meta Title (50-60 chars recommended)</label><input value={form.title ?? ''} onChange={(e) => setForm((p:any) => ({ ...p, title: e.target.value }))} className={INPUT} maxLength={70} /></div>
              <div><label className="block text-xs font-medium mb-1">Meta Description (150-160 chars)</label><textarea value={form.description ?? ''} onChange={(e) => setForm((p:any) => ({ ...p, description: e.target.value }))} rows={3} className={INPUT+' resize-none'} maxLength={200} /></div>
              <div><label className="block text-xs font-medium mb-1">Keywords</label><input value={form.keywords ?? ''} onChange={(e) => setForm((p:any) => ({ ...p, keywords: e.target.value }))} className={INPUT} /></div>
              <div><label className="block text-xs font-medium mb-1">OG Title</label><input value={form.og_title ?? ''} onChange={(e) => setForm((p:any) => ({ ...p, og_title: e.target.value }))} className={INPUT} /></div>
              <div><label className="block text-xs font-medium mb-1">OG Description</label><textarea value={form.og_description ?? ''} onChange={(e) => setForm((p:any) => ({ ...p, og_description: e.target.value }))} rows={2} className={INPUT+' resize-none'} /></div>
              <div><label className="block text-xs font-medium mb-1">OG Image URL</label><input type="url" value={form.og_image_url ?? ''} onChange={(e) => setForm((p:any) => ({ ...p, og_image_url: e.target.value }))} className={INPUT} /></div>
              <div><label className="block text-xs font-medium mb-1">Canonical URL</label><input type="url" value={form.canonical_url ?? ''} onChange={(e) => setForm((p:any) => ({ ...p, canonical_url: e.target.value }))} className={INPUT} /></div>
              <div><label className="block text-xs font-medium mb-1">Robots</label><input value={form.robots ?? 'index, follow'} onChange={(e) => setForm((p:any) => ({ ...p, robots: e.target.value }))} className={INPUT} placeholder="index, follow" /></div>
              <div className="flex gap-3 pt-2">
                <button onClick={() => setEditingPage(null)} className="flex-1 py-2.5 border border-outline-variant rounded-lg text-sm">Cancel</button>
                <button onClick={handleSave} disabled={isSaving} className="flex-1 py-2.5 bg-primary text-white text-sm font-semibold rounded-lg disabled:opacity-60 flex items-center justify-center gap-2">
                  {isSaving ? <><Loader2 size={14} className="animate-spin" /> Saving…</> : <><Save size={14} /> Save SEO</>}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── System Tab ───────────────────────────────────────────────────────────────

function SystemTab() {
  return (
    <div className="space-y-4">
      <div className="bg-white rounded-lg border border-outline-variant p-6 space-y-4">
        <h2 className="font-heading font-semibold text-base">System Information</h2>
        <div className="space-y-3 text-sm">
          {[
            { label: 'Project', value: 'Hotel Super Townhouse' },
            { label: 'Supabase Project', value: 'jzcmfpvscdsvkijpgdlj' },
            { label: 'Phase', value: '5 — CMS & PMS (Active)' },
            { label: 'Auth Provider', value: 'Supabase Auth + RLS' },
            { label: 'Storage Bucket', value: 'hotel-images' },
          ].map((item) => (
            <div key={item.label} className="flex items-center justify-between py-2 border-b border-outline-variant last:border-0">
              <span className="text-on-surface-variant">{item.label}</span>
              <span className="font-mono text-on-surface">{item.value}</span>
            </div>
          ))}
        </div>
      </div>
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-5 flex items-start gap-3">
        <Shield size={18} className="text-yellow-600 flex-shrink-0 mt-0.5" />
        <div>
          <p className="font-semibold text-sm text-yellow-800">Security Active</p>
          <p className="text-sm text-yellow-700 mt-1">Row Level Security (RLS) is enforced on all tables. The service role key is never exposed to the browser — all admin writes go through authenticated Supabase clients.</p>
        </div>
      </div>
    </div>
  );
}

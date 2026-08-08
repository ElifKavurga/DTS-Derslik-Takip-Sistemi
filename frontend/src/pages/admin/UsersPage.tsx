import { useState, useMemo, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import toast from 'react-hot-toast';
import {
  Plus, Edit2, Trash2,
  ChevronUp, ChevronDown, ChevronsUpDown,
  SlidersHorizontal, X, Mail, Building2, BookOpen,
  GraduationCap, Eye, KeyRound, ToggleLeft, ToggleRight,
  MoreVertical,
} from 'lucide-react';
import { AxiosError } from 'axios';
import { cn } from '@/utils/cn';

import { PrimaryButton }   from '@/components/ui/PrimaryButton';
import { SecondaryButton } from '@/components/ui/SecondaryButton';
import { ConfirmDialog }   from '@/components/ui/ConfirmDialog';
import { FormModal }       from '@/components/ui/FormModal';
import { AppSelect }       from '@/components/ui/AppSelect';
import { userService }     from '@/services/userService';
import { facultyService }  from '@/services/facultyService';
import { departmentService } from '@/services/departmentService';
import { Role }            from '@/types';

// ── Rol meta ─────────────────────────────────────────────────────────────────
const ROLE_META: Record<Role, { label: string; cls: string }> = {
  SUPER_ADMIN:      { label: 'Süper Admin',  cls: 'bg-indigo-950 text-white border-indigo-900' },
  DEPARTMENT_ADMIN: { label: 'Bölüm Admini', cls: 'bg-orange-500 text-white border-orange-400' },
  ACADEMICIAN:      { label: 'Akademisyen',  cls: 'bg-sky-600 text-white border-sky-500'   },
};

const ACADEMIC_TITLE_OPTIONS = [
  { label: 'Profesör Dr.', value: 'Profesör Dr.' },
  { label: 'Doçent Dr.', value: 'Doçent Dr.' },
  { label: 'Dr. Öğretim Üyesi', value: 'Dr. Öğretim Üyesi' },
  { label: 'Araştırma Görevlisi', value: 'Araştırma Görevlisi' },
];

const LEGACY_TITLE_MAP: Record<string, string> = {
  PROFESOR: 'Profesör Dr.',
  DOCENT: 'Doçent Dr.',
  DR_OGRETIM_UYESI: 'Dr. Öğretim Üyesi',
  ARASTIRMA_GOREVLISI: 'Araştırma Görevlisi',
  'Prof. Dr.': 'Profesör Dr.',
  'Doç. Dr.': 'Doçent Dr.',
  'Dr. Öğr. Üyesi': 'Dr. Öğretim Üyesi',
  'Arş. Gör.': 'Araştırma Görevlisi',
};

const normalizeAcademicTitle = (title?: string | null) => {
  const trimmed = title?.trim();
  if (!trimmed) return '';
  return LEGACY_TITLE_MAP[trimmed] ?? (ACADEMIC_TITLE_OPTIONS.some((option) => option.value === trimmed) ? trimmed : '');
};

// ── Avatar initials ──────────────────────────────────────────────────────────
const AVATAR_COLORS = [
  'bg-violet-600', 'bg-sky-600', 'bg-emerald-600',
  'bg-orange-500', 'bg-rose-600', 'bg-teal-600', 'bg-indigo-600',
];
const avatarColor = (name: string) =>
  AVATAR_COLORS[
    name.split('').reduce((acc, c) => acc + c.charCodeAt(0), 0) % AVATAR_COLORS.length
  ];
const initials = (first: string, last: string) =>
  `${first?.[0] ?? ''}${last?.[0] ?? ''}`.toUpperCase();

// ── Zod şeması ───────────────────────────────────────────────────────────────
const userSchema = z.object({
  firstName:    z.string().min(1, 'Ad zorunludur.'),
  lastName:     z.string().min(1, 'Soyad zorunludur.'),
  email:        z.string().email('Geçerli bir e-posta giriniz.'),
  password:     z.string().min(6).optional(),
  roles:        z.array(z.enum(['SUPER_ADMIN', 'DEPARTMENT_ADMIN', 'ACADEMICIAN'])).min(1, 'En az bir rol seçilmelidir.'),
  phone:        z.string().optional(),
  active:       z.boolean().optional(),
  title:        z.string().optional(),
  facultyId:    z.string().optional(),
  departmentId: z.string().optional(),
}).superRefine((values, ctx) => {
  const roles = values.roles ?? [];
  const needsFacultyDepartment = roles.includes('ACADEMICIAN') || roles.includes('DEPARTMENT_ADMIN');
  if (needsFacultyDepartment && !values.facultyId) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['facultyId'], message: 'Fakülte seçimi zorunludur.' });
  }
  if (needsFacultyDepartment && !values.departmentId) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['departmentId'], message: 'Bölüm seçimi zorunludur.' });
  }
  if (roles.includes('ACADEMICIAN')) {
    if (!values.title?.trim()) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['title'], message: 'Akademisyenler için unvan seçilmelidir.' });
    }
    if (!values.phone?.trim()) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['phone'], message: 'Telefon zorunludur.' });
    }
  }
});

const pwSchema = z.object({
  newPassword:     z.string().min(6, 'En az 6 karakter olmalıdır.'),
  confirmPassword: z.string().min(6),
}).refine((v) => v.newPassword === v.confirmPassword, {
  message: 'Parolalar eşleşmiyor.',
  path: ['confirmPassword'],
});

type UserFormValues = z.infer<typeof userSchema>;
type PwFormValues   = z.infer<typeof pwSchema>;
type SortKey = 'name' | 'email' | 'faculty' | 'department';
type SortDir = 'asc' | 'desc';

// ── InfoRow ──────────────────────────────────────────────────────────────────
const InfoRow = ({ icon, text }: { icon: React.ReactNode; text?: string | null }) => {
  if (!text) return null;
  return (
    <div className="flex items-center gap-1.5 text-[11px] text-slate-500 leading-none">
      <span className="shrink-0 text-slate-400">{icon}</span>
      <span className="truncate">{text}</span>
    </div>
  );
};

// ── UserActionsMenu (custom, richer) ─────────────────────────────────────────
interface UserActionsMenuProps {
  user:          any;
  onEdit:        () => void;
  onDelete:      () => void;
  onToggleActive: () => void;
  onResetPw:     () => void;
  onViewProfile: () => void;
}

const UserActionsMenu = ({
  user, onEdit, onDelete, onToggleActive, onResetPw, onViewProfile,
}: UserActionsMenuProps) => {
  const [open, setOpen] = useState(false);
  const [menuPos, setMenuPos] = useState<{ top: number; right: number } | null>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const menuRef  = useRef<HTMLDivElement>(null);

  // Dış tıklama ile kapat
  useEffect(() => {
    const h = (e: MouseEvent) => {
      const target = e.target as Node;
      if (
        buttonRef.current && !buttonRef.current.contains(target) &&
        menuRef.current  && !menuRef.current.contains(target)
      ) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, []);

  const handleToggle = () => {
    if (!open && buttonRef.current) {
      const r = buttonRef.current.getBoundingClientRect();
      setMenuPos({
        top:   r.bottom + 6,
        right: window.innerWidth - r.right,
      });
    }
    setOpen((o) => !o);
  };

  const items = [
    { label: 'Profili Görüntüle',    icon: <Eye className="h-3.5 w-3.5" />,        onClick: onViewProfile,  variant: 'default' as const },
    { label: 'Düzenle',              icon: <Edit2 className="h-3.5 w-3.5" />,       onClick: onEdit,         variant: 'default' as const },
    { label: 'Şifre Sıfırla',        icon: <KeyRound className="h-3.5 w-3.5" />,   onClick: onResetPw,      variant: 'default' as const },
    {
      label: user.active ? 'Pasif Yap' : 'Aktif Yap',
      icon: user.active
        ? <ToggleLeft className="h-3.5 w-3.5" />
        : <ToggleRight className="h-3.5 w-3.5" />,
      onClick: onToggleActive,
      variant: 'default' as const,
    },
    { label: 'Sil', icon: <Trash2 className="h-3.5 w-3.5" />, onClick: onDelete, variant: 'danger' as const },
  ];

  return (
    <div className="shrink-0">
      <button
        ref={buttonRef}
        type="button"
        onMouseDown={(e) => e.stopPropagation()}
        onClick={handleToggle}
        className="flex h-8 w-8 items-center justify-center rounded-xl hover:bg-slate-100 text-slate-400 hover:text-slate-700 transition"
      >
        <MoreVertical className="h-4 w-4" />
      </button>

      {open && menuPos && createPortal(
        <div
          ref={menuRef}
          style={{ position: 'fixed', top: menuPos.top, right: menuPos.right, zIndex: 9999 }}
          className="w-48 rounded-2xl border border-slate-200/50 bg-white p-1.5 shadow-2xl shadow-slate-300/40"
        >
          {items.map((item, i) => (
            <button
              key={i}
              type="button"
              onMouseDown={(e) => e.stopPropagation()}
              onClick={() => { setOpen(false); item.onClick(); }}
              className={cn(
                'flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-[12px] font-semibold transition',
                item.variant === 'danger'
                  ? 'text-red-600 hover:bg-red-50'
                  : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900',
              )}
            >
              <span className={item.variant === 'danger' ? 'text-red-400' : 'text-slate-400'}>
                {item.icon}
              </span>
              {item.label}
            </button>
          ))}
        </div>,
        document.body,
      )}
    </div>
  );
};

// ── UserCard ─────────────────────────────────────────────────────────────────
interface UserCardProps {
  user:           any;
  onEdit:         () => void;
  onDelete:       () => void;
  onToggleActive: () => void;
  onResetPw:      () => void;
  onViewProfile:  () => void;
}

const UserCard = ({ user, onEdit, onDelete, onToggleActive, onResetPw, onViewProfile }: UserCardProps) => {
  const userRoles: Role[] = user.roles ?? (user.role ? [user.role] : []);
  const color  = avatarColor(`${user.firstName}${user.lastName}`);
  const inits  = initials(user.firstName, user.lastName);

  return (
    <div
      className="group relative flex items-center gap-4 rounded-2xl border border-slate-200/50 bg-white px-5 py-4 transition-all duration-200 ease-out hover:-translate-y-px hover:border-[#88d0f2]/60 hover:shadow-lg hover:shadow-slate-200/70"
      style={{ boxShadow: '0 1px 3px rgba(15,23,42,0.04), 0 4px 16px -4px rgba(15,23,42,0.06)' }}
    >
      {/* Left accent */}
      <div className="absolute inset-y-0 left-0 w-[3px] rounded-l-2xl bg-transparent group-hover:bg-[#006482] transition-colors duration-200" />

      {/* ── Avatar ── */}
      <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-sm font-bold text-white tracking-wide select-none ${color}`}>
        {inits}
      </div>

      {/* ── Sol: İsim + E-posta ── */}
      <div className="w-48 shrink-0 min-w-0">
        <p className="text-[13px] font-bold text-slate-900 leading-snug truncate">
          {user.firstName} {user.lastName}
        </p>
        <div className="mt-0.5 flex items-center gap-1 text-[11px] text-slate-400 truncate">
          <Mail className="h-3 w-3 shrink-0" />
          <span className="truncate">{user.email}</span>
        </div>
      </div>

      {/* ── Orta: Ek bilgiler ── */}
      <div className="flex-1 min-w-0 grid grid-cols-2 gap-x-6 gap-y-1 px-2">
        <InfoRow icon={<Building2 className="h-3 w-3" />}   text={user.faculty}    />
        <InfoRow icon={<GraduationCap className="h-3 w-3" />} text={user.title}    />
        <InfoRow icon={<BookOpen className="h-3 w-3" />}    text={user.department} />
      </div>

      {/* ── Sağ: Roller + Durum + Aksiyonlar ── */}
      <div className="flex items-center gap-2 shrink-0">
        {/* Rol badge'leri */}
        <div className="flex flex-wrap justify-end gap-1 max-w-[200px]">
          {userRoles.map((r) => (
            <span key={r} className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-bold tracking-wide ${ROLE_META[r].cls}`}>
              {ROLE_META[r].label}
            </span>
          ))}
        </div>

        {/* Durum badge */}
        <span className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-bold whitespace-nowrap ${
          user.active
            ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
            : 'bg-red-50 text-red-500 border-red-200'
        }`}>
          <span className={`h-1.5 w-1.5 rounded-full ${user.active ? 'bg-emerald-500' : 'bg-red-400'}`} />
          {user.active ? 'Aktif' : 'Pasif'}
        </span>

        {/* Düzenle butonu */}
        <button
          type="button"
          onClick={onEdit}
          className="flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-[11px] font-semibold text-slate-600 shadow-sm transition-all duration-150 hover:border-[#006482]/40 hover:bg-[#eff8ff] hover:text-[#006482] group-hover:border-[#006482]/20 active:scale-95"
        >
          <Edit2 className="h-3 w-3" />
          Düzenle
        </button>

        {/* Zengin üç nokta menüsü */}
        <UserActionsMenu
          user={user}
          onEdit={onEdit}
          onDelete={onDelete}
          onToggleActive={onToggleActive}
          onResetPw={onResetPw}
          onViewProfile={onViewProfile}
        />
      </div>
    </div>
  );
};

// ── FilterPopover ────────────────────────────────────────────────────────────
interface FilterPopoverProps {
  faculties: string[]; departments: string[];
  filterRole: string; filterFaculty: string; filterDepartment: string; filterActive: string;
  onChangeRole: (v: string) => void; onChangeFaculty: (v: string) => void;
  onChangeDepartment: (v: string) => void; onChangeActive: (v: string) => void;
  onClearAll: () => void; activeCount: number;
}

const FilterPopover = ({
  faculties, departments,
  filterRole, filterFaculty, filterDepartment, filterActive,
  onChangeRole, onChangeFaculty, onChangeDepartment, onChangeActive,
  onClearAll, activeCount,
}: FilterPopoverProps) => {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  // Listener her zaman aktif; buton mousedown'ı durdurarak toggle ile çakışmayı önler
  useEffect(() => {
    const h = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, []);

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onMouseDown={(e) => e.stopPropagation()}
        onClick={() => setOpen((o) => !o)}
        className={cn(
          'flex items-center gap-2 rounded-2xl border px-4 py-2.5 text-sm font-semibold shadow-sm transition-all duration-200 whitespace-nowrap',
          activeCount > 0
            ? 'border-[#006482]/30 bg-[#eff8ff] text-[#006482] hover:bg-[#ddf0fb]'
            : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300 hover:bg-slate-50',
        )}
      >
        <SlidersHorizontal className="h-4 w-4" />
        Filtrele
        {activeCount > 0 && (
          <span className="flex h-5 w-5 items-center justify-center rounded-full bg-[#006482] text-[10px] font-bold text-white">
            {activeCount}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-2 z-50 w-96 rounded-3xl border border-slate-200/60 bg-white p-5 shadow-2xl shadow-slate-200/60">
          <div className="mb-4 flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-widest text-slate-400">Filtreler</span>
            {activeCount > 0 && (
              <button type="button" onClick={onClearAll} className="flex items-center gap-1 text-[11px] font-semibold text-slate-400 hover:text-red-500 transition-colors">
                <X className="h-3 w-3" /> Temizle
              </button>
            )}
          </div>
          <div className="space-y-3">
            <div>
              <label className="dts-input-label">Rol</label>
              <AppSelect
                value={filterRole}
                onChange={onChangeRole}
                options={[{ label: 'Tüm Roller', value: '' }, ...Object.keys(ROLE_META).map((role) => ({ label: ROLE_META[role as Role].label, value: role }))]}
                placeholder="Tüm Roller"
              />
            </div>
            {faculties.length > 0 && (
              <div>
                <label className="dts-input-label">Fakülte</label>
                <AppSelect
                  value={filterFaculty}
                  onChange={onChangeFaculty}
                  options={[{ label: 'Tüm Fakülteler', value: '' }, ...faculties.map((faculty) => ({ label: faculty, value: faculty }))]}
                  searchable
                  placeholder="Tüm Fakülteler"
                />
              </div>
            )}
            {departments.length > 0 && (
              <div>
                <label className="dts-input-label">Bölüm</label>
                <AppSelect
                  value={filterDepartment}
                  onChange={onChangeDepartment}
                  options={[{ label: 'Tüm Bölümler', value: '' }, ...departments.map((department) => ({ label: department, value: department }))]}
                  searchable
                  placeholder="Tüm Bölümler"
                />
              </div>
            )}
            <div>
              <label className="dts-input-label">Durum</label>
              <AppSelect
                value={filterActive}
                onChange={onChangeActive}
                options={[
                  { label: 'Tüm Durumlar', value: '' },
                  { label: 'Aktif', value: 'true' },
                  { label: 'Pasif', value: 'false' },
                ]}
                placeholder="Tüm Durumlar"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// ── ProfileViewModal ──────────────────────────────────────────────────────────
const ProfileViewModal = ({ user, onClose }: { user: any; onClose: () => void }) => {
  if (!user) return null;
  const userRoles: Role[] = user.roles ?? (user.role ? [user.role] : []);
  const color = avatarColor(`${user.firstName}${user.lastName}`);
  const inits = initials(user.firstName, user.lastName);

  return (
    <FormModal isOpen={!!user} onClose={onClose} title="Kullanıcı Profili">
      <div className="space-y-5">
        <div className="flex items-center gap-4">
          <div className={`flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl text-xl font-bold text-white ${color}`}>
            {inits}
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-900">
              {user.title ? <span className="text-slate-500">{user.title} </span> : null}
              {user.firstName} {user.lastName}
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">{user.email}</p>
            <div className="mt-2 flex flex-wrap gap-1.5">
              {userRoles.map((r) => (
                <span key={r} className={`rounded-full border px-2 py-0.5 text-[10px] font-bold ${ROLE_META[r].cls}`}>
                  {ROLE_META[r].label}
                </span>
              ))}
              <span className={`rounded-full border px-2 py-0.5 text-[10px] font-bold ${user.active ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-red-50 text-red-500 border-red-200'}`}>
                {user.active ? 'Aktif' : 'Pasif'}
              </span>
            </div>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3 rounded-2xl bg-slate-50/70 p-4 border border-slate-100">
          {[
            { icon: <Building2 className="h-3.5 w-3.5" />,    label: 'Fakülte',  value: user.faculty },
            { icon: <BookOpen className="h-3.5 w-3.5" />,     label: 'Bölüm',    value: user.department },
            { icon: <GraduationCap className="h-3.5 w-3.5" />, label: 'Unvan',   value: user.title },
            { icon: <Mail className="h-3.5 w-3.5" />,         label: 'Telefon',  value: user.phone },
          ].map(({ icon, label, value }) =>
            value ? (
              <div key={label}>
                <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">{label}</p>
                <div className="mt-0.5 flex items-center gap-1.5 text-[12px] text-slate-700 font-medium">
                  <span className="text-slate-400">{icon}</span> {value}
                </div>
              </div>
            ) : null,
          )}
        </div>
        <div className="flex justify-end">
          <SecondaryButton onClick={onClose}>Kapat</SecondaryButton>
        </div>
      </div>
    </FormModal>
  );
};

// ── PwResetModal ──────────────────────────────────────────────────────────────
const PwResetModal = ({
  user, onClose, onConfirm, loading,
}: { user: any; onClose: () => void; onConfirm: (pw: string) => void; loading: boolean }) => {
  const { register, handleSubmit, formState: { errors } } = useForm<PwFormValues>({
    resolver: zodResolver(pwSchema),
  });
  if (!user) return null;
  return (
    <FormModal isOpen={!!user} onClose={onClose} title={`Şifre Sıfırla — ${user.firstName} ${user.lastName}`}>
      <form onSubmit={handleSubmit((v) => onConfirm(v.newPassword))} className="space-y-4">
        <div className="space-y-1">
          <label className="dts-input-label">Yeni Parola</label>
          <input type="password" {...register('newPassword')} className={`dts-input ${errors.newPassword ? 'border-red-300' : ''}`} />
          {errors.newPassword && <p className="text-[11px] text-red-500">{errors.newPassword.message}</p>}
        </div>
        <div className="space-y-1">
          <label className="dts-input-label">Parola Tekrar</label>
          <input type="password" {...register('confirmPassword')} className={`dts-input ${errors.confirmPassword ? 'border-red-300' : ''}`} />
          {errors.confirmPassword && <p className="text-[11px] text-red-500">{errors.confirmPassword.message}</p>}
        </div>
        <div className="flex justify-end gap-3 border-t border-slate-100 pt-4">
          <SecondaryButton type="button" onClick={onClose}>İptal</SecondaryButton>
          <PrimaryButton type="submit" loading={loading}>Parolayı Sıfırla</PrimaryButton>
        </div>
      </form>
    </FormModal>
  );
};

// ── Ana bileşen ───────────────────────────────────────────────────────────────
export const UsersPage = () => {
  const queryClient = useQueryClient();

  const [searchQuery,      setSearchQuery]      = useState('');
  const [filterRole,       setFilterRole]       = useState('');
  const [filterFaculty,    setFilterFaculty]    = useState('');
  const [filterDepartment, setFilterDepartment] = useState('');
  const [filterActive,     setFilterActive]     = useState('');
  const [sortKey,  setSortKey]  = useState<SortKey>('name');
  const [sortDir,  setSortDir]  = useState<SortDir>('asc');

  const [isModalOpen,   setIsModalOpen]   = useState(false);
  const [editingUser,   setEditingUser]   = useState<any | null>(null);
  const [deletingUser,  setDeletingUser]  = useState<any | null>(null);
  const [viewingUser,   setViewingUser]   = useState<any | null>(null);
  const [pwResetUser,   setPwResetUser]   = useState<any | null>(null);

    const { register, handleSubmit, reset, watch, control, setValue, formState: { errors } } = useForm<UserFormValues>({
    resolver: zodResolver(userSchema),
    defaultValues: { firstName: '', lastName: '', email: '', password: undefined, roles: [], active: true, facultyId: '', departmentId: '' },
  });
  const watchedRoles = watch('roles') || [];
  const watchedFacultyId = watch('facultyId');
  const watchedDepartmentId = watch('departmentId');
  const needsFacultyDepartment = watchedRoles.includes('ACADEMICIAN') || watchedRoles.includes('DEPARTMENT_ADMIN');
  const isAcademician = watchedRoles.includes('ACADEMICIAN');

  const { data, isLoading } = useQuery({ queryKey: ['users'], queryFn: userService.getAll });
  const usersList: any[] = useMemo(() => data ?? [], [data]);
  const faculties = useMemo(() => [...new Set(usersList.map((u) => u.faculty).filter(Boolean))].sort() as string[], [usersList]);
  const departments = useMemo(() => [...new Set(usersList.map((u) => u.department).filter(Boolean))].sort() as string[], [usersList]);

  const facultiesQuery = useQuery({ queryKey: ['faculties'], queryFn: facultyService.getAll });
  const departmentsQuery = useQuery({
    queryKey: ['departments', watchedFacultyId],
    queryFn: () => departmentService.getByFaculty(watchedFacultyId ?? ''),
    enabled: !!watchedFacultyId,
  });

  const facultiesOptions = useMemo(() => ((facultiesQuery.data?.faculties ?? []) as any[]).map((item) => ({ label: item.name, value: item.id })), [facultiesQuery.data]);
  const departmentOptions = useMemo(() => (departmentsQuery.data ?? []).map((item) => ({ label: item.name, value: item.id })), [departmentsQuery.data]);

  const activeFilterCount = [filterRole, filterFaculty, filterDepartment, filterActive].filter(Boolean).length;

  const filteredUsers = useMemo(() => {
    let list = usersList.filter((u) => {
      const q = searchQuery.toLowerCase();
      const matchSearch = !q || `${u.firstName} ${u.lastName} ${u.email}`.toLowerCase().includes(q);
      const roles: Role[] = u.roles ?? (u.role ? [u.role] : []);
      const matchRole   = !filterRole       || roles.includes(filterRole as Role);
      const matchFac    = !filterFaculty    || u.faculty === filterFaculty;
      const matchDept   = !filterDepartment || u.department === filterDepartment;
      const matchActive = filterActive === '' ? true : filterActive === 'true' ? u.active : !u.active;
      return matchSearch && matchRole && matchFac && matchDept && matchActive;
    });
    return [...list].sort((a, b) => {
      const aVal = sortKey === 'name' ? `${a.firstName} ${a.lastName}` : (a[sortKey] ?? '');
      const bVal = sortKey === 'name' ? `${b.firstName} ${b.lastName}` : (b[sortKey] ?? '');
      return sortDir === 'asc' ? aVal.localeCompare(bVal, 'tr') : bVal.localeCompare(aVal, 'tr');
    });
  }, [usersList, searchQuery, filterRole, filterFaculty, filterDepartment, filterActive, sortKey, sortDir]);

  const toggleSort = (key: SortKey) => {
    if (sortKey === key) setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    else { setSortKey(key); setSortDir('asc'); }
  };

  // Form

  const handleOpenCreate = () => {
    setEditingUser(null);
    reset({ firstName: '', lastName: '', email: '', password: undefined, roles: [], active: true, facultyId: '', departmentId: '', title: '', phone: '' });
    setIsModalOpen(true);
  };
  const handleOpenEdit = (user: any) => {
    setEditingUser(user);
    const facultyOption = (facultiesQuery.data?.faculties ?? []).find((item: any) => item.name === user.faculty);
    const initialFacultyId = facultyOption?.id ?? '';
    const initialDepartmentId = (departmentsQuery.data ?? []).find((item: any) => item.name === user.department)?.id ?? '';

    reset({
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      password: undefined,
      roles: user.roles ?? (user.role ? [user.role] : []),
      phone: user.phone,
      active: user.active,
      title: normalizeAcademicTitle(user.title),
      facultyId: initialFacultyId,
      departmentId: initialDepartmentId,
    });
    setIsModalOpen(true);
  };

  // Mutations
  const createMutation = useMutation({
    mutationFn: (p: any) => userService.create(p),
    onSuccess: () => { toast.success('Kullanıcı başarıyla eklendi.'); queryClient.invalidateQueries({ queryKey: ['users'] }); setIsModalOpen(false); },
    onError: (err: AxiosError<{ message: string }>) => toast.error(err.response?.data?.message || 'Hata oluştu.'),
  });
  const updateMutation = useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: any }) => userService.update(id, payload),
    onSuccess: () => { toast.success('Kullanıcı başarıyla güncellendi.'); queryClient.invalidateQueries({ queryKey: ['users'] }); setIsModalOpen(false); },
    onError: (err: AxiosError<{ message: string }>) => toast.error(err.response?.data?.message || 'Hata oluştu.'),
  });
  const deleteMutation = useMutation({
    mutationFn: (id: string) => userService.delete(id),
    onSuccess: () => { toast.success('Kullanıcı silindi.'); queryClient.invalidateQueries({ queryKey: ['users'] }); setDeletingUser(null); },
    onError: (err: AxiosError<{ message: string }>) => toast.error(err.response?.data?.message || 'Hata oluştu.'),
  });
  const toggleActiveMutation = useMutation({
    mutationFn: ({ id, user }: { id: string; user: any }) => userService.update(id, { ...user, active: !user.active }),
    onSuccess: (_, { user }) => {
      toast.success(`Kullanıcı ${user.active ? 'pasif' : 'aktif'} yapıldı.`);
      queryClient.invalidateQueries({ queryKey: ['users'] });
    },
    onError: (err: AxiosError<{ message: string }>) => toast.error(err.response?.data?.message || 'Hata oluştu.'),
  });
  const pwResetMutation = useMutation({
    mutationFn: ({ id, user, pw }: { id: string; user: any; pw: string }) =>
      userService.update(id, { ...user, password: pw }),
    onSuccess: () => { toast.success('Parola başarıyla sıfırlandı.'); setPwResetUser(null); },
    onError: (err: AxiosError<{ message: string }>) => toast.error(err.response?.data?.message || 'Hata oluştu.'),
  });

  const getFacultyName = (facultyId?: string) => (facultiesQuery.data?.faculties ?? []).find((item: any) => item.id === facultyId)?.name;
  const getDepartmentName = (departmentId?: string) => (departmentsQuery.data ?? []).find((item: any) => item.id === departmentId)?.name;

  const onSubmit = (values: UserFormValues) => {
    const payload = {
      firstName: values.firstName,
      lastName: values.lastName,
      email: values.email,
      roles: values.roles,
      phone: values.phone,
      active: values.active ?? true,
      title: values.title,
      facultyId: values.facultyId || null,
      departmentId: values.departmentId || null,
      faculty: values.facultyId ? getFacultyName(values.facultyId) : editingUser?.faculty,
      department: values.departmentId ? getDepartmentName(values.departmentId) : editingUser?.department,
    } as any;

    if (!editingUser) {
      payload.password = values.password;
      createMutation.mutate(payload);
    } else {
      updateMutation.mutate({ id: editingUser.id, payload });
    }
  };

  const sortOptions: { key: SortKey; label: string }[] = [
    { key: 'name', label: 'Ad Soyad' },
    { key: 'email', label: 'E-posta' },
    { key: 'faculty', label: 'Fakülte' },
    { key: 'department', label: 'Bölüm' },
  ];

  // ── Render ──────────────────────────────────────────────────────────────────
  return (
    <div className="space-y-4">

      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">
            Kullanıcılar
            {usersList.length > 0 && (
              <span className="ml-2 rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-semibold text-slate-500">
                {filteredUsers.length}{filteredUsers.length !== usersList.length ? ` / ${usersList.length}` : ''}
              </span>
            )}
          </h1>
          <p className="mt-0.5 text-[13px] text-slate-400">Sistemdeki tüm kullanıcıları buradan yönetebilirsiniz.</p>
        </div>
        {usersList.length > 0 && (
          <PrimaryButton onClick={handleOpenCreate} icon={<Plus className="h-4 w-4" />}>
            Yeni Kullanıcı
          </PrimaryButton>
        )}
      </div>

      {/* Search + Filter */}
      {usersList.length > 0 && (
        <div className="flex items-center gap-2">
          <div className="relative min-w-0 flex-1 max-w-sm">
            <span className="pointer-events-none absolute inset-y-0 left-3.5 flex items-center text-slate-400">
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-4.35-4.35M17 11A6 6 0 1 1 5 11a6 6 0 0 1 12 0z" />
              </svg>
            </span>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Ad, soyad veya e-posta ara..."
              className="dts-input pl-10 py-2.5 text-sm"
            />
            {searchQuery && (
              <button type="button" onClick={() => setSearchQuery('')} className="absolute inset-y-0 right-3 flex items-center text-slate-400 hover:text-slate-600">
                <X className="h-4 w-4" />
              </button>
            )}
          </div>
          <FilterPopover
            faculties={faculties} departments={departments}
            filterRole={filterRole} filterFaculty={filterFaculty}
            filterDepartment={filterDepartment} filterActive={filterActive}
            onChangeRole={setFilterRole} onChangeFaculty={setFilterFaculty}
            onChangeDepartment={setFilterDepartment} onChangeActive={setFilterActive}
            onClearAll={() => { setFilterRole(''); setFilterFaculty(''); setFilterDepartment(''); setFilterActive(''); }}
            activeCount={activeFilterCount}
          />
        </div>
      )}

      {/* Sort chips */}
      {usersList.length > 0 && (
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-[11px] text-slate-400 font-medium">Sırala:</span>
          {sortOptions.map(({ key, label }) => (
            <button
              key={key}
              type="button"
              onClick={() => toggleSort(key)}
              className={cn(
                'flex items-center gap-1 rounded-full border px-3 py-1 text-[11px] font-semibold transition-all',
                sortKey === key
                  ? 'border-[#006482]/30 bg-[#eff8ff] text-[#006482]'
                  : 'border-slate-200 bg-white text-slate-500 hover:border-slate-300',
              )}
            >
              {label}
              {sortKey === key ? (sortDir === 'asc' ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />) : <ChevronsUpDown className="h-3 w-3 opacity-30" />}
            </button>
          ))}
        </div>
      )}

      {/* List */}
      {isLoading ? (
        <div className="space-y-2.5">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="animate-pulse flex items-center gap-4 rounded-2xl border border-slate-200/40 bg-white px-5 py-4">
              <div className="h-11 w-11 rounded-xl bg-slate-100 shrink-0" />
              <div className="w-48 space-y-2">
                <div className="h-4 w-36 rounded-full bg-slate-100" />
                <div className="h-3 w-48 rounded-full bg-slate-100" />
              </div>
              <div className="flex-1 grid grid-cols-2 gap-2">
                <div className="h-3 rounded-full bg-slate-100" />
                <div className="h-3 rounded-full bg-slate-100" />
                <div className="h-3 rounded-full bg-slate-100" />
                <div className="h-3 rounded-full bg-slate-100" />
              </div>
              <div className="flex gap-2 shrink-0">
                <div className="h-6 w-20 rounded-full bg-slate-100" />
                <div className="h-6 w-14 rounded-full bg-slate-100" />
              </div>
            </div>
          ))}
        </div>
      ) : usersList.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-3xl bg-slate-100 text-slate-400 text-2xl font-bold">
            ?
          </div>
          <h3 className="text-base font-bold text-slate-700">Henüz kullanıcı kaydı yok</h3>
          <p className="mt-1 text-sm text-slate-400">İlk kullanıcıyı eklemek için butona tıklayın.</p>
          <div className="mt-5">
            <PrimaryButton onClick={handleOpenCreate} icon={<Plus className="h-4 w-4" />}>
              Yeni Kullanıcı
            </PrimaryButton>
          </div>
        </div>
      ) : filteredUsers.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-14 text-center">
          <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-100 text-slate-400">
            <SlidersHorizontal className="h-6 w-6" />
          </div>
          <h3 className="text-sm font-bold text-slate-600">Eşleşen kullanıcı bulunamadı</h3>
          <p className="mt-1 text-[13px] text-slate-400">Arama veya filtre kriterlerini değiştirin.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {filteredUsers.map((user: any) => (
            <UserCard
              key={user.id}
              user={user}
              onEdit={() => handleOpenEdit(user)}
              onDelete={() => setDeletingUser(user)}
              onToggleActive={() => toggleActiveMutation.mutate({ id: user.id, user })}
              onResetPw={() => setPwResetUser(user)}
              onViewProfile={() => setViewingUser(user)}
            />
          ))}
        </div>
      )}

      {/* Edit / Create Modal */}
      <FormModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={editingUser ? 'Kullanıcıyı Düzenle' : 'Yeni Kullanıcı'}>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="dts-input-label">Ad</label>
              <input type="text" {...register('firstName')} className={`dts-input ${errors.firstName ? 'border-red-300' : ''}`} />
              {errors.firstName && <p className="text-[11px] text-red-500">{errors.firstName.message}</p>}
            </div>
            <div className="space-y-1">
              <label className="dts-input-label">Soyad</label>
              <input type="text" {...register('lastName')} className={`dts-input ${errors.lastName ? 'border-red-300' : ''}`} />
              {errors.lastName && <p className="text-[11px] text-red-500">{errors.lastName.message}</p>}
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="dts-input-label">Kurumsal E-posta</label>
              <input type="email" {...register('email')} className={`dts-input ${errors.email ? 'border-red-300' : ''}`} />
              {errors.email && <p className="text-[11px] text-red-500">{errors.email.message}</p>}
            </div>
            {!editingUser && (
              <div className="space-y-1">
                <label className="dts-input-label">Parola</label>
                <input type="password" {...register('password')} className={`dts-input ${errors.password ? 'border-red-300' : ''}`} />
                {errors.password && <p className="text-[11px] text-red-500">{errors.password.message}</p>}
              </div>
            )}
          </div>
          <div className="space-y-2">
            <label className="dts-input-label">Roller</label>
            <div className="flex flex-wrap gap-4">
              {(['ACADEMICIAN', 'DEPARTMENT_ADMIN', 'SUPER_ADMIN'] as Role[]).map((r) => (
                <label key={r} className="flex cursor-pointer items-center gap-2 text-sm font-medium text-slate-700">
                  <input type="checkbox" value={r} {...register('roles')} className="h-4 w-4 rounded border-slate-300 accent-[#006482]" />
                  {ROLE_META[r].label}
                </label>
              ))}
            </div>
            {errors.roles && <p className="text-[11px] text-red-500">{(errors.roles as any)?.message}</p>}
          </div>
          {needsFacultyDepartment && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="dts-input-label">Fakülte</label>
                <Controller
                  name="facultyId"
                  control={control}
                  render={({ field }) => (
                    <AppSelect
                      options={facultiesOptions}
                      value={field.value}
                      onChange={(value) => {
                        field.onChange(value);
                        setValue('departmentId', '');
                      }}
                      searchable
                      hasError={!!errors.facultyId}
                      placeholder="Seçiniz..."
                    />
                  )}
                />
                {errors.facultyId && <p className="text-[11px] text-red-500">{(errors.facultyId as any)?.message}</p>}
              </div>
              <div className="space-y-1">
                <label className="dts-input-label">Bölüm</label>
                <Controller
                  name="departmentId"
                  control={control}
                  render={({ field }) => (
                    <AppSelect
                      options={departmentOptions}
                      value={field.value}
                      onChange={field.onChange}
                      disabled={!watchedFacultyId}
                      searchable
                      hasError={!!errors.departmentId}
                      placeholder={watchedFacultyId ? 'Seçiniz...' : 'Önce fakülte seçin'}
                    />
                  )}
                />
                {errors.departmentId && <p className="text-[11px] text-red-500">{(errors.departmentId as any)?.message}</p>}
              </div>
            </div>
          )}
          {isAcademician && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="dts-input-label">Unvan</label>
                <Controller
                  name="title"
                  control={control}
                  render={({ field }) => (
                    <AppSelect
                      options={ACADEMIC_TITLE_OPTIONS}
                      value={field.value}
                      onChange={field.onChange}
                      searchable
                      hasError={!!errors.title}
                      placeholder="Seçiniz..."
                    />
                  )}
                />
                {errors.title && <p className="text-[11px] text-red-500">{errors.title.message}</p>}
              </div>
              <div className="space-y-1">
                <label className="dts-input-label">Telefon</label>
                <input type="text" {...register('phone')} className={`dts-input ${errors.phone ? 'border-red-300' : ''}`} />
                {errors.phone && <p className="text-[11px] text-red-500">{errors.phone.message}</p>}
              </div>
            </div>
          )}
          {editingUser && (
            <label className="flex cursor-pointer items-center gap-2 text-sm font-medium text-slate-700">
              <input type="checkbox" {...register('active')} className="h-4 w-4 rounded border-slate-300 accent-[#006482]" />
              Hesap Aktif
            </label>
          )}
          <div className="flex justify-end gap-3 border-t border-slate-100 pt-4">
            <SecondaryButton type="button" onClick={() => setIsModalOpen(false)}>İptal</SecondaryButton>
            <PrimaryButton type="submit" loading={createMutation.isPending || updateMutation.isPending}>
              {editingUser ? 'Güncelle' : 'Kaydet'}
            </PrimaryButton>
          </div>
        </form>
      </FormModal>

      {/* Profile View Modal */}
      <ProfileViewModal user={viewingUser} onClose={() => setViewingUser(null)} />

      {/* Password Reset Modal */}
      <PwResetModal
        user={pwResetUser}
        onClose={() => setPwResetUser(null)}
        onConfirm={(pw) => { if (pwResetUser) pwResetMutation.mutate({ id: pwResetUser.id, user: pwResetUser, pw }); }}
        loading={pwResetMutation.isPending}
      />

      {/* Confirm Delete */}
      <ConfirmDialog
        isOpen={!!deletingUser}
        onClose={() => setDeletingUser(null)}
        onConfirm={() => { if (deletingUser) deleteMutation.mutate(deletingUser.id); }}
        title="Kullanıcıyı Sil"
        message={`"${deletingUser?.firstName} ${deletingUser?.lastName}" kaydını silmek istediğinize emin misiniz? Bu işlem geri alınamaz.`}
        confirmLoading={deleteMutation.isPending}
        confirmText="Sil"
        cancelText="İptal"
      />
    </div>
  );
};

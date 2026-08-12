import { useState, useMemo, useRef, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import toast from 'react-hot-toast';
import {
  Plus, Edit2, Trash2,
  ChevronUp, ChevronDown, ChevronsUpDown,
  SlidersHorizontal, X, User as UserIcon, Building2, BookOpen, Clock, Tag, Calendar,
  MoreVertical, Copy, Eye, ToggleLeft, ToggleRight
} from 'lucide-react';
import { AxiosError } from 'axios';
import { cn } from '@/utils/cn';
import { createPortal } from 'react-dom';

import { PrimaryButton } from '@/components/ui/PrimaryButton';
import { SecondaryButton } from '@/components/ui/SecondaryButton';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { FormModal } from '@/components/ui/FormModal';
import { AppSelect } from '@/components/ui/AppSelect';
import { courseService } from '@/services/courseService';
import { academicianService } from '@/services/academicianService';
import { facultyService } from '@/services/facultyService';
import { departmentService } from '@/services/departmentService';
import { CourseType, Semester } from '@/types';
import { useAuthStore } from '@/store/useAuthStore';

// ── CourseType & Semester Meta ────────────────────────────────────────────────
const COURSE_TYPE_META: Record<CourseType, { label: string; cls: string }> = {
  ZORUNLU: { label: 'Zorunlu', cls: 'bg-rose-50 text-rose-600 border-rose-200' },
  SECMELI: { label: 'Seçmeli', cls: 'bg-sky-50 text-sky-600 border-sky-200' },
};

const SEMESTER_META: Record<Semester, { label: string; cls: string }> = {
  GUZ:       { label: 'Güz',       cls: 'bg-amber-50 text-amber-600 border-amber-200' },
  BAHAR:     { label: 'Bahar',     cls: 'bg-emerald-50 text-emerald-600 border-emerald-200' },
  YAZ_OKULU: { label: 'Yaz Okulu', cls: 'bg-orange-50 text-orange-600 border-orange-200' },
};

// ── Form Schema ──────────────────────────────────────────────────────────────
const courseSchema = z.object({
  code: z.string().min(1, 'Ders kodu zorunludur.').max(20, 'En fazla 20 karakter.'),
  name: z.string().min(1, 'Ders adı zorunludur.').max(255, 'En fazla 255 karakter.'),
  facultyId: z.string().optional(),
  departmentId: z.string().optional(),
  academicianId: z.string().min(1, 'Akademisyen seçimi zorunludur.'),
  theoreticalHours: z.coerce.number().min(0, 'En az 0 olabilir.'),
  practicalHours: z.coerce.number().min(0, 'En az 0 olabilir.'),
  ects: z.coerce.number().min(1, 'En az 1 olabilir.'),
  credits: z.coerce.number().min(0, 'En az 0 olabilir.'),
  courseType: z.enum(['ZORUNLU', 'SECMELI']),
  semester: z.enum(['GUZ', 'BAHAR', 'YAZ_OKULU']),
  grade: z.coerce.number().min(1, 'En az 1 olabilir.').max(6, 'En fazla 6 olabilir.'),
  active: z.boolean(),
});
type CourseFormValues = z.infer<typeof courseSchema>;
type SortKey = 'code' | 'name' | 'faculty' | 'department' | 'academician';
type SortDir = 'asc' | 'desc';

// ── CourseActionsMenu ────────────────────────────────────────────────────────
interface CourseActionsMenuProps {
  course: any;
  onView: () => void;
  onEdit: () => void;
  onCopy: () => void;
  onToggleActive: () => void;
  onDelete: () => void;
  isReadOnly?: boolean;
}

const CourseActionsMenu = ({ course, onView, onEdit, onCopy, onToggleActive, onDelete, isReadOnly = false }: CourseActionsMenuProps) => {
  const [open, setOpen] = useState(false);
  const [menuPos, setMenuPos] = useState<{ top: number; right: number } | null>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const h = (e: MouseEvent) => {
      const target = e.target as Node;
      if (buttonRef.current && !buttonRef.current.contains(target) && menuRef.current && !menuRef.current.contains(target)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, []);

  const handleToggle = () => {
    if (!open && buttonRef.current) {
      const r = buttonRef.current.getBoundingClientRect();
      setMenuPos({ top: r.bottom + 6, right: window.innerWidth - r.right });
    }
    setOpen((o) => !o);
  };

  const items = isReadOnly
    ? [
        { label: 'Detayları Görüntüle', icon: <Eye className="h-3.5 w-3.5" />, onClick: onView, variant: 'default' },
      ]
    : [
        { label: 'Detayları Görüntüle', icon: <Eye className="h-3.5 w-3.5" />, onClick: onView, variant: 'default' },
        { label: 'Düzenle', icon: <Edit2 className="h-3.5 w-3.5" />, onClick: onEdit, variant: 'default' },
        { label: 'Kopyasını Oluştur', icon: <Copy className="h-3.5 w-3.5" />, onClick: onCopy, variant: 'default' },
        {
          label: course.active ? 'Pasif Yap' : 'Aktif Yap',
          icon: course.active ? <ToggleLeft className="h-3.5 w-3.5" /> : <ToggleRight className="h-3.5 w-3.5" />,
          onClick: onToggleActive,
          variant: 'default',
        },
        { label: 'Sil', icon: <Trash2 className="h-3.5 w-3.5" />, onClick: onDelete, variant: 'danger' },
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
                item.variant === 'danger' ? 'text-red-600 hover:bg-red-50' : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900',
              )}
            >
              <span className={item.variant === 'danger' ? 'text-red-400' : 'text-slate-400'}>{item.icon}</span>
              {item.label}
            </button>
          ))}
        </div>,
        document.body,
      )}
    </div>
  );
};

// ── InfoRow ──────────────────────────────────────────────────────────────────
const InfoRow = ({ icon, text }: { icon: React.ReactNode; text?: string | null }) => {
  if (!text) return null;
  return (
    <div className="flex items-center gap-1.5 text-[11px] text-slate-500 leading-none truncate">
      <span className="shrink-0 text-slate-400">{icon}</span>
      <span className="truncate">{text}</span>
    </div>
  );
};

// ── CourseCard ───────────────────────────────────────────────────────────────
const CourseCard = ({ course, onView, onEdit, onCopy, onToggleActive, onDelete, isReadOnly = false }: any) => {
  return (
    <div className="group relative flex items-center gap-4 rounded-2xl border border-slate-200/50 bg-white px-5 py-4 transition-all duration-200 ease-out hover:-translate-y-px hover:border-[#88d0f2]/60 hover:shadow-lg hover:shadow-slate-200/70">
      <div className="absolute inset-y-0 left-0 w-[3px] rounded-l-2xl bg-transparent group-hover:bg-[#006482] transition-colors duration-200" />
      
      {/* Sol: Kod + İsim */}
      <div className="w-56 shrink-0 min-w-0 pr-4 border-r border-slate-100">
        <div className="flex items-center gap-2">
          <span className="rounded-md bg-slate-100 px-1.5 py-0.5 text-[10px] font-bold text-slate-600 tracking-widest">{course.code}</span>
        </div>
        <p className="mt-1.5 text-[13px] font-bold text-slate-900 leading-snug truncate" title={course.name}>
          {course.name}
        </p>
      </div>

      {/* Orta: Bilgiler */}
      <div className="flex-1 min-w-0 grid grid-cols-2 gap-x-6 gap-y-1.5 px-2">
        <InfoRow icon={<UserIcon className="h-3 w-3" />} text={course.academicianName} />
        <InfoRow icon={<Building2 className="h-3 w-3" />} text={course.facultyName} />
        <InfoRow icon={<BookOpen className="h-3 w-3" />} text={course.departmentName} />
        <InfoRow icon={<Clock className="h-3 w-3" />} text={`T: ${course.theoreticalHours} U: ${course.practicalHours} (AKTS: ${course.ects})`} />
      </div>

      {/* Sağ: Badge'ler + Aksiyonlar */}
      <div className="flex items-center gap-2 shrink-0">
        <span className={cn('inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-bold tracking-wide', SEMESTER_META[course.semester as Semester].cls)}>
          {SEMESTER_META[course.semester as Semester].label}
        </span>
        <span className={cn('inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-bold tracking-wide', COURSE_TYPE_META[course.courseType as CourseType].cls)}>
          {COURSE_TYPE_META[course.courseType as CourseType].label}
        </span>
        <span className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-bold whitespace-nowrap ${course.active ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-red-50 text-red-500 border-red-200'}`}>
          <span className={`h-1.5 w-1.5 rounded-full ${course.active ? 'bg-emerald-500' : 'bg-red-400'}`} />
          {course.active ? 'Aktif' : 'Pasif'}
        </span>

        {!isReadOnly && (
          <button
            type="button"
            onClick={onEdit}
            className="flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-[11px] font-semibold text-slate-600 shadow-sm transition-all duration-150 hover:border-[#006482]/40 hover:bg-[#eff8ff] hover:text-[#006482] group-hover:border-[#006482]/20 active:scale-95"
          >
            <Edit2 className="h-3 w-3" />
            Düzenle
          </button>
        )}

        <CourseActionsMenu course={course} onView={onView} onEdit={onEdit} onCopy={onCopy} onToggleActive={onToggleActive} onDelete={onDelete} isReadOnly={isReadOnly} />
      </div>
    </div>
  );
};

// ── FilterPopover ────────────────────────────────────────────────────────────
const FilterPopover = ({ filters, setFilters, lists, activeCount, onClearAll, showLocationFilters = true }: any) => {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const h = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false); };
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
          activeCount > 0 ? 'border-[#006482]/30 bg-[#eff8ff] text-[#006482] hover:bg-[#ddf0fb]' : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300 hover:bg-slate-50'
        )}
      >
        <SlidersHorizontal className="h-4 w-4" />
        Filtrele
        {activeCount > 0 && <span className="flex h-5 w-5 items-center justify-center rounded-full bg-[#006482] text-[10px] font-bold text-white">{activeCount}</span>}
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
            {showLocationFilters && (
              <>
                <div>
                  <label className="dts-input-label">Fakülte</label>
                  <AppSelect
                    value={filters.faculty}
                    onChange={(value) => setFilters({ ...filters, faculty: value })}
                    options={[{ label: 'Tümü', value: '' }, ...lists.faculties.map((faculty: string) => ({ label: faculty, value: faculty }))]}
                    searchable
                    placeholder="Tümü"
                  />
                </div>
                <div>
                  <label className="dts-input-label">Bölüm</label>
                  <AppSelect
                    value={filters.department}
                    onChange={(value) => setFilters({ ...filters, department: value })}
                    options={[{ label: 'Tümü', value: '' }, ...lists.departments.map((department: string) => ({ label: department, value: department }))]}
                    searchable
                    placeholder="Tümü"
                  />
                </div>
              </>
            )}
            <div>
              <label className="dts-input-label">Akademisyen</label>
              <AppSelect
                value={filters.academician}
                onChange={(value) => setFilters({ ...filters, academician: value })}
                options={[{ label: 'Tümü', value: '' }, ...lists.academicians.map((academician: string) => ({ label: academician, value: academician }))]}
                searchable
                placeholder="Tümü"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="dts-input-label">Dönem</label>
                <AppSelect
                  value={filters.semester}
                  onChange={(value) => setFilters({ ...filters, semester: value })}
                  options={[{ label: 'Tümü', value: '' }, ...Object.keys(SEMESTER_META).map((semester) => ({ label: SEMESTER_META[semester as Semester].label, value: semester }))]}
                  placeholder="Tümü"
                />
              </div>
              <div>
                <label className="dts-input-label">Tür</label>
                <AppSelect
                  value={filters.courseType}
                  onChange={(value) => setFilters({ ...filters, courseType: value })}
                  options={[{ label: 'Tümü', value: '' }, ...Object.keys(COURSE_TYPE_META).map((courseType) => ({ label: COURSE_TYPE_META[courseType as CourseType].label, value: courseType }))]}
                  placeholder="Tümü"
                />
              </div>
            </div>
            <div>
              <label className="dts-input-label">Durum</label>
              <AppSelect
                value={filters.active}
                onChange={(value) => setFilters({ ...filters, active: value })}
                options={[
                  { label: 'Tümü', value: '' },
                  { label: 'Aktif', value: 'true' },
                  { label: 'Pasif', value: 'false' },
                ]}
                placeholder="Tümü"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// ── Detay Modal ─────────────────────────────────────────────────────────────
const CourseViewModal = ({ course, onClose }: { course: any; onClose: () => void }) => {
  if (!course) return null;
  return (
    <FormModal isOpen={!!course} onClose={onClose} title="Ders Detayları">
      <div className="space-y-5">
        <div className="flex items-start gap-4">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-500">
            <BookOpen className="h-6 w-6" />
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-900">{course.code} - {course.name}</h3>
            <div className="mt-1 flex flex-wrap gap-1.5">
              <span className={cn('rounded-full border px-2 py-0.5 text-[10px] font-bold', SEMESTER_META[course.semester as Semester].cls)}>{SEMESTER_META[course.semester as Semester].label}</span>
              <span className={cn('rounded-full border px-2 py-0.5 text-[10px] font-bold', COURSE_TYPE_META[course.courseType as CourseType].cls)}>{COURSE_TYPE_META[course.courseType as CourseType].label}</span>
              <span className={`rounded-full border px-2 py-0.5 text-[10px] font-bold ${course.active ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-red-50 text-red-500 border-red-200'}`}>
                {course.active ? 'Aktif' : 'Pasif'}
              </span>
            </div>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3 rounded-2xl bg-slate-50/70 p-4 border border-slate-100">
          <div className="col-span-2">
            <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Akademisyen</p>
            <div className="mt-0.5 text-[13px] font-medium text-slate-700">{course.academicianName}</div>
          </div>
          <div className="col-span-2">
            <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Fakülte / Bölüm</p>
            <div className="mt-0.5 text-[13px] font-medium text-slate-700">{course.facultyName} / {course.departmentName}</div>
          </div>
          <div>
            <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Teorik Saat</p>
            <div className="mt-0.5 text-[13px] font-medium text-slate-700">{course.theoreticalHours}</div>
          </div>
          <div>
            <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Uygulama Saati</p>
            <div className="mt-0.5 text-[13px] font-medium text-slate-700">{course.practicalHours}</div>
          </div>
          <div>
            <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">AKTS / Kredi</p>
            <div className="mt-0.5 text-[13px] font-medium text-slate-700">{course.ects} / {course.credits}</div>
          </div>
          <div>
            <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Sınıf</p>
            <div className="mt-0.5 text-[13px] font-medium text-slate-700">{course.grade}. Sınıf</div>
          </div>
        </div>
        <div className="flex justify-end"><SecondaryButton onClick={onClose}>Kapat</SecondaryButton></div>
      </div>
    </FormModal>
  );
};

// ── Ana Bileşen ──────────────────────────────────────────────────────────────
export const CoursesPage = () => {
  const queryClient = useQueryClient();
  const role = useAuthStore((state) => state.user?.role);
  const isDepartmentAdmin = role === 'DEPARTMENT_ADMIN';
  const isReadOnly = role === 'ACADEMICIAN';

  const [searchQuery, setSearchQuery] = useState('');
  const [filters, setFilters] = useState({ faculty: '', department: '', academician: '', semester: '', courseType: '', active: '' });
  const [sortKey, setSortKey] = useState<SortKey>('code');
  const [sortDir, setSortDir] = useState<SortDir>('asc');

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCourse, setEditingCourse] = useState<any>(null);
  const [deletingCourse, setDeletingCourse] = useState<any>(null);
  const [viewingCourse, setViewingCourse] = useState<any>(null);

  const { data, isLoading } = useQuery({ queryKey: ['courses'], queryFn: courseService.getAll });
  const coursesList = useMemo(() => data ?? [], [data]);
  
  // Data for filters
  const lists = useMemo(() => {
    return {
      faculties: [...new Set(coursesList.map((c) => c.facultyName))].sort(),
      departments: [...new Set(coursesList.map((c) => c.departmentName))].sort(),
      academicians: [...new Set(coursesList.map((c) => c.academicianName))].sort(),
    };
  }, [coursesList]);
  
  const activeFilterCount = Object.values(filters).filter(Boolean).length;

  const filteredCourses = useMemo(() => {
    let list = coursesList.filter((c) => {
      const q = searchQuery.toLowerCase();
      const matchSearch = !q || c.name.toLowerCase().includes(q) || c.code.toLowerCase().includes(q) || c.academicianName.toLowerCase().includes(q) || c.departmentName.toLowerCase().includes(q);
      const matchFac = !filters.faculty || c.facultyName === filters.faculty;
      const matchDept = !filters.department || c.departmentName === filters.department;
      const matchAca = !filters.academician || c.academicianName === filters.academician;
      const matchSem = !filters.semester || c.semester === filters.semester;
      const matchType = !filters.courseType || c.courseType === filters.courseType;
      const matchActive = filters.active === '' ? true : filters.active === 'true' ? c.active : !c.active;
      return matchSearch && matchFac && matchDept && matchAca && matchSem && matchType && matchActive;
    });
    return list.sort((a, b) => {
      const aVal = sortKey === 'faculty' ? a.facultyName : sortKey === 'department' ? a.departmentName : sortKey === 'academician' ? a.academicianName : a[sortKey];
      const bVal = sortKey === 'faculty' ? b.facultyName : sortKey === 'department' ? b.departmentName : sortKey === 'academician' ? b.academicianName : b[sortKey];
      return sortDir === 'asc' ? String(aVal).localeCompare(String(bVal), 'tr') : String(bVal).localeCompare(String(aVal), 'tr');
    });
  }, [coursesList, searchQuery, filters, sortKey, sortDir]);

  const toggleSort = (key: SortKey) => {
    if (sortKey === key) setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    else { setSortKey(key); setSortDir('asc'); }
  };

  // Form
  const { register, handleSubmit, reset, watch, setValue, control, formState: { errors } } = useForm<CourseFormValues>({
    resolver: zodResolver(courseSchema),
    defaultValues: { code: '', name: '', facultyId: '', departmentId: '', academicianId: '', theoreticalHours: 2, practicalHours: 0, ects: 3, credits: 2, courseType: 'ZORUNLU', semester: 'GUZ', grade: 1, active: true },
  });

  const watchFacultyId = watch('facultyId');
  const watchDepartmentId = watch('departmentId');

  // Load dependent data for form
  const { data: facultiesList } = useQuery({
    queryKey: ['faculties'],
    queryFn: facultyService.getAll,
    enabled: !isDepartmentAdmin,
  });
  
  const { data: departmentsForFaculty } = useQuery({
    queryKey: ['departments', watchFacultyId],
    queryFn: () => departmentService.getByFaculty(watchFacultyId!),
    enabled: !isDepartmentAdmin && !!watchFacultyId,
  });

  const { data: academiciansForDept, isFetching: isFetchingAcademicians } = useQuery({
    queryKey: ['academicians', isDepartmentAdmin ? 'department-admin-scope' : watchDepartmentId],
    queryFn: () => isDepartmentAdmin ? academicianService.getAll() : academicianService.getByDepartment(watchDepartmentId!),
    enabled: isDepartmentAdmin || !!watchDepartmentId,
    staleTime: 1000 * 60 * 5,
  });

  useEffect(() => {
    if (isDepartmentAdmin) return;
    if (!isModalOpen) return;

    if (!watchFacultyId) {
      setValue('departmentId', '');
      setValue('academicianId', '');
      return;
    }

    if (!editingCourse || watchFacultyId !== editingCourse.facultyId) {
      setValue('departmentId', '');
      setValue('academicianId', '');
    }
  }, [isDepartmentAdmin, isModalOpen, editingCourse, watchFacultyId, setValue]);

  useEffect(() => {
    if (isDepartmentAdmin) return;
    if (!isModalOpen) return;

    if (!watchDepartmentId) {
      setValue('academicianId', '');
      return;
    }

    if (!editingCourse || watchDepartmentId !== editingCourse.departmentId) {
      setValue('academicianId', '');
    }
  }, [isDepartmentAdmin, isModalOpen, editingCourse, watchDepartmentId, setValue]);

  const handleOpenCreate = () => {
    setEditingCourse(null);
    reset({ code: '', name: '', facultyId: '', departmentId: '', academicianId: '', theoreticalHours: 2, practicalHours: 0, ects: 3, credits: 2, courseType: 'ZORUNLU', semester: 'GUZ', grade: 1, active: true });
    setIsModalOpen(true);
  };
  
  const handleOpenEdit = (course: any) => {
    setEditingCourse(course);
    reset({
      code: course.code, name: course.name, facultyId: course.facultyId, departmentId: course.departmentId, academicianId: course.academicianId,
      theoreticalHours: course.theoreticalHours, practicalHours: course.practicalHours, ects: course.ects, credits: course.credits,
      courseType: course.courseType, semester: course.semester, grade: course.grade, active: course.active
    });
    setIsModalOpen(true);
  };

  const academicianOptions = useMemo(() => {
    return (academiciansForDept || []).map((academician: any) => ({
      label: `${academician.title ?? ''} ${academician.firstName ?? ''} ${academician.lastName ?? ''}`.trim(),
      value: academician.id,
    }));
  }, [academiciansForDept]);

  const handleOpenCopy = (course: any) => {
    setEditingCourse(null); // Create mode
    reset({
      code: `${course.code}-KOPYA`, name: course.name, facultyId: course.facultyId, departmentId: course.departmentId, academicianId: course.academicianId,
      theoreticalHours: course.theoreticalHours, practicalHours: course.practicalHours, ects: course.ects, credits: course.credits,
      courseType: course.courseType, semester: course.semester, grade: course.grade, active: true
    });
    setIsModalOpen(true);
  };

  const createMutation = useMutation({
    mutationFn: courseService.create,
    onSuccess: () => { toast.success('Ders eklendi.'); queryClient.invalidateQueries({ queryKey: ['courses'] }); setIsModalOpen(false); },
    onError: (err: any) => toast.error(err.response?.data?.message || 'Hata oluştu.'),
  });
  
  const updateMutation = useMutation({
    mutationFn: ({ id, payload }: any) => courseService.update(id, payload),
    onSuccess: () => { toast.success('Ders güncellendi.'); queryClient.invalidateQueries({ queryKey: ['courses'] }); setIsModalOpen(false); },
    onError: (err: any) => toast.error(err.response?.data?.message || 'Hata oluştu.'),
  });
  
  const toggleMutation = useMutation({
    mutationFn: ({ id, payload }: any) => courseService.update(id, payload),
    onSuccess: (_, { payload }) => { toast.success(`Ders ${payload.active ? 'aktif' : 'pasif'} yapıldı.`); queryClient.invalidateQueries({ queryKey: ['courses'] }); },
    onError: (err: any) => toast.error(err.response?.data?.message || 'Hata oluştu.'),
  });
  
  const deleteMutation = useMutation({
    mutationFn: courseService.delete,
    onSuccess: () => { toast.success('Ders silindi.'); queryClient.invalidateQueries({ queryKey: ['courses'] }); setDeletingCourse(null); },
    onError: (err: any) => toast.error(err.response?.data?.message || 'Hata oluştu.'),
  });

  const onSubmit = (values: CourseFormValues) => {
    if (!isDepartmentAdmin && (!values.facultyId || !values.departmentId)) {
      toast.error('Fakülte ve bölüm seçimi zorunludur.');
      return;
    }

    const payload = isDepartmentAdmin
      ? { ...values, facultyId: undefined, departmentId: undefined }
      : values;

    if (editingCourse) updateMutation.mutate({ id: editingCourse.id, payload });
    else createMutation.mutate(payload);
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">Dersler {coursesList.length > 0 && <span className="ml-2 rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-semibold text-slate-500">{filteredCourses.length}{filteredCourses.length !== coursesList.length ? ` / ${coursesList.length}` : ''}</span>}</h1>
          <p className="mt-0.5 text-[13px] text-slate-400">Üniversitede açılan dersleri tanımlayabilirsiniz.</p>
        </div>
        {!isReadOnly && (
          <PrimaryButton onClick={handleOpenCreate} icon={<Plus className="h-4 w-4" />}>Yeni Ders</PrimaryButton>
        )}
      </div>

      {/* Toolbar */}
      {coursesList.length > 0 && (
        <div className="flex items-center gap-2">
          <div className="relative min-w-0 flex-1 max-w-sm">
            <span className="absolute inset-y-0 left-3.5 flex items-center text-slate-400"><svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-4.35-4.35M17 11A6 6 0 1 1 5 11a6 6 0 0 1 12 0z" /></svg></span>
            <input type="text" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} placeholder="Ders adı, kodu veya akademisyen ara..." className="dts-input pl-10 py-2.5 text-sm" />
            {searchQuery && <button type="button" onClick={() => setSearchQuery('')} className="absolute inset-y-0 right-3 flex items-center text-slate-400 hover:text-slate-600"><X className="h-4 w-4" /></button>}
          </div>
          <FilterPopover filters={filters} setFilters={setFilters} lists={lists} activeCount={activeFilterCount} onClearAll={() => setFilters({ faculty: '', department: '', academician: '', semester: '', courseType: '', active: '' })} showLocationFilters={!isDepartmentAdmin} />
        </div>
      )}

      {/* Sort Chips */}
      {coursesList.length > 0 && (
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-[11px] text-slate-400 font-medium">Sırala:</span>
          {[{ key: 'code', label: 'Kod' }, { key: 'name', label: 'İsim' }, { key: 'academician', label: 'Akademisyen' }].map(({ key, label }) => (
            <button key={key} type="button" onClick={() => toggleSort(key as SortKey)} className={cn('flex items-center gap-1 rounded-full border px-3 py-1 text-[11px] font-semibold transition-all', sortKey === key ? 'border-[#006482]/30 bg-[#eff8ff] text-[#006482]' : 'border-slate-200 bg-white text-slate-500 hover:border-slate-300')}>
              {label}
              {sortKey === key ? (sortDir === 'asc' ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />) : <ChevronsUpDown className="h-3 w-3 opacity-30" />}
            </button>
          ))}
        </div>
      )}

      {/* List */}
      {isLoading ? (
        <div className="space-y-2.5">{[1, 2, 3].map((i) => <div key={i} className="animate-pulse h-24 rounded-2xl border border-slate-200/40 bg-white" />)}</div>
      ) : coursesList.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-3xl bg-slate-100 text-slate-400 text-2xl font-bold"><BookOpen className="h-8 w-8" /></div>
          <h3 className="text-base font-bold text-slate-700">Henüz ders yok</h3>
          {!isReadOnly && (
            <PrimaryButton onClick={handleOpenCreate} className="mt-5" icon={<Plus className="h-4 w-4" />}>Yeni Ders Ekle</PrimaryButton>
          )}
        </div>
      ) : filteredCourses.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-14 text-center">
          <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-100 text-slate-400"><SlidersHorizontal className="h-6 w-6" /></div>
          <h3 className="text-sm font-bold text-slate-600">Eşleşen ders bulunamadı</h3>
        </div>
      ) : (
        <div className="space-y-2">
          {filteredCourses.map((course: any) => (
            <CourseCard
              key={course.id} course={course}
              onView={() => setViewingCourse(course)}
              onEdit={() => handleOpenEdit(course)}
              onCopy={() => handleOpenCopy(course)}
              onToggleActive={() => toggleMutation.mutate({ id: course.id, payload: { ...course, active: !course.active } })}
              onDelete={() => setDeletingCourse(course)}
              isReadOnly={isReadOnly}
            />
          ))}
        </div>
      )}

      {/* Form Modal */}
      <FormModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={editingCourse ? 'Dersi Düzenle' : 'Yeni Ders'}>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid grid-cols-4 gap-3">
            <div className="col-span-1 space-y-1">
              <label className="dts-input-label">Kod</label>
              <input type="text" {...register('code')} className={`dts-input ${errors.code ? 'border-red-300' : ''}`} placeholder="CENG101" />
              {errors.code && <p className="text-[10px] text-red-500">{errors.code.message}</p>}
            </div>
            <div className="col-span-3 space-y-1">
              <label className="dts-input-label">Ders Adı</label>
              <input type="text" {...register('name')} className={`dts-input ${errors.name ? 'border-red-300' : ''}`} />
              {errors.name && <p className="text-[10px] text-red-500">{errors.name.message}</p>}
            </div>
          </div>
          
          {!isDepartmentAdmin && (
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="dts-input-label">Fakülte</label>
                <Controller
                  name="facultyId"
                  control={control}
                  render={({ field }) => (
                    <AppSelect
                      options={(facultiesList?.faculties || []).map((f: any) => ({ label: f.name, value: f.id }))}
                      value={field.value}
                      onChange={field.onChange}
                      searchable
                      hasError={!!errors.facultyId}
                      placeholder="Seçiniz..."
                    />
                  )}
                />
              </div>
              <div className="space-y-1">
                <label className="dts-input-label">Bölüm</label>
                <Controller
                  name="departmentId"
                  control={control}
                  render={({ field }) => (
                    <AppSelect
                      options={(departmentsForFaculty || []).map((d: any) => ({ label: d.name, value: d.id }))}
                      value={field.value}
                      onChange={field.onChange}
                      disabled={!watchFacultyId}
                      searchable
                      hasError={!!errors.departmentId}
                      placeholder="Seçiniz..."
                    />
                  )}
                />
              </div>
            </div>
          )}
          
          <div className="space-y-1">
            <label className="dts-input-label">Akademisyen</label>
            <Controller
              name="academicianId"
              control={control}
              render={({ field }) => (
                <AppSelect
                  options={academicianOptions}
                  value={field.value}
                  onChange={field.onChange}
                  disabled={(!isDepartmentAdmin && !watchDepartmentId) || isFetchingAcademicians}
                  searchable
                  hasError={!!errors.academicianId}
                  placeholder={isFetchingAcademicians ? 'Yükleniyor...' : 'Seçiniz...'}
                  emptyText="Bu bölümde akademisyen bulunamadı"
                />
              )}
            />
          </div>

          <div className="grid grid-cols-4 gap-3">
            <div className="space-y-1">
              <label className="dts-input-label">T. Saat</label>
              <input type="number" {...register('theoreticalHours')} className="dts-input" />
            </div>
            <div className="space-y-1">
              <label className="dts-input-label">U. Saat</label>
              <input type="number" {...register('practicalHours')} className="dts-input" />
            </div>
            <div className="space-y-1">
              <label className="dts-input-label">AKTS</label>
              <input type="number" {...register('ects')} className="dts-input" />
            </div>
            <div className="space-y-1">
              <label className="dts-input-label">Kredi</label>
              <input type="number" {...register('credits')} className="dts-input" />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div className="space-y-1">
              <label className="dts-input-label">Tür</label>
              <Controller
                name="courseType"
                control={control}
                render={({ field }) => (
                  <AppSelect
                    options={[{ label: 'Zorunlu', value: 'ZORUNLU' }, { label: 'Seçmeli', value: 'SECMELI' }]}
                    value={field.value}
                    onChange={field.onChange}
                  />
                )}
              />
            </div>
            <div className="space-y-1">
              <label className="dts-input-label">Dönem</label>
              <Controller
                name="semester"
                control={control}
                render={({ field }) => (
                  <AppSelect
                    options={[
                      { label: 'Güz', value: 'GUZ' },
                      { label: 'Bahar', value: 'BAHAR' },
                      { label: 'Yaz Okulu', value: 'YAZ_OKULU' }
                    ]}
                    value={field.value}
                    onChange={field.onChange}
                  />
                )}
              />
            </div>
            <div className="space-y-1">
              <label className="dts-input-label">Sınıf</label>
              <Controller
                name="grade"
                control={control}
                render={({ field }) => (
                  <AppSelect
                    options={[1, 2, 3, 4, 5, 6].map(i => ({ label: `${i}. Sınıf`, value: String(i) }))}
                    value={String(field.value)}
                    onChange={(val) => field.onChange(Number(val))}
                  />
                )}
              />
            </div>
          </div>

          <div className="flex justify-end gap-3 border-t border-slate-100 pt-4 mt-2">
            <SecondaryButton type="button" onClick={() => setIsModalOpen(false)}>İptal</SecondaryButton>
            <PrimaryButton type="submit" loading={createMutation.isPending || updateMutation.isPending}>Kaydet</PrimaryButton>
          </div>
        </form>
      </FormModal>

      {/* Profile View Modal */}
      <CourseViewModal course={viewingCourse} onClose={() => setViewingCourse(null)} />

      {/* Confirm Delete */}
      <ConfirmDialog
        isOpen={!!deletingCourse}
        onClose={() => setDeletingCourse(null)}
        onConfirm={() => { if (deletingCourse) deleteMutation.mutate(deletingCourse.id); }}
        title="Dersi Sil"
        message={`"${deletingCourse?.code} - ${deletingCourse?.name}" dersini silmek istediğinize emin misiniz? Bu işlem geri alınamaz.`}
        confirmLoading={deleteMutation.isPending} confirmText="Sil" cancelText="İptal"
      />
    </div>
  );
};

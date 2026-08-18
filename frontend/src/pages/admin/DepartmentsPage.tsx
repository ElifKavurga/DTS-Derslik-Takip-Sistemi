import { useMemo, useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Controller, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { AxiosError } from 'axios';
import toast from 'react-hot-toast';
import { BookOpen, GraduationCap, Plus, SlidersHorizontal, Trash2, Edit2, X, ChevronRight } from 'lucide-react';
import { z } from 'zod';
import { cn } from '@/utils/cn';

import { AppSelect } from '@/components/ui/AppSelect';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { EmptyState } from '@/components/ui/EmptyState';
import { FormModal } from '@/components/ui/FormModal';
import { MoreActionsMenu } from '@/components/ui/MoreActionsMenu';
import { PageHeader } from '@/components/ui/PageHeader';
import { PrimaryButton } from '@/components/ui/PrimaryButton';
import { SecondaryButton } from '@/components/ui/SecondaryButton';
import { departmentService, DepartmentResponse } from '@/services/departmentService';
import { facultyService } from '@/services/facultyService';

const departmentSchema = z.object({
  name: z.string().min(1, 'Bölüm adı zorunludur.').max(255, 'Bölüm adı en fazla 255 karakter olabilir.'),
  code: z.string().min(1, 'Bölüm kodu zorunludur.').max(50, 'Bölüm kodu en fazla 50 karakter olabilir.'),
  facultyId: z.string().min(1, 'Fakülte seçimi zorunludur.'),
});

type DepartmentFormValues = z.infer<typeof departmentSchema>;

const countLabel = (filteredCount: number, totalCount: number) => {
  if (totalCount === 0) return null;
  return filteredCount === totalCount ? String(totalCount) : `${filteredCount} / ${totalCount}`;
};

// ── FilterPopover ────────────────────────────────────────────────────────────
const FilterPopover = ({ value, onChange, options, onClearAll }: any) => {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const activeCount = value ? 1 : 0;

  // Click outside listener that ignores portal AppSelect dropdown clicks
  useEffect(() => {
    const h = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (
        ref.current &&
        !ref.current.contains(target) &&
        !target.closest('.dts-select-menu')
      ) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, []);

  return (
    <div className="relative animate-fade-in" ref={ref}>
      <button
        type="button"
        onMouseDown={(e) => e.stopPropagation()}
        onClick={() => setOpen((o) => !o)}
        className={cn(
          'flex h-10 items-center gap-2 rounded-xl border px-3 py-2 text-xs sm:text-sm font-semibold shadow-xs transition-all duration-200 whitespace-nowrap',
          activeCount > 0 ? 'border-[#006482]/30 bg-[#eff8ff] text-[#006482] hover:bg-[#ddf0fb]' : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300 hover:bg-slate-50'
        )}
      >
        <SlidersHorizontal className="h-4 w-4 shrink-0" />
        Filtrele
        {activeCount > 0 && <span className="flex h-4.5 w-4.5 items-center justify-center rounded-full bg-[#006482] text-[9px] font-bold text-white">{activeCount}</span>}
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-2 z-50 w-[calc(100vw-2rem)] sm:w-80 max-w-sm rounded-3xl border border-slate-200/60 bg-white p-4 sm:p-5 shadow-2xl shadow-slate-200/60">
          <div className="mb-3 flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Filtreler</span>
            {activeCount > 0 && (
              <button type="button" onClick={onClearAll} className="flex items-center gap-1 text-[10px] font-semibold text-slate-400 hover:text-red-500 transition-colors">
                <X className="h-3 w-3" /> Temizle
              </button>
            )}
          </div>
          <div>
            <label className="dts-input-label text-[10px] mb-1">Fakülte</label>
            <AppSelect
              value={value}
              onChange={(val) => { onChange(val); setOpen(false); }}
              options={[{ label: 'Tümü', value: '' }, ...options]}
              searchable
              placeholder="Tüm Fakülteler"
              searchPlaceholder="Fakülte ara..."
            />
          </div>
        </div>
      )}
    </div>
  );
};

export const DepartmentsPage = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState('');
  const [facultyFilter, setFacultyFilter] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingDepartment, setEditingDepartment] = useState<DepartmentResponse | null>(null);
  const [deletingDepartment, setDeletingDepartment] = useState<DepartmentResponse | null>(null);

  const { data: departments = [], isLoading } = useQuery({
    queryKey: ['departments'],
    queryFn: departmentService.getAll,
  });

  const { data: facultiesData } = useQuery({
    queryKey: ['faculties'],
    queryFn: facultyService.getAll,
  });

  const facultyOptions = useMemo(
    () => (facultiesData?.faculties ?? []).map((faculty) => ({ label: faculty.name, value: faculty.id })),
    [facultiesData?.faculties],
  );

  const filteredDepartments = useMemo(() => {
    const query = searchQuery.trim().toLocaleLowerCase('tr-TR');
    return departments.filter((department) => {
      const matchesQuery =
        !query ||
        department.name.toLocaleLowerCase('tr-TR').includes(query) ||
        department.code.toLocaleLowerCase('tr-TR').includes(query);
      const matchesFaculty = !facultyFilter || department.facultyId === facultyFilter;
      return matchesQuery && matchesFaculty;
    });
  }, [departments, facultyFilter, searchQuery]);

  const {
    control,
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<DepartmentFormValues>({
    resolver: zodResolver(departmentSchema),
    defaultValues: { name: '', code: '', facultyId: '' },
  });

  const invalidateDepartmentData = (facultyId?: string) => {
    queryClient.invalidateQueries({ queryKey: ['departments'] });
    if (facultyId) queryClient.invalidateQueries({ queryKey: ['departments', facultyId] });
  };

  const handleOpenCreate = () => {
    setEditingDepartment(null);
    reset({ name: '', code: '', facultyId: facultyFilter });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (department: DepartmentResponse) => {
    setEditingDepartment(department);
    reset({ name: department.name, code: department.code, facultyId: department.facultyId });
    setIsModalOpen(true);
  };

  const createMutation = useMutation({
    mutationFn: departmentService.create,
    onSuccess: (department) => {
      toast.success('Bölüm başarıyla eklendi.');
      invalidateDepartmentData(department.facultyId);
      setIsModalOpen(false);
    },
    onError: (err: AxiosError<{ message: string }>) => {
      toast.error(err.response?.data?.message || 'Bölüm eklenirken hata oluştu.');
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: DepartmentFormValues }) => departmentService.update(id, payload),
    onSuccess: (department) => {
      toast.success('Bölüm başarıyla güncellendi.');
      invalidateDepartmentData(department.facultyId);
      queryClient.invalidateQueries({ queryKey: ['department', department.id] });
      setIsModalOpen(false);
    },
    onError: (err: AxiosError<{ message: string }>) => {
      toast.error(err.response?.data?.message || 'Bölüm güncellenirken hata oluştu.');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: departmentService.delete,
    onSuccess: () => {
      toast.success('Bölüm başarıyla silindi.');
      invalidateDepartmentData(deletingDepartment?.facultyId);
      setDeletingDepartment(null);
    },
    onError: (err: AxiosError<{ message: string }>) => {
      toast.error(err.response?.data?.message || 'Bölüm silinirken hata oluştu.');
    },
  });

  const onSubmit = (values: DepartmentFormValues) => {
    if (editingDepartment) {
      updateMutation.mutate({ id: editingDepartment.id, payload: values });
      return;
    }
    createMutation.mutate(values);
  };

  const renderedCount = countLabel(filteredDepartments.length, departments.length);

  return (
    <div className="space-y-4 sm:space-y-5">
      <PageHeader
        title="Bölümler"
        badge={
          renderedCount ? (
            <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-semibold text-slate-500">{renderedCount}</span>
          ) : null
        }
        action={
          <PrimaryButton onClick={handleOpenCreate} icon={<Plus className="h-4 w-4" />}>
            Yeni Bölüm
          </PrimaryButton>
        }
      />

      {departments.length > 0 && (
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5">
          <div className="relative min-w-0 flex-1 max-w-md">
            <span className="pointer-events-none absolute inset-y-0 left-3.5 flex items-center text-slate-400">
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-4.35-4.35M17 11A6 6 0 1 1 5 11a6 6 0 0 1 12 0z" />
              </svg>
            </span>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Bölüm adı veya kodu ara..."
              className="dts-input pl-9 h-10 py-1.5 text-xs sm:text-sm rounded-xl hover:border-[#88d0f2] focus:border-[#006482] focus:ring-2 focus:ring-[#006482]/10"
            />
            {searchQuery && (
              <button type="button" onClick={() => setSearchQuery('')} className="absolute inset-y-0 right-3 flex items-center text-slate-400 hover:text-slate-600">
                <X className="h-4 w-4" />
              </button>
            )}
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <FilterPopover
              value={facultyFilter}
              onChange={setFacultyFilter}
              options={facultyOptions}
              onClearAll={() => setFacultyFilter('')}
            />
          </div>
        </div>
      )}

      {isLoading ? (
        <div className="space-y-2.5">
          {[1, 2, 3].map((item) => (
            <div key={item} className="h-24 animate-pulse rounded-2xl border border-slate-200/40 bg-white" />
          ))}
        </div>
      ) : departments.length === 0 ? (
        <EmptyState
          title="Henüz bölüm yok"
          description="Üniversite genelindeki ilk bölümü oluşturmak için Yeni Bölüm butonunu kullanın."
          action={<PrimaryButton onClick={handleOpenCreate} icon={<Plus className="h-4.5 w-4.5" />}>Yeni Bölüm Ekle</PrimaryButton>}
        />
      ) : filteredDepartments.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-14 text-center">
          <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-100 text-slate-400">
            <SlidersHorizontal className="h-6 w-6" />
          </div>
          <h3 className="text-sm font-bold text-slate-600">Eşleşen bölüm bulunamadı</h3>
          <p className="mt-1 text-[13px] text-slate-400">Arama kelimesini veya filtre kriterlerini değiştirmeyi deneyin.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {filteredDepartments.map((department) => {
            const actions = [
              {
                label: 'Düzenle',
                icon: <Edit2 className="h-3.5 w-3.5" />,
                onClick: () => handleOpenEdit(department),
              },
              {
                label: 'Sil',
                icon: <Trash2 className="h-3.5 w-3.5" />,
                onClick: () => setDeletingDepartment(department),
                variant: 'danger' as const,
              },
            ];

            return (
              <div
                key={department.id}
                onClick={() => navigate(`/super-admin/bolumler/${department.id}`)}
                className="group flex items-center justify-between p-3.5 sm:p-4 rounded-2xl border border-slate-200/80 bg-gradient-to-br from-[#f6fbfe] via-white to-[#e2f3fa] shadow-xs cursor-pointer select-none transition-all duration-200 ease-out dts-interactive-card"
              >
                <div className="flex-1 min-w-0 flex flex-col md:flex-row md:items-center justify-between gap-3.5 pr-3">
                  {/* Department Details */}
                  <div className="flex items-center gap-3.5 min-w-0">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white/80 text-slate-500 border border-slate-100/90 group-hover:bg-[#eff8ff] group-hover:text-[#006482] transition duration-200">
                      <BookOpen className="h-5.5 w-5.5" />
                    </div>
                    <div className="min-w-0">
                      <h4 className="text-sm font-bold text-slate-900 leading-tight group-hover:text-[#006482] transition-colors duration-150 truncate">
                        {department.name}
                      </h4>
                      <p className="text-[10px] text-slate-450 mt-0.5 truncate">
                        {department.code} <span className="text-slate-300 mx-1">|</span> {department.facultyName}
                      </p>
                    </div>
                  </div>

                  {/* Akademisyen & Ders Boxes (Side by side on desktop, wraps on mobile) */}
                  <div className="flex flex-wrap items-center gap-2 sm:gap-3.5">
                    <div className="flex items-center gap-2 border border-slate-200/50 bg-white/95 rounded-xl px-2.5 py-1 min-w-[95px] shadow-xs">
                      <GraduationCap className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                      <div className="flex flex-col text-left">
                        <span className="text-[8px] font-bold text-slate-400 uppercase tracking-wider leading-none">Akademisyen</span>
                        <span className="text-xs font-extrabold text-slate-700 mt-0.5 leading-none">{department.academicianCount}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 border border-slate-200/50 bg-white/95 rounded-xl px-2.5 py-1 min-w-[75px] shadow-xs">
                      <BookOpen className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                      <div className="flex flex-col text-left">
                        <span className="text-[8px] font-bold text-slate-400 uppercase tracking-wider leading-none">Ders</span>
                        <span className="text-xs font-extrabold text-slate-700 mt-0.5 leading-none">{department.courseCount}</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Actions Dropdown */}
                <div onClick={(e) => e.stopPropagation()} className="shrink-0 flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={(event) => {
                      event.stopPropagation();
                      navigate(`/super-admin/bolumler/${department.id}`);
                    }}
                    className="hidden sm:flex items-center gap-0.5 rounded-xl border border-slate-200 bg-white px-2 py-1 text-[11px] font-semibold text-slate-600 shadow-xs transition hover:border-[#006482]/40 hover:bg-[#eff8ff] hover:text-[#006482] active:scale-95 whitespace-nowrap"
                  >
                    Detay
                    <ChevronRight className="h-3 w-3" />
                  </button>
                  <MoreActionsMenu actions={actions} />
                </div>
              </div>
            );
          })}
        </div>
      )}

      <FormModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={editingDepartment ? 'Bölümü Düzenle' : 'Yeni Bölüm'}>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
          <div className="space-y-1">
            <label htmlFor="departmentName" className="dts-input-label text-[10px] mb-1">Bölüm Adı</label>
            <input id="departmentName" type="text" {...register('name')} placeholder="Örn. Bilgisayar Mühendisliği" className={`dts-input ${errors.name ? 'border-red-300 focus:border-red-500 focus:ring-red-500/10' : ''}`} />
            {errors.name && <p className="mt-1 text-[11px] font-medium text-red-500">{errors.name.message}</p>}
          </div>

          <div className="space-y-1">
            <label htmlFor="departmentCode" className="dts-input-label text-[10px] mb-1">Bölüm Kodu</label>
            <input id="departmentCode" type="text" {...register('code')} placeholder="Örn. CENG" className={`dts-input ${errors.code ? 'border-red-300 focus:border-red-500 focus:ring-red-500/10' : ''}`} />
            {errors.code && <p className="mt-1 text-[11px] font-medium text-red-500">{errors.code.message}</p>}
          </div>

          <div className="space-y-1">
            <label className="dts-input-label text-[10px] mb-1">Fakülte</label>
            <Controller
              name="facultyId"
              control={control}
              render={({ field }) => (
                <AppSelect
                  options={facultyOptions}
                  value={field.value}
                  onChange={field.onChange}
                  searchable
                  hasError={!!errors.facultyId}
                  placeholder="Fakülte seçiniz..."
                  searchPlaceholder="Fakülte ara..."
                />
              )}
            />
            {errors.facultyId && <p className="mt-1 text-[11px] font-medium text-red-500">{errors.facultyId.message}</p>}
          </div>

          <div className="mt-2 flex justify-end gap-3 border-t border-slate-100 pt-3">
            <SecondaryButton type="button" onClick={() => setIsModalOpen(false)}>İptal</SecondaryButton>
            <PrimaryButton type="submit" loading={createMutation.isPending || updateMutation.isPending}>
              {editingDepartment ? 'Güncelle' : 'Kaydet'}
            </PrimaryButton>
          </div>
        </form>
      </FormModal>

      <ConfirmDialog
        isOpen={!!deletingDepartment}
        onClose={() => setDeletingDepartment(null)}
        onConfirm={() => {
          if (deletingDepartment) deleteMutation.mutate(deletingDepartment.id);
        }}
        title="Bölümü Sil"
        message={`"${deletingDepartment?.name}" bölümünü silmek istediğinize emin misiniz? Bağlı akademisyen veya ders varsa işlem yapılmaz.`}
        confirmLoading={deleteMutation.isPending}
        confirmText="Sil"
        cancelText="İptal"
      />
    </div>
  );
};

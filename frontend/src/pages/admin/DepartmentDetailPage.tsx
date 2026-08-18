import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Controller, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { AxiosError } from 'axios';
import toast from 'react-hot-toast';
import { BookOpen, ChevronLeft, GraduationCap, Mail, User, Edit2 } from 'lucide-react';
import { z } from 'zod';
import { cn } from '@/utils/cn';

import { AppSelect } from '@/components/ui/AppSelect';
import { EmptyState } from '@/components/ui/EmptyState';
import { FormModal } from '@/components/ui/FormModal';
import { PageHeader } from '@/components/ui/PageHeader';
import { PrimaryButton } from '@/components/ui/PrimaryButton';
import { SecondaryButton } from '@/components/ui/SecondaryButton';
import { academicianService } from '@/services/academicianService';
import { courseService } from '@/services/courseService';
import { departmentService } from '@/services/departmentService';
import { facultyService } from '@/services/facultyService';
import { useHeaderStore } from '@/store/useHeaderStore';

const departmentSchema = z.object({
  name: z.string().min(1, 'Bölüm adı zorunludur.').max(255, 'Bölüm adı en fazla 255 karakter olabilir.'),
  code: z.string().min(1, 'Bölüm kodu zorunludur.').max(50, 'Bölüm kodu en fazla 50 karakter olabilir.'),
  facultyId: z.string().min(1, 'Fakülte seçimi zorunludur.'),
});

type DepartmentFormValues = z.infer<typeof departmentSchema>;

const PREVIEW_LIMIT = 5;

export const DepartmentDetailPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const setMeta = useHeaderStore((state) => state.setMeta);
  
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [showAllAcademicians, setShowAllAcademicians] = useState(false);
  const [showAllCourses, setShowAllCourses] = useState(false);
  const [selectedAcademicianId, setSelectedAcademicianId] = useState<string | null>(null);

  const { data: department, isLoading: isDepartmentLoading } = useQuery({
    queryKey: ['department', id],
    queryFn: () => departmentService.getById(id || ''),
    enabled: !!id,
  });

  const { data: academicians = [], isLoading: isAcademiciansLoading } = useQuery({
    queryKey: ['academicians', id],
    queryFn: () => academicianService.getByDepartment(id || ''),
    enabled: !!id,
  });

  const { data: courses = [], isLoading: isCoursesLoading } = useQuery({
    queryKey: ['courses'],
    queryFn: courseService.getAll,
    enabled: !!id,
  });

  const { data: facultiesData } = useQuery({
    queryKey: ['faculties'],
    queryFn: facultyService.getAll,
  });

  const facultyOptions = useMemo(
    () => (facultiesData?.faculties ?? []).map((faculty) => ({ label: faculty.name, value: faculty.id })),
    [facultiesData?.faculties],
  );

  const departmentCourses = useMemo(
    () => courses.filter((course) => course.departmentId === id),
    [courses, id],
  );

  // Filter department courses based on selected academician
  const filteredCoursesList = useMemo(() => {
    if (!selectedAcademicianId) return departmentCourses;
    return departmentCourses.filter((course) => course.academicianId === selectedAcademicianId);
  }, [departmentCourses, selectedAcademicianId]);

  const visibleAcademicians = showAllAcademicians ? academicians : academicians.slice(0, PREVIEW_LIMIT);
  const visibleCourses = showAllCourses ? filteredCoursesList : filteredCoursesList.slice(0, PREVIEW_LIMIT);

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

  // Global listener to clear selection when clicking a blank area
  useEffect(() => {
    const handleDocumentClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      // If we clicked inside an academician card, let that card handle the selection toggle
      if (target.closest('.dts-academician-card')) {
        return;
      }
      // If we clicked on other interactive elements, do not clear selection
      if (
        target.closest('button') ||
        target.closest('a') ||
        target.closest('input') ||
        target.closest('select') ||
        target.closest('.dts-select-menu') ||
        target.closest('.dts-course-card') ||
        target.closest('[role="dialog"]') ||
        target.closest('.dts-modal')
      ) {
        return;
      }
      setSelectedAcademicianId(null);
    };

    document.addEventListener('click', handleDocumentClick);
    return () => document.removeEventListener('click', handleDocumentClick);
  }, []);

  useEffect(() => {
    if (department) {
      setMeta(department.name, ['Ana Ekran', 'Bölüm Yönetimi', department.name]);
    }
  }, [department, setMeta]);

  const updateMutation = useMutation({
    mutationFn: (values: DepartmentFormValues) => departmentService.update(id || '', values),
    onSuccess: (updatedDepartment) => {
      toast.success('Bölüm başarıyla güncellendi.');
      queryClient.invalidateQueries({ queryKey: ['departments'] });
      queryClient.invalidateQueries({ queryKey: ['departments', updatedDepartment.facultyId] });
      queryClient.invalidateQueries({ queryKey: ['department', updatedDepartment.id] });
      setIsEditModalOpen(false);
    },
    onError: (err: AxiosError<{ message: string }>) => {
      toast.error(err.response?.data?.message || 'Bölüm güncellenirken hata oluştu.');
    },
  });

  const handleOpenEdit = () => {
    if (!department) return;
    reset({ name: department.name, code: department.code, facultyId: department.facultyId });
    setIsEditModalOpen(true);
  };

  const onSubmit = (values: DepartmentFormValues) => {
    updateMutation.mutate(values);
  };

  const isLoading = isDepartmentLoading || isAcademiciansLoading || isCoursesLoading;

  if (isLoading && !department) {
    return (
      <div className="space-y-4 sm:space-y-5 animate-pulse">
        <div className="h-20 rounded-2xl bg-slate-200" />
        <div className="h-24 rounded-2xl bg-slate-200" />
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 sm:gap-6">
          <div className="h-40 rounded-2xl bg-slate-100" />
          <div className="h-40 rounded-2xl bg-slate-100" />
        </div>
      </div>
    );
  }

  if (!department) {
    return (
      <EmptyState
        title="Bölüm bulunamadı"
        description="Görüntülemek istediğiniz bölüm kaydı bulunamadı."
        action={<SecondaryButton onClick={() => navigate('/super-admin/bolumler')}>Bölüm Yönetimine Dön</SecondaryButton>}
      />
    );
  }

  return (
    <div className="space-y-4 sm:space-y-5">
      <PageHeader
        title={department.name}
        backAction={
          <button
            type="button"
            onClick={() => navigate('/super-admin/bolumler')}
            className="flex w-fit items-center gap-1 text-xs font-semibold text-slate-500 hover:text-slate-900 transition select-none group"
          >
            <ChevronLeft className="h-3.5 w-3.5 transition-transform group-hover:-translate-x-0.5" />
            Bölüm Yönetimine Dön
          </button>
        }
        badge={
          <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-bold text-slate-600">
            {department.code} · {department.facultyName}
          </span>
        }
        action={
          <PrimaryButton onClick={handleOpenEdit} icon={<Edit2 className="h-4 w-4" />}>
            Düzenle
          </PrimaryButton>
        }
      />

      {/* Department Summary Card */}
      <section className="relative overflow-hidden rounded-2xl border border-slate-200/80 bg-gradient-to-br from-[#f6fbfe] via-white to-[#e2f3fa] p-3.5 sm:p-4 shadow-xs">
        <div className="absolute inset-x-0 top-0 h-[3px] bg-gradient-to-r from-[#004b62] via-[#006482] to-[#fabc07]" />

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3.5">
          <div className="flex flex-col justify-center min-w-0">
            <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Bölüm Kodu</span>
            <span className="text-xs font-extrabold text-slate-800 mt-1 truncate">{department.code}</span>
          </div>
          <div className="flex flex-col justify-center min-w-0">
            <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Fakülte</span>
            <span className="text-xs font-extrabold text-slate-800 mt-1 truncate">{department.facultyName}</span>
          </div>
          <div className="flex flex-col justify-center min-w-0">
            <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Akademisyen</span>
            <span className="text-xs font-extrabold text-slate-800 mt-1">{department.academicianCount}</span>
          </div>
          <div className="flex flex-col justify-center min-w-0">
            <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Ders</span>
            <span className="text-xs font-extrabold text-slate-800 mt-1">{department.courseCount}</span>
          </div>
        </div>
      </section>

      {/* Grid: Left - Academicians, Right - Courses */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 sm:gap-6">
        {/* Akademisyenler */}
        <section className="space-y-3">
          <div className="flex items-center justify-between border-b border-slate-200/70 pb-2">
            <h2 className="text-xs font-extrabold uppercase tracking-widest text-slate-400 flex items-center gap-1.5">
              <GraduationCap className="h-4 w-4 text-slate-500" />
              Akademisyenler
            </h2>
            {academicians.length > PREVIEW_LIMIT && (
              <button
                type="button"
                onClick={() => setShowAllAcademicians((value) => !value)}
                className="text-[11px] font-bold text-[#006482] transition hover:text-[#004e65] whitespace-nowrap"
              >
                {showAllAcademicians ? 'Daha Az Göster' : 'Tümünü Gör →'}
              </button>
            )}
          </div>

          {academicians.length === 0 ? (
            <EmptyState title="Bu bölümde henüz akademisyen bulunmuyor." description="Akademisyen atandığında burada görünecektir." />
          ) : (
            <div className="space-y-2">
              {visibleAcademicians.map((academician) => {
                const fullName = `${academician.title ?? ''} ${academician.firstName} ${academician.lastName}`.trim();
                const isSelected = selectedAcademicianId === academician.id;
                
                return (
                  <div
                    key={academician.id}
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedAcademicianId((prev) => (prev === academician.id ? null : academician.id));
                    }}
                    className={cn(
                      "dts-academician-card group flex items-center justify-between p-3 rounded-2xl border shadow-2xs transition-all duration-200 ease-out cursor-pointer select-none",
                      isSelected
                        ? "border-[#006482] ring-2 ring-[#006482]/10 bg-gradient-to-br from-[#eff8ff] via-white to-[#dcf0fa] scale-[1.01] shadow-sm"
                        : "border-slate-200/80 bg-gradient-to-br from-[#f6fbfe] via-white to-[#e2f3fa] hover:border-[#88d0f2] hover:shadow-xs hover:scale-[1.005]"
                    )}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className={cn(
                        "flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border transition duration-200",
                        isSelected
                          ? "bg-[#eff8ff] text-[#006482] border-[#006482]/20"
                          : "bg-white/85 text-slate-500 border-slate-100 group-hover:bg-[#eff8ff] group-hover:text-[#006482]"
                      )}>
                        <User className="h-5 w-5" />
                      </div>
                      <div className="min-w-0">
                        <h4 className={cn(
                          "truncate text-xs font-bold transition-colors duration-150",
                          isSelected ? "text-[#006482]" : "text-slate-900 group-hover:text-[#006482]"
                        )}>{fullName}</h4>
                        <div className="flex items-center gap-1.5 truncate text-[10px] text-slate-500 mt-0.5">
                          <Mail className="h-3 w-3 shrink-0 text-slate-400" />
                          {academician.email}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>

        {/* Dersler */}
        <section className="space-y-3">
          <div className="flex items-center justify-between border-b border-slate-200/70 pb-2">
            <h2 className="text-xs font-extrabold uppercase tracking-widest text-slate-400 flex flex-wrap items-center gap-1.5">
              <BookOpen className="h-4 w-4 text-slate-500" />
              {selectedAcademicianId ? (
                <span className="text-xs font-extrabold uppercase tracking-widest text-[#006482]">
                  {(() => {
                    const aca = academicians.find((a) => a.id === selectedAcademicianId);
                    if (!aca) return 'Dersler';
                    const fullName = `${aca.title ?? ''} ${aca.firstName} ${aca.lastName}`.trim();
                    // Apply Turkish possessive suffix rules
                    const vowels = ['a', 'e', 'ı', 'i', 'o', 'u', 'ö', 'ü'];
                    const isVowel = vowels.includes(fullName.slice(-1).toLowerCase());
                    let lastVowel = 'a';
                    for (let i = fullName.length - 1; i >= 0; i--) {
                      const char = fullName[i].toLowerCase();
                      if (vowels.includes(char)) {
                        lastVowel = char;
                        break;
                      }
                    }
                    let suffix = 'ın';
                    if (['a', 'ı'].includes(lastVowel)) {
                      suffix = isVowel ? "nın" : "ın";
                    } else if (['e', 'i'].includes(lastVowel)) {
                      suffix = isVowel ? "nin" : "in";
                    } else if (['o', 'u'].includes(lastVowel)) {
                      suffix = isVowel ? "nun" : "un";
                    } else if (['ö', 'ü'].includes(lastVowel)) {
                      suffix = isVowel ? "nün" : "ün";
                    }
                    return `${fullName}'${suffix} Dersleri`;
                  })()}
                </span>
              ) : (
                'Dersler'
              )}
            </h2>
            {filteredCoursesList.length > PREVIEW_LIMIT && (
              <button
                type="button"
                onClick={() => setShowAllCourses((value) => !value)}
                className="text-[11px] font-bold text-[#006482] transition hover:text-[#004e65] whitespace-nowrap"
              >
                {showAllCourses ? 'Daha Az Göster' : 'Tümünü Gör →'}
              </button>
            )}
          </div>

          {departmentCourses.length === 0 ? (
            <EmptyState title="Bu bölümde henüz ders tanımlanmamış." description="Ders eklendiğinde burada görünecektir." />
          ) : filteredCoursesList.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-10 text-center rounded-2xl border border-dashed border-slate-200 bg-slate-50/50 p-6">
              <div className="mb-2 flex h-9 w-9 items-center justify-center rounded-xl bg-slate-100 text-slate-400">
                <BookOpen className="h-5 w-5" />
              </div>
              <h3 className="text-xs font-bold text-slate-650">Tanımlı ders bulunmuyor</h3>
              <p className="mt-0.5 text-[10px] text-slate-400">Bu akademisyene ait tanımlı ders bulunmuyor.</p>
            </div>
          ) : (
            <div className="space-y-2">
              {visibleCourses.map((course) => (
                <div
                  key={course.id}
                  className="dts-course-card group flex items-center justify-between p-3 rounded-2xl border border-slate-200/80 bg-gradient-to-br from-[#f6fbfe] via-white to-[#e2f3fa] shadow-2xs transition-all duration-200 ease-out dts-interactive-card"
                >
                  <div className="flex items-center gap-3 min-w-0 flex-1 pr-2">
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white/85 text-slate-500 border border-slate-100 group-hover:bg-[#eff8ff] group-hover:text-[#006482] transition duration-200">
                      <BookOpen className="h-5 w-5" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5">
                        <span className="rounded bg-white border border-slate-200/80 px-1 py-0.2 text-[8px] font-bold text-slate-500 tracking-wider shadow-3xs">{course.code}</span>
                      </div>
                      <h4 className="truncate text-xs font-bold text-slate-900 group-hover:text-[#006482] transition-colors duration-150 mt-1">{course.name}</h4>
                    </div>
                  </div>
                  <div className="hidden sm:flex items-center gap-1 text-[10px] text-slate-400 font-semibold max-w-[150px] truncate shrink-0">
                    <GraduationCap className="h-3.5 w-3.5 shrink-0 text-slate-450" />
                    <span className="truncate">{course.academicianName}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>

      {/* Form Modal */}
      <FormModal isOpen={isEditModalOpen} onClose={() => setIsEditModalOpen(false)} title="Bölümü Düzenle">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
          <div className="space-y-1">
            <label htmlFor="departmentName" className="dts-input-label text-[10px] mb-1">Bölüm Adı</label>
            <input id="departmentName" type="text" {...register('name')} className={`dts-input ${errors.name ? 'border-red-300 focus:border-red-500 focus:ring-red-500/10' : ''}`} />
            {errors.name && <p className="mt-1 text-[11px] font-medium text-red-500">{errors.name.message}</p>}
          </div>

          <div className="space-y-1">
            <label htmlFor="departmentCode" className="dts-input-label text-[10px] mb-1">Bölüm Kodu</label>
            <input id="departmentCode" type="text" {...register('code')} className={`dts-input ${errors.code ? 'border-red-300 focus:border-red-500 focus:ring-red-500/10' : ''}`} />
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
            <SecondaryButton type="button" onClick={() => setIsEditModalOpen(false)}>İptal</SecondaryButton>
            <PrimaryButton type="submit" loading={updateMutation.isPending}>Güncelle</PrimaryButton>
          </div>
        </form>
      </FormModal>
    </div>
  );
};

import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Controller, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { AxiosError } from 'axios';
import toast from 'react-hot-toast';
import { BookOpen, ChevronLeft, GraduationCap, Mail, User } from 'lucide-react';
import { z } from 'zod';
import { AppSelect } from '@/components/ui/AppSelect';
import { EmptyState } from '@/components/ui/EmptyState';
import { FormModal } from '@/components/ui/FormModal';
import { PrimaryButton } from '@/components/ui/PrimaryButton';
import { RichList } from '@/components/ui/RichList';
import { RichListItem } from '@/components/ui/RichListItem';
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

const PREVIEW_LIMIT = 4;

export const DepartmentDetailPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const setMeta = useHeaderStore((state) => state.setMeta);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [showAllAcademicians, setShowAllAcademicians] = useState(false);
  const [showAllCourses, setShowAllCourses] = useState(false);

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

  const visibleAcademicians = showAllAcademicians ? academicians : academicians.slice(0, PREVIEW_LIMIT);
  const visibleCourses = showAllCourses ? departmentCourses : departmentCourses.slice(0, PREVIEW_LIMIT);

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

  if (isDepartmentLoading && !department) {
    return (
      <div className="space-y-4">
        <div className="h-8 w-48 animate-pulse rounded bg-slate-200" />
        <div className="h-24 animate-pulse rounded-2xl border border-slate-200/40 bg-white" />
        <div className="grid grid-cols-2 gap-3.5 md:grid-cols-4">
          {[1, 2, 3, 4].map((item) => <div key={item} className="h-20 animate-pulse rounded-2xl bg-slate-200" />)}
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
    <div className="space-y-5">
      <button
        type="button"
        onClick={() => navigate('/super-admin/bolumler')}
        className="flex w-fit items-center gap-1.5 text-xs font-semibold text-slate-500 transition hover:text-slate-900"
      >
        <ChevronLeft className="h-4 w-4" />
        Bölüm Yönetimine Dön
      </button>

      <section className="dts-card flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0">
          <h1 className="truncate text-xl font-bold tracking-tight text-slate-900">{department.name}</h1>
          <p className="mt-1 truncate text-[13px] font-medium text-slate-500">{department.code} · {department.facultyName}</p>
        </div>
        <SecondaryButton onClick={handleOpenEdit}>Düzenle</SecondaryButton>
      </section>

      <div className="grid grid-cols-2 gap-3.5 lg:grid-cols-4">
        {[
          { label: 'Bölüm Kodu', value: department.code },
          { label: 'Fakülte', value: department.facultyName },
          { label: 'Akademisyen', value: department.academicianCount },
          { label: 'Ders', value: department.courseCount },
        ].map((item) => (
          <div key={item.label} className="dts-card flex min-h-20 flex-col justify-center p-4">
            <span className="text-[9px] font-bold uppercase tracking-wider text-slate-400">{item.label}</span>
            <span className="mt-1.5 truncate text-sm font-extrabold text-slate-800">{item.value}</span>
          </div>
        ))}
      </div>

      <section className="space-y-3">
        <div className="flex items-center justify-between border-b border-slate-200/70 pb-2">
          <h2 className="text-sm font-extrabold uppercase tracking-widest text-slate-700">Akademisyenler</h2>
          {academicians.length > PREVIEW_LIMIT && (
            <button
              type="button"
              onClick={() => setShowAllAcademicians((value) => !value)}
              className="text-xs font-semibold text-[#006482] transition hover:text-[#004e65]"
            >
              {showAllAcademicians ? 'Daha Az Göster' : 'Tümünü Gör →'}
            </button>
          )}
        </div>

        {isAcademiciansLoading ? (
          <div className="space-y-2.5">{[1, 2].map((item) => <div key={item} className="h-20 animate-pulse rounded-2xl border border-slate-200/40 bg-white" />)}</div>
        ) : academicians.length === 0 ? (
          <EmptyState title="Bu bölümde henüz akademisyen bulunmuyor." description="Akademisyen atandığında burada görünecektir." />
        ) : (
          <RichList>
            {visibleAcademicians.map((academician) => {
              const fullName = `${academician.title ?? ''} ${academician.firstName} ${academician.lastName}`.trim();
              return (
                <RichListItem key={academician.id}>
                  <div className="flex items-center gap-3.5">
                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-slate-100 bg-[#eff8ff] text-[#006482]">
                      <User className="h-5.5 w-5.5" />
                    </div>
                    <div className="min-w-0">
                      <h4 className="truncate text-sm font-bold text-slate-900">{fullName}</h4>
                      <p className="mt-1 flex items-center gap-1.5 truncate text-[11px] text-slate-500">
                        <Mail className="h-3 w-3 shrink-0 text-slate-400" />
                        {academician.email}
                      </p>
                      {academician.title && <p className="mt-0.5 text-[11px] font-medium text-slate-400">{academician.title}</p>}
                    </div>
                  </div>
                </RichListItem>
              );
            })}
          </RichList>
        )}
      </section>

      <section className="space-y-3">
        <div className="flex items-center justify-between border-b border-slate-200/70 pb-2">
          <h2 className="text-sm font-extrabold uppercase tracking-widest text-slate-700">Dersler</h2>
          {departmentCourses.length > PREVIEW_LIMIT && (
            <button
              type="button"
              onClick={() => setShowAllCourses((value) => !value)}
              className="text-xs font-semibold text-[#006482] transition hover:text-[#004e65]"
            >
              {showAllCourses ? 'Daha Az Göster' : 'Tümünü Gör →'}
            </button>
          )}
        </div>

        {isCoursesLoading ? (
          <div className="space-y-2.5">{[1, 2, 3].map((item) => <div key={item} className="h-20 animate-pulse rounded-2xl border border-slate-200/40 bg-white" />)}</div>
        ) : departmentCourses.length === 0 ? (
          <EmptyState title="Bu bölümde henüz ders tanımlanmamış." description="Ders eklendiğinde burada görünecektir." />
        ) : (
          <div className="space-y-2">
            {visibleCourses.map((course) => (
              <div key={course.id} className="group relative flex flex-col gap-3 rounded-2xl border border-slate-200/50 bg-white px-5 py-4 transition-all duration-200 hover:border-[#88d0f2]/60 hover:shadow-lg hover:shadow-slate-200/70 sm:flex-row sm:items-center sm:justify-between">
                <div className="absolute inset-y-0 left-0 w-[3px] rounded-l-2xl bg-transparent transition-colors duration-200 group-hover:bg-[#006482]" />
                <div className="flex min-w-0 items-center gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-slate-50 text-slate-500">
                    <BookOpen className="h-5 w-5" />
                  </div>
                  <div className="min-w-0">
                    <span className="rounded-md bg-slate-100 px-1.5 py-0.5 text-[10px] font-bold tracking-widest text-slate-600">{course.code}</span>
                    <h4 className="mt-1.5 truncate text-[13px] font-bold text-slate-900">{course.name}</h4>
                  </div>
                </div>
                <div className="flex items-center gap-1.5 text-[11px] font-medium text-slate-500 sm:w-72">
                  <GraduationCap className="h-3.5 w-3.5 shrink-0 text-slate-400" />
                  <span className="truncate">{course.academicianName}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      <FormModal isOpen={isEditModalOpen} onClose={() => setIsEditModalOpen(false)} title="Bölümü Düzenle">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
          <div className="space-y-1">
            <label htmlFor="departmentName" className="dts-input-label">Bölüm Adı</label>
            <input id="departmentName" type="text" {...register('name')} className={`dts-input ${errors.name ? 'border-red-300 focus:border-red-500 focus:ring-red-500/10' : ''}`} />
            {errors.name && <p className="mt-1 text-[11px] font-medium text-red-500">{errors.name.message}</p>}
          </div>

          <div className="space-y-1">
            <label htmlFor="departmentCode" className="dts-input-label">Bölüm Kodu</label>
            <input id="departmentCode" type="text" {...register('code')} className={`dts-input ${errors.code ? 'border-red-300 focus:border-red-500 focus:ring-red-500/10' : ''}`} />
            {errors.code && <p className="mt-1 text-[11px] font-medium text-red-500">{errors.code.message}</p>}
          </div>

          <div className="space-y-1">
            <label className="dts-input-label">Fakülte</label>
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

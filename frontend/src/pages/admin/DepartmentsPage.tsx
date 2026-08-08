import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Controller, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { AxiosError } from 'axios';
import toast from 'react-hot-toast';
import { BookOpen, GraduationCap, Plus, SlidersHorizontal, Trash2 } from 'lucide-react';
import { z } from 'zod';
import { AppSelect } from '@/components/ui/AppSelect';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { EmptyState } from '@/components/ui/EmptyState';
import { FormModal } from '@/components/ui/FormModal';
import { MoreActionsMenu } from '@/components/ui/MoreActionsMenu';
import { PrimaryButton } from '@/components/ui/PrimaryButton';
import { RichList } from '@/components/ui/RichList';
import { RichListItem } from '@/components/ui/RichListItem';
import { SearchInput } from '@/components/ui/SearchInput';
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
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-slate-900">
            Bölüm Yönetimi
            {renderedCount && (
              <span className="ml-2 rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-semibold text-slate-500">{renderedCount}</span>
            )}
          </h1>
          <p className="mt-0.5 text-[13px] text-slate-400">Sistemde tanımlı tüm bölümleri buradan yönetebilirsiniz.</p>
        </div>
        <PrimaryButton onClick={handleOpenCreate} icon={<Plus className="h-4 w-4" />}>Yeni Bölüm</PrimaryButton>
      </div>

      {departments.length > 0 && (
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          <div className="min-w-0 flex-1 sm:max-w-sm">
            <SearchInput onSearchChange={setSearchQuery} placeholder="Bölüm adı veya kodu ara..." />
          </div>
          <div className="w-full sm:w-72">
            <AppSelect
              value={facultyFilter}
              onChange={setFacultyFilter}
              options={[{ label: 'Tüm Fakülteler', value: '' }, ...facultyOptions]}
              searchable
              placeholder="Tüm Fakülteler"
              searchPlaceholder="Fakülte ara..."
            />
          </div>
        </div>
      )}

      {isLoading ? (
        <div className="space-y-2.5">{[1, 2, 3].map((item) => <div key={item} className="h-24 animate-pulse rounded-2xl border border-slate-200/40 bg-white" />)}</div>
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
        </div>
      ) : (
        <RichList>
          {filteredDepartments.map((department) => {
            const actions = [
              { label: 'Sil', icon: <Trash2 className="h-3.5 w-3.5" />, onClick: () => setDeletingDepartment(department), variant: 'danger' as const },
            ];

            return (
              <RichListItem
                key={department.id}
                onClick={() => navigate(`/super-admin/bolumler/${department.id}`)}
                actionMenu={<MoreActionsMenu actions={actions} />}
              >
                <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                  <div className="flex min-w-0 items-center gap-3.5">
                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-slate-100 bg-[#eff8ff] text-[#006482]">
                      <BookOpen className="h-5.5 w-5.5" />
                    </div>
                    <div className="min-w-0">
                      <h4 className="truncate text-sm font-bold leading-tight text-slate-900 group-hover:text-[#006482]">{department.name}</h4>
                      <p className="mt-1 truncate text-[11px] font-medium text-slate-500">{department.code} · {department.facultyName}</p>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-2 sm:gap-3.5 lg:mr-6">
                    <div className="flex min-w-[115px] items-center gap-2 rounded-xl border border-slate-200/50 bg-slate-50/50 px-3 py-1.5">
                      <GraduationCap className="h-4 w-4 text-slate-400" />
                      <div className="flex flex-col text-left">
                        <span className="text-[8px] font-bold uppercase leading-none tracking-wider text-slate-400">Akademisyen</span>
                        <span className="mt-0.5 text-xs font-extrabold leading-none text-slate-700">{department.academicianCount}</span>
                      </div>
                    </div>
                    <div className="flex min-w-[85px] items-center gap-2 rounded-xl border border-slate-200/50 bg-slate-50/50 px-3 py-1.5">
                      <BookOpen className="h-4 w-4 text-slate-400" />
                      <div className="flex flex-col text-left">
                        <span className="text-[8px] font-bold uppercase leading-none tracking-wider text-slate-400">Ders</span>
                        <span className="mt-0.5 text-xs font-extrabold leading-none text-slate-700">{department.courseCount}</span>
                      </div>
                    </div>
                    <SecondaryButton
                      type="button"
                      onClick={(event) => {
                        event.stopPropagation();
                        navigate(`/super-admin/bolumler/${department.id}`);
                      }}
                    >
                      Görüntüle
                    </SecondaryButton>
                    <PrimaryButton
                      type="button"
                      onClick={(event) => {
                        event.stopPropagation();
                        handleOpenEdit(department);
                      }}
                    >
                      Düzenle
                    </PrimaryButton>
                  </div>
                </div>
              </RichListItem>
            );
          })}
        </RichList>
      )}

      <FormModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={editingDepartment ? 'Bölümü Düzenle' : 'Yeni Bölüm'}>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
          <div className="space-y-1">
            <label htmlFor="departmentName" className="dts-input-label">Bölüm Adı</label>
            <input id="departmentName" type="text" {...register('name')} placeholder="Örn. Bilgisayar Mühendisliği" className={`dts-input ${errors.name ? 'border-red-300 focus:border-red-500 focus:ring-red-500/10' : ''}`} />
            {errors.name && <p className="mt-1 text-[11px] font-medium text-red-500">{errors.name.message}</p>}
          </div>

          <div className="space-y-1">
            <label htmlFor="departmentCode" className="dts-input-label">Bölüm Kodu</label>
            <input id="departmentCode" type="text" {...register('code')} placeholder="Örn. CENG" className={`dts-input ${errors.code ? 'border-red-300 focus:border-red-500 focus:ring-red-500/10' : ''}`} />
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

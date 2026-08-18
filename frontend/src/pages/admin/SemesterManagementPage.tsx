import React, { useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import toast from 'react-hot-toast';
import { Calendar, CalendarDays, Plus, Trash2, Edit2, Check, AlertTriangle, Sparkles } from 'lucide-react';
import { cn } from '@/utils/cn';

import { PageHeader } from '@/components/ui/PageHeader';
import { PrimaryButton } from '@/components/ui/PrimaryButton';
import { SecondaryButton } from '@/components/ui/SecondaryButton';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { FormModal } from '@/components/ui/FormModal';
import { AppSelect } from '@/components/ui/AppSelect';
import { semesterService } from '@/services/semesterService';
import { AcademicPeriod } from '@/types';

const periodSchema = z.object({
  academicYear: z.string().regex(/^\d{4}-\d{4}$/, 'Format YYYY-YYYY olmalıdır. Örn: 2026-2027'),
  termType: z.enum(['FALL', 'SPRING']),
  startDate: z.string().min(1, 'Başlangıç tarihi zorunludur.'),
  endDate: z.string().min(1, 'Bitiş tarihi zorunludur.'),
  isActive: z.boolean(),
});

type PeriodFormValues = z.infer<typeof periodSchema>;

export const SemesterManagementPage = () => {
  const queryClient = useQueryClient();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingPeriod, setEditingPeriod] = useState<AcademicPeriod | null>(null);
  const [deletingPeriod, setDeletingPeriod] = useState<AcademicPeriod | null>(null);
  const [activatingPeriod, setActivatingPeriod] = useState<AcademicPeriod | null>(null);

  const {
    register,
    handleSubmit,
    control,
    reset,
    formState: { errors },
  } = useForm<PeriodFormValues>({
    resolver: zodResolver(periodSchema),
  });

  const { data: periods = [], isLoading } = useQuery({
    queryKey: ['academicPeriodsAll'],
    queryFn: () => semesterService.getAll(),
  });

  const handleOpenCreate = () => {
    setEditingPeriod(null);
    reset({
      academicYear: '',
      termType: 'FALL',
      startDate: '',
      endDate: '',
      isActive: false,
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (period: AcademicPeriod) => {
    setEditingPeriod(period);
    reset({
      academicYear: period.academicYear,
      termType: period.termType,
      startDate: period.startDate,
      endDate: period.endDate,
      isActive: period.isActive,
    });
    setIsModalOpen(true);
  };

  const createMutation = useMutation({
    mutationFn: semesterService.create,
    onSuccess: () => {
      toast.success('Akademik dönem başarıyla eklendi.');
      queryClient.invalidateQueries({ queryKey: ['academicPeriodsAll'] });
      queryClient.invalidateQueries({ queryKey: ['academicPeriodsDropdown'] });
      setIsModalOpen(false);
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || 'Hata oluştu.');
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: PeriodFormValues }) =>
      semesterService.update(id, payload),
    onSuccess: () => {
      toast.success('Akademik dönem güncellendi.');
      queryClient.invalidateQueries({ queryKey: ['academicPeriodsAll'] });
      queryClient.invalidateQueries({ queryKey: ['academicPeriodsDropdown'] });
      queryClient.invalidateQueries({ queryKey: ['departmentAdminDashboard'] });
      setIsModalOpen(false);
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || 'Hata oluştu.');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: semesterService.delete,
    onSuccess: () => {
      toast.success('Akademik dönem başarıyla silindi.');
      queryClient.invalidateQueries({ queryKey: ['academicPeriodsAll'] });
      queryClient.invalidateQueries({ queryKey: ['academicPeriodsDropdown'] });
      setDeletingPeriod(null);
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || 'Dönem silinemedi.');
    },
  });

  const activateMutation = useMutation({
    mutationFn: semesterService.activate,
    onSuccess: () => {
      toast.success('Akademik dönem aktif hale getirildi. Diğer tüm dönemler pasife alındı.');
      queryClient.invalidateQueries({ queryKey: ['academicPeriodsAll'] });
      queryClient.invalidateQueries({ queryKey: ['academicPeriodsDropdown'] });
      queryClient.invalidateQueries({ queryKey: ['departmentAdminDashboard'] });
      queryClient.invalidateQueries({ queryKey: ['weeklySchedules'] });
      queryClient.invalidateQueries({ queryKey: ['scheduleStatus'] });
      setActivatingPeriod(null);
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || 'Dönem aktifleştirilemedi.');
    },
  });

  const onSubmit = (values: PeriodFormValues) => {
    if (editingPeriod) {
      updateMutation.mutate({ id: editingPeriod.id, payload: values });
    } else {
      createMutation.mutate(values);
    }
  };

  const sortedPeriods = useMemo(() => {
    return [...periods].sort((a, b) => b.startDate.localeCompare(a.startDate));
  }, [periods]);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Dönem Yönetimi"
        badge={periods.length > 0 ? `${periods.length} Dönem` : undefined}
        action={
          <PrimaryButton onClick={handleOpenCreate} icon={<Plus className="h-4.5 w-4.5" />}>
            Yeni Dönem Ekle
          </PrimaryButton>
        }
      />

      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-20 w-full animate-pulse rounded-2xl bg-slate-100" />
          ))}
        </div>
      ) : periods.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-3xl border border-dashed border-slate-200 bg-white py-20 text-center">
          <Calendar className="mb-4 h-12 w-12 text-slate-300" />
          <h3 className="text-sm font-bold text-slate-800">Dönem Bulunamadı</h3>
          <p className="mt-1 text-xs text-slate-400">Sistemde kayıtlı akademik dönem bulunmamaktadır.</p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-3xl border border-slate-200/60 bg-white shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50/50 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  <th className="px-6 py-4">Akademik Yıl / Dönem</th>
                  <th className="px-6 py-4">Dönem Türü</th>
                  <th className="px-6 py-4">Başlangıç Tarihi</th>
                  <th className="px-6 py-4">Bitiş Tarihi</th>
                  <th className="px-6 py-4">Durum</th>
                  <th className="px-6 py-4 text-right">İşlemler</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-sm font-medium text-slate-700">
                {sortedPeriods.map((period) => (
                  <tr
                    key={period.id}
                    className={cn(
                      'transition-colors duration-150',
                      period.isActive ? 'bg-[#f6fbfe] hover:bg-[#eff8ff]' : 'hover:bg-slate-55/20'
                    )}
                  >
                    <td className="px-6 py-4.5">
                      <div className="flex items-center gap-3">
                        <div
                          className={cn(
                            'flex h-9 w-9 items-center justify-center rounded-xl border',
                            period.isActive
                              ? 'border-[#006482]/20 bg-[#eff8ff] text-[#006482]'
                              : 'border-slate-100 bg-slate-50 text-slate-450'
                          )}
                        >
                          <CalendarDays className="h-4.5 w-4.5" />
                        </div>
                        <div>
                          <p className="font-extrabold text-slate-900">{period.displayName}</p>
                          <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mt-0.5">
                            {period.academicYear}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4.5">
                      <span
                        className={cn(
                          'inline-flex items-center rounded-lg border px-2 py-0.5 text-xs font-bold',
                          period.termType === 'FALL'
                            ? 'border-amber-100 bg-amber-50/60 text-amber-600'
                            : 'border-emerald-100 bg-emerald-50/60 text-emerald-600'
                        )}
                      >
                        {period.termType === 'FALL' ? 'Güz' : 'Bahar'}
                      </span>
                    </td>
                    <td className="px-6 py-4.5 text-slate-500">
                      {new Date(period.startDate).toLocaleDateString('tr-TR', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                      })}
                    </td>
                    <td className="px-6 py-4.5 text-slate-500">
                      {new Date(period.endDate).toLocaleDateString('tr-TR', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                      })}
                    </td>
                    <td className="px-6 py-4.5">
                      {period.isActive ? (
                        <span className="inline-flex items-center gap-1 rounded-lg border border-emerald-250 bg-emerald-50 px-2 py-0.5 text-xs font-bold text-emerald-600">
                          <Check className="h-3 w-3 stroke-[3]" /> Aktif Dönem
                        </span>
                      ) : (
                        <span className="inline-flex items-center rounded-lg border border-slate-200 bg-slate-50 px-2 py-0.5 text-xs font-semibold text-slate-400">
                          Pasif
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4.5 text-right">
                      <div className="flex items-center justify-end gap-2">
                        {!period.isActive && (
                          <button
                            onClick={() => setActivatingPeriod(period)}
                            className="inline-flex h-8 items-center justify-center rounded-lg border border-[#006482]/20 bg-white px-2.5 text-xs font-bold text-[#006482] shadow-xs hover:bg-[#eff8ff] transition"
                          >
                            Aktifleştir
                          </button>
                        )}
                        <button
                          onClick={() => handleOpenEdit(period)}
                          className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-500 shadow-xs hover:border-slate-300 hover:text-slate-700 transition"
                          title="Düzenle"
                        >
                          <Edit2 className="h-3.5 w-3.5" />
                        </button>
                        <button
                          onClick={() => setDeletingPeriod(period)}
                          disabled={period.isActive}
                          className={cn(
                            'flex h-8 w-8 items-center justify-center rounded-lg border shadow-xs transition',
                            period.isActive
                              ? 'border-slate-100 bg-slate-50 text-slate-300 cursor-not-allowed'
                              : 'border-red-200 bg-white text-red-500 hover:border-red-300 hover:bg-red-50/50'
                          )}
                          title={period.isActive ? 'Aktif dönem silinemez' : 'Sil'}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Create / Edit Form Modal */}
      <FormModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingPeriod ? 'Dönemi Düzenle' : 'Yeni Akademik Dönem'}
      >
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-1">
            <label className="dts-input-label text-[10px] mb-1">Akademik Yıl</label>
            <input
              type="text"
              placeholder="Örn: 2026-2027"
              {...register('academicYear')}
              className={cn('dts-input', errors.academicYear && 'border-red-300')}
            />
            {errors.academicYear ? (
              <p className="text-[10px] text-red-500">{errors.academicYear.message}</p>
            ) : (
              <p className="text-[10.5px] text-slate-400">YYYY-YYYY formatında akademik yıl giriniz.</p>
            )}
          </div>

          <div className="space-y-1">
            <label className="dts-input-label text-[10px] mb-1">Dönem Türü</label>
            <Controller
              name="termType"
              control={control}
              render={({ field }) => (
                <AppSelect
                  options={[
                    { label: 'Güz Dönemi', value: 'FALL' },
                    { label: 'Bahar Dönemi', value: 'SPRING' },
                  ]}
                  value={field.value}
                  onChange={field.onChange}
                />
              )}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="dts-input-label text-[10px] mb-1">Başlangıç Tarihi</label>
              <input
                type="date"
                {...register('startDate')}
                className={cn('dts-input', errors.startDate && 'border-red-300')}
              />
              {errors.startDate && <p className="text-[10px] text-red-500">{errors.startDate.message}</p>}
            </div>
            <div className="space-y-1">
              <label className="dts-input-label text-[10px] mb-1">Bitiş Tarihi</label>
              <input
                type="date"
                {...register('endDate')}
                className={cn('dts-input', errors.endDate && 'border-red-300')}
              />
              {errors.endDate && <p className="text-[10px] text-red-500">{errors.endDate.message}</p>}
            </div>
          </div>

          <div className="flex items-center gap-2 pt-2">
            <input
              type="checkbox"
              id="isActive"
              {...register('isActive')}
              className="h-4 w-4 rounded-sm border-slate-300 text-[#006482] focus:ring-[#006482]/20"
            />
            <label htmlFor="isActive" className="text-xs font-bold text-slate-700 cursor-pointer select-none">
              Bu dönemi sisteme eklerken doğrudan aktif yap
            </label>
          </div>

          <div className="flex justify-end gap-3 border-t border-slate-100 pt-4 mt-2">
            <SecondaryButton type="button" onClick={() => setIsModalOpen(false)}>
              İptal
            </SecondaryButton>
            <PrimaryButton type="submit" loading={createMutation.isPending || updateMutation.isPending}>
              Kaydet
            </PrimaryButton>
          </div>
        </form>
      </FormModal>

      {/* Activation Confirmation Modal */}
      <ConfirmDialog
        isOpen={!!activatingPeriod}
        onClose={() => setActivatingPeriod(null)}
        onConfirm={() => {
          if (activatingPeriod) activateMutation.mutate(activatingPeriod.id);
        }}
        title="Dönemi Aktifleştir"
        message={
          <div className="space-y-3">
            <p>
              <strong>"{activatingPeriod?.displayName}"</strong> dönemini sistemin aktif dönemi yapmak istediğinize emin misiniz?
            </p>
            <div className="flex gap-2.5 rounded-2xl bg-amber-50 p-3.5 text-xs text-amber-700 border border-amber-200/50 leading-relaxed font-semibold">
              <AlertTriangle className="h-5 w-5 shrink-0 text-amber-600 mt-0.5" />
              <span>
                Bu işlemle birlikte diğer tüm dönemler pasif hale gelecektir. Dersler, haftalık ders programları ve dashboard istatistikleri bu yeni seçilen aktif döneme göre yüklenecektir.
              </span>
            </div>
          </div>
        }
        confirmText="Dönemi Aktifleştir"
        cancelText="İptal"
        confirmLoading={activateMutation.isPending}
      />

      {/* Delete Confirmation Modal */}
      <ConfirmDialog
        isOpen={!!deletingPeriod}
        onClose={() => setDeletingPeriod(null)}
        onConfirm={() => {
          if (deletingPeriod) deleteMutation.mutate(deletingPeriod.id);
        }}
        title="Dönemi Sil"
        message={`"${deletingPeriod?.displayName}" dönemini sistemden silmek istediğinize emin misiniz? Bu dönemle ilişkili ders programları ve dersler de etkilenecektir. Bu işlem geri alınamaz.`}
        confirmText="Sil"
        cancelText="İptal"
        confirmLoading={deleteMutation.isPending}
      />
    </div>
  );
};

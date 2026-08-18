import { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import toast from 'react-hot-toast';
import { Plus, Edit2, Trash2, Landmark, Building2, Layers, MapPinned, X } from 'lucide-react';
import { AxiosError } from 'axios';
import { useNavigate } from 'react-router-dom';

import { PageHeader } from '@/components/ui/PageHeader';
import { PrimaryButton } from '@/components/ui/PrimaryButton';
import { SecondaryButton } from '@/components/ui/SecondaryButton';
import { EmptyState } from '@/components/ui/EmptyState';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { FormModal } from '@/components/ui/FormModal';
import { MoreActionsMenu } from '@/components/ui/MoreActionsMenu';
import { facultyService } from '@/services/facultyService';
import { FacultyResponse, CreateFacultyRequest, UpdateFacultyRequest } from '@/types';

// Zod validation schema
const facultySchema = z.object({
  name: z
    .string()
    .min(1, 'Fakülte adı zorunludur.')
    .max(255, 'Fakülte adı en fazla 255 karakter olabilir.'),
  code: z
    .string()
    .min(1, 'Fakülte kodu zorunludur.')
    .max(50, 'Fakülte kodu en fazla 50 karakter olabilir.'),
});

type FacultyFormValues = z.infer<typeof facultySchema>;

export const FacultyPage = () => {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');

  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingFaculty, setEditingFaculty] = useState<FacultyResponse | null>(null);
  const [deletingFaculty, setDeletingFaculty] = useState<FacultyResponse | null>(null);

  // Fetch faculties
  const { data, isLoading } = useQuery({
    queryKey: ['faculties'],
    queryFn: facultyService.getAll,
  });

  const facultiesList = useMemo(() => data?.faculties || [], [data?.faculties]);

  // Filter faculties by search query
  const filteredFaculties = useMemo(() => {
    return facultiesList.filter(
      (f) =>
        f.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        f.code.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [facultiesList, searchQuery]);

  // Form setup
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<FacultyFormValues>({
    resolver: zodResolver(facultySchema),
    defaultValues: {
      name: '',
      code: '',
    },
  });

  // Open modal for Create
  const handleOpenCreate = () => {
    setEditingFaculty(null);
    reset({ name: '', code: '' });
    setIsModalOpen(true);
  };

  // Open modal for Edit
  const handleOpenEdit = (faculty: FacultyResponse) => {
    setEditingFaculty(faculty);
    reset({ name: faculty.name, code: faculty.code });
    setIsModalOpen(true);
  };

  // Create Mutation
  const createMutation = useMutation({
    mutationFn: (payload: CreateFacultyRequest) => facultyService.create(payload),
    onSuccess: () => {
      toast.success('Fakülte başarıyla eklendi.');
      queryClient.invalidateQueries({ queryKey: ['faculties'] });
      setIsModalOpen(false);
    },
    onError: (err: AxiosError<{ message: string }>) => {
      const message = err.response?.data?.message || 'Fakülte eklenirken hata oluştu.';
      toast.error(message);
    },
  });

  // Update Mutation
  const updateMutation = useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: UpdateFacultyRequest }) =>
      facultyService.update(id, payload),
    onSuccess: () => {
      toast.success('Fakülte başarıyla güncellendi.');
      queryClient.invalidateQueries({ queryKey: ['faculties'] });
      setIsModalOpen(false);
    },
    onError: (err: AxiosError<{ message: string }>) => {
      const message = err.response?.data?.message || 'Fakülte güncellenirken hata oluştu.';
      toast.error(message);
    },
  });

  // Delete Mutation
  const deleteMutation = useMutation({
    mutationFn: (id: string) => facultyService.delete(id),
    onSuccess: () => {
      toast.success('Fakülte başarıyla silindi.');
      queryClient.invalidateQueries({ queryKey: ['faculties'] });
      setDeletingFaculty(null);
    },
    onError: (err: AxiosError<{ message: string }>) => {
      const message = err.response?.data?.message || 'Fakülte silinirken hata oluştu.';
      toast.error(message);
    },
  });

  // Form Submit Handler
  const onSubmit = (values: FacultyFormValues) => {
    if (editingFaculty) {
      updateMutation.mutate({ id: editingFaculty.id, payload: values });
    } else {
      createMutation.mutate(values);
    }
  };

  const handleConfirmDelete = () => {
    if (deletingFaculty) {
      deleteMutation.mutate(deletingFaculty.id);
    }
  };

  return (
    <div className="space-y-4 sm:space-y-5">
      <PageHeader
        title="Fakülte Yönetimi"
        badge={
          facultiesList.length > 0 ? (
            <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-semibold text-slate-500">
              {filteredFaculties.length}{filteredFaculties.length !== facultiesList.length ? ` / ${facultiesList.length}` : ''}
            </span>
          ) : null
        }
        action={
          facultiesList.length > 0 ? (
            <PrimaryButton onClick={handleOpenCreate} icon={<Plus className="h-4.5 w-4.5" />}>
              Yeni Fakülte Ekle
            </PrimaryButton>
          ) : null
        }
      />

      {/* Filter and List Area */}
      <div className="space-y-4">
        {facultiesList.length > 0 && (
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
                placeholder="Fakülte adı veya kodu ara..."
                className="dts-input pl-9 h-10 py-1.5 text-xs sm:text-sm rounded-xl hover:border-[#88d0f2] focus:border-[#006482] focus:ring-2 focus:ring-[#006482]/10"
              />
              {searchQuery && (
                <button type="button" onClick={() => setSearchQuery('')} className="absolute inset-y-0 right-3 flex items-center text-slate-400 hover:text-slate-600">
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>
          </div>
        )}

        {isLoading ? (
          <div className="space-y-2.5">
            {[1, 2, 3].map((idx) => (
              <div key={idx} className="dts-card p-4 animate-pulse flex items-center justify-between border border-slate-200/40 bg-white">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-xl bg-slate-100" />
                  <div className="space-y-2">
                    <div className="h-4 w-40 rounded bg-slate-100" />
                    <div className="h-3 w-20 rounded bg-slate-100" />
                  </div>
                </div>
                <div className="flex gap-3">
                  <div className="h-9 w-14 rounded-xl bg-slate-50" />
                  <div className="h-9 w-14 rounded-xl bg-slate-50" />
                  <div className="h-9 w-14 rounded-xl bg-slate-50" />
                </div>
              </div>
            ))}
          </div>
        ) : facultiesList.length === 0 ? (
          <EmptyState
            title="Henüz sisteme herhangi bir fakülte eklenmemiştir."
            description="Sistemi kullanmaya başlamak için önce fakülteleri oluşturun. Daha sonra bina, kat ve derslik tanımlamalarını yapabilirsiniz."
            action={
              <PrimaryButton onClick={handleOpenCreate} icon={<Plus className="h-4.5 w-4.5" />}>
                İlk Fakülteyi Oluştur
              </PrimaryButton>
            }
          />
        ) : filteredFaculties.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-100 text-slate-400">
              <Landmark className="h-6 w-6" />
            </div>
            <h3 className="text-sm font-bold text-slate-600">Eşleşen fakülte bulunamadı</h3>
            <p className="mt-1 text-[13px] text-slate-400">Arama kelimesini değiştirmeyi veya temizlemeyi deneyin.</p>
          </div>
        ) : (
          <div className="space-y-2">
            {filteredFaculties.map((faculty) => {
              const actions = [
                {
                  label: 'Düzenle',
                  icon: <Edit2 className="h-3.5 w-3.5" />,
                  onClick: () => handleOpenEdit(faculty),
                },
                {
                  label: 'Sil',
                  icon: <Trash2 className="h-3.5 w-3.5" />,
                  onClick: () => setDeletingFaculty(faculty),
                  variant: 'danger' as const,
                },
              ];

              return (
                <div
                  key={faculty.id}
                  onClick={() => navigate(`/super-admin/fakulteler/${faculty.id}`)}
                  className="group flex items-center justify-between p-3.5 sm:p-4 rounded-2xl border border-slate-200/80 bg-gradient-to-br from-[#f6fbfe] via-white to-[#e2f3fa] shadow-xs cursor-pointer select-none transition-all duration-200 ease-out dts-interactive-card"
                >
                  <div className="flex-1 min-w-0 flex flex-col md:flex-row md:items-center justify-between gap-3.5 pr-3">
                    {/* Faculty Title & Code */}
                    <div className="flex items-center gap-3.5 min-w-0">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white/80 text-slate-500 border border-slate-100/90 group-hover:bg-[#eff8ff] group-hover:text-[#006482] transition duration-200">
                        <Landmark className="h-5.5 w-5.5" />
                      </div>
                      <div className="min-w-0">
                        <h4 className="text-sm font-bold text-slate-900 leading-tight group-hover:text-[#006482] transition-colors duration-150 truncate">
                          {faculty.name}
                        </h4>
                        <p className="text-[10px] text-slate-400 mt-0.5">Fakülte Kodu: {faculty.code}</p>
                      </div>
                    </div>

                    {/* Metrics list */}
                    <div className="flex flex-wrap items-center gap-2 sm:gap-3.5">
                      <div className="flex items-center gap-2 border border-slate-200/50 bg-white/95 rounded-xl px-2.5 py-1 min-w-[75px] shadow-xs">
                        <Building2 className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                        <div className="flex flex-col text-left">
                          <span className="text-[8px] font-bold text-slate-400 uppercase tracking-wider leading-none">Bina</span>
                          <span className="text-xs font-extrabold text-slate-700 mt-0.5 leading-none">{faculty.totalBuildings}</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 border border-slate-200/50 bg-white/95 rounded-xl px-2.5 py-1 min-w-[75px] shadow-xs">
                        <Layers className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                        <div className="flex flex-col text-left">
                          <span className="text-[8px] font-bold text-slate-400 uppercase tracking-wider leading-none">Kat</span>
                          <span className="text-xs font-extrabold text-slate-700 mt-0.5 leading-none">{faculty.totalFloors}</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 border border-slate-200/50 bg-white/95 rounded-xl px-2.5 py-1 min-w-[75px] shadow-xs">
                        <MapPinned className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                        <div className="flex flex-col text-left">
                          <span className="text-[8px] font-bold text-slate-400 uppercase tracking-wider leading-none">Derslik</span>
                          <span className="text-xs font-extrabold text-slate-700 mt-0.5 leading-none">{faculty.totalClassrooms}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Actions dropdown */}
                  <div onClick={(e) => e.stopPropagation()} className="shrink-0">
                    <MoreActionsMenu actions={actions} />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Create/Edit Form Modal */}
      <FormModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingFaculty ? 'Fakülteyi Düzenle' : 'Yeni Fakülte Ekle'}
      >
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
          <div className="space-y-1">
            <label htmlFor="name" className="dts-input-label text-[10px] mb-1">
              Fakülte Adı
            </label>
            <input
              id="name"
              type="text"
              {...register('name')}
              placeholder="Örn. Mühendislik Fakültesi"
              className={`dts-input ${errors.name ? 'border-red-300 focus:border-red-500 focus:ring-red-500/10' : ''}`}
            />
            {errors.name && <p className="text-[11px] font-medium text-red-500 mt-1">{errors.name.message}</p>}
          </div>

          <div className="space-y-1">
            <label htmlFor="code" className="dts-input-label text-[10px] mb-1">
              Fakülte Kodu
            </label>
            <input
              id="code"
              type="text"
              {...register('code')}
              placeholder="Örn. MF"
              className={`dts-input ${errors.code ? 'border-red-300 focus:border-red-500 focus:ring-red-500/10' : ''}`}
            />
            {errors.code && <p className="text-[11px] font-medium text-red-500 mt-1">{errors.code.message}</p>}
          </div>

          <div className="flex justify-end gap-3 pt-3 border-t border-slate-100 mt-2">
            <SecondaryButton type="button" onClick={() => setIsModalOpen(false)}>
              İptal
            </SecondaryButton>
            <PrimaryButton
              type="submit"
              loading={createMutation.isPending || updateMutation.isPending}
            >
              {editingFaculty ? 'Güncelle' : 'Kaydet'}
            </PrimaryButton>
          </div>
        </form>
      </FormModal>

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        isOpen={!!deletingFaculty}
        onClose={() => setDeletingFaculty(null)}
        onConfirm={handleConfirmDelete}
        title="Fakülteyi Sil"
        message={`"${deletingFaculty?.name}" kaydını silmek istediğinize emin misiniz? Bu işlem geri alınamaz.`}
        confirmLoading={deleteMutation.isPending}
        confirmText="Sil"
        cancelText="İptal"
      />
    </div>
  );
};

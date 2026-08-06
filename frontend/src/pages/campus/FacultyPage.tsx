import { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import toast from 'react-hot-toast';
import { Plus, Edit2, Trash2, Landmark, Building2, Layers, MapPinned } from 'lucide-react';
import { AxiosError } from 'axios';
import { useNavigate } from 'react-router-dom';

import { PageHeader } from '@/components/ui/PageHeader';
import { PrimaryButton } from '@/components/ui/PrimaryButton';
import { SecondaryButton } from '@/components/ui/SecondaryButton';
import { SearchInput } from '@/components/ui/SearchInput';
import { EmptyState } from '@/components/ui/EmptyState';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { FormModal } from '@/components/ui/FormModal';
import { RichList } from '@/components/ui/RichList';
import { RichListItem } from '@/components/ui/RichListItem';
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
    <div className="space-y-6">
      <PageHeader
        title="Fakülte Yönetimi"
        description="Sistemde tanımlı fakülteleri görüntüleyebilir ve yönetebilirsiniz."
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
          <div className="dts-filter-bar">
            <SearchInput
              onSearchChange={setSearchQuery}
              placeholder="Fakülte adı veya kodu ara..."
            />
          </div>
        )}

        {isLoading ? (
          <div className="space-y-3.5">
            {[1, 2, 3].map((idx) => (
              <div key={idx} className="dts-card p-5 animate-pulse flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="h-11 w-11 rounded-xl bg-slate-100" />
                  <div className="space-y-2">
                    <div className="h-4 w-40 rounded bg-slate-100" />
                    <div className="h-3.5 w-20 rounded bg-slate-100" />
                  </div>
                </div>
                <div className="flex gap-4">
                  <div className="h-10 w-16 rounded-xl bg-slate-50" />
                  <div className="h-10 w-16 rounded-xl bg-slate-50" />
                  <div className="h-10 w-16 rounded-xl bg-slate-50" />
                </div>
              </div>
            ))}
          </div>
        ) : filteredFaculties.length === 0 ? (
          <EmptyState
            title="Henüz sisteme herhangi bir fakülte eklenmemiştir."
            description="Sistemi kullanmaya başlamak için önce fakülteleri oluşturun. Daha sonra bina, kat ve derslik tanımlamalarını yapabilirsiniz."
            action={
              <PrimaryButton onClick={handleOpenCreate} icon={<Plus className="h-4.5 w-4.5" />}>
                İlk Fakülteyi Oluştur
              </PrimaryButton>
            }
          />
        ) : (
          <RichList>
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
                <RichListItem
                  key={faculty.id}
                  onClick={() => navigate(`/super-admin/fakulteler/${faculty.id}`)}
                  actionMenu={<MoreActionsMenu actions={actions} />}
                >
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    {/* Faculty Title & Code */}
                    <div className="flex items-center gap-3.5">
                      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-slate-50 text-slate-500 border border-slate-100 group-hover:bg-[#eff8ff] group-hover:text-[#006482] transition duration-200">
                        <Landmark className="h-5.5 w-5.5" />
                      </div>
                      <div>
                        <h4 className="text-sm font-bold text-slate-900 leading-tight group-hover:text-[#006482] transition-colors duration-150">
                          {faculty.name}
                        </h4>
                        <p className="text-[10px] text-slate-400 mt-1">Fakülte Kodu: {faculty.code}</p>
                      </div>
                    </div>

                    {/* Metrics list */}
                    <div className="flex flex-wrap items-center gap-2 sm:gap-3.5 md:mr-6">
                      <div className="flex items-center gap-2 border border-slate-200/50 bg-slate-50/50 rounded-xl px-3 py-1.5 min-w-[85px]">
                        <Building2 className="h-4 w-4 text-slate-400" />
                        <div className="flex flex-col text-left">
                          <span className="text-[8px] font-bold text-slate-400 uppercase tracking-wider leading-none">Bina</span>
                          <span className="text-xs font-extrabold text-slate-700 mt-0.5 leading-none">{faculty.totalBuildings}</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 border border-slate-200/50 bg-slate-50/50 rounded-xl px-3 py-1.5 min-w-[85px]">
                        <Layers className="h-4 w-4 text-slate-400" />
                        <div className="flex flex-col text-left">
                          <span className="text-[8px] font-bold text-slate-400 uppercase tracking-wider leading-none">Kat</span>
                          <span className="text-xs font-extrabold text-slate-700 mt-0.5 leading-none">{faculty.totalFloors}</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 border border-slate-200/50 bg-slate-50/50 rounded-xl px-3 py-1.5 min-w-[85px]">
                        <MapPinned className="h-4 w-4 text-slate-400" />
                        <div className="flex flex-col text-left">
                          <span className="text-[8px] font-bold text-slate-400 uppercase tracking-wider leading-none">Derslik</span>
                          <span className="text-xs font-extrabold text-slate-700 mt-0.5 leading-none">{faculty.totalClassrooms}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </RichListItem>
              );
            })}
          </RichList>
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
            <label htmlFor="name" className="dts-input-label">
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
            <label htmlFor="code" className="dts-input-label">
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

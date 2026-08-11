import { Fragment, useMemo, useState, type FormEvent } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { CalendarDays, Clock, Edit2, MapPin, Plus, Trash2, User, XCircle } from 'lucide-react';
import { AppSelect } from '@/components/ui/AppSelect';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { FormModal } from '@/components/ui/FormModal';
import { PrimaryButton } from '@/components/ui/PrimaryButton';
import { SecondaryButton } from '@/components/ui/SecondaryButton';
import { courseService } from '@/services/courseService';
import { scheduleService } from '@/services/scheduleService';
import {
  AvailableClassroomResponse,
  CourseResponse,
  ScheduleDay,
  Semester,
  WeeklyScheduleResponse,
  classroomTypeLabels,
  scheduleDays,
  scheduleTimeSlots,
} from '@/types';
import { cn } from '@/utils/cn';

const semesterOptions: { label: string; value: Semester | '' }[] = [
  { label: 'Tüm Dönemler', value: '' },
  { label: 'Güz', value: 'GUZ' },
  { label: 'Bahar', value: 'BAHAR' },
  { label: 'Yaz', value: 'YAZ_OKULU' },
];

type ScheduleFormState = {
  courseId: string;
  dayOfWeek: ScheduleDay | '';
  timeSlot: string;
  classroomId: string;
};

const initialForm: ScheduleFormState = {
  courseId: '',
  dayOfWeek: '',
  timeSlot: '',
  classroomId: '',
};

const dayLabel = (day: string) => scheduleDays.find((item) => item.value === day)?.label ?? day;

const formatSlot = (slot: string) => slot.replace('-', ' - ');

export const SchedulePage = () => {
  const queryClient = useQueryClient();
  const [selectedSemester, setSelectedSemester] = useState<Semester | ''>('GUZ');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingSchedule, setEditingSchedule] = useState<WeeklyScheduleResponse | null>(null);
  const [deletingSchedule, setDeletingSchedule] = useState<WeeklyScheduleResponse | null>(null);
  const [form, setForm] = useState<ScheduleFormState>(initialForm);

  const { data: schedules = [], isLoading, error } = useQuery({
    queryKey: ['weeklySchedules', selectedSemester],
    queryFn: () => scheduleService.getAll(selectedSemester || undefined),
  });

  const { data: courses = [] } = useQuery({
    queryKey: ['courses'],
    queryFn: courseService.getAll,
  });

  const selectedCourse = useMemo(
    () => courses.find((course) => course.id === form.courseId) ?? null,
    [courses, form.courseId],
  );

  const canQueryClassrooms = Boolean(form.dayOfWeek && form.timeSlot);

  const { data: classrooms = [], isFetching: isClassroomsLoading } = useQuery({
    queryKey: ['availableClassrooms', form.dayOfWeek, form.timeSlot, editingSchedule?.id],
    queryFn: () => scheduleService.getAvailableClassrooms({
      dayOfWeek: form.dayOfWeek,
      timeSlot: form.timeSlot,
      excludeScheduleId: editingSchedule?.id,
    }),
    enabled: canQueryClassrooms,
  });

  const availableClassrooms = useMemo(
    () => classrooms.filter((classroom) => classroom.available),
    [classrooms],
  );

  const busyClassrooms = useMemo(
    () => classrooms.filter((classroom) => !classroom.available),
    [classrooms],
  );

  const schedulesByCell = useMemo(() => {
    const map = new Map<string, WeeklyScheduleResponse[]>();
    schedules.forEach((schedule) => {
      const key = `${schedule.dayOfWeek}:${schedule.timeSlot}`;
      map.set(key, [...(map.get(key) ?? []), schedule]);
    });
    return map;
  }, [schedules]);

  const courseOptions = useMemo(
    () => courses
      .filter((course) => course.active)
      .filter((course) => !selectedSemester || course.semester === selectedSemester)
      .map((course) => ({ label: `${course.code} - ${course.name}`, value: course.id })),
    [courses, selectedSemester],
  );

  const classroomOptions = useMemo(
    () => availableClassrooms.map((classroom) => ({
      label: `${classroom.code} - ${classroom.name} · ${classroom.capacity} kişi · ${classroomTypeLabels[classroom.type] ?? classroom.type}`,
      value: classroom.id,
    })),
    [availableClassrooms],
  );

  const openCreate = () => {
    setEditingSchedule(null);
    setForm(initialForm);
    setIsModalOpen(true);
  };

  const openEdit = (schedule: WeeklyScheduleResponse) => {
    setEditingSchedule(schedule);
    setForm({
      courseId: schedule.courseId,
      dayOfWeek: schedule.dayOfWeek,
      timeSlot: schedule.timeSlot,
      classroomId: schedule.classroomId,
    });
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingSchedule(null);
    setForm(initialForm);
  };

  const updateForm = (patch: Partial<ScheduleFormState>) => {
    setForm((current) => {
      const next = { ...current, ...patch };
      if ('dayOfWeek' in patch || 'timeSlot' in patch) {
        next.classroomId = '';
      }
      return next;
    });
  };

  const createMutation = useMutation({
    mutationFn: scheduleService.create,
    onSuccess: () => {
      toast.success('Ders programı eklendi.');
      queryClient.invalidateQueries({ queryKey: ['weeklySchedules'] });
      closeModal();
    },
    onError: (err: any) => toast.error(err.response?.data?.message || 'Ders programı eklenemedi.'),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: ScheduleFormState }) => scheduleService.update(id, {
      courseId: payload.courseId,
      classroomId: payload.classroomId,
      dayOfWeek: payload.dayOfWeek as ScheduleDay,
      timeSlot: payload.timeSlot,
    }),
    onSuccess: () => {
      toast.success('Ders programı güncellendi.');
      queryClient.invalidateQueries({ queryKey: ['weeklySchedules'] });
      closeModal();
    },
    onError: (err: any) => toast.error(err.response?.data?.message || 'Ders programı güncellenemedi.'),
  });

  const deleteMutation = useMutation({
    mutationFn: scheduleService.delete,
    onSuccess: () => {
      toast.success('Ders programı kaldırıldı.');
      queryClient.invalidateQueries({ queryKey: ['weeklySchedules'] });
      setDeletingSchedule(null);
    },
    onError: (err: any) => toast.error(err.response?.data?.message || 'Ders programı kaldırılamadı.'),
  });

  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!form.courseId || !form.dayOfWeek || !form.timeSlot || !form.classroomId) {
      toast.error('Ders, gün, saat ve sınıf seçimi zorunludur.');
      return;
    }

    const payload = {
      courseId: form.courseId,
      classroomId: form.classroomId,
      dayOfWeek: form.dayOfWeek,
      timeSlot: form.timeSlot,
    };

    if (editingSchedule) updateMutation.mutate({ id: editingSchedule.id, payload });
    else createMutation.mutate(payload);
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <h1 className="text-xl font-bold tracking-tight text-slate-900">Ders Programı</h1>
          <p className="mt-0.5 text-[13px] text-slate-400">Bölüm derslerini haftalık takvime manuel yerleştirin.</p>
        </div>
        <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row sm:items-center">
          <div className="flex w-full min-w-[180px] items-center gap-2 sm:w-44">
            <CalendarDays className="h-4 w-4 shrink-0 text-slate-400" />
            <AppSelect
              value={selectedSemester}
              onChange={(value) => setSelectedSemester(value as Semester | '')}
              options={semesterOptions}
              placeholder="Dönem seçiniz"
              className="min-w-[150px]"
            />
          </div>
          <PrimaryButton onClick={openCreate} icon={<Plus className="h-4 w-4" />}>Ders Programı Ekle</PrimaryButton>
        </div>
      </div>

      {isLoading ? (
        <div className="grid gap-2">
          {[1, 2, 3].map((item) => <div key={item} className="h-24 animate-pulse rounded-2xl border border-slate-200/50 bg-white" />)}
        </div>
      ) : error ? (
        <div className="rounded-2xl border border-red-100 bg-red-50 px-4 py-8 text-center">
          <p className="text-sm font-bold text-red-700">Haftalık ders programı yüklenirken bir hata oluştu.</p>
        </div>
      ) : schedules.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-slate-200 bg-white py-16 text-center">
          <CalendarDays className="h-10 w-10 text-slate-300" />
          <h3 className="mt-3 text-base font-bold text-slate-700">Henüz haftalık ders programı oluşturulmadı.</h3>
          <PrimaryButton onClick={openCreate} className="mt-5" icon={<Plus className="h-4 w-4" />}>Ders Programı Ekle</PrimaryButton>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-slate-200/70 bg-white">
          <div className="grid min-w-[980px]" style={{ gridTemplateColumns: '116px repeat(5, minmax(160px, 1fr))' }}>
            <div className="border-b border-r border-slate-100 bg-slate-50 px-3 py-3 text-xs font-bold uppercase tracking-wider text-slate-400">Saat</div>
            {scheduleDays.map((day) => (
              <div key={day.value} className="border-b border-r border-slate-100 bg-slate-50 px-3 py-3 text-xs font-bold uppercase tracking-wider text-slate-500">
                {day.label}
              </div>
            ))}

            {scheduleTimeSlots.map((slot) => (
              <Fragment key={slot}>
                <div key={`${slot}-label`} className="border-b border-r border-slate-100 px-3 py-4 text-xs font-bold text-slate-500">
                  {formatSlot(slot)}
                </div>
                {scheduleDays.map((day) => {
                  const cellSchedules = schedulesByCell.get(`${day.value}:${slot}`) ?? [];
                  const hasConflict = cellSchedules.some((schedule, index) =>
                    cellSchedules.findIndex((other) => other.classroomId === schedule.classroomId) !== index
                  );

                  return (
                    <div key={`${day.value}-${slot}`} className="min-h-28 border-b border-r border-slate-100 p-2">
                      <div className="space-y-2">
                        {cellSchedules.map((schedule) => (
                          <ScheduleCard
                            key={schedule.id}
                            schedule={schedule}
                            hasConflict={hasConflict}
                            onEdit={() => openEdit(schedule)}
                            onDelete={() => setDeletingSchedule(schedule)}
                          />
                        ))}
                      </div>
                    </div>
                  );
                })}
              </Fragment>
            ))}
          </div>
        </div>
      )}

      <FormModal isOpen={isModalOpen} onClose={closeModal} title={editingSchedule ? 'Ders Programını Düzenle' : 'Ders Programı Ekle'}>
        <form onSubmit={submit} className="space-y-4">
          <div className="space-y-1">
            <label className="dts-input-label">Ders</label>
            <AppSelect
              value={form.courseId}
              onChange={(courseId) => updateForm({ courseId })}
              options={courseOptions}
              searchable
              placeholder="Ders seçiniz"
              emptyText="Bu dönem için ders bulunamadı"
            />
          </div>

          <ReadonlyLecturer course={selectedCourse} />

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="dts-input-label">Gün</label>
              <AppSelect
                value={form.dayOfWeek}
                onChange={(dayOfWeek) => updateForm({ dayOfWeek: dayOfWeek as ScheduleDay })}
                options={scheduleDays.map((day) => ({ label: day.label, value: day.value }))}
                placeholder="Gün seçiniz"
              />
            </div>
            <div className="space-y-1">
              <label className="dts-input-label">Saat</label>
              <AppSelect
                value={form.timeSlot}
                onChange={(timeSlot) => updateForm({ timeSlot })}
                options={scheduleTimeSlots.map((slot) => ({ label: formatSlot(slot), value: slot }))}
                placeholder="Saat seçiniz"
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="dts-input-label">Sınıf</label>
            <AppSelect
              value={form.classroomId}
              onChange={(classroomId) => updateForm({ classroomId })}
              options={classroomOptions}
              searchable
              disabled={!canQueryClassrooms || isClassroomsLoading}
              placeholder={isClassroomsLoading ? 'Sınıflar kontrol ediliyor...' : 'Sınıf seçiniz'}
              emptyText={canQueryClassrooms ? 'Uygun sınıf bulunamadı' : 'Önce gün ve saat seçiniz'}
            />
            {busyClassrooms.length > 0 && (
              <div className="mt-2 rounded-2xl border border-amber-100 bg-amber-50/60 p-3">
                <p className="text-[11px] font-bold uppercase tracking-wider text-amber-700">Dolu sınıflar</p>
                <div className="mt-2 flex flex-wrap gap-2">
                  {busyClassrooms.map((classroom) => (
                    <span key={classroom.id} className="rounded-full border border-amber-200 bg-white px-2.5 py-1 text-[11px] font-semibold text-amber-700">
                      {classroom.code}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="flex justify-end gap-3 border-t border-slate-100 pt-4">
            <SecondaryButton type="button" onClick={closeModal}>İptal</SecondaryButton>
            <PrimaryButton type="submit" loading={createMutation.isPending || updateMutation.isPending}>Kaydet</PrimaryButton>
          </div>
        </form>
      </FormModal>

      <ConfirmDialog
        isOpen={!!deletingSchedule}
        onClose={() => setDeletingSchedule(null)}
        onConfirm={() => deletingSchedule && deleteMutation.mutate(deletingSchedule.id)}
        title="Ders Programını Kaldır"
        message="Bu ders programını kaldırmak istediğinize emin misiniz?"
        confirmText="Kaldır"
        cancelText="Vazgeç"
        confirmLoading={deleteMutation.isPending}
      />
    </div>
  );
};

const ReadonlyLecturer = ({ course }: { course: CourseResponse | null }) => (
  <div className="rounded-2xl border border-slate-200/70 bg-slate-50 px-3 py-2.5">
    <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Akademisyen</p>
    <p className={cn('mt-1 text-sm font-semibold', course ? 'text-slate-700' : 'text-slate-400')}>
      {course?.academicianName ?? 'Ders seçildiğinde otomatik gösterilir'}
    </p>
  </div>
);

const ScheduleCard = ({
  schedule,
  hasConflict,
  onEdit,
  onDelete,
}: {
  schedule: WeeklyScheduleResponse;
  hasConflict: boolean;
  onEdit: () => void;
  onDelete: () => void;
}) => (
  <article className={cn('rounded-xl border p-2.5 shadow-sm', hasConflict ? 'border-red-200 bg-red-50' : 'border-[#006482]/15 bg-[#eff8ff]')}>
    <div className="flex items-start justify-between gap-2">
      <div className="min-w-0">
        <p className="truncate text-xs font-extrabold text-slate-900">{schedule.courseCode}</p>
        <p className="mt-0.5 line-clamp-2 text-[11px] font-semibold leading-snug text-slate-600">{schedule.courseName}</p>
      </div>
      <div className="flex shrink-0 items-center gap-1">
        <button type="button" onClick={onEdit} className="rounded-lg p-1 text-slate-400 transition hover:bg-white hover:text-[#006482]" aria-label="Düzenle">
          <Edit2 className="h-3.5 w-3.5" />
        </button>
        <button type="button" onClick={onDelete} className="rounded-lg p-1 text-slate-400 transition hover:bg-white hover:text-red-600" aria-label="Sil">
          <Trash2 className="h-3.5 w-3.5" />
        </button>
      </div>
    </div>
    <div className="mt-2 space-y-1 text-[10px] font-semibold text-slate-500">
      <p className="flex items-center gap-1.5"><User className="h-3 w-3" /> <span className="truncate">{schedule.academicianName}</span></p>
      <p className="flex items-center gap-1.5"><MapPin className="h-3 w-3" /> <span className="truncate">{schedule.classroomCode} · {schedule.classroomName}</span></p>
      <p className="flex items-center gap-1.5"><Clock className="h-3 w-3" /> {formatSlot(schedule.timeSlot)}</p>
      {hasConflict && <p className="flex items-center gap-1.5 font-bold text-red-600"><XCircle className="h-3 w-3" /> Çakışma</p>}
    </div>
  </article>
);

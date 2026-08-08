import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { CheckCheck, Loader2, X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { NotificationResponse, notificationService } from '@/services/notificationService';

type NotificationPanelProps = {
  onClose: () => void;
};

const formatRelativeTime = (value: string) => {
  const diffMs = Date.now() - new Date(value).getTime();
  const diffMinutes = Math.max(0, Math.floor(diffMs / 60000));

  if (diffMinutes < 1) return 'Şimdi';
  if (diffMinutes < 60) return `${diffMinutes} dk önce`;

  const diffHours = Math.floor(diffMinutes / 60);
  if (diffHours < 24) return `${diffHours} sa önce`;

  const diffDays = Math.floor(diffHours / 24);
  return `${diffDays} gün önce`;
};

export const NotificationPanel = ({ onClose }: NotificationPanelProps) => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const { data: notifications = [], isLoading } = useQuery({
    queryKey: ['notifications'],
    queryFn: notificationService.getAll,
  });

  const markAsReadMutation = useMutation({
    mutationFn: notificationService.markAsRead,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      queryClient.invalidateQueries({ queryKey: ['notifications', 'unread-count'] });
    },
  });

  const markAllAsReadMutation = useMutation({
    mutationFn: notificationService.markAllAsRead,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      queryClient.invalidateQueries({ queryKey: ['notifications', 'unread-count'] });
    },
  });

  const handleNotificationClick = (notification: NotificationResponse) => {
    if (!notification.read) {
      markAsReadMutation.mutate(notification.id);
    }
    if (notification.targetUrl) {
      navigate(notification.targetUrl);
      onClose();
    }
  };

  const hasUnread = notifications.some((notification) => !notification.read);

  return (
    <div className="absolute right-0 top-12 z-50 w-[calc(100vw-1.5rem)] max-w-[400px] rounded-2xl border border-[#DCE4EA] bg-white shadow-2xl shadow-slate-900/10">
      <div className="flex items-center justify-between gap-3 border-b border-[#DCE4EA] p-4">
        <div>
          <h2 className="text-xs font-bold tracking-[0.18em] text-[#647488]">BİLDİRİMLER</h2>
          <p className="mt-1 text-xs font-medium text-[#647488]">{notifications.length ? 'Son 20 bildirim' : 'Henüz bildirim yok'}</p>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
          aria-label="Bildirimleri kapat"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      <div className="flex items-center justify-end border-b border-[#DCE4EA] px-4 py-2">
        <button
          type="button"
          onClick={() => markAllAsReadMutation.mutate()}
          disabled={!hasUnread || markAllAsReadMutation.isPending}
          className="inline-flex items-center gap-2 rounded-lg px-2.5 py-1.5 text-xs font-bold text-[#006482] transition hover:bg-[#006482]/10 disabled:cursor-not-allowed disabled:opacity-45"
        >
          <CheckCheck className="h-3.5 w-3.5" />
          Tümünü okundu işaretle
        </button>
      </div>

      <div className="max-h-[420px] overflow-y-auto p-2">
        {isLoading && (
          <div className="flex items-center justify-center gap-2 px-4 py-10 text-sm font-medium text-[#647488]">
            <Loader2 className="h-4 w-4 animate-spin text-[#006482]" />
            Yükleniyor
          </div>
        )}

        {!isLoading && !notifications.length && (
          <div className="px-4 py-10 text-center text-sm font-medium text-[#647488]">Okunacak bildiriminiz yok.</div>
        )}

        {!isLoading &&
          notifications.map((notification) => (
            <button
              key={notification.id}
              type="button"
              onClick={() => handleNotificationClick(notification)}
              className={`mb-1 flex w-full gap-3 rounded-xl px-3 py-3 text-left transition last:mb-0 ${
                notification.read ? 'hover:bg-[#F6F8FA]' : 'bg-[#006482]/10 hover:bg-[#006482]/20'
              }`}
            >
              <span
                className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${
                  notification.read ? 'bg-slate-300' : 'bg-[#FAB900]'
                }`}
              />
              <span className="min-w-0">
                <span className="block text-sm font-bold text-[#102033]">{notification.title}</span>
                <span className="mt-1 block text-xs font-medium leading-5 text-[#647488]">{notification.message}</span>
                <span className="mt-1.5 block text-[11px] font-semibold text-[#647488]">
                  {formatRelativeTime(notification.createdAt)}
                </span>
              </span>
            </button>
          ))}
      </div>
    </div>
  );
};

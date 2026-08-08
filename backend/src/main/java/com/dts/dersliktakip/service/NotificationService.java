package com.dts.dersliktakip.service;

import com.dts.dersliktakip.dto.NotificationResponse;
import com.dts.dersliktakip.entity.Notification;
import com.dts.dersliktakip.entity.Role;
import com.dts.dersliktakip.entity.User;
import com.dts.dersliktakip.repository.NotificationRepository;
import com.dts.dersliktakip.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class NotificationService {

    private final NotificationRepository notificationRepository;
    private final UserRepository userRepository;

    @Transactional(readOnly = true)
    public List<NotificationResponse> listForUser(UUID userId) {
        return notificationRepository.findTop20ByRecipientIdOrderByCreatedAtDesc(userId)
                .stream()
                .map(this::toResponse)
                .toList();
    }

    @Transactional(readOnly = true)
    public long countUnread(UUID userId) {
        return notificationRepository.countByRecipientIdAndReadAtIsNull(userId);
    }

    @Transactional
    public NotificationResponse markAsRead(UUID userId, UUID notificationId) {
        Notification notification = notificationRepository.findById(notificationId)
                .filter(item -> item.getRecipient().getId().equals(userId))
                .orElseThrow(() -> new IllegalArgumentException("Bildirim bulunamadı."));

        if (notification.getReadAt() == null) {
            notification.setReadAt(Instant.now());
        }

        return toResponse(notificationRepository.save(notification));
    }

    @Transactional
    public void markAllAsRead(UUID userId) {
        Instant now = Instant.now();
        notificationRepository.findAllByRecipientIdAndReadAtIsNull(userId)
                .forEach(notification -> notification.setReadAt(now));
    }

    @Transactional
    public void createForUser(User recipient, String title, String message, String targetUrl) {
        Notification notification = new Notification();
        notification.setRecipient(recipient);
        notification.setTitle(title);
        notification.setMessage(message);
        notification.setTargetUrl(targetUrl);
        notificationRepository.save(notification);
    }

    @Transactional
    public void createForRole(Role role, String title, String message, String targetUrl) {
        userRepository.findActiveUsersByRole(role)
                .forEach(user -> createForUser(user, title, message, targetUrl));
    }

    private NotificationResponse toResponse(Notification notification) {
        return new NotificationResponse(
                notification.getId(),
                notification.getTitle(),
                notification.getMessage(),
                notification.getTargetUrl(),
                notification.getReadAt() != null,
                notification.getCreatedAt()
        );
    }
}

package com.dts.dersliktakip.repository;

import com.dts.dersliktakip.entity.Notification;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.UUID;

public interface NotificationRepository extends JpaRepository<Notification, UUID> {

    List<Notification> findTop20ByRecipientIdOrderByCreatedAtDesc(UUID recipientId);

    List<Notification> findAllByRecipientIdAndReadAtIsNull(UUID recipientId);

    long countByRecipientIdAndReadAtIsNull(UUID recipientId);
}

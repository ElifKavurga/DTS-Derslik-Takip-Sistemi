package com.dts.dersliktakip.controller;

import com.dts.dersliktakip.dto.NotificationResponse;
import com.dts.dersliktakip.dto.UnreadNotificationCountResponse;
import com.dts.dersliktakip.security.UserPrincipal;
import com.dts.dersliktakip.service.NotificationService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/notifications")
@RequiredArgsConstructor
public class NotificationController {

    private final NotificationService notificationService;

    @GetMapping
    public ResponseEntity<List<NotificationResponse>> listNotifications(@AuthenticationPrincipal UserPrincipal principal) {
        return ResponseEntity.ok(notificationService.listForUser(principal.getId()));
    }

    @GetMapping("/unread-count")
    public ResponseEntity<UnreadNotificationCountResponse> countUnread(@AuthenticationPrincipal UserPrincipal principal) {
        return ResponseEntity.ok(new UnreadNotificationCountResponse(notificationService.countUnread(principal.getId())));
    }

    @PutMapping("/{id}/read")
    public ResponseEntity<NotificationResponse> markAsRead(
            @PathVariable UUID id,
            @AuthenticationPrincipal UserPrincipal principal
    ) {
        return ResponseEntity.ok(notificationService.markAsRead(principal.getId(), id));
    }

    @PutMapping("/read-all")
    public ResponseEntity<Void> markAllAsRead(@AuthenticationPrincipal UserPrincipal principal) {
        notificationService.markAllAsRead(principal.getId());
        return ResponseEntity.noContent().build();
    }
}

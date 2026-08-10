package com.dts.dersliktakip.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

import java.time.Instant;
import java.util.UUID;

@Getter
@Setter
@Entity
@Table(name = "floor_layout")
public class FloorLayout {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @OneToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "floor_id", nullable = false, unique = true)
    private Floor floor;

    @Column(columnDefinition = "TEXT", name = "background_image_base64")
    private String backgroundImageBase64;

    @Column(length = 10, name = "background_image_type")
    private String backgroundImageType;

    @Column(nullable = false, name = "viewport_x")
    private Double viewportX = 0.0;

    @Column(nullable = false, name = "viewport_y")
    private Double viewportY = 0.0;

    @Column(nullable = false, name = "viewport_zoom")
    private Double viewportZoom = 1.0;

    @Column(nullable = false, name = "background_x")
    private Double backgroundX = 0.0;

    @Column(nullable = false, name = "background_y")
    private Double backgroundY = 0.0;

    @Column(name = "background_width")
    private Double backgroundWidth;

    @Column(name = "background_height")
    private Double backgroundHeight;

    @Column(nullable = false, name = "background_opacity")
    private Double backgroundOpacity = 0.35;

    @Column(nullable = false, name = "background_locked")
    private Boolean backgroundLocked = false;

    @Column(nullable = false, updatable = false, name = "created_at")
    private Instant createdAt;

    @Column(nullable = false, name = "updated_at")
    private Instant updatedAt;

    @PrePersist
    protected void onCreate() {
        Instant now = Instant.now();
        createdAt = now;
        updatedAt = now;
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = Instant.now();
    }
}

package com.dts.dersliktakip.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

import java.time.Instant;
import java.util.UUID;

@Getter
@Setter
@Entity
@Table(name = "space_objects")
public class SpaceObject {

    @Id
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "floor_id", nullable = false)
    private Floor floor;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "classroom_id")
    private Classroom classroom;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 50)
    private SpaceObjectType type;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private SpaceObjectStatus status = SpaceObjectStatus.EMPTY;

    @Column(length = 255)
    private String label;

    @Column(length = 100)
    private String code;

    private Integer capacity;

    @Column(nullable = false, name = "position_x")
    private Double positionX = 0.0;

    @Column(nullable = false, name = "position_y")
    private Double positionY = 0.0;

    @Column(nullable = false)
    private Double width = 160.0;

    @Column(nullable = false)
    private Double height = 100.0;

    @Column(nullable = false)
    private Double rotation = 0.0;

    @Column(name = "slot_row")
    private Integer slotRow;

    @Column(name = "slot_column")
    private Integer slotColumn;

    @Column(columnDefinition = "TEXT", name = "metadata_json")
    private String metadataJson;

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

package com.dts.dersliktakip.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.OneToOne;
import jakarta.persistence.PrePersist;
import jakarta.persistence.PreUpdate;
import jakarta.persistence.Table;
import lombok.Getter;
import lombok.Setter;

import java.time.Instant;
import java.util.UUID;

@Getter
@Setter
@Entity
@Table(name = "department_schedule_configs")
public class DepartmentScheduleConfig {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @OneToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "department_id", nullable = false, unique = true)
    private Department department;

    @Column(name = "start_time", nullable = false, length = 5)
    private String startTime;

    @Column(name = "end_time", nullable = false, length = 5)
    private String endTime;

    @Column(name = "lesson_duration_minutes", nullable = false)
    private Integer lessonDurationMinutes;

    @Column(name = "break_duration_minutes", nullable = false)
    private Integer breakDurationMinutes;

    @Column(name = "lunch_break_enabled", nullable = false)
    private Boolean lunchBreakEnabled;

    @Column(name = "lunch_break_start", nullable = false, length = 5)
    private String lunchBreakStart;

    @Column(name = "lunch_break_end", nullable = false, length = 5)
    private String lunchBreakEnd;

    @Column(nullable = false, updatable = false)
    private Instant createdAt;

    @Column(nullable = false)
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

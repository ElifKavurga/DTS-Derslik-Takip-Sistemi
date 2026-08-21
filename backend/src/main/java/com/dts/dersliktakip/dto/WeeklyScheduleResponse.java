package com.dts.dersliktakip.dto;

import com.dts.dersliktakip.entity.ClassroomType;
import com.dts.dersliktakip.entity.DeliveryType;
import com.dts.dersliktakip.entity.Semester;

import java.util.UUID;

public record WeeklyScheduleResponse(
        UUID id,
        UUID courseId,
        String courseCode,
        String courseName,
        UUID academicianId,
        String academicianName,
        UUID classroomId,
        String classroomCode,
        String classroomName,
        Integer classroomCapacity,
        ClassroomType classroomType,
        UUID departmentId,
        String departmentName,
        String dayOfWeek,
        String timeSlot,
        Semester semester,
        UUID academicPeriodId,
        String academicPeriodDisplayName,
        UUID scheduleGroupId,
        DeliveryType deliveryType,
        Integer classLevel,
        String section,
        String studentGroup,
        String sourceNote
) {
}

package com.dts.dersliktakip.mapper;

import com.dts.dersliktakip.dto.CourseResponse;
import com.dts.dersliktakip.entity.Course;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;

@Mapper(componentModel = "spring")
public interface CourseMapper {

    @Mapping(target = "facultyId", source = "faculty.id")
    @Mapping(target = "facultyName", source = "faculty.name")
    @Mapping(target = "departmentId", source = "department.id")
    @Mapping(target = "departmentName", source = "department.name")
    @Mapping(target = "academicianId", source = "academician.id")
    @Mapping(target = "academicianName", expression = "java(course.getAcademician().getTitle() + \" \" + course.getAcademician().getFirstName() + \" \" + course.getAcademician().getLastName())")
    @Mapping(target = "academicPeriodId", source = "academicPeriod.id")
    @Mapping(target = "academicPeriodDisplayName", source = "academicPeriod.displayName")
    CourseResponse toResponse(Course course);
}

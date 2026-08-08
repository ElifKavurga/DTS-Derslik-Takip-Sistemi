package com.dts.dersliktakip.mapper;

import com.dts.dersliktakip.dto.AcademicianResponse;
import com.dts.dersliktakip.entity.Academician;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;

@Mapper(componentModel = "spring")
public interface AcademicianMapper {

    @Mapping(target = "facultyId", source = "faculty.id")
    @Mapping(target = "facultyName", source = "faculty.name")
    @Mapping(target = "departmentId", source = "department.id")
    @Mapping(target = "departmentName", source = "department.name")
    AcademicianResponse toResponse(Academician academician);
}

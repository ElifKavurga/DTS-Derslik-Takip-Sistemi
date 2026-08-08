package com.dts.dersliktakip.mapper;

import com.dts.dersliktakip.dto.DepartmentResponse;
import com.dts.dersliktakip.entity.Department;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;

@Mapper(componentModel = "spring")
public interface DepartmentMapper {

    @Mapping(target = "facultyId", source = "faculty.id")
    @Mapping(target = "facultyName", source = "faculty.name")
    @Mapping(target = "academicianCount", constant = "0L")
    @Mapping(target = "courseCount", constant = "0L")
    DepartmentResponse toResponse(Department department);
}

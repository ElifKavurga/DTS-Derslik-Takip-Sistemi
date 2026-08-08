package com.dts.dersliktakip.mapper;

import com.dts.dersliktakip.dto.DepartmentResponse;
import com.dts.dersliktakip.entity.Department;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;

@Mapper(componentModel = "spring")
public interface DepartmentMapper {

    @Mapping(target = "facultyId", source = "faculty.id")
    DepartmentResponse toResponse(Department department);
}

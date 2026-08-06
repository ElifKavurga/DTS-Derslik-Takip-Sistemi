package com.dts.dersliktakip.mapper;

import com.dts.dersliktakip.dto.CreateFacultyRequest;
import com.dts.dersliktakip.dto.FacultyResponse;
import com.dts.dersliktakip.dto.UpdateFacultyRequest;
import com.dts.dersliktakip.entity.Faculty;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;
import org.mapstruct.MappingTarget;
import java.util.List;

@Mapper(componentModel = "spring")
public interface FacultyMapper {

    FacultyResponse toResponse(Faculty faculty);

    List<FacultyResponse> toResponseList(List<Faculty> faculties);

    @Mapping(target = "id", ignore = true)
    @Mapping(target = "createdAt", ignore = true)
    @Mapping(target = "updatedAt", ignore = true)
    Faculty toEntity(CreateFacultyRequest request);

    @Mapping(target = "id", ignore = true)
    @Mapping(target = "createdAt", ignore = true)
    @Mapping(target = "updatedAt", ignore = true)
    void updateEntityFromRequest(UpdateFacultyRequest request, @MappingTarget Faculty faculty);
}

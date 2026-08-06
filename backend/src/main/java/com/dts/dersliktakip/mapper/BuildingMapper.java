package com.dts.dersliktakip.mapper;

import com.dts.dersliktakip.dto.BuildingResponse;
import com.dts.dersliktakip.dto.CreateBuildingRequest;
import com.dts.dersliktakip.dto.UpdateBuildingRequest;
import com.dts.dersliktakip.entity.Building;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;
import org.mapstruct.MappingTarget;

@Mapper(componentModel = "spring")
public interface BuildingMapper {

    @Mapping(target = "facultyId", source = "faculty.id")
    BuildingResponse toResponse(Building building);

    @Mapping(target = "id", ignore = true)
    @Mapping(target = "faculty", ignore = true)
    @Mapping(target = "createdAt", ignore = true)
    @Mapping(target = "updatedAt", ignore = true)
    Building toEntity(CreateBuildingRequest request);

    @Mapping(target = "id", ignore = true)
    @Mapping(target = "faculty", ignore = true)
    @Mapping(target = "createdAt", ignore = true)
    @Mapping(target = "updatedAt", ignore = true)
    void updateEntityFromRequest(UpdateBuildingRequest request, @MappingTarget Building building);
}

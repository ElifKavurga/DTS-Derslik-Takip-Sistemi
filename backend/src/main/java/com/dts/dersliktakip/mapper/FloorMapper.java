package com.dts.dersliktakip.mapper;

import com.dts.dersliktakip.dto.FloorResponse;
import com.dts.dersliktakip.dto.CreateFloorRequest;
import com.dts.dersliktakip.dto.UpdateFloorRequest;
import com.dts.dersliktakip.entity.Floor;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;
import org.mapstruct.MappingTarget;

@Mapper(componentModel = "spring")
public interface FloorMapper {

    @Mapping(target = "buildingId", source = "building.id")
    FloorResponse toResponse(Floor floor);

    @Mapping(target = "id", ignore = true)
    @Mapping(target = "building", ignore = true)
    @Mapping(target = "planMode", ignore = true)
    @Mapping(target = "createdAt", ignore = true)
    @Mapping(target = "updatedAt", ignore = true)
    Floor toEntity(CreateFloorRequest request);

    @Mapping(target = "id", ignore = true)
    @Mapping(target = "building", ignore = true)
    @Mapping(target = "planMode", ignore = true)
    @Mapping(target = "createdAt", ignore = true)
    @Mapping(target = "updatedAt", ignore = true)
    void updateEntityFromRequest(UpdateFloorRequest request, @MappingTarget Floor floor);
}

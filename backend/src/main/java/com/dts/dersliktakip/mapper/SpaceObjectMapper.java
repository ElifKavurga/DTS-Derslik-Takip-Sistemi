package com.dts.dersliktakip.mapper;

import com.dts.dersliktakip.dto.SpaceObjectRequest;
import com.dts.dersliktakip.dto.SpaceObjectResponse;
import com.dts.dersliktakip.entity.SpaceObject;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;

@Mapper(componentModel = "spring")
public interface SpaceObjectMapper {

    @Mapping(target = "classroomId", source = "classroom.id")
    SpaceObjectResponse toResponse(SpaceObject entity);

    @Mapping(target = "floor", ignore = true)
    @Mapping(target = "classroom", ignore = true)
    @Mapping(target = "createdAt", ignore = true)
    @Mapping(target = "updatedAt", ignore = true)
    @Mapping(target = "status", defaultExpression = "java(com.dts.dersliktakip.entity.SpaceObjectStatus.EMPTY)")
    SpaceObject toEntity(SpaceObjectRequest request);
}

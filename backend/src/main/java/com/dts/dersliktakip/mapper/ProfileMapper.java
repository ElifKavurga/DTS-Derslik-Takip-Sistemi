package com.dts.dersliktakip.mapper;

import com.dts.dersliktakip.dto.ProfileResponse;
import com.dts.dersliktakip.dto.UpdateProfileRequest;
import com.dts.dersliktakip.dto.UpdateProfileResponse;
import com.dts.dersliktakip.entity.User;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;
import org.mapstruct.MappingTarget;

@Mapper(componentModel = "spring")
public interface ProfileMapper {

    @Mapping(target = "fullName", expression = "java(user.getFirstName() + \" \" + user.getLastName())")
    @Mapping(target = "role", expression = "java(user.getRoles() != null && !user.getRoles().isEmpty() ? user.getRoles().iterator().next() : null)")
    ProfileResponse toResponse(User user);

    @Mapping(target = "fullName", expression = "java(user.getFirstName() + \" \" + user.getLastName())")
    @Mapping(target = "role", expression = "java(user.getRoles() != null && !user.getRoles().isEmpty() ? user.getRoles().iterator().next() : null)")
    UpdateProfileResponse toUpdateResponse(User user);

    @Mapping(target = "id", ignore = true)
    @Mapping(target = "email", ignore = true)
    @Mapping(target = "password", ignore = true)
    @Mapping(target = "roles", ignore = true)
    @Mapping(target = "active", ignore = true)
    @Mapping(target = "createdAt", ignore = true)
    @Mapping(target = "updatedAt", ignore = true)
    @Mapping(target = "department", ignore = true)
    @Mapping(target = "faculty", ignore = true)
    void updateEntityFromRequest(UpdateProfileRequest request, @MappingTarget User user);
}

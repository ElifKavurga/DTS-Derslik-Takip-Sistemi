package com.dts.dersliktakip.mapper;

import com.dts.dersliktakip.dto.UserResponse;
import com.dts.dersliktakip.entity.Role;
import com.dts.dersliktakip.entity.User;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;

@Mapper(componentModel = "spring")
public interface UserMapper {

    @Mapping(target = "fullName", expression = "java(user.getFirstName() + \" \" + user.getLastName())")
    @Mapping(target = "role", expression = "java(resolvePrimaryRole(user))")
    UserResponse toResponse(User user);

    default Role resolvePrimaryRole(User user) {
        if (user.getRoles() == null || user.getRoles().isEmpty()) {
            return null;
        }
        if (user.getRoles().contains(Role.SUPER_ADMIN)) {
            return Role.SUPER_ADMIN;
        }
        if (user.getRoles().contains(Role.DEPARTMENT_ADMIN)) {
            return Role.DEPARTMENT_ADMIN;
        }
        if (user.getRoles().contains(Role.ACADEMICIAN)) {
            return Role.ACADEMICIAN;
        }
        return null;
    }
}

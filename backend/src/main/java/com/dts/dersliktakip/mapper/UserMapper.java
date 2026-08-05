package com.dts.dersliktakip.mapper;

import com.dts.dersliktakip.dto.UserResponse;
import com.dts.dersliktakip.entity.User;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;

@Mapper(componentModel = "spring")
public interface UserMapper {

    @Mapping(target = "fullName", expression = "java(user.getFirstName() + \" \" + user.getLastName())")
    UserResponse toResponse(User user);
}

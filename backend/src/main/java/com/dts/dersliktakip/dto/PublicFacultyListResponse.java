package com.dts.dersliktakip.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class PublicFacultyListResponse {
    private List<PublicFacultyResponse> faculties;
}

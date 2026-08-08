package com.dts.dersliktakip.dto;

import java.util.List;

public record CourseListResponse(
        List<CourseResponse> courses
) {
}

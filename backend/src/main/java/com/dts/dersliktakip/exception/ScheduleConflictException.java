package com.dts.dersliktakip.exception;

import java.util.List;

public class ScheduleConflictException extends IllegalArgumentException {

    private final String code;
    private final List<String> details;

    public ScheduleConflictException(String code, String message, List<String> details) {
        super(message);
        this.code = code;
        this.details = details == null ? List.of() : List.copyOf(details);
    }

    public String getCode() {
        return code;
    }

    public List<String> getDetails() {
        return details;
    }
}

package com.dts.dersliktakip.exception;

public class UserNotFoundException extends RuntimeException {

    public UserNotFoundException(String message) {
        super(message);
    }

    public UserNotFoundException(java.util.UUID id) {
        super("User not found: " + id);
    }
}

package com.dts.dersliktakip.exception;

public class ExpiredResetTokenException extends RuntimeException {

    public ExpiredResetTokenException(String message) {
        super(message);
    }
}

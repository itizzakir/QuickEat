package com.quickbite.food_delivery_backend.exception;

/** Maps to 400 for business-rule violations that bean validation cannot express. */
public class BadRequestException extends RuntimeException {

    public BadRequestException(String message) {
        super(message);
    }
}

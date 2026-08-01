package com.quickbite.food_delivery_backend.exception;

/**
 * Maps to 409. Used when the request is well-formed and authorised but the resource is in a
 * state that forbids it — a delivery job already claimed by another courier, or a user who
 * still has orders attached and so cannot be hard-deleted.
 */
public class ConflictException extends RuntimeException {

    public ConflictException(String message) {
        super(message);
    }
}

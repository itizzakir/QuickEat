package com.quickbite.food_delivery_backend.exception;

/** Maps to 404. Replaces the bare RuntimeException("Error: ... not found.") calls. */
public class ResourceNotFoundException extends RuntimeException {

    public ResourceNotFoundException(String message) {
        super(message);
    }

    public static ResourceNotFoundException of(String resource, Object id) {
        return new ResourceNotFoundException(resource + " not found with id " + id);
    }
}

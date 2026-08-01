package com.quickbite.food_delivery_backend.security;

import com.quickbite.food_delivery_backend.exception.ResourceNotFoundException;
import com.quickbite.food_delivery_backend.models.Restaurant;
import com.quickbite.food_delivery_backend.repository.RestaurantRepository;
import com.quickbite.food_delivery_backend.security.services.UserDetailsImpl;

import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Component;

/**
 * Single place where "does this account control this restaurant?" is answered, shared by the
 * menu, restaurant and order endpoints so the rule cannot be implemented three slightly
 * different ways.
 */
@Component
public class RestaurantAccessGuard {

    private final RestaurantRepository restaurantRepository;

    public RestaurantAccessGuard(RestaurantRepository restaurantRepository) {
        this.restaurantRepository = restaurantRepository;
    }

    /**
     * Loads the restaurant and asserts the caller owns it, or is an admin.
     *
     * @throws ResourceNotFoundException if no such restaurant
     * @throws AccessDeniedException     if the caller is neither the owner nor an admin
     */
    public Restaurant requireManageable(Long restaurantId, UserDetailsImpl principal) {
        Restaurant restaurant = restaurantRepository.findById(restaurantId)
                .orElseThrow(() -> ResourceNotFoundException.of("Restaurant", restaurantId));
        assertManageable(restaurant, principal);
        return restaurant;
    }

    public void assertManageable(Restaurant restaurant, UserDetailsImpl principal) {
        if (SecurityUtils.isAdmin(principal)) {
            return;
        }
        Long ownerId = restaurant.getOwner() != null ? restaurant.getOwner().getId() : null;
        if (principal == null || ownerId == null || !ownerId.equals(principal.getId())) {
            throw new AccessDeniedException("You do not manage this restaurant");
        }
    }
}

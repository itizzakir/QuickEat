package com.quickbite.food_delivery_backend.controllers;

import com.quickbite.food_delivery_backend.exception.BadRequestException;
import com.quickbite.food_delivery_backend.exception.ResourceNotFoundException;
import com.quickbite.food_delivery_backend.models.MenuItem;
import com.quickbite.food_delivery_backend.models.Restaurant;
import com.quickbite.food_delivery_backend.payload.request.AvailabilityRequest;
import com.quickbite.food_delivery_backend.payload.request.MenuItemRequest;
import com.quickbite.food_delivery_backend.payload.response.MenuItemResponse;
import com.quickbite.food_delivery_backend.payload.response.MessageResponse;
import com.quickbite.food_delivery_backend.repository.MenuItemRepository;
import com.quickbite.food_delivery_backend.security.RestaurantAccessGuard;
import com.quickbite.food_delivery_backend.security.services.UserDetailsImpl;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.stream.Collectors;

/**
 * Menu management for a single restaurant. Reads are public; every write requires that the
 * caller owns {@code restaurantId} (or is an admin).
 */
@RestController
@RequestMapping("/api/restaurants/{restaurantId}/menu")
@Tag(name = "Menu", description = "Menu items for a restaurant")
public class MenuItemController {

    private final MenuItemRepository menuItemRepository;
    private final RestaurantAccessGuard accessGuard;

    public MenuItemController(MenuItemRepository menuItemRepository,
                              RestaurantAccessGuard accessGuard) {
        this.menuItemRepository = menuItemRepository;
        this.accessGuard = accessGuard;
    }

    @GetMapping
    @Operation(summary = "List a restaurant's menu (public)")
    public List<MenuItemResponse> list(@PathVariable Long restaurantId) {
        return menuItemRepository.findByRestaurantId(restaurantId).stream()
                .map(MenuItemResponse::from)
                .collect(Collectors.toList());
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('RESTAURANT','ADMIN')")
    @Operation(summary = "Add a dish to the menu (owner or admin)")
    public ResponseEntity<MenuItemResponse> create(@PathVariable Long restaurantId,
                                                   @Valid @RequestBody MenuItemRequest request,
                                                   @AuthenticationPrincipal UserDetailsImpl principal) {
        Restaurant restaurant = accessGuard.requireManageable(restaurantId, principal);

        MenuItem item = new MenuItem();
        apply(request, item);
        item.setRestaurant(restaurant);

        return ResponseEntity.status(HttpStatus.CREATED)
                .body(MenuItemResponse.from(menuItemRepository.save(item)));
    }

    @PutMapping("/{itemId}")
    @PreAuthorize("hasAnyRole('RESTAURANT','ADMIN')")
    @Operation(summary = "Update a dish (owner or admin)")
    public ResponseEntity<MenuItemResponse> update(@PathVariable Long restaurantId,
                                                    @PathVariable Long itemId,
                                                    @Valid @RequestBody MenuItemRequest request,
                                                    @AuthenticationPrincipal UserDetailsImpl principal) {
        accessGuard.requireManageable(restaurantId, principal);
        MenuItem item = loadItemOfRestaurant(itemId, restaurantId);

        apply(request, item);
        return ResponseEntity.ok(MenuItemResponse.from(menuItemRepository.save(item)));
    }

    @PatchMapping("/{itemId}/availability")
    @PreAuthorize("hasAnyRole('RESTAURANT','ADMIN')")
    @Operation(summary = "Toggle whether a dish can currently be ordered")
    public ResponseEntity<MenuItemResponse> setAvailability(
            @PathVariable Long restaurantId,
            @PathVariable Long itemId,
            @Valid @RequestBody AvailabilityRequest request,
            @AuthenticationPrincipal UserDetailsImpl principal) {

        accessGuard.requireManageable(restaurantId, principal);
        MenuItem item = loadItemOfRestaurant(itemId, restaurantId);

        item.setAvailable(request.getAvailable());
        return ResponseEntity.ok(MenuItemResponse.from(menuItemRepository.save(item)));
    }

    @DeleteMapping("/{itemId}")
    @PreAuthorize("hasAnyRole('RESTAURANT','ADMIN')")
    @Transactional
    @Operation(summary = "Remove a dish from the menu (owner or admin)")
    public ResponseEntity<MessageResponse> delete(@PathVariable Long restaurantId,
                                                   @PathVariable Long itemId,
                                                   @AuthenticationPrincipal UserDetailsImpl principal) {
        accessGuard.requireManageable(restaurantId, principal);
        MenuItem item = loadItemOfRestaurant(itemId, restaurantId);

        // Detach from the owning collection so orphanRemoval does not fight the explicit delete.
        Restaurant restaurant = item.getRestaurant();
        if (restaurant != null) {
            restaurant.getMenu().remove(item);
        }
        menuItemRepository.delete(item);

        return ResponseEntity.ok(new MessageResponse("Menu item deleted"));
    }

    /** Guards against editing dish 7 of restaurant B through restaurant A's URL. */
    private MenuItem loadItemOfRestaurant(Long itemId, Long restaurantId) {
        MenuItem item = menuItemRepository.findById(itemId)
                .orElseThrow(() -> ResourceNotFoundException.of("Menu item", itemId));
        Long actual = item.getRestaurant() != null ? item.getRestaurant().getId() : null;
        if (actual == null || !actual.equals(restaurantId)) {
            throw new BadRequestException("Menu item " + itemId
                    + " does not belong to restaurant " + restaurantId);
        }
        return item;
    }

    private void apply(MenuItemRequest request, MenuItem item) {
        item.setName(request.getName());
        item.setDescription(request.getDescription());
        item.setPrice(request.getPrice());
        item.setVegetarian(request.getVegetarian());
        item.setCategory(request.getCategory());
        item.setAvailable(request.getAvailable() == null || request.getAvailable());
        item.setImage(request.getImage());
    }
}

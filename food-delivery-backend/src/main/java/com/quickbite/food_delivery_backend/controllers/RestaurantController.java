package com.quickbite.food_delivery_backend.controllers;

import com.quickbite.food_delivery_backend.exception.ResourceNotFoundException;
import com.quickbite.food_delivery_backend.models.Restaurant;
import com.quickbite.food_delivery_backend.payload.request.RestaurantUpdateRequest;
import com.quickbite.food_delivery_backend.payload.response.OrderResponse;
import com.quickbite.food_delivery_backend.payload.response.PageResponse;
import com.quickbite.food_delivery_backend.payload.response.RestaurantResponse;
import com.quickbite.food_delivery_backend.repository.OrderRepository;
import com.quickbite.food_delivery_backend.repository.RestaurantRepository;
import com.quickbite.food_delivery_backend.security.RestaurantAccessGuard;
import com.quickbite.food_delivery_backend.security.services.UserDetailsImpl;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;

import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/restaurants")
@Tag(name = "Restaurants", description = "Public catalogue and owner-facing management")
public class RestaurantController {

    private final RestaurantRepository restaurantRepository;
    private final OrderRepository orderRepository;
    private final RestaurantAccessGuard accessGuard;

    public RestaurantController(RestaurantRepository restaurantRepository,
                                OrderRepository orderRepository,
                                RestaurantAccessGuard accessGuard) {
        this.restaurantRepository = restaurantRepository;
        this.orderRepository = orderRepository;
        this.accessGuard = accessGuard;
    }

    /** Public catalogue. Summary view only — no menus, no owner. */
    @GetMapping
    @Operation(summary = "List restaurants, optionally filtered by category (public)")
    public List<RestaurantResponse> getAllRestaurants(@RequestParam(required = false) String category) {
        if (category != null && !category.isEmpty()) {
            return restaurantRepository.findByCategoryContainingIgnoreCase(category).stream()
                    .map(RestaurantResponse::summary)
                    .collect(Collectors.toList());
        }
        return restaurantRepository.findAll().stream()
                .map(RestaurantResponse::summary)
                .collect(Collectors.toList());
    }

    /**
     * The signed-in restaurant owner's own restaurant. Mapped before {@code /{id}} so the
     * literal wins over the path variable.
     */
    @GetMapping("/my")
    @PreAuthorize("hasRole('RESTAURANT')")
    @Operation(summary = "The authenticated owner's restaurant")
    public ResponseEntity<RestaurantResponse> getMyRestaurant(
            @AuthenticationPrincipal UserDetailsImpl principal) {

        List<Restaurant> owned = restaurantRepository.findByOwnerId(principal.getId());
        if (owned.isEmpty()) {
            throw new ResourceNotFoundException("No restaurant is linked to this account");
        }
        // findById re-reads through the menu entity graph so the dashboard gets the dishes too.
        Restaurant restaurant = restaurantRepository.findById(owned.get(0).getId())
                .orElseThrow(() -> ResourceNotFoundException.of("Restaurant", owned.get(0).getId()));
        return ResponseEntity.ok(RestaurantResponse.detail(restaurant));
    }

    /** Public detail view, including the menu. */
    @GetMapping("/{id}")
    @Operation(summary = "Restaurant detail with menu (public)")
    public ResponseEntity<RestaurantResponse> getRestaurantById(@PathVariable Long id) {
        return restaurantRepository.findById(id)
                .map(restaurant -> ResponseEntity.ok(RestaurantResponse.detail(restaurant)))
                .orElseThrow(() -> ResourceNotFoundException.of("Restaurant", id));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('RESTAURANT','ADMIN')")
    @Operation(summary = "Edit restaurant details (owner or admin)")
    public ResponseEntity<RestaurantResponse> updateRestaurant(
            @PathVariable Long id,
            @Valid @RequestBody RestaurantUpdateRequest request,
            @AuthenticationPrincipal UserDetailsImpl principal) {

        Restaurant restaurant = accessGuard.requireManageable(id, principal);

        restaurant.setName(request.getName());
        restaurant.setDescription(request.getDescription());
        restaurant.setAddress(request.getAddress());
        restaurant.setImage(request.getImage());
        restaurant.setCategory(request.getCategory());
        restaurant.setDeliveryTime(request.getDeliveryTime());
        restaurant.setDeliveryFee(request.getDeliveryFee());
        restaurant.setDiscount(request.getDiscount());

        return ResponseEntity.ok(RestaurantResponse.detail(restaurantRepository.save(restaurant)));
    }

    /**
     * Order feed for the restaurant dashboard, newest first.
     *
     * <p>Read-only transaction: the paged query intentionally skips the collection join-fetch
     * (that would force in-memory pagination), so the item lines are batch-loaded here while
     * the session is still open.
     */
    @GetMapping("/{id}/orders")
    @PreAuthorize("hasAnyRole('RESTAURANT','ADMIN')")
    @Transactional(readOnly = true)
    @Operation(summary = "Paged order feed for a restaurant (owner or admin)")
    public ResponseEntity<PageResponse<OrderResponse>> getRestaurantOrders(
            @PathVariable Long id,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size,
            @AuthenticationPrincipal UserDetailsImpl principal) {

        accessGuard.requireManageable(id, principal);

        Pageable pageable = PageRequest.of(Math.max(page, 0), Math.min(Math.max(size, 1), 100),
                Sort.by(Sort.Direction.DESC, "createdAt"));

        return ResponseEntity.ok(PageResponse.of(
                orderRepository.findByRestaurantId(id, pageable), OrderResponse::from));
    }
}

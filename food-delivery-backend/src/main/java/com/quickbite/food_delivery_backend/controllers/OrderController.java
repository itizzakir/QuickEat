package com.quickbite.food_delivery_backend.controllers;

import com.quickbite.food_delivery_backend.exception.BadRequestException;
import com.quickbite.food_delivery_backend.exception.ResourceNotFoundException;
import com.quickbite.food_delivery_backend.models.*;
import com.quickbite.food_delivery_backend.payload.request.OrderItemRequest;
import com.quickbite.food_delivery_backend.payload.request.OrderRequest;
import com.quickbite.food_delivery_backend.payload.request.UpdateOrderStatusRequest;
import com.quickbite.food_delivery_backend.payload.response.OrderResponse;
import com.quickbite.food_delivery_backend.repository.*;
import com.quickbite.food_delivery_backend.security.SecurityUtils;
import com.quickbite.food_delivery_backend.security.services.UserDetailsImpl;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.EnumSet;
import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/orders")
@Tag(name = "Orders", description = "Customer ordering and kitchen-side status changes")
public class OrderController {

    /**
     * Kitchen-side transitions. Everything from PICKED_UP onwards belongs to the courier and is
     * driven through /api/delivery. The legality of each move lives in EOrderStatus.
     */
    private static final Set<EOrderStatus> RESTAURANT_TARGETS = EnumSet.of(
            EOrderStatus.CONFIRMED, EOrderStatus.PREPARING, EOrderStatus.READY_FOR_PICKUP,
            EOrderStatus.CANCELLED);

    @Autowired
    OrderRepository orderRepository;

    @Autowired
    UserRepository userRepository;

    @Autowired
    RestaurantRepository restaurantRepository;

    @Autowired
    MenuItemRepository menuItemRepository;

    @PostMapping
    @Operation(summary = "Place an order; priced server-side from the menu")
    @PreAuthorize("hasRole('CUSTOMER')")
    @Transactional
    public ResponseEntity<OrderResponse> createOrder(
            @Valid @RequestBody OrderRequest orderRequest,
            @AuthenticationPrincipal UserDetailsImpl principal) {

        User user = userRepository.findById(principal.getId())
                .orElseThrow(() -> ResourceNotFoundException.of("User", principal.getId()));

        Order order = new Order();
        order.setUser(user);
        order.setStatus(EOrderStatus.PENDING);
        order.setCreatedAt(LocalDateTime.now());
        order.setDeliveryAddress(orderRequest.getDeliveryAddress() != null
                ? orderRequest.getDeliveryAddress()
                : user.getAddress());

        Restaurant restaurant = null;
        double total = 0.0;

        for (OrderItemRequest itemRequest : orderRequest.getItems()) {
            MenuItem menuItem = menuItemRepository.findById(itemRequest.getMenuItemId())
                    .orElseThrow(() -> ResourceNotFoundException.of("Menu item",
                            itemRequest.getMenuItemId()));

            if (Boolean.FALSE.equals(menuItem.getAvailable())) {
                throw new BadRequestException("'" + menuItem.getName() + "' is currently unavailable");
            }

            Restaurant itemRestaurant = menuItem.getRestaurant();
            if (itemRestaurant == null) {
                throw new BadRequestException("'" + menuItem.getName() + "' is not on any menu");
            }
            if (restaurant == null) {
                restaurant = itemRestaurant;
            } else if (!restaurant.getId().equals(itemRestaurant.getId())) {
                throw new BadRequestException(
                        "All items in an order must come from the same restaurant");
            }

            OrderItem orderItem = new OrderItem();
            orderItem.setMenuItem(menuItem);
            orderItem.setQuantity(itemRequest.getQuantity());
            // Priced from the menu, not from anything the client sent.
            orderItem.setPrice(menuItem.getPrice());
            order.addItem(orderItem);

            total += menuItem.getPrice() * itemRequest.getQuantity();
        }

        order.setRestaurant(restaurant);
        // The client's totalPrice is discarded; this is the only total that is ever stored.
        order.setTotalAmount(total);
        // Snapshotted at order time so later menu/fee edits do not rewrite history — and so
        // courier earnings have something real to sum.
        order.setDeliveryFee(parseDeliveryFee(restaurant.getDeliveryFee()));
        order.setPaymentMethod(orderRequest.getPaymentMethod() != null
                ? orderRequest.getPaymentMethod() : "MOCK");
        order.setUpdatedAt(order.getCreatedAt());

        return ResponseEntity.ok(OrderResponse.from(orderRepository.save(order)));
    }

    @GetMapping("/user/{userId}")
    @Operation(summary = "Order history (self or admin)")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<List<OrderResponse>> getUserOrders(
            @PathVariable Long userId,
            @AuthenticationPrincipal UserDetailsImpl principal) {

        SecurityUtils.requireSelfOrAdmin(principal, userId);

        List<OrderResponse> orders = orderRepository.findByUserIdOrderByCreatedAtDesc(userId)
                .stream().map(OrderResponse::from).collect(Collectors.toList());
        return ResponseEntity.ok(orders);
    }

    /**
     * Status transitions. Customers cannot reach this endpoint at all, restaurants may only
     * move their own orders, and the change must be a legal transition from the current state.
     */
    @PutMapping("/{orderId}/status")
    @Operation(summary = "Kitchen-side status change (owning restaurant or admin)")
    @PreAuthorize("hasAnyRole('RESTAURANT','DELIVERY','ADMIN')")
    @Transactional
    public ResponseEntity<OrderResponse> updateOrderStatus(
            @PathVariable Long orderId,
            @Valid @RequestBody UpdateOrderStatusRequest request,
            @AuthenticationPrincipal UserDetailsImpl principal) {

        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> ResourceNotFoundException.of("Order", orderId));

        EOrderStatus current = order.getStatus();
        EOrderStatus target = request.getStatus();

        authoriseStatusChange(principal, order, target);

        if (current == target) {
            return ResponseEntity.ok(OrderResponse.from(order));
        }
        if (!current.canTransitionTo(target)) {
            throw new BadRequestException(
                    "Cannot change order status from " + current + " to " + target);
        }

        order.setStatus(target);
        order.setUpdatedAt(LocalDateTime.now());
        return ResponseEntity.ok(OrderResponse.from(orderRepository.save(order)));
    }

    /**
     * Restaurants store their delivery fee as display text ("FREE", "₹29"). Pull the number out
     * of it; anything unparseable counts as free rather than failing the order.
     */
    private Double parseDeliveryFee(String displayValue) {
        if (displayValue == null || displayValue.isBlank()) {
            return 0.0;
        }
        String digits = displayValue.replaceAll("[^0-9.]", "");
        if (digits.isBlank()) {
            return 0.0;
        }
        try {
            return Double.parseDouble(digits);
        } catch (NumberFormatException ex) {
            return 0.0;
        }
    }

    private void authoriseStatusChange(UserDetailsImpl principal, Order order, EOrderStatus target) {
        if (SecurityUtils.isAdmin(principal)) {
            return;
        }

        if (SecurityUtils.hasRole(principal, ERole.ROLE_RESTAURANT)) {
            Restaurant restaurant = order.getRestaurant();
            Long ownerId = restaurant != null && restaurant.getOwner() != null
                    ? restaurant.getOwner().getId()
                    : null;
            if (ownerId == null || !ownerId.equals(principal.getId())) {
                throw new AccessDeniedException("You do not own the restaurant for this order");
            }
            if (!RESTAURANT_TARGETS.contains(target)) {
                throw new AccessDeniedException(
                        "A restaurant cannot set status " + target + "; that belongs to delivery");
            }
            return;
        }

        if (SecurityUtils.hasRole(principal, ERole.ROLE_DELIVERY)) {
            // Couriers drive their own transitions through /api/delivery, where the order is
            // checked against the partner it is actually assigned to.
            throw new AccessDeniedException(
                    "Delivery partners must use /api/delivery/orders/{id}/status");
        }

        throw new AccessDeniedException("You are not allowed to change this order's status");
    }
}

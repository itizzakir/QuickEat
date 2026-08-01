package com.quickbite.food_delivery_backend.controllers;

import com.quickbite.food_delivery_backend.exception.BadRequestException;
import com.quickbite.food_delivery_backend.exception.ResourceNotFoundException;
import com.quickbite.food_delivery_backend.models.*;
import com.quickbite.food_delivery_backend.payload.request.AddToCartRequest;
import com.quickbite.food_delivery_backend.payload.response.CartResponse;
import com.quickbite.food_delivery_backend.repository.*;
import com.quickbite.food_delivery_backend.security.SecurityUtils;
import com.quickbite.food_delivery_backend.security.services.UserDetailsImpl;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

import java.util.Optional;

/**
 * A cart always belongs to the authenticated caller. The user id in these paths is validated
 * against the JWT principal, and the id that used to arrive in the add-to-cart body is gone
 * entirely — it was an unauthenticated write primitive against any account.
 */
@RestController
@RequestMapping("/api/cart")
@Tag(name = "Cart", description = "The signed-in customer's cart")
@PreAuthorize("hasRole('CUSTOMER')")
public class CartController {

    @Autowired
    CartRepository cartRepository;

    @Autowired
    CartItemRepository cartItemRepository;

    @Autowired
    UserRepository userRepository;

    @Autowired
    MenuItemRepository menuItemRepository;

    @GetMapping("/{userId}")
    @Operation(summary = "Fetch a cart (self only)")
    public ResponseEntity<CartResponse> getCart(@PathVariable Long userId,
                                                @AuthenticationPrincipal UserDetailsImpl principal) {
        SecurityUtils.requireSelfOrAdmin(principal, userId);

        Optional<Cart> cart = cartRepository.findByUserId(userId);
        return ResponseEntity.ok(cart.map(CartResponse::from).orElseGet(CartResponse::empty));
    }

    @PostMapping("/add")
    @Operation(summary = "Add a dish to the signed-in customer's cart")
    @Transactional
    public ResponseEntity<CartResponse> addToCart(@Valid @RequestBody AddToCartRequest request,
                                                  @AuthenticationPrincipal UserDetailsImpl principal) {
        // The cart owner comes from the token, never from the request body.
        Long userId = principal.getId();

        User user = userRepository.findById(userId)
                .orElseThrow(() -> ResourceNotFoundException.of("User", userId));

        MenuItem menuItem = menuItemRepository.findById(request.getMenuItemId())
                .orElseThrow(() -> ResourceNotFoundException.of("Menu item", request.getMenuItemId()));

        if (Boolean.FALSE.equals(menuItem.getAvailable())) {
            throw new BadRequestException("'" + menuItem.getName() + "' is currently unavailable");
        }

        Cart cart = cartRepository.findByUserId(userId).orElseGet(() -> new Cart(user));

        Optional<CartItem> existingItem = cart.getItems().stream()
                .filter(item -> item.getMenuItem().getId().equals(menuItem.getId()))
                .findFirst();

        if (existingItem.isPresent()) {
            CartItem item = existingItem.get();
            item.setQuantity(item.getQuantity() + request.getQuantity());
        } else {
            CartItem newItem = new CartItem(cart, menuItem, request.getQuantity());
            cart.addItem(newItem);
        }

        cart.calculateTotal();
        return ResponseEntity.ok(CartResponse.from(cartRepository.save(cart)));
    }

    @DeleteMapping("/remove/{itemId}")
    @Operation(summary = "Remove a line from your own cart")
    @Transactional
    public ResponseEntity<CartResponse> removeFromCart(@PathVariable Long itemId,
                                                       @AuthenticationPrincipal UserDetailsImpl principal) {
        CartItem cartItem = cartItemRepository.findById(itemId)
                .orElseThrow(() -> ResourceNotFoundException.of("Cart item", itemId));

        Cart cart = cartItem.getCart();
        // Previously unchecked: any authenticated user could delete lines from anyone's cart
        // just by guessing an item id.
        SecurityUtils.requireOwner(principal, cart.getUser() != null ? cart.getUser().getId() : null);

        cart.removeItem(cartItem);
        return ResponseEntity.ok(CartResponse.from(cartRepository.save(cart)));
    }

    @PostMapping("/clear/{userId}")
    @Operation(summary = "Empty a cart (self only); idempotent")
    @Transactional
    public ResponseEntity<CartResponse> clearCart(@PathVariable Long userId,
                                                  @AuthenticationPrincipal UserDetailsImpl principal) {
        SecurityUtils.requireSelfOrAdmin(principal, userId);

        // Idempotent: clearing a cart that was never created is a no-op, not an error.
        // Checkout calls this straight after placing an order, and a 404 there would surface
        // to the customer as a failed payment.
        return cartRepository.findByUserId(userId)
                .map(cart -> {
                    cart.getItems().clear();
                    cart.setTotalPrice(0.0);
                    return ResponseEntity.ok(CartResponse.from(cartRepository.save(cart)));
                })
                .orElseGet(() -> ResponseEntity.ok(CartResponse.empty()));
    }
}

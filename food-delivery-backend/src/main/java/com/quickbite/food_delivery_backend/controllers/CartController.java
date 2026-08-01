package com.quickbite.food_delivery_backend.controllers;

import com.quickbite.food_delivery_backend.models.*;
import com.quickbite.food_delivery_backend.payload.request.AddToCartRequest;
import com.quickbite.food_delivery_backend.repository.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import jakarta.transaction.Transactional;

import java.util.Optional;

@CrossOrigin(origins = "*", maxAge = 3600)
@RestController
@RequestMapping("/api/cart")
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
    public ResponseEntity<?> getCart(@PathVariable Long userId) {
        Optional<Cart> cart = cartRepository.findByUserId(userId);
        if (cart.isPresent()) {
            return ResponseEntity.ok(cart.get());
        } else {
            // Return empty cart structure if not exists, or create one? 
            // Better to create one lazily or return empty structure.
            return ResponseEntity.ok(new Cart()); 
        }
    }

    @PostMapping("/add")
    @Transactional
    public ResponseEntity<?> addToCart(@RequestBody AddToCartRequest request) {
        User user = userRepository.findById(request.getUserId())
                .orElseThrow(() -> new RuntimeException("Error: User not found."));

        MenuItem menuItem = menuItemRepository.findById(request.getMenuItemId())
                .orElseThrow(() -> new RuntimeException("Error: MenuItem not found."));

        Cart cart = cartRepository.findByUserId(request.getUserId()).orElse(new Cart(user));
        
        // Check if item already exists in cart
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
        Cart savedCart = cartRepository.save(cart);
        
        return ResponseEntity.ok(savedCart);
    }
    
    @DeleteMapping("/remove/{itemId}")
    @Transactional
    public ResponseEntity<?> removeFromCart(@PathVariable Long itemId) {
        CartItem cartItem = cartItemRepository.findById(itemId)
                .orElseThrow(() -> new RuntimeException("Error: CartItem not found."));
        
        Cart cart = cartItem.getCart();
        cart.removeItem(cartItem);
        cartRepository.save(cart);
        
        return ResponseEntity.ok(cart);
    }

    @PostMapping("/clear/{userId}")
    @Transactional
    public ResponseEntity<?> clearCart(@PathVariable Long userId) {
        Cart cart = cartRepository.findByUserId(userId)
                .orElseThrow(() -> new RuntimeException("Error: Cart not found."));
        
        cart.getItems().clear();
        cart.setTotalPrice(0.0);
        cartRepository.save(cart);
        
        return ResponseEntity.ok(cart);
    }
}

package com.quickbite.food_delivery_backend.controllers;

import com.quickbite.food_delivery_backend.models.*;
import com.quickbite.food_delivery_backend.payload.request.OrderRequest;
import com.quickbite.food_delivery_backend.payload.request.OrderItemRequest;
import com.quickbite.food_delivery_backend.repository.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@CrossOrigin(origins = "*", maxAge = 3600)
@RestController
@RequestMapping("/api/orders")
public class OrderController {

    @Autowired
    OrderRepository orderRepository;

    @Autowired
    UserRepository userRepository;

    @Autowired
    RestaurantRepository restaurantRepository;

    @Autowired
    MenuItemRepository menuItemRepository;

    @PostMapping
    public ResponseEntity<?> createOrder(@RequestBody OrderRequest orderRequest) {
        User user = userRepository.findById(orderRequest.getCustomerId())
                .orElseThrow(() -> new RuntimeException("Error: User not found."));

        Restaurant restaurant = restaurantRepository.findById(orderRequest.getRestaurantId())
                .orElseThrow(() -> new RuntimeException("Error: Restaurant not found."));

        Order order = new Order();
        order.setUser(user);
        order.setRestaurant(restaurant);
        order.setTotalAmount(orderRequest.getTotalPrice());
        order.setDeliveryAddress(orderRequest.getDeliveryAddress());
        order.setStatus(EOrderStatus.PENDING);
        order.setCreatedAt(LocalDateTime.now());

        for (OrderItemRequest itemRequest : orderRequest.getItems()) {
            MenuItem menuItem = menuItemRepository.findById(itemRequest.getMenuItemId())
                    .orElseThrow(() -> new RuntimeException("Error: MenuItem not found ID: " + itemRequest.getMenuItemId()));
            
            OrderItem orderItem = new OrderItem();
            orderItem.setOrder(order);
            orderItem.setMenuItem(menuItem);
            orderItem.setQuantity(itemRequest.getQuantity());
            orderItem.setPrice(menuItem.getPrice());
            
            order.addItem(orderItem);
        }

        orderRepository.save(order);

        return ResponseEntity.ok("Order placed successfully!");
    }

    @GetMapping("/user/{userId}")
    public ResponseEntity<List<Order>> getUserOrders(@PathVariable Long userId) {
        List<Order> orders = orderRepository.findByUserIdOrderByCreatedAtDesc(userId);
        return ResponseEntity.ok(orders);
    }
    
    @PutMapping("/{orderId}/status")
    public ResponseEntity<?> updateOrderStatus(@PathVariable Long orderId, @RequestBody String status) {
         Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> new RuntimeException("Error: Order not found."));
         
         try {
             // Remove quotes if present
             String cleanStatus = status.replace("\"", "");
             order.setStatus(EOrderStatus.valueOf(cleanStatus));
             orderRepository.save(order);
             return ResponseEntity.ok("Order status updated.");
         } catch (IllegalArgumentException e) {
             return ResponseEntity.badRequest().body("Invalid status");
         }
    }
}

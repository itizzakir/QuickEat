package com.quickbite.food_delivery_backend;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.quickbite.food_delivery_backend.models.*;
import com.quickbite.food_delivery_backend.repository.*;

import org.junit.jupiter.api.BeforeEach;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;

import java.time.LocalDateTime;
import java.util.Map;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/**
 * Shared fixture for the Phase 3 controller tests: a clean database, one account per role and a
 * restaurant with a menu. Tokens are obtained by actually signing in, so every test exercises
 * the real filter chain.
 */
@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
public abstract class ApiTestSupport {

    protected static final String PASSWORD = "password";

    @Autowired protected MockMvc mockMvc;
    @Autowired protected ObjectMapper objectMapper;
    @Autowired protected UserRepository userRepository;
    @Autowired protected RestaurantRepository restaurantRepository;
    @Autowired protected MenuItemRepository menuItemRepository;
    @Autowired protected OrderRepository orderRepository;
    @Autowired protected CartRepository cartRepository;
    @Autowired protected DeliveryInfoRepository deliveryInfoRepository;
    @Autowired protected PasswordEncoder passwordEncoder;

    protected User admin;
    protected User customer;
    protected User owner;
    protected User otherOwner;
    protected User courier;
    protected User otherCourier;
    protected Restaurant restaurant;
    protected Restaurant otherRestaurant;
    protected MenuItem burger;   // 250.0
    protected MenuItem fries;    // 100.0

    @BeforeEach
    void seedFixture() {
        cartRepository.deleteAll();
        orderRepository.deleteAll();
        menuItemRepository.deleteAll();
        restaurantRepository.deleteAll();
        deliveryInfoRepository.deleteAll();
        userRepository.deleteAll();

        admin = user("Ada Admin", "ada@test.dev", ERole.ROLE_ADMIN);
        customer = user("Cara Customer", "cara@test.dev", ERole.ROLE_CUSTOMER);
        owner = user("Olive Owner", "olive@test.dev", ERole.ROLE_RESTAURANT);
        otherOwner = user("Oscar Owner", "oscar@test.dev", ERole.ROLE_RESTAURANT);
        courier = user("Dan Delivery", "dan@test.dev", ERole.ROLE_DELIVERY);
        otherCourier = user("Dora Delivery", "dora@test.dev", ERole.ROLE_DELIVERY);

        restaurant = restaurant("Test Kitchen", owner, "Burgers, Fast Food", "₹29");
        otherRestaurant = restaurant("Rival Kitchen", otherOwner, "Pizza", "FREE");

        burger = menuItem(restaurant, "Test Burger", 250.0);
        fries = menuItem(restaurant, "Test Fries", 100.0);
    }

    protected User user(String name, String email, ERole role) {
        User user = new User(name, email, passwordEncoder.encode(PASSWORD), role);
        user.setMobile("+91 90000 00000");
        user.setEnabled(Boolean.TRUE);
        return userRepository.save(user);
    }

    protected Restaurant restaurant(String name, User owner, String category, String deliveryFee) {
        Restaurant r = new Restaurant();
        r.setName(name);
        r.setCategory(category);
        r.setOwner(owner);
        r.setRating(4.4);
        r.setDeliveryTime(30);
        r.setDeliveryFee(deliveryFee);
        r.setApproved(Boolean.TRUE);
        return restaurantRepository.save(r);
    }

    protected MenuItem menuItem(Restaurant r, String name, double price) {
        MenuItem item = new MenuItem();
        item.setName(name);
        item.setPrice(price);
        item.setAvailable(true);
        item.setVegetarian(true);
        item.setCategory("Main Course");
        item.setRestaurant(r);
        return menuItemRepository.save(item);
    }

    /** Places an order for the given customer and returns it, bypassing HTTP. */
    protected Order order(User forCustomer, Restaurant atRestaurant, EOrderStatus status,
                          User assignedCourier) {
        Order order = new Order();
        order.setUser(forCustomer);
        order.setRestaurant(atRestaurant);
        order.setStatus(status);
        order.setCreatedAt(LocalDateTime.now());
        order.setUpdatedAt(LocalDateTime.now());
        order.setTotalAmount(350.0);
        order.setDeliveryFee(29.0);
        order.setPaymentMethod("MOCK");
        order.setDeliveryPartner(assignedCourier);

        OrderItem line = new OrderItem();
        line.setMenuItem(burger);
        line.setQuantity(1);
        line.setPrice(burger.getPrice());
        order.addItem(line);

        return orderRepository.save(order);
    }

    protected String token(User user) throws Exception {
        MvcResult result = mockMvc.perform(post("/api/auth/signin")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(
                                Map.of("email", user.getEmail(), "password", PASSWORD))))
                .andExpect(status().isOk())
                .andReturn();
        Map<?, ?> body = objectMapper.readValue(result.getResponse().getContentAsString(), Map.class);
        return "Bearer " + body.get("token");
    }

    protected String json(Object value) throws Exception {
        return objectMapper.writeValueAsString(value);
    }
}

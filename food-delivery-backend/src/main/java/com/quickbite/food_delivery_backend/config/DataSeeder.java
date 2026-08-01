package com.quickbite.food_delivery_backend.config;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.quickbite.food_delivery_backend.models.*;
import com.quickbite.food_delivery_backend.repository.*;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.CommandLineRunner;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.context.annotation.Profile;
import org.springframework.core.io.ClassPathResource;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.io.InputStream;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

/**
 * Loads the demo catalogue from src/main/resources/seed/*.json.
 *
 * <p>Seeding is idempotent PER RECORD rather than globally: each user, restaurant and order
 * set is checked individually, so adding rows to the JSON and restarting picks up only the
 * new ones. Restarting with unchanged JSON inserts nothing and cannot trip a unique
 * constraint.
 */
@Component
@Profile("!test")
@ConditionalOnProperty(name = "app.seed.enabled", havingValue = "true", matchIfMissing = true)
public class DataSeeder implements CommandLineRunner {

    private static final Logger log = LoggerFactory.getLogger(DataSeeder.class);

    /** Sample orders are attached to this demo customer. */
    private static final String SAMPLE_ORDER_CUSTOMER = "john@example.com";

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private RestaurantRepository restaurantRepository;

    @Autowired
    private MenuItemRepository menuItemRepository;

    @Autowired
    private DeliveryInfoRepository deliveryInfoRepository;

    @Autowired
    private OrderRepository orderRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    private final ObjectMapper objectMapper = new ObjectMapper();

    @Override
    @Transactional
    public void run(String... args) throws Exception {
        List<SeedRestaurant> restaurantSeeds = read("seed/restaurants.json",
                new TypeReference<List<SeedRestaurant>>() {});

        int users = seedUsers();
        int[] catalogue = seedRestaurants(restaurantSeeds);
        int orders = seedSampleOrders(restaurantSeeds);

        log.info("Seeded {} users, {} restaurants, {} menu items, {} orders",
                users, catalogue[0], catalogue[1], orders);
    }

    // ------------------------------------------------------------------ users

    private int seedUsers() throws Exception {
        List<SeedUser> seeds = read("seed/users.json", new TypeReference<List<SeedUser>>() {});

        List<User> newUsers = new ArrayList<>();
        List<SeedUser> newDeliveryProfiles = new ArrayList<>();
        for (SeedUser seed : seeds) {
            if (userRepository.existsByEmail(seed.email)) {
                continue;
            }
            User user = new User(seed.fullName, seed.email,
                    passwordEncoder.encode(seed.password), ERole.valueOf(seed.role));
            user.setMobile(seed.mobile);
            user.setAddress(seed.address);
            user.setAvatarUrl(seed.avatarUrl);
            newUsers.add(user);
            if (seed.deliveryInfo != null) {
                newDeliveryProfiles.add(seed);
            }
        }
        userRepository.saveAll(newUsers);

        // Signup writes a DeliveryInfo row for delivery partners, so the seeded delivery
        // account needs one too or the delivery profile screen has nothing to render.
        List<DeliveryInfo> profiles = new ArrayList<>();
        for (SeedUser seed : newDeliveryProfiles) {
            User user = userRepository.findByEmail(seed.email).orElseThrow();
            if (deliveryInfoRepository.findByUserId(user.getId()).isPresent()) {
                continue;
            }
            SeedDeliveryInfo d = seed.deliveryInfo;
            profiles.add(new DeliveryInfo(user, d.vehicleType, d.vehicleModel, d.licenseNumber,
                    d.vehicleRegistrationNumber, d.deliveryZone, d.idProofUrl));
        }
        deliveryInfoRepository.saveAll(profiles);

        return newUsers.size();
    }

    // ------------------------------------------------------ restaurants + menu

    /** @return {restaurants inserted, menu items inserted} */
    private int[] seedRestaurants(List<SeedRestaurant> seeds) {
        Map<String, User> ownersByEmail = new HashMap<>();
        List<Restaurant> created = new ArrayList<>();
        List<MenuItem> menuItems = new ArrayList<>();

        for (SeedRestaurant seed : seeds) {
            if (restaurantRepository.findByName(seed.name).isPresent()) {
                continue;
            }
            User owner = ownersByEmail.computeIfAbsent(seed.ownerEmail,
                    email -> userRepository.findByEmail(email).orElse(null));
            if (owner == null) {
                log.warn("Skipping restaurant '{}': owner {} not found", seed.name, seed.ownerEmail);
                continue;
            }

            Restaurant restaurant = new Restaurant();
            restaurant.setName(seed.name);
            restaurant.setDescription(seed.description);
            restaurant.setAddress(seed.address);
            restaurant.setImage(seed.image);
            restaurant.setRating(seed.rating);
            restaurant.setDeliveryTime(seed.deliveryTime);
            restaurant.setDeliveryFee(seed.deliveryFee);
            restaurant.setDiscount(seed.discount);
            restaurant.setCategory(seed.category);
            restaurant.setOwner(owner);
            // Demo restaurants ship live; only self-registered ones wait for admin approval.
            restaurant.setApproved(Boolean.TRUE);
            created.add(restaurant);
        }
        restaurantRepository.saveAll(created);

        // Menu items are inserted only for restaurants created in this run, so a restart
        // never duplicates a menu.
        Map<String, Restaurant> createdByName = new HashMap<>();
        for (Restaurant restaurant : created) {
            createdByName.put(restaurant.getName(), restaurant);
        }
        for (SeedRestaurant seed : seeds) {
            Restaurant restaurant = createdByName.get(seed.name);
            if (restaurant == null) {
                continue;
            }
            for (SeedMenuItem seedItem : seed.menu) {
                MenuItem item = new MenuItem();
                item.setName(seedItem.name);
                item.setDescription(seedItem.description);
                item.setPrice(seedItem.price);
                item.setVegetarian(seedItem.vegetarian);
                item.setCategory(seedItem.category);
                item.setAvailable(seedItem.available);
                item.setImage(seedItem.image);
                // Both sides of the association, so the in-memory graph matches the database.
                item.setRestaurant(restaurant);
                restaurant.getMenu().add(item);
                menuItems.add(item);
            }
        }
        menuItemRepository.saveAll(menuItems);

        return new int[] { created.size(), menuItems.size() };
    }

    // ----------------------------------------------------------- sample orders

    /**
     * Ten orders for the demo customer spread over the last fortnight, covering every
     * EOrderStatus so the order tracker and the restaurant dashboard both have data.
     */
    private int seedSampleOrders(List<SeedRestaurant> seeds) {
        User customer = userRepository.findByEmail(SAMPLE_ORDER_CUSTOMER).orElse(null);
        if (customer == null || !orderRepository.findByUserIdOrderByCreatedAtDesc(customer.getId()).isEmpty()) {
            return 0;
        }

        EOrderStatus[] statuses = EOrderStatus.values();
        List<Order> orders = new ArrayList<>();
        LocalDateTime now = LocalDateTime.now();

        for (int i = 0; i < 10; i++) {
            // The first six seeded restaurants, resolved by name rather than by assuming the
            // generated ids happen to be 1..6.
            Restaurant restaurant = restaurantRepository.findByName(seeds.get(i % 6).name).orElse(null);
            if (restaurant == null) {
                continue;
            }
            List<MenuItem> menu = menuItemRepository.findByRestaurantId(restaurant.getId());
            if (menu.isEmpty()) {
                continue;
            }

            Order order = new Order();
            order.setUser(customer);
            order.setRestaurant(restaurant);
            order.setDeliveryAddress(customer.getAddress());
            order.setStatus(statuses[i % statuses.length]);
            // Staggered across the last 14 days, newest first.
            order.setCreatedAt(now.minusDays(i + 1L).minusHours(i * 2L + 1L));
            order.setUpdatedAt(order.getCreatedAt());
            order.setPaymentMethod("MOCK");
            order.setDeliveryFee(parseDeliveryFee(restaurant.getDeliveryFee()));

            int itemCount = 2 + (i % 3);                     // 2..4 items
            double total = 0.0;
            for (int j = 0; j < itemCount; j++) {
                MenuItem menuItem = menu.get((i + j) % menu.size());
                int quantity = 1 + ((i + j) % 2);
                OrderItem orderItem = new OrderItem();
                orderItem.setMenuItem(menuItem);
                orderItem.setQuantity(quantity);
                orderItem.setPrice(menuItem.getPrice());
                order.addItem(orderItem);
                total += menuItem.getPrice() * quantity;     // computed, never hardcoded
            }
            order.setTotalAmount(total);
            orders.add(order);
        }
        orderRepository.saveAll(orders);
        return orders.size();
    }

    // ----------------------------------------------------------------- helpers

    /** Mirrors OrderController: "FREE"/"₹29" display text becomes a number. */
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

    private <T> T read(String path, TypeReference<T> type) throws Exception {
        try (InputStream in = new ClassPathResource(path).getInputStream()) {
            return objectMapper.readValue(in, type);
        }
    }

    // JSON shapes. Kept package-private and dumb on purpose — they exist only to bind the
    // seed files, not to be part of the domain model.

    static class SeedUser {
        public String fullName;
        public String email;
        public String password;
        public String role;
        public String mobile;
        public String address;
        public String avatarUrl;
        public SeedDeliveryInfo deliveryInfo;
    }

    static class SeedDeliveryInfo {
        public String vehicleType;
        public String vehicleModel;
        public String licenseNumber;
        public String vehicleRegistrationNumber;
        public String deliveryZone;
        public String idProofUrl;
    }

    static class SeedRestaurant {
        public String name;
        public String description;
        public String address;
        public String image;
        public Double rating;
        public Integer deliveryTime;
        public String deliveryFee;
        public String discount;
        public String category;
        public String ownerEmail;
        public List<SeedMenuItem> menu = new ArrayList<>();
    }

    static class SeedMenuItem {
        public String name;
        public String description;
        public Double price;
        public Boolean vegetarian;
        public String category;
        public Boolean available;
        public String image;
    }
}

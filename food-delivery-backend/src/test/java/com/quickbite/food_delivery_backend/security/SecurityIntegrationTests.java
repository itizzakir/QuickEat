package com.quickbite.food_delivery_backend.security;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.quickbite.food_delivery_backend.models.*;
import com.quickbite.food_delivery_backend.repository.*;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;

import java.util.List;
import java.util.Map;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

/**
 * Phase 2 acceptance. Every test drives the real filter chain through MockMvc with real JWTs,
 * so authorisation is exercised end to end rather than mocked away.
 */
@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
class SecurityIntegrationTests {

    private static final String BCRYPT_PREFIX = "$2a$";

    @Autowired private MockMvc mockMvc;
    @Autowired private ObjectMapper objectMapper;
    @Autowired private UserRepository userRepository;
    @Autowired private RestaurantRepository restaurantRepository;
    @Autowired private MenuItemRepository menuItemRepository;
    @Autowired private OrderRepository orderRepository;
    @Autowired private CartRepository cartRepository;
    @Autowired private DeliveryInfoRepository deliveryInfoRepository;
    @Autowired private PasswordEncoder passwordEncoder;

    private User userA;
    private User userB;
    private User owner;
    private Restaurant restaurant;
    private MenuItem burger;   // 250.0
    private MenuItem fries;    // 100.0

    @BeforeEach
    void setUp() {
        // delivery_info before users: the signup test creates a delivery partner, whose
        // profile row holds an FK back to the user.
        cartRepository.deleteAll();
        orderRepository.deleteAll();
        menuItemRepository.deleteAll();
        restaurantRepository.deleteAll();
        deliveryInfoRepository.deleteAll();
        userRepository.deleteAll();

        userA = persistUser("Alice Customer", "alice@example.com", ERole.ROLE_CUSTOMER);
        userB = persistUser("Bob Customer", "bob@example.com", ERole.ROLE_CUSTOMER);
        owner = persistUser("Olive Owner", "olive@example.com", ERole.ROLE_RESTAURANT);
        persistUser("Dan Delivery", "dan@example.com", ERole.ROLE_DELIVERY);

        restaurant = new Restaurant();
        restaurant.setName("Test Kitchen");
        restaurant.setCategory("Burgers");
        restaurant.setOwner(owner);
        restaurant.setRating(4.2);
        restaurant = restaurantRepository.save(restaurant);

        burger = persistMenuItem("Test Burger", 250.0);
        fries = persistMenuItem("Test Fries", 100.0);
    }

    private User persistUser(String name, String email, ERole role) {
        User user = new User(name, email, passwordEncoder.encode("password"), role);
        return userRepository.save(user);
    }

    private MenuItem persistMenuItem(String name, double price) {
        MenuItem item = new MenuItem();
        item.setName(name);
        item.setPrice(price);
        item.setAvailable(true);
        item.setVegetarian(true);
        item.setRestaurant(restaurant);
        return menuItemRepository.save(item);
    }

    /** Signs in for real and returns the bearer value, so tokens under test are genuine. */
    private String tokenFor(String email) throws Exception {
        MvcResult result = mockMvc.perform(post("/api/auth/signin")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(
                                Map.of("email", email, "password", "password"))))
                .andExpect(status().isOk())
                .andReturn();
        Map<?, ?> body = objectMapper.readValue(result.getResponse().getContentAsString(), Map.class);
        return "Bearer " + body.get("token");
    }

    // ---------------------------------------------------------------- (a) IDOR

    @Test
    @DisplayName("(a) user A's token is refused on user B's profile, cart and orders")
    void crossUserAccessIsForbidden() throws Exception {
        String tokenA = tokenFor(userA.getEmail());

        mockMvc.perform(get("/api/users/profile/{id}", userB.getId()).header("Authorization", tokenA))
                .andExpect(status().isForbidden());

        mockMvc.perform(get("/api/cart/{id}", userB.getId()).header("Authorization", tokenA))
                .andExpect(status().isForbidden());

        mockMvc.perform(get("/api/orders/user/{id}", userB.getId()).header("Authorization", tokenA))
                .andExpect(status().isForbidden());

        mockMvc.perform(post("/api/cart/clear/{id}", userB.getId()).header("Authorization", tokenA))
                .andExpect(status().isForbidden());

        // ...and A's own data is still reachable, so this is authorisation and not a blanket deny.
        mockMvc.perform(get("/api/users/profile/{id}", userA.getId()).header("Authorization", tokenA))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.email").value(userA.getEmail()));
    }

    @Test
    @DisplayName("(a) user A cannot overwrite user B's profile")
    void crossUserProfileWriteIsForbidden() throws Exception {
        String tokenA = tokenFor(userA.getEmail());

        mockMvc.perform(put("/api/users/profile/{id}", userB.getId())
                        .header("Authorization", tokenA)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(Map.of("fullName", "Hacked Name"))))
                .andExpect(status().isForbidden());

        assertThat(userRepository.findById(userB.getId()).orElseThrow().getFullName())
                .isEqualTo("Bob Customer");
    }

    @Test
    @DisplayName("(a) user A cannot delete a line from user B's cart")
    void crossUserCartItemDeleteIsForbidden() throws Exception {
        String tokenB = tokenFor(userB.getEmail());
        mockMvc.perform(post("/api/cart/add")
                        .header("Authorization", tokenB)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(
                                Map.of("menuItemId", burger.getId(), "quantity", 2))))
                .andExpect(status().isOk());

        Cart cartB = cartRepository.findByUserId(userB.getId()).orElseThrow();
        Long itemId = cartB.getItems().get(0).getId();

        mockMvc.perform(delete("/api/cart/remove/{itemId}", itemId)
                        .header("Authorization", tokenFor(userA.getEmail())))
                .andExpect(status().isForbidden());

        assertThat(cartRepository.findByUserId(userB.getId()).orElseThrow().getItems()).hasSize(1);
    }

    @Test
    @DisplayName("add-to-cart ignores any user id in the body and uses the token's user")
    void addToCartUsesPrincipalNotBody() throws Exception {
        // A forged userId pointing at B must not create or modify B's cart.
        mockMvc.perform(post("/api/cart/add")
                        .header("Authorization", tokenFor(userA.getEmail()))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(Map.of(
                                "userId", userB.getId(),
                                "menuItemId", burger.getId(),
                                "quantity", 1))))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.userId").value(userA.getId()));

        assertThat(cartRepository.findByUserId(userB.getId())).isEmpty();
    }

    // ------------------------------------------------------- (b) no bcrypt hashes

    @Test
    @DisplayName("(b) no response body anywhere contains a bcrypt hash")
    void noResponseLeaksPasswordHashes() throws Exception {
        String tokenA = tokenFor(userA.getEmail());
        String ownerToken = tokenFor(owner.getEmail());

        mockMvc.perform(post("/api/cart/add")
                .header("Authorization", tokenA)
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(
                        Map.of("menuItemId", burger.getId(), "quantity", 1))));
        placeOrder(tokenA, Map.of("items", List.of(Map.of("menuItemId", burger.getId(), "quantity", 1))));

        List<String> bodies = List.of(
                perform(get("/api/restaurants")),
                perform(get("/api/restaurants/" + restaurant.getId())),
                perform(get("/api/users/profile/" + userA.getId()).header("Authorization", tokenA)),
                perform(get("/api/cart/" + userA.getId()).header("Authorization", tokenA)),
                perform(get("/api/orders/user/" + userA.getId()).header("Authorization", tokenA)),
                perform(post("/api/auth/signin")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(
                                Map.of("email", userA.getEmail(), "password", "password")))),
                perform(get("/api/users/profile/" + owner.getId()).header("Authorization", ownerToken)));

        // Sanity check: the hashes really are in the database, so this assertion has teeth.
        assertThat(userRepository.findById(userA.getId()).orElseThrow().getPassword())
                .startsWith(BCRYPT_PREFIX);

        for (String body : bodies) {
            assertThat(body).doesNotContain(BCRYPT_PREFIX);
            assertThat(body).doesNotContain("\"password\"");
        }
    }

    private String perform(org.springframework.test.web.servlet.request.MockHttpServletRequestBuilder rb)
            throws Exception {
        return mockMvc.perform(rb).andReturn().getResponse().getContentAsString();
    }

    // ------------------------------------------------- (c) server-side pricing

    @Test
    @DisplayName("(c) a tampered totalPrice is discarded and the server total is stored")
    void tamperedOrderTotalIsIgnored() throws Exception {
        String tokenA = tokenFor(userA.getEmail());

        // 2 burgers (250) + 3 fries (100) = 800, but the client claims it owes 1.
        String body = placeOrder(tokenA, Map.of(
                "customerId", userB.getId(),          // also forged, also ignored
                "restaurantId", 999,
                "totalPrice", 1.0,
                "items", List.of(
                        Map.of("menuItemId", burger.getId(), "quantity", 2),
                        Map.of("menuItemId", fries.getId(), "quantity", 3))));

        Map<?, ?> response = objectMapper.readValue(body, Map.class);
        assertThat(((Number) response.get("totalAmount")).doubleValue()).isEqualTo(800.0);

        // Read back through the graph-fetching finder so items are initialised.
        Order stored = orderRepository.findByUserIdOrderByCreatedAtDesc(userA.getId()).get(0);
        assertThat(stored.getTotalAmount()).isEqualTo(800.0);
        assertThat(stored.getUser().getId()).isEqualTo(userA.getId());          // not userB
        assertThat(stored.getRestaurant().getId()).isEqualTo(restaurant.getId()); // not 999
        assertThat(stored.getItems()).allSatisfy(item ->
                assertThat(item.getPrice()).isIn(250.0, 100.0));
    }

    @Test
    @DisplayName("an order spanning two restaurants is rejected")
    void multiRestaurantOrderIsRejected() throws Exception {
        Restaurant other = new Restaurant();
        other.setName("Other Kitchen");
        other.setOwner(owner);
        other = restaurantRepository.save(other);

        MenuItem otherItem = new MenuItem();
        otherItem.setName("Other Dish");
        otherItem.setPrice(300.0);
        otherItem.setAvailable(true);
        otherItem.setRestaurant(other);
        otherItem = menuItemRepository.save(otherItem);

        mockMvc.perform(post("/api/orders")
                        .header("Authorization", tokenFor(userA.getEmail()))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(Map.of("items", List.of(
                                Map.of("menuItemId", burger.getId(), "quantity", 1),
                                Map.of("menuItemId", otherItem.getId(), "quantity", 1))))))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message").value(
                        "All items in an order must come from the same restaurant"));

        assertThat(orderRepository.count()).isZero();
    }

    private String placeOrder(String token, Map<String, Object> payload) throws Exception {
        return mockMvc.perform(post("/api/orders")
                        .header("Authorization", token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(payload)))
                .andExpect(status().isOk())
                .andReturn().getResponse().getContentAsString();
    }

    // ------------------------------------------------------ (d) role enforcement

    @Test
    @DisplayName("(d) a CUSTOMER token is refused on the order status endpoint")
    void customerCannotChangeOrderStatus() throws Exception {
        String tokenA = tokenFor(userA.getEmail());
        placeOrder(tokenA, Map.of("items", List.of(Map.of("menuItemId", burger.getId(), "quantity", 1))));
        Long orderId = orderRepository.findAll().get(0).getId();

        mockMvc.perform(put("/api/orders/{id}/status", orderId)
                        .header("Authorization", tokenA)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"status\":\"CONFIRMED\"}"))
                .andExpect(status().isForbidden());

        assertThat(orderRepository.findById(orderId).orElseThrow().getStatus())
                .isEqualTo(EOrderStatus.PENDING);
    }

    @Test
    @DisplayName("the owning restaurant may advance status, but only along a legal transition")
    void restaurantOwnerCanAdvanceStatusWithinRules() throws Exception {
        placeOrder(tokenFor(userA.getEmail()),
                Map.of("items", List.of(Map.of("menuItemId", burger.getId(), "quantity", 1))));
        Long orderId = orderRepository.findAll().get(0).getId();
        String ownerToken = tokenFor(owner.getEmail());

        // DELIVERED belongs to the courier, so a restaurant is refused outright (403) rather
        // than merely told the transition is illegal.
        mockMvc.perform(put("/api/orders/{id}/status", orderId)
                        .header("Authorization", ownerToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"status\":\"DELIVERED\"}"))
                .andExpect(status().isForbidden());

        // READY_FOR_PICKUP is a kitchen-side status, but not reachable from PENDING — that is
        // the illegal-transition path, and it is a 400.
        mockMvc.perform(put("/api/orders/{id}/status", orderId)
                        .header("Authorization", ownerToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"status\":\"READY_FOR_PICKUP\"}"))
                .andExpect(status().isBadRequest());

        mockMvc.perform(put("/api/orders/{id}/status", orderId)
                        .header("Authorization", ownerToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"status\":\"CONFIRMED\"}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("CONFIRMED"));
    }

    @Test
    @DisplayName("a restaurant account cannot touch another restaurant's orders")
    void otherRestaurantOwnerIsForbidden() throws Exception {
        placeOrder(tokenFor(userA.getEmail()),
                Map.of("items", List.of(Map.of("menuItemId", burger.getId(), "quantity", 1))));
        Long orderId = orderRepository.findAll().get(0).getId();

        User intruder = persistUser("Ivan Intruder", "ivan@example.com", ERole.ROLE_RESTAURANT);

        mockMvc.perform(put("/api/orders/{id}/status", orderId)
                        .header("Authorization", tokenFor(intruder.getEmail()))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"status\":\"CONFIRMED\"}"))
                .andExpect(status().isForbidden());
    }

    @Test
    @DisplayName("an unknown status value is rejected as a bad request, not a 500")
    void unknownStatusValueIsRejected() throws Exception {
        placeOrder(tokenFor(userA.getEmail()),
                Map.of("items", List.of(Map.of("menuItemId", burger.getId(), "quantity", 1))));
        Long orderId = orderRepository.findAll().get(0).getId();

        mockMvc.perform(put("/api/orders/{id}/status", orderId)
                        .header("Authorization", tokenFor(owner.getEmail()))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"status\":\"TELEPORTED\"}"))
                .andExpect(status().isBadRequest());
    }

    // ------------------------------------------------ (e) no admin self-signup

    @Test
    @DisplayName("(e) signing up as ROLE_ADMIN is rejected")
    void adminSelfRegistrationIsRejected() throws Exception {
        mockMvc.perform(post("/api/auth/signup")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(Map.of(
                                "fullName", "Mallory",
                                "email", "mallory@example.com",
                                "password", "password123",
                                "role", "ROLE_ADMIN"))))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message").value("Role ROLE_ADMIN cannot be self-registered"));

        assertThat(userRepository.existsByEmail("mallory@example.com")).isFalse();
    }

    @Test
    @DisplayName("the three self-service roles still register normally")
    void selfServiceRolesAreAccepted() throws Exception {
        for (String role : List.of("ROLE_CUSTOMER", "ROLE_RESTAURANT", "ROLE_DELIVERY")) {
            String email = role.toLowerCase() + "@signup.test";
            mockMvc.perform(post("/api/auth/signup")
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(objectMapper.writeValueAsString(Map.of(
                                    "fullName", "New " + role,
                                    "email", email,
                                    "password", "password123",
                                    "role", role,
                                    "businessName", "Biz",
                                    "vehicleType", "MOTORCYCLE",
                                    "vehicleModel", "Activa",
                                    "licenseNumber", "L1",
                                    "vehicleRegistrationNumber", "R1",
                                    "deliveryZone", "Zone 1"))))
                    .andExpect(status().isOk());
            assertThat(userRepository.findByEmail(email).orElseThrow().getRole().name()).isEqualTo(role);
        }
    }

    // --------------------------------------------------- (f) JSON error bodies

    @Test
    @DisplayName("(f) bad credentials return 401 with a JSON body")
    void badCredentialsReturnJson() throws Exception {
        mockMvc.perform(post("/api/auth/signin")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(
                                Map.of("email", userA.getEmail(), "password", "wrong-password"))))
                .andExpect(status().isUnauthorized())
                .andExpect(content().contentTypeCompatibleWith(MediaType.APPLICATION_JSON))
                .andExpect(jsonPath("$.status").value(401))
                .andExpect(jsonPath("$.message").value("Invalid email or password"))
                .andExpect(jsonPath("$.path").value("/api/auth/signin"));
    }

    @Test
    @DisplayName("an unauthenticated call to a protected endpoint returns a JSON 401")
    void missingTokenReturnsJson() throws Exception {
        mockMvc.perform(get("/api/cart/{id}", userA.getId()))
                .andExpect(status().isUnauthorized())
                .andExpect(content().contentTypeCompatibleWith(MediaType.APPLICATION_JSON))
                .andExpect(jsonPath("$.status").value(401))
                .andExpect(jsonPath("$.error").value("Unauthorized"));
    }

    @Test
    @DisplayName("a forbidden call returns a JSON 403 in the same shape")
    void forbiddenReturnsJson() throws Exception {
        mockMvc.perform(get("/api/cart/{id}", userB.getId())
                        .header("Authorization", tokenFor(userA.getEmail())))
                .andExpect(status().isForbidden())
                .andExpect(content().contentTypeCompatibleWith(MediaType.APPLICATION_JSON))
                .andExpect(jsonPath("$.status").value(403))
                .andExpect(jsonPath("$.error").value("Forbidden"));
    }

    @Test
    @DisplayName("validation failures return 400 with per-field messages")
    void validationErrorsAreReported() throws Exception {
        mockMvc.perform(post("/api/cart/add")
                        .header("Authorization", tokenFor(userA.getEmail()))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"quantity\":0}"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.fieldErrors.menuItemId").exists())
                .andExpect(jsonPath("$.fieldErrors.quantity").exists());
    }

    // ------------------------------------------------------------- public reads

    @Test
    @DisplayName("the public catalogue stays reachable without a token and hides the owner")
    void publicCatalogueIsStillPublic() throws Exception {
        mockMvc.perform(get("/api/restaurants"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].name").value("Test Kitchen"))
                .andExpect(jsonPath("$[0].owner").doesNotExist())
                .andExpect(jsonPath("$[0].menu").doesNotExist());

        mockMvc.perform(get("/api/restaurants/{id}", restaurant.getId()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.menu.length()").value(2))
                .andExpect(jsonPath("$.owner").doesNotExist());
    }
}

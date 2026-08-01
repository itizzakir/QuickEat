package com.quickbite.food_delivery_backend.payload.response;

import com.fasterxml.jackson.annotation.JsonInclude;

/** Sign-in response. {@code restaurantId} is present only for RESTAURANT accounts. */
@JsonInclude(JsonInclude.Include.NON_NULL)
public class JwtResponse {

  private final String token;
  private final String type = "Bearer";
  private final Long id;
  private final String fullName;
  private final String email;
  private final String role;
  private final Long restaurantId;

  public JwtResponse(String accessToken, Long id, String fullName, String email, String role) {
    this(accessToken, id, fullName, email, role, null);
  }

  public JwtResponse(String accessToken, Long id, String fullName, String email, String role,
                     Long restaurantId) {
    this.token = accessToken;
    this.id = id;
    this.fullName = fullName;
    this.email = email;
    this.role = role;
    this.restaurantId = restaurantId;
  }

  public String getToken() { return token; }
  public String getType() { return type; }
  public Long getId() { return id; }
  public String getFullName() { return fullName; }
  public String getEmail() { return email; }
  public String getRole() { return role; }
  public Long getRestaurantId() { return restaurantId; }
}

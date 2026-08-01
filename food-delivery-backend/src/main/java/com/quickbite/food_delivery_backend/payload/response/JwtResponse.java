package com.quickbite.food_delivery_backend.payload.response;

import lombok.Data;

@Data
public class JwtResponse {
  private String token;
  private String type = "Bearer";
  private Long id;
  private String fullName;
  private String email;
  private String role;

  public JwtResponse(String accessToken, Long id, String fullName, String email, String role) {
    this.token = accessToken;
    this.id = id;
    this.fullName = fullName;
    this.email = email;
    this.role = role;
  }
}

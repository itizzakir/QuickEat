package com.quickbite.food_delivery_backend.models;

import jakarta.persistence.*;
import com.fasterxml.jackson.annotation.JsonProperty;

@Entity
@Table(name = "users",
       uniqueConstraints = {
           @UniqueConstraint(columnNames = "email")
       })
public class User {
  @Id
  @GeneratedValue(strategy = GenerationType.IDENTITY)
  private Long id;

  @Column(nullable = false)
  private String fullName;

    @Column(nullable = false, unique = true)
    private String email;

    // Never serialised. Controllers return DTOs now, but this is the backstop that stops a
    // BCrypt hash reaching a client if an entity is ever returned directly again.
    @JsonProperty(access = JsonProperty.Access.WRITE_ONLY)
    @Column(nullable = false)
    private String password;

    @Enumerated(EnumType.STRING)
    @Column(length = 20)
    private ERole role;
    
    private String mobile;
    private String avatarUrl;
    private String address;

    /**
     * Lets an admin suspend an account instead of deleting it. Treated as enabled when null so
     * that rows written before this column existed can still sign in.
     */
    private Boolean enabled = Boolean.TRUE;

    public User() {
    }

    public User(String fullName, String email, String password, ERole role) {
        this.fullName = fullName;
        this.email = email;
        this.password = password;
        this.role = role;
    }

    // Getters and Setters
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public String getFullName() { return fullName; }
    public void setFullName(String fullName) { this.fullName = fullName; }

    public String getEmail() { return email; }
    public void setEmail(String email) { this.email = email; }

    public String getPassword() { return password; }
    public void setPassword(String password) { this.password = password; }

    public ERole getRole() { return role; }
    public void setRole(ERole role) { this.role = role; }
    
    public String getMobile() { return mobile; }
    public void setMobile(String mobile) { this.mobile = mobile; }

    public String getAvatarUrl() { return avatarUrl; }
    public void setAvatarUrl(String avatarUrl) { this.avatarUrl = avatarUrl; }

    public String getAddress() { return address; }
    public void setAddress(String address) { this.address = address; }

    public Boolean getEnabled() { return enabled; }
    public void setEnabled(Boolean enabled) { this.enabled = enabled; }

    /** Null-safe view of {@link #enabled}: only an explicit false suspends the account. */
    public boolean isActive() { return !Boolean.FALSE.equals(enabled); }
}

package com.quickbite.food_delivery_backend.models;

import com.fasterxml.jackson.annotation.JsonIgnore;

import jakarta.persistence.*;

/**
 * A saved delivery address.
 *
 * <p>Signup used to join addressLine1/city/state/postalCode/country into one comma-separated
 * String on User, which could not be edited field-by-field, validated, or picked between —
 * the profile page just showed the blob. Addresses are their own rows now, and a user may keep
 * several with one marked default.
 */
@Entity
@Table(name = "addresses")
public class Address {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "user_id", nullable = false)
    @JsonIgnore
    private User user;

    /** What the customer calls it: "Home", "Office". */
    private String label;

    @Column(nullable = false)
    private String line1;

    private String line2;

    @Column(nullable = false)
    private String city;

    private String state;

    private String postalCode;

    private String country;

    /** At most one per user; the controller keeps that true. */
    private Boolean isDefault = Boolean.FALSE;

    public Address() {
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public User getUser() { return user; }
    public void setUser(User user) { this.user = user; }

    public String getLabel() { return label; }
    public void setLabel(String label) { this.label = label; }

    public String getLine1() { return line1; }
    public void setLine1(String line1) { this.line1 = line1; }

    public String getLine2() { return line2; }
    public void setLine2(String line2) { this.line2 = line2; }

    public String getCity() { return city; }
    public void setCity(String city) { this.city = city; }

    public String getState() { return state; }
    public void setState(String state) { this.state = state; }

    public String getPostalCode() { return postalCode; }
    public void setPostalCode(String postalCode) { this.postalCode = postalCode; }

    public String getCountry() { return country; }
    public void setCountry(String country) { this.country = country; }

    public Boolean getIsDefault() { return isDefault; }
    public void setIsDefault(Boolean isDefault) { this.isDefault = isDefault; }

    public boolean isDefaultAddress() { return Boolean.TRUE.equals(isDefault); }

    /**
     * The single line stored on the order, so an order keeps the address as it was even if the
     * customer later edits or deletes the saved one.
     */
    public String toFormattedString() {
        StringBuilder sb = new StringBuilder(line1);
        if (line2 != null && !line2.isBlank()) sb.append(", ").append(line2);
        sb.append(", ").append(city);
        if (state != null && !state.isBlank()) sb.append(", ").append(state);
        if (postalCode != null && !postalCode.isBlank()) sb.append(" - ").append(postalCode);
        if (country != null && !country.isBlank()) sb.append(", ").append(country);
        return sb.toString();
    }
}

package com.quickbite.food_delivery_backend.payload.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public class AddressRequest {

    @Size(max = 40)
    private String label;

    @NotBlank(message = "line1 is required")
    @Size(max = 200)
    private String line1;

    @Size(max = 200)
    private String line2;

    @NotBlank(message = "city is required")
    @Size(max = 80)
    private String city;

    @Size(max = 80)
    private String state;

    @Size(max = 20)
    private String postalCode;

    @Size(max = 80)
    private String country;

    /** Marking a new address default demotes the previous one. */
    private Boolean isDefault;

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
}

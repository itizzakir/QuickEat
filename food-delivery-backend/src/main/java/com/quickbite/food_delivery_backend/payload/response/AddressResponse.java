package com.quickbite.food_delivery_backend.payload.response;

import com.quickbite.food_delivery_backend.models.Address;

public class AddressResponse {

    private final Long id;
    private final String label;
    private final String line1;
    private final String line2;
    private final String city;
    private final String state;
    private final String postalCode;
    private final String country;
    private final boolean isDefault;
    /** Pre-rendered single line, so clients never re-implement the join. */
    private final String formatted;

    private AddressResponse(Address address) {
        this.id = address.getId();
        this.label = address.getLabel();
        this.line1 = address.getLine1();
        this.line2 = address.getLine2();
        this.city = address.getCity();
        this.state = address.getState();
        this.postalCode = address.getPostalCode();
        this.country = address.getCountry();
        this.isDefault = address.isDefaultAddress();
        this.formatted = address.toFormattedString();
    }

    public static AddressResponse from(Address address) {
        return address == null ? null : new AddressResponse(address);
    }

    public Long getId() { return id; }
    public String getLabel() { return label; }
    public String getLine1() { return line1; }
    public String getLine2() { return line2; }
    public String getCity() { return city; }
    public String getState() { return state; }
    public String getPostalCode() { return postalCode; }
    public String getCountry() { return country; }
    public boolean getIsDefault() { return isDefault; }
    public String getFormatted() { return formatted; }
}

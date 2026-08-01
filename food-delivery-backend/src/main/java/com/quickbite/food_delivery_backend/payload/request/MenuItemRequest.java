package com.quickbite.food_delivery_backend.payload.request;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

/** Create/update payload for a dish. The owning restaurant comes from the path, not the body. */
public class MenuItemRequest {

    @NotBlank(message = "name is required")
    @Size(max = 120)
    private String name;

    @Size(max = 1000)
    private String description;

    @NotNull(message = "price is required")
    @DecimalMin(value = "0.0", inclusive = false, message = "price must be greater than zero")
    private Double price;

    private Boolean vegetarian = Boolean.FALSE;

    @Size(max = 60)
    private String category;

    private Boolean available = Boolean.TRUE;

    private String image;

    public String getName() { return name; }
    public void setName(String name) { this.name = name; }

    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }

    public Double getPrice() { return price; }
    public void setPrice(Double price) { this.price = price; }

    public Boolean getVegetarian() { return vegetarian; }
    public void setVegetarian(Boolean vegetarian) { this.vegetarian = vegetarian; }

    public String getCategory() { return category; }
    public void setCategory(String category) { this.category = category; }

    public Boolean getAvailable() { return available; }
    public void setAvailable(Boolean available) { this.available = available; }

    public String getImage() { return image; }
    public void setImage(String image) { this.image = image; }
}

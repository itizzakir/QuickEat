package com.quickbite.food_delivery_backend.models;

import jakarta.persistence.*;
import com.fasterxml.jackson.annotation.JsonIgnore;

@Entity
@Table(name = "menu_items")
public class MenuItem {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String name;

    private Double price;
    
    @Column(length = 1000)
    private String description;
    
    private Boolean vegetarian;
    private String image;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "restaurant_id")
    @JsonIgnore // Prevent infinite recursion when serializing Restaurant -> Menu -> Restaurant
    private Restaurant restaurant;

    public MenuItem() {
    }

    public MenuItem(String name, Double price, String description, Boolean vegetarian, String image) {
        this.name = name;
        this.price = price;
        this.description = description;
        this.vegetarian = vegetarian;
        this.image = image;
    }

    // Getters and Setters
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public String getName() { return name; }
    public void setName(String name) { this.name = name; }

    public Double getPrice() { return price; }
    public void setPrice(Double price) { this.price = price; }

    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }

    public Boolean getVegetarian() { return vegetarian; }
    public void setVegetarian(Boolean vegetarian) { this.vegetarian = vegetarian; }

    public String getImage() { return image; }
    public void setImage(String image) { this.image = image; }

    public Restaurant getRestaurant() { return restaurant; }
    public void setRestaurant(Restaurant restaurant) { this.restaurant = restaurant; }
}

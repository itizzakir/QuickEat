package com.quickbite.food_delivery_backend.config;

import com.quickbite.food_delivery_backend.models.*;
import com.quickbite.food_delivery_backend.repository.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.util.Arrays;
import java.util.List;

@Component
public class DataSeeder implements CommandLineRunner {

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private RestaurantRepository restaurantRepository;

    @Autowired
    private MenuItemRepository menuItemRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Override
    @Transactional
    public void run(String... args) throws Exception {
        seedUsers();
        seedRestaurantsAndMenu();
    }

    private void seedUsers() {
        if (userRepository.count() == 0) {
            // Admin
            User admin = new User("Admin User", "admin@quickbite.com", passwordEncoder.encode("admin123"), ERole.ROLE_ADMIN);
            userRepository.save(admin);

            // Customer
            User customer = new User("John Doe", "john@example.com", passwordEncoder.encode("password"), ERole.ROLE_CUSTOMER);
            userRepository.save(customer);

            // Delivery
            User delivery = new User("Delivery Guy", "delivery@quickbite.com", passwordEncoder.encode("password"), ERole.ROLE_DELIVERY);
            userRepository.save(delivery);
            
            // Restaurant Owner (Generic)
            User owner = new User("Restaurant Owner", "owner@quickbite.com", passwordEncoder.encode("password"), ERole.ROLE_RESTAURANT);
            userRepository.save(owner);
        }
    }

    private void seedRestaurantsAndMenu() {
        if (restaurantRepository.count() == 0) {
            User owner = userRepository.findByEmail("owner@quickbite.com").orElse(null);

            // Restaurant 1: Spicy Biryani House
            createRestaurant(owner, "Spicy Biryani House", 
                "https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?w=500&auto=format&fit=crop&q=60",
                4.5, 30, "Biryani, Mughlai", "Free", "50% OFF", Arrays.asList(
                    new MenuItem("Hyderabadi Chicken Biryani", 350.0, "Authentic Hyderabadi Dum Biryani served with Mirchi ka Salan and Raita.", false, "https://images.unsplash.com/photo-1633945274405-b6c8069047b0?w=500&auto=format&fit=crop&q=60"),
                    new MenuItem("Mutton Biryani", 450.0, "Tender mutton pieces marinated in spices and cooked with aromatic basmati rice.", false, "https://images.unsplash.com/photo-1631515243349-e06036043944?w=500&auto=format&fit=crop&q=60"),
                    new MenuItem("Veg Biryani", 280.0, "Fresh mixed vegetables cooked with basmati rice and spices.", true, "https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?w=500&auto=format&fit=crop&q=60"),
                    new MenuItem("Chicken 65", 250.0, "Spicy, deep-fried chicken dish.", false, "https://images.unsplash.com/photo-1610057099443-fde8c4d50f91?w=500&auto=format&fit=crop&q=60"),
                    new MenuItem("Egg Biryani", 220.0, "Fragrant biryani rice served with boiled eggs.", false, "https://images.unsplash.com/photo-1642821373181-696a54913e93?w=500&auto=format&fit=crop&q=60"),
                    new MenuItem("Mirchi Ka Salan", 150.0, "Tangy and spicy chilli curry.", true, "https://images.unsplash.com/photo-1601050690597-df0568f70950?w=500&auto=format&fit=crop&q=60"),
                    new MenuItem("Prawn Biryani", 480.0, "Flavorful biryani cooked with marinated prawns.", false, "https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?w=500&auto=format&fit=crop&q=60"),
                    new MenuItem("Andhra Chicken Fry", 290.0, "Spicy dry chicken roast.", false, "https://images.unsplash.com/photo-1626082927389-6cd097cdc6ec?w=500&auto=format&fit=crop&q=60")
                ));

            // Restaurant 2: South Delight
            createRestaurant(owner, "South Delight", 
                "https://images.unsplash.com/photo-1589301760014-d929f3979dbc?w=500&auto=format&fit=crop&q=60",
                4.2, 25, "South Indian", "₹20", "40% OFF", Arrays.asList(
                    new MenuItem("Masala Dosa", 120.0, "Crispy crepe made from rice and lentil batter, filled with spiced potato.", true, "https://images.unsplash.com/photo-1589301760014-d929f3979dbc?w=500&auto=format&fit=crop&q=60"),
                    new MenuItem("Idli Sambar", 80.0, "Steamed rice cakes served with lentil soup.", true, "https://images.unsplash.com/photo-1589301760014-d929f3979dbc?w=500&auto=format&fit=crop&q=60"),
                    new MenuItem("Uttapam", 140.0, "Thick pancake with toppings cooked right into the batter.", true, "https://images.unsplash.com/photo-1589301760014-d929f3979dbc?w=500&auto=format&fit=crop&q=60"),
                    new MenuItem("Rava Dosa", 130.0, "Crispy semolina crepe.", true, "https://images.unsplash.com/photo-1589301760014-d929f3979dbc?w=500&auto=format&fit=crop&q=60"),
                    new MenuItem("Medu Vada", 90.0, "Fried lentil donuts served with chutney.", true, "https://images.unsplash.com/photo-1589301760014-d929f3979dbc?w=500&auto=format&fit=crop&q=60"),
                    new MenuItem("Mysore Masala Dosa", 150.0, "Spicy version of masala dosa with red chutney.", true, "https://images.unsplash.com/photo-1589301760014-d929f3979dbc?w=500&auto=format&fit=crop&q=60"),
                    new MenuItem("Pesarattu", 110.0, "Green gram dosa served with ginger chutney.", true, "https://images.unsplash.com/photo-1589301760014-d929f3979dbc?w=500&auto=format&fit=crop&q=60"),
                    new MenuItem("Rava Idli", 95.0, "Semolina steamed cakes.", true, "https://images.unsplash.com/photo-1589301760014-d929f3979dbc?w=500&auto=format&fit=crop&q=60")
                ));

            // Restaurant 3: Punjabi Zaika
            createRestaurant(owner, "Punjabi Zaika", 
                "https://images.unsplash.com/photo-1626777552726-4a6b54c97e46?w=500&auto=format&fit=crop&q=60",
                4.6, 35, "North Indian", "Free", null, Arrays.asList(
                    new MenuItem("Butter Chicken", 380.0, "Chicken cooked in a mildly spiced curry sauce.", false, "https://images.unsplash.com/photo-1603894584373-5ac82b2ae398?w=500&auto=format&fit=crop&q=60"),
                    new MenuItem("Dal Makhani", 280.0, "Whole black lentils and kidney beans cooked with butter and cream.", true, "https://images.unsplash.com/photo-1546833999-b9f581a1996d?w=500&auto=format&fit=crop&q=60"),
                    new MenuItem("Paneer Tikka", 320.0, "Marinated paneer cheese served in a spiced gravy.", true, "https://images.unsplash.com/photo-1567188040759-fb8a883dc6d8?w=500&auto=format&fit=crop&q=60"),
                    new MenuItem("Naan", 40.0, "Leavened, oven-baked flatbread.", true, "https://images.unsplash.com/photo-1626074353765-517a681e40be?w=500&auto=format&fit=crop&q=60"),
                    new MenuItem("Chole Bhature", 250.0, "Spicy chickpea curry served with deep-fried bread.", true, "https://images.unsplash.com/photo-1626074353765-517a681e40be?w=500&auto=format&fit=crop&q=60"),
                    new MenuItem("Malai Kofta", 300.0, "Fried dumplings in a creamy sauce.", true, "https://images.unsplash.com/photo-1565557623262-b51c2513a641?w=500&auto=format&fit=crop&q=60"),
                    new MenuItem("Aloo Gobi", 200.0, "Potatoes and cauliflower cooked with spices.", true, "https://images.unsplash.com/photo-1601050690597-df0568f70950?w=500&auto=format&fit=crop&q=60"),
                    new MenuItem("Rajma Chawal", 220.0, "Kidney bean curry served with steamed rice.", true, "https://images.unsplash.com/photo-1546833999-b9f581a1996d?w=500&auto=format&fit=crop&q=60"),
                    new MenuItem("Sarson Da Saag", 260.0, "Mustard greens curry with maize flour bread.", true, "https://images.unsplash.com/photo-1626074353765-517a681e40be?w=500&auto=format&fit=crop&q=60")
                ));

            // Restaurant 4: Pizza Corner
            createRestaurant(owner, "Pizza Corner", 
                "https://images.unsplash.com/photo-1604382354936-07c5d9983bd3?w=500&auto=format&fit=crop&q=60",
                4.3, 28, "Italian, Pizza", "₹15", "Buy 1 Get 1", Arrays.asList(
                    new MenuItem("Margherita Pizza", 250.0, "Classic tomato and mozzarella cheese pizza.", true, "https://images.unsplash.com/photo-1574071318508-1cdbab80d002?w=500&auto=format&fit=crop&q=60"),
                    new MenuItem("Pepperoni Pizza", 350.0, "Pizza topped with pepperoni slices.", false, "https://images.unsplash.com/photo-1628840042765-356cda07504e?w=500&auto=format&fit=crop&q=60"),
                    new MenuItem("Veggie Supreme", 300.0, "Loaded with bell peppers, onions, olives, and corn.", true, "https://images.unsplash.com/photo-1571407970349-bc81e7e96d47?w=500&auto=format&fit=crop&q=60"),
                    new MenuItem("Chicken BBQ Pizza", 380.0, "Grilled chicken with BBQ sauce topping.", false, "https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=500&auto=format&fit=crop&q=60"),
                    new MenuItem("Garlic Bread", 120.0, "Toasted bread with garlic butter.", true, "https://images.unsplash.com/photo-1573140247632-f84660f67126?w=500&auto=format&fit=crop&q=60"),
                    new MenuItem("Mushroom Pizza", 280.0, "Topped with fresh mushrooms and herbs.", true, "https://images.unsplash.com/photo-1513104890138-7c749659a591?w=500&auto=format&fit=crop&q=60"),
                    new MenuItem("Cheese Burst Pizza", 420.0, "Overloaded with extra cheese in the crust and top.", true, "https://images.unsplash.com/photo-1574071318508-1cdbab80d002?w=500&auto=format&fit=crop&q=60")
                ));

            // Restaurant 5: Burger Junction
            createRestaurant(owner, "Burger Junction", 
                "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=500&auto=format&fit=crop&q=60",
                4.1, 22, "Fast Food, Burgers", "Free", "25% OFF", Arrays.asList(
                    new MenuItem("Classic Cheese Burger", 180.0, "Juicy patty with cheese, lettuce, and tomato.", false, "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=500&auto=format&fit=crop&q=60"),
                    new MenuItem("Veggie Burger", 150.0, "Potato and mixed veg patty with spicy sauce.", true, "https://images.unsplash.com/photo-1550547660-d9450f859349?w=500&auto=format&fit=crop&q=60"),
                    new MenuItem("Chicken Crispy Burger", 220.0, "Crispy fried chicken fillet burger.", false, "https://images.unsplash.com/photo-1615297928064-24977384d0f9?w=500&auto=format&fit=crop&q=60"),
                    new MenuItem("French Fries", 100.0, "Crispy salted fries.", true, "https://images.unsplash.com/photo-1573080496987-a199f8cd4054?w=500&auto=format&fit=crop&q=60"),
                    new MenuItem("Aloo Tikki Burger", 120.0, "Spiced potato patty burger.", true, "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=500&auto=format&fit=crop&q=60"),
                    new MenuItem("Onion Rings", 110.0, "Crispy fried onion rings.", true, "https://images.unsplash.com/photo-1639024471283-03518883512d?w=500&auto=format&fit=crop&q=60"),
                    new MenuItem("Paneer Burger", 190.0, "Grilled paneer steak burger.", true, "https://images.unsplash.com/photo-1550547660-d9450f859349?w=500&auto=format&fit=crop&q=60"),
                    new MenuItem("Double Cheese Burger", 250.0, "Two patties with double cheese.", false, "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=500&auto=format&fit=crop&q=60")
                ));

            // Restaurant 6: Tandoori Flames
            createRestaurant(owner, "Tandoori Flames", 
                "https://images.unsplash.com/photo-1610057099443-fde8c4d50f91?w=500&auto=format&fit=crop&q=60",
                4.4, 32, "Grill, Tandoori", "₹25", null, Arrays.asList(
                    new MenuItem("Tandoori Chicken", 400.0, "Chicken marinated in yogurt and spices, roasted in a tandoor.", false, "https://images.unsplash.com/photo-1610057099443-fde8c4d50f91?w=500&auto=format&fit=crop&q=60"),
                    new MenuItem("Paneer Tikka", 320.0, "Grilled marinated paneer cubes.", true, "https://images.unsplash.com/photo-1599487488170-d11ec9c172f0?w=500&auto=format&fit=crop&q=60"),
                    new MenuItem("Seekh Kebab", 350.0, "Minced meat grilled skewers.", false, "https://images.unsplash.com/photo-1606491956689-2ea28c674675?w=500&auto=format&fit=crop&q=60"),
                    new MenuItem("Chicken Tikka", 360.0, "Boneless chicken marinated in spices.", false, "https://images.unsplash.com/photo-1599487488170-d11ec9c172f0?w=500&auto=format&fit=crop&q=60"),
                    new MenuItem("Haryali Kebab", 330.0, "Chicken marinated in green herb paste.", false, "https://images.unsplash.com/photo-1601050690597-df0568f70950?w=500&auto=format&fit=crop&q=60"),
                    new MenuItem("Reshmi Kebab", 380.0, "Silky textured chicken kebabs.", false, "https://images.unsplash.com/photo-1606491956689-2ea28c674675?w=500&auto=format&fit=crop&q=60"),
                    new MenuItem("Fish Tikka", 420.0, "Marinated fish chunks grilled to perfection.", false, "https://images.unsplash.com/photo-1599487488170-d11ec9c172f0?w=500&auto=format&fit=crop&q=60")
                ));

            // Restaurant 7: The Veggie Hub
            createRestaurant(owner, "The Veggie Hub", 
                "https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=500&auto=format&fit=crop&q=60",
                4.0, 28, "Vegetarian, Healthy", "Free", "20% OFF", Arrays.asList(
                    new MenuItem("Greek Salad", 220.0, "Fresh salad with feta cheese and olives.", true, "https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=500&auto=format&fit=crop&q=60"),
                    new MenuItem("Veggie Wrap", 180.0, "Grilled vegetables wrapped in a tortilla.", true, "https://images.unsplash.com/photo-1540713434306-58505cf1b6fc?w=500&auto=format&fit=crop&q=60"),
                    new MenuItem("Quinoa Bowl", 280.0, "Healthy quinoa bowl with avocado and chickpeas.", true, "https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=500&auto=format&fit=crop&q=60"),
                    new MenuItem("Caesar Salad", 230.0, "Green salad with croutons and parmesan.", true, "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=500&auto=format&fit=crop&q=60"),
                    new MenuItem("Vegetable Soup", 150.0, "Hot and healthy mixed vegetable soup.", true, "https://images.unsplash.com/photo-1547592166-23acbe3a624b?w=500&auto=format&fit=crop&q=60"),
                    new MenuItem("Corn Salad", 160.0, "Sweet corn tossed with veggies and lemon.", true, "https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=500&auto=format&fit=crop&q=60"),
                    new MenuItem("Hummus Pita", 210.0, "Creamy hummus served with pita bread.", true, "https://images.unsplash.com/photo-1540713434306-58505cf1b6fc?w=500&auto=format&fit=crop&q=60")
                ));

            // Restaurant 8: Chinese Dragon
            createRestaurant(owner, "Chinese Dragon", 
                "https://images.unsplash.com/photo-1585032226651-759b368d7246?w=500&auto=format&fit=crop&q=60",
                4.3, 30, "Chinese, Asian", "₹20", null, Arrays.asList(
                    new MenuItem("Hakka Noodles", 200.0, "Stir-fried noodles with vegetables.", true, "https://images.unsplash.com/photo-1585032226651-759b368d7246?w=500&auto=format&fit=crop&q=60"),
                    new MenuItem("Manchurian", 220.0, "Fried veg balls in spicy sauce.", true, "https://images.unsplash.com/photo-1525755662778-989d0524087e?w=500&auto=format&fit=crop&q=60"),
                    new MenuItem("Spring Rolls", 180.0, "Crispy rolls filled with veggies.", true, "https://images.unsplash.com/photo-1534422298391-e4f8c172dddb?w=500&auto=format&fit=crop&q=60"),
                    new MenuItem("Fried Rice", 210.0, "Rice stir-fried with vegetables.", true, "https://images.unsplash.com/photo-1603133872878-684f208fb74b?w=500&auto=format&fit=crop&q=60"),
                    new MenuItem("Chilli Paneer", 240.0, "Paneer cubes tossed in spicy chilli sauce.", true, "https://images.unsplash.com/photo-1565557623262-b51c2513a641?w=500&auto=format&fit=crop&q=60"),
                    new MenuItem("Schezwan Noodles", 220.0, "Spicy noodles tossed in schezwan sauce.", true, "https://images.unsplash.com/photo-1585032226651-759b368d7246?w=500&auto=format&fit=crop&q=60"),
                    new MenuItem("Dim Sums", 190.0, "Steamed dumplings served with dip.", true, "https://images.unsplash.com/photo-1525755662778-989d0524087e?w=500&auto=format&fit=crop&q=60")
                ));

            // Restaurant 9: Dessert Paradise
            createRestaurant(owner, "Dessert Paradise", 
                "https://images.unsplash.com/photo-1563729784474-d77dbb933a9e?w=500&auto=format&fit=crop&q=60",
                4.7, 20, "Desserts, Ice Cream", "Free", "30% OFF", Arrays.asList(
                    new MenuItem("Chocolate Cake", 150.0, "Rich chocolate layer cake.", true, "https://images.unsplash.com/photo-1578985545062-69928b1d9587?w=500&auto=format&fit=crop&q=60"),
                    new MenuItem("Strawberry Ice Cream", 100.0, "Fresh strawberry ice cream.", true, "https://images.unsplash.com/photo-1497034825429-c343d7c6a68f?w=500&auto=format&fit=crop&q=60"),
                    new MenuItem("Donuts", 120.0, "Assorted donuts.", true, "https://images.unsplash.com/photo-1551024601-bec78aea704b?w=500&auto=format&fit=crop&q=60"),
                    new MenuItem("Brownie", 130.0, "Fudgy chocolate brownie.", true, "https://images.unsplash.com/photo-1606313564200-e75d5e30476c?w=500&auto=format&fit=crop&q=60"),
                    new MenuItem("Mango Shake", 110.0, "Thick and creamy mango milkshake.", true, "https://images.unsplash.com/photo-1579954115545-a95591f289c1?w=500&auto=format&fit=crop&q=60"),
                    new MenuItem("Cheese Cake", 200.0, "Classic blueberry cheesecake.", true, "https://images.unsplash.com/photo-1578985545062-69928b1d9587?w=500&auto=format&fit=crop&q=60"),
                    new MenuItem("Gulab Jamun", 90.0, "Sweet fried dough balls soaked in syrup.", true, "https://images.unsplash.com/photo-1606313564200-e75d5e30476c?w=500&auto=format&fit=crop&q=60")
                ));

            // Restaurant 10: Street Food Corner
            createRestaurant(owner, "Street Food Corner", 
                "https://images.unsplash.com/photo-1601050690597-df0568f70950?w=500&auto=format&fit=crop&q=60",
                4.2, 25, "Street Food, Snacks", "₹15", null, Arrays.asList(
                    new MenuItem("Pani Puri", 60.0, "Crispy hollow balls filled with spicy water.", true, "https://images.unsplash.com/photo-1601050690597-df0568f70950?w=500&auto=format&fit=crop&q=60"),
                    new MenuItem("Samosa", 40.0, "Deep-fried pastry with spiced potato filling.", true, "https://images.unsplash.com/photo-1601050690597-df0568f70950?w=500&auto=format&fit=crop&q=60"),
                    new MenuItem("Vada Pav", 50.0, "Spicy potato fritter in a bun.", true, "https://images.unsplash.com/photo-1601050690597-df0568f70950?w=500&auto=format&fit=crop&q=60"),
                    new MenuItem("Bhel Puri", 70.0, "Puffed rice tossed with chutneys and veggies.", true, "https://images.unsplash.com/photo-1601050690597-df0568f70950?w=500&auto=format&fit=crop&q=60"),
                    new MenuItem("Sev Puri", 80.0, "Crispy papdis topped with potatoes and chutneys.", true, "https://images.unsplash.com/photo-1601050690597-df0568f70950?w=500&auto=format&fit=crop&q=60"),
                    new MenuItem("Dahi Puri", 90.0, "Puri filled with yogurt and chutneys.", true, "https://images.unsplash.com/photo-1601050690597-df0568f70950?w=500&auto=format&fit=crop&q=60"),
                    new MenuItem("Pav Bhaji", 150.0, "Spicy vegetable mash served with buttered buns.", true, "https://images.unsplash.com/photo-1601050690597-df0568f70950?w=500&auto=format&fit=crop&q=60")
                ));

            // Restaurant 11: Healthy Bites
            createRestaurant(owner, "Healthy Bites", 
                "https://images.unsplash.com/photo-1490645935967-10de6ba17061?w=500&auto=format&fit=crop&q=60",
                4.1, 35, "Healthy, Salads", "Free", null, Arrays.asList(
                    new MenuItem("Avocado Salad", 280.0, "Green salad with avocado slices.", true, "https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=500&auto=format&fit=crop&q=60"),
                    new MenuItem("Fruit Bowl", 200.0, "Mixed seasonal fruits.", true, "https://images.unsplash.com/photo-1519996529931-28324d5a630e?w=500&auto=format&fit=crop&q=60"),
                    new MenuItem("Smoothie Bowl", 250.0, "Berry smoothie with granola.", true, "https://images.unsplash.com/photo-1490645935967-10de6ba17061?w=500&auto=format&fit=crop&q=60"),
                    new MenuItem("Green Juice", 180.0, "Fresh kale and spinach juice.", true, "https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=500&auto=format&fit=crop&q=60"),
                    new MenuItem("Oats Meal", 160.0, "Warm oatmeal with fruits and nuts.", true, "https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=500&auto=format&fit=crop&q=60"),
                    new MenuItem("Detox Juice", 170.0, "Beetroot and carrot mix juice.", true, "https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=500&auto=format&fit=crop&q=60"),
                    new MenuItem("Protein Salad", 290.0, "Chickpea and paneer salad.", true, "https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=500&auto=format&fit=crop&q=60")
                ));

            // Restaurant 12: Midnight Cravings
            createRestaurant(owner, "Midnight Cravings", 
                "https://images.unsplash.com/photo-1528735602780-2552fd46c7af?w=500&auto=format&fit=crop&q=60",
                3.9, 40, "Late Night, Snacks", "₹30", null, Arrays.asList(
                    new MenuItem("Cheese Nachos", 180.0, "Crispy nachos with cheese sauce.", true, "https://images.unsplash.com/photo-1513456852971-30c0b8199d4d?w=500&auto=format&fit=crop&q=60"),
                    new MenuItem("Maggi", 60.0, "Spicy instant noodles.", true, "https://images.unsplash.com/photo-1612929633738-8fe44f7ec841?w=500&auto=format&fit=crop&q=60"),
                    new MenuItem("Club Sandwich", 150.0, "Multi-layer sandwich.", false, "https://images.unsplash.com/photo-1528735602780-2552fd46c7af?w=500&auto=format&fit=crop&q=60"),
                    new MenuItem("Pasta", 200.0, "White sauce pasta.", true, "https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=500&auto=format&fit=crop&q=60"),
                    new MenuItem("Garlic Toast", 100.0, "Buttery garlic toast.", true, "https://images.unsplash.com/photo-1573140247632-f84660f67126?w=500&auto=format&fit=crop&q=60"),
                    new MenuItem("Chicken Wings", 250.0, "Spicy buffalo wings.", false, "https://images.unsplash.com/photo-1612929633738-8fe44f7ec841?w=500&auto=format&fit=crop&q=60"),
                    new MenuItem("Hot Chocolate", 140.0, "Warm chocolate drink with marshmallows.", true, "https://images.unsplash.com/photo-1576435728678-68d0fbf94e91?w=500&auto=format&fit=crop&q=60")
                ));
        }
    }

    private void createRestaurant(User owner, String name, String image, Double rating, Integer deliveryTime, String category, String deliveryFee, String discount, List<MenuItem> items) {
        Restaurant restaurant = new Restaurant(name, image, rating, deliveryTime, category, deliveryFee, discount);
        restaurant.setOwner(owner);
        restaurantRepository.save(restaurant);

        for (MenuItem item : items) {
            item.setRestaurant(restaurant);
            menuItemRepository.save(item);
        }
    }
}

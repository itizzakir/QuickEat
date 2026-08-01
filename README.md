# Food-Delivery-App

 	QuickEats – Project Documentation
The Vision: More Than Just an App
Welcome to QuickEats – a platform created with a simple but powerful idea: bringing people closer through food.
QuickEats isn’t just “another food delivery app.” It’s a digital bridge between restaurants, customers, and delivery partners built to be fast, intuitive, and community-focused.
Think of it as a local version of Uber Eats or DoorDash, but with more transparency, flexibility, and control for everyone involved.
Here’s who we built this for:
 Restaurant Owners: A digital storefront to showcase their food, manage orders, and grow their business.

Customers: A quick, easy way to discover nearby favorites and get food delivered with zero hassle.
Delivery Partners: A simple tool to earn on their own terms, with clear tasks and fair tracking.
Administrators: A control center to keep the whole ecosystem healthy, safe, and running smoothly.

The Experience in Action (Screens + Flow)
Let’s walk through the app journey as if you were using it:
First Impressions
Homepage – clean, modern, and welcoming. Right away, users can search for restaurants nearby.

Sign-In – simple and fast, because nobody wants to fight with forms when they’re hungry.
Role-Based Sign-Up – one smart form, tailored depending on whether you’re a customer, restaurant, or delivery partner.
 
The Customer Journey
Shopping Cart – add, remove, adjust quantities, see the total—clear and simple.
Checkout & Payment – multiple payment options, all secure and smooth.
Order Tracking – a live timeline from “Cooking” to “Delivered,” so customers never feel in the dark.

The Restaurant Dashboard
Orders Hub – accept new orders, monitor ongoing ones, and streamline the kitchen workflow.
Menu Management – add/edit dishes, prices, categories, and photos in seconds.

The Delivery Partner’s Hub
Available Orders – see pickup and drop-off locations, accept jobs instantly.
Earnings Dashboard – track completed deliveries and daily/weekly totals with full transparency.


The Admin Console
User Management – view, edit, and manage all platform users.
Restaurant Oversight – approve restaurants, verify info, and keep standards high.
Delivery Partner Management – monitor and manage the delivery fleet.

Designed for Everyone
🔹 Customers → Smooth ordering, multiple payment options, real-time tracking.
 🔹 Restaurants → Full control of menus, orders, and branding.
 🔹 Delivery Partners → Freedom, transparency, and fair earnings.
 🔹 Admins → Total visibility across users, orders, and operations.

The Tech Behind QuickEats
We didn’t just want this to look good—we wanted it to be rock solid too.
Backend (Engine Room):
Spring Boot (Java 17)


PostgreSQL (database)
Spring Data JPA (data handling)
Spring Security + JWT (authentication)
Frontend (The Storefront):
React.js (UI framework)
React Router (navigation)
Context API (state management)
Tailwind CSS (responsive, modern design)

The Blueprint: How It All Fits
Backend → Handles APIs, security, business logic, and database.
Frontend → User-friendly interface with role-specific views.
Separation of Concerns → Clean architecture ensures scalability and easier debugging.

Getting Started: Run It Yourself 
Prerequisites
Java JDK 17+
Node.js & npm
MySQL running locally
Git installed

Step 1: Backend Setup
git clone https://github.com/ankulsingh221/Food-Delivery-App.git
cd Food-Delivery-App/backend
Create a MySQL database (e.g., food_delivery_db).
Update application.properties with your DB URL, username, and password.
Run the backend (FoodDeliveryAppApplication.java).
Default URL → http://localhost:8080

Step 2: Frontend Setup
cd Food-Delivery-App/frontend
npm install
Create .env.local file in /frontend with: 
VITE_API_BASE_URL=http://localhost:8080

Start the frontend:
 npm run dev
Open → http://localhost:5173

That’s it—you’ve got QuickEats running on your machine!


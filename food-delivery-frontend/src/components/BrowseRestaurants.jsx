"use client";

import { useState, useMemo } from "react";
import Carousel from "../components/Carousel";
import CategoryCard from "../components/CategoryCard";
import RestaurantCard from "../components/RestaurantCard";
import { categories } from "../components/mockData";
import { Search, MapPin, ChevronDown, Plus, Loader2 } from "lucide-react";

export default function BrowseRestaurants({
  user,
  allRestaurants,
  searchQuery,
  setSearchQuery,
  handleRestaurantClick,
  addToCart,
  selectedRestaurant,
  setSelectedRestaurant,
  selectedRestaurantMenu,
  isMenuLoading,
}) {
  const [filters, setFilters] = useState({ minRating: 0 });
  const [sortBy, setSortBy] = useState("rating");

  // --- FILTERING & SORTING LOGIC ---
  const filteredAndSortedRestaurants = useMemo(() => {
    return allRestaurants
      .filter(
        (r) =>
          (r.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            r.category?.toLowerCase().includes(searchQuery.toLowerCase())) &&
          (r.rating || 0) >= filters.minRating
      )
      .sort((a, b) => {
        switch (sortBy) {
          case "rating":
            return (b.rating || 0) - (a.rating || 0);
          case "deliveryTime":
            return (
              (a.estimatedDeliveryTime || 0) - (b.estimatedDeliveryTime || 0)
            );
          default:
            return 0;
        }
      });
  }, [allRestaurants, searchQuery, filters, sortBy]);

  const topRestaurants = useMemo(() => {
    return [...allRestaurants]
      .sort((a, b) => (b.rating || 0) - (a.rating || 0))
      .slice(0, 10);
  }, [allRestaurants]);

  // --- UI STATE & RESPONSIVENESS ---
  const isSmallScreen = typeof window !== "undefined" && window.innerWidth < 640;
  
  const categoryCarouselSettings = {
    visibleCount: isSmallScreen ? 3 : 5,
    slideCount: 2,
  };
  const topRestaurantCarouselSettings = {
    visibleCount: isSmallScreen ? 1 : 3,
    slideCount: 1,
  };

  return (
    <div className="space-y-8">
      <div className="flex items-center bg-white border rounded-xl shadow-sm p-2 gap-2">
        <div className="flex items-center p-2">
          <MapPin className="h-6 w-6 text-primary-500" />
          <div className="ml-2">
            <p className="font-bold">Your Location</p>
          </div>
          <ChevronDown className="h-5 w-5" />
        </div>
        <div className="hidden sm:block h-8 border-l"></div>
        <div className="relative flex-grow">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
          <input
            type="text"
            placeholder="Search restaurants or cuisines..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border-none focus:ring-0"
          />
        </div>
      </div>
      <section>
        <h2 className="text-2xl font-bold mb-6">Categories</h2>
        <Carousel
          items={categories}
          renderItem={(cat) => (
            <CategoryCard
              category={cat}
              onClick={() => setSearchQuery(cat.name)}
            />
          )}
          {...categoryCarouselSettings}
        />
      </section>
      <section>
        <h2 className="text-2xl font-bold mb-6">Top Restaurants</h2>
        <Carousel
          items={topRestaurants}
          renderItem={(resto) => (
            <RestaurantCard
              restaurant={resto}
              onClick={handleRestaurantClick}
              isTopRestaurant
            />
          )}
          {...topRestaurantCarouselSettings}
        />
      </section>

      <section>
        <h2 className="text-2xl font-bold mb-6">All Restaurants</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredAndSortedRestaurants.map((restaurant) => (
            <RestaurantCard
              key={restaurant.id}
              restaurant={restaurant}
              onClick={handleRestaurantClick}
            />
          ))}
        </div>
      </section>

      {selectedRestaurant && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-4xl h-[90vh] flex flex-col">
            <div className="flex justify-between p-6 border-b">
              <h2 className="text-2xl font-bold">
                {selectedRestaurant.name}
              </h2>
              <button onClick={() => setSelectedRestaurant(null)}>
                <Plus className="rotate-45" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-6">
              {isMenuLoading ? (
                <div className="flex justify-center items-center h-full">
                  <Loader2 className="animate-spin h-8 w-8 text-primary-500" />
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {selectedRestaurantMenu.map((item) => (
                    <div
                      key={item.id}
                      className="bg-gray-50 rounded-xl p-4 flex items-center"
                    >
                      <img
                        src={item.image || "/placeholder.svg"}
                        alt={item.name}
                        className="w-16 h-16 object-cover rounded-lg mr-4"
                      />
                      <div className="flex-1">
                        <h3 className="font-semibold">{item.name}</h3>
                        <p className="font-bold">₹{item.price}</p>
                      </div>
                      <button
                        onClick={() => addToCart(item)}
                        className="btn-primary p-2"
                      >
                        <Plus />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
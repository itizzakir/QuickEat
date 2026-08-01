"use client"

import { Star, Clock, Truck, Heart } from "lucide-react"
import { useWishlist } from "../contexts/WishlistContext"

const RestaurantCard = ({ restaurant, onClick, isTopRestaurant = false }) => {
  const { isInWishlist, toggleWishlist } = useWishlist()
  const isWishlisted = isInWishlist(restaurant.id)

  const handleWishlistClick = (e) => {
    e.stopPropagation()
    toggleWishlist(restaurant)
  }

  return (
    <div
      className={`bg-white rounded-xl shadow-sm hover:shadow-lg transition-all duration-300 cursor-pointer overflow-hidden ${
        isTopRestaurant ? "relative" : ""
      }`}
      onClick={() => onClick(restaurant)}
    >
      {restaurant.discount && (
        <div className="absolute top-2 left-2 bg-blue-600 text-white px-2 py-1 rounded text-xs font-semibold z-10">
          {restaurant.discount}
        </div>
      )}

      <button
        onClick={handleWishlistClick}
        className="absolute top-2 right-2 p-2 bg-white/80 backdrop-blur-sm rounded-full shadow-sm hover:bg-white transition-colors z-20 group"
      >
        <Heart
          className={`h-5 w-5 transition-colors ${
            isWishlisted ? "fill-red-500 text-red-500" : "text-gray-600 group-hover:text-red-500"
          }`}
        />
      </button>

      <div className="relative">
        <img src={restaurant.image || "/placeholder.svg"} alt={restaurant.name} className="w-full h-48 object-cover" />
        {restaurant.promoted && (
          <div className="absolute bottom-2 left-2 bg-orange-500 text-white px-2 py-1 rounded text-xs font-semibold">
            PROMOTED
          </div>
        )}
      </div>

      <div className="p-4">
        <div className="flex justify-between items-start mb-2">
          <h3 className="font-bold text-lg text-gray-900 truncate flex-1 mr-2">{restaurant.name}</h3>
          <div className="flex items-center space-x-1 bg-green-500 text-white px-2 py-1 rounded-lg flex-shrink-0">
            <Star className="h-3 w-3 fill-current" />
            <span className="text-xs font-semibold">{restaurant.rating}</span>
          </div>
        </div>

        <p className="text-gray-600 text-sm mb-3 truncate">{restaurant.category}</p>

        <div className="flex items-center justify-between text-sm text-gray-600">
          <div className="flex items-center space-x-1">
            <Clock className="h-4 w-4 text-gray-500" />
            <span>{restaurant.deliveryTime} min</span>
          </div>
          <div className="flex items-center space-x-1">
            <Truck className="h-4 w-4 text-gray-500" />
            <span className={restaurant.deliveryFee === "Free" ? "text-green-600 font-semibold" : ""}>
              {restaurant.deliveryFee}
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}

export default RestaurantCard

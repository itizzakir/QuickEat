import React from 'react';
import { useWishlist } from '../contexts/WishlistContext';
import RestaurantCard from './RestaurantCard';

const Wishlist = ({ onRestaurantClick }) => {
  const { wishlist } = useWishlist();

  if (wishlist.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-gray-500">
        <h2 className="text-2xl font-bold mb-2">Your Wishlist is Empty</h2>
        <p>Start adding your favorite restaurants to find them quickly!</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold mb-6">My Wishlist</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {wishlist.map((restaurant) => (
          <RestaurantCard
            key={restaurant.id}
            restaurant={restaurant}
            onClick={onRestaurantClick}
          />
        ))}
      </div>
    </div>
  );
};

export default Wishlist;

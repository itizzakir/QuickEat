"use client"

import { useState, useEffect } from "react"
import { Search, MapPin, Sparkles } from "lucide-react"

export default function HeroSection() {
  const [isVisible, setIsVisible] = useState(false)
  const [searchAddress, setSearchAddress] = useState("")
  const [isSearching, setIsSearching] = useState(false)

  useEffect(() => {
    setIsVisible(true)
  }, [])

  const handleSearch = async (e) => {
    e.preventDefault()
    if (!searchAddress.trim()) return

    setIsSearching(true)

    // Simulate search API call
    setTimeout(() => {
      // Scroll to restaurants section after search
      const restaurantSection = document.getElementById("restaurants")
      if (restaurantSection) {
        const navHeight = 64 // Height of fixed navbar
        const elementPosition = restaurantSection.offsetTop - navHeight

        window.scrollTo({
          top: elementPosition,
          behavior: "smooth",
        })
      }
      setIsSearching(false)
    }, 1000)
  }

  const handleQuickSearch = (cuisine) => {
    setSearchAddress(`${cuisine} restaurants near me`)
    // Trigger search
    setTimeout(() => {
      const restaurantSection = document.getElementById("restaurants")
      if (restaurantSection) {
        const navHeight = 64
        const elementPosition = restaurantSection.offsetTop - navHeight

        window.scrollTo({
          top: elementPosition,
          behavior: "smooth",
        })
      }
    }, 100)
  }

  return (
    <section id="hero" className="bg-gradient-to-br from-gray-50 via-white to-primary-50 pt-20 pb-16 overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Floating background elements */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-20 left-10 w-72 h-72 bg-primary-200 rounded-full mix-blend-multiply filter blur-xl opacity-30 animate-blob"></div>
          <div className="absolute top-40 right-10 w-72 h-72 bg-yellow-200 rounded-full mix-blend-multiply filter blur-xl opacity-30 animate-blob animation-delay-2000"></div>
          <div className="absolute -bottom-8 left-20 w-72 h-72 bg-pink-200 rounded-full mix-blend-multiply filter blur-xl opacity-30 animate-blob animation-delay-4000"></div>
        </div>

        <div className="relative text-center mb-12">
          {/* Badge */}
          <div
            className={`inline-flex items-center px-4 py-2 bg-white/60 backdrop-blur-sm rounded-full border border-primary-200 mb-6 transform transition-all duration-1000 ${
              isVisible ? "translate-y-0 opacity-100" : "translate-y-10 opacity-0"
            }`}
          >
            <Sparkles className="h-4 w-4 text-primary-500 mr-2" />
            <span className="text-sm font-medium text-gray-700">Free delivery on your first order</span>
          </div>

          {/* Main heading */}
          <h1
            className={`text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold text-black mb-6 leading-tight transform transition-all duration-1000 delay-200 ${
              isVisible ? "translate-y-0 opacity-100" : "translate-y-10 opacity-0"
            }`}
          >
            Order food to your <span className="text-gradient">door</span>
          </h1>

          <p
            className={`text-lg md:text-xl text-gray-600 max-w-2xl mx-auto mb-8 transform transition-all duration-1000 delay-400 ${
              isVisible ? "translate-y-0 opacity-100" : "translate-y-10 opacity-0"
            }`}
          >
            Get your favorite meals delivered fast from restaurants near you
          </p>
        </div>

        {/* Search Section */}
        <div
          className={`max-w-2xl mx-auto transform transition-all duration-1000 delay-600 ${
            isVisible ? "translate-y-0 opacity-100" : "translate-y-10 opacity-0"
          }`}
        >
          <form
            onSubmit={handleSearch}
            className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl border border-gray-200/50 p-6 hover:shadow-2xl transition-all duration-300"
          >
            <div className="flex flex-col md:flex-row gap-4">
              {/* Location Input */}
              <div className="flex-1">
                <div className="relative">
                  <MapPin className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                  <input
                    type="text"
                    value={searchAddress}
                    onChange={(e) => setSearchAddress(e.target.value)}
                    placeholder="Enter delivery address"
                    className="input-field pl-12"
                    required
                  />
                </div>
              </div>

              {/* Search Button */}
              <button
                type="submit"
                disabled={isSearching || !searchAddress.trim()}
                className="btn-primary px-8 py-4 flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSearching ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                    Searching...
                  </>
                ) : (
                  <>
                    <Search className="h-5 w-5 mr-2" />
                    Find food
                  </>
                )}
              </button>
            </div>
          </form>

          {/* Quick Options */}
          <div className="flex flex-wrap gap-3 mt-6 justify-center">
            {["Pizza", "Burgers", "Chinese", "Sushi", "Mexican", "Italian"].map((item, index) => (
              <button
                key={item}
                onClick={() => handleQuickSearch(item)}
                className={`px-6 py-3 bg-white/60 backdrop-blur-sm text-gray-700 rounded-full text-sm font-medium hover:bg-white hover:text-primary-600 transition-all duration-300 border border-gray-200/50 hover:border-primary-200 hover:scale-105 transform hover:shadow-md ${
                  isVisible ? "translate-y-0 opacity-100" : "translate-y-10 opacity-0"
                }`}
                style={{ transitionDelay: `${800 + index * 100}ms` }}
              >
                {item}
              </button>
            ))}
          </div>
        </div>

        {/* Stats section */}
        <div
          className={`grid grid-cols-3 gap-8 max-w-lg mx-auto mt-16 transform transition-all duration-1000 delay-1000 ${
            isVisible ? "translate-y-0 opacity-100" : "translate-y-10 opacity-0"
          }`}
        >
          <div className="text-center group">
            <div className="text-3xl font-bold text-primary-600 group-hover:scale-110 transition-transform duration-300">
              10K+
            </div>
            <div className="text-sm text-gray-600 mt-1">Restaurants</div>
          </div>
          <div className="text-center group">
            <div className="text-3xl font-bold text-primary-600 group-hover:scale-110 transition-transform duration-300">
              500K+
            </div>
            <div className="text-sm text-gray-600 mt-1">Happy Users</div>
          </div>
          <div className="text-center group">
            <div className="text-3xl font-bold text-primary-600 group-hover:scale-110 transition-transform duration-300">
              25min
            </div>
            <div className="text-sm text-gray-600 mt-1">Avg Delivery</div>
          </div>
        </div>
      </div>
    </section>
  )
}

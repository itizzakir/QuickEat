"use client"

import { useState } from "react"
import { ChevronLeft, ChevronRight } from "lucide-react"

const Carousel = ({ items, renderItem, visibleCount = 4, slideCount = 1 }) => {
  const [currentIndex, setCurrentIndex] = useState(0)

  const maxIndex = Math.max(0, items.length - visibleCount)

  const nextSlide = () => {
    setCurrentIndex((prev) => Math.min(prev + slideCount, maxIndex))
  }

  const prevSlide = () => {
    setCurrentIndex((prev) => Math.max(prev - slideCount, 0))
  }

  return (
    <div className="relative">
      <div className="flex items-center justify-between mb-4">
        <div className="flex space-x-2">
          <button
            onClick={prevSlide}
            disabled={currentIndex === 0}
            className="p-2 rounded-full bg-white shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>
          <button
            onClick={nextSlide}
            disabled={currentIndex >= maxIndex}
            className="p-2 rounded-full bg-white shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all"
          >
            <ChevronRight className="h-5 w-5" />
          </button>
        </div>
      </div>

      <div className="overflow-hidden">
        <div
          className="flex transition-transform duration-300 ease-in-out"
          style={{
            transform: `translateX(-${currentIndex * (100 / visibleCount)}%)`,
            width: `${(items.length / visibleCount) * 100}%`,
          }}
        >
          {items.map((item, index) => (
            <div key={index} className="flex-shrink-0 px-2" style={{ width: `${100 / items.length}%` }}>
              {renderItem(item)}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

export default Carousel

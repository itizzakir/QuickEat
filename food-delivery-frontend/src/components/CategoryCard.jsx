"use client"

const CategoryCard = ({ category, onClick }) => {
  return (
    <div
      className="flex flex-col items-center p-4 bg-white rounded-lg shadow-sm hover:shadow-md transition-all cursor-pointer group"
      onClick={() => onClick(category)}
    >
      <div className="w-16 h-16 mb-3 rounded-full overflow-hidden group-hover:scale-110 transition-transform">
        <img src={category.image || "/placeholder.svg"} alt={category.name} className="w-full h-full object-cover" />
      </div>
      <h3 className="text-sm font-semibold text-gray-800 text-center">{category.name}</h3>
      <p className="text-xs text-gray-500 mt-1">{category.count} places</p>
    </div>
  )
}

export default CategoryCard

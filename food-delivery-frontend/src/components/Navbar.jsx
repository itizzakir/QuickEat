"use client"

import { useState, useEffect } from "react"
import { MapPin, Menu, X } from "lucide-react"

export default function Navbar({ onSignInClick, onSignUpClick }) {
  const [isOpen, setIsOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20)
    }
    window.addEventListener("scroll", handleScroll)
    return () => window.removeEventListener("scroll", handleScroll)
  }, [])

  const scrollToSection = (sectionId) => {
    const element = document.getElementById(sectionId)
    if (element) {
      const navHeight = 64
      const elementPosition = element.offsetTop - navHeight
      window.scrollTo({
        top: elementPosition,
        behavior: "smooth",
      })
    }
    setIsOpen(false)
  }

  const navLinks = [
    { name: "Menu", action: () => scrollToSection("restaurants") },
    { name: "About", action: () => scrollToSection("hero") },
    { name: "Cities", action: () => scrollToSection("cities") },
    { name: "Contact", action: () => scrollToSection("footer") },
  ]

  return (
    <nav
      className={`fixed top-0 w-full z-50 transition-all duration-300 ${
        scrolled
          ? "bg-white/80 backdrop-blur-md shadow-lg border-b border-gray-200/50"
          : "bg-white border-b border-gray-200"
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <div className="flex items-center">
            <button
              onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
              className="text-2xl font-bold text-black hover:scale-105 transition-transform duration-300"
            >
              Quick<span className="text-primary-500">Eats</span>
            </button>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden lg:flex items-center space-x-8">
            {navLinks.map((link) => (
              <button
                key={link.name}
                onClick={link.action}
                className="text-gray-700 hover:text-black transition-colors duration-300 font-medium relative group"
              >
                {link.name}
                <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-black group-hover:w-full transition-all duration-300"></span>
              </button>
            ))}

            <button
              onClick={() => scrollToSection("cities")}
              className="flex items-center space-x-2 text-gray-700 hover:text-black transition-colors duration-300"
            >
              <MapPin className="h-4 w-4" />
              <span className="font-medium">Deliver to</span>
            </button>

            <button
              onClick={onSignInClick}
              className="text-gray-700 hover:text-black font-medium transition-colors duration-300"
            >
              Sign in
            </button>

            <button onClick={onSignUpClick} className="btn-primary">
              Sign up
            </button>
          </div>

          {/* Mobile menu button */}
          <div className="lg:hidden">
            <button
              onClick={() => setIsOpen(!isOpen)}
              className="p-2 text-gray-700 hover:text-black transition-colors duration-300"
            >
              {isOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>
        </div>

        {/* Mobile Navigation */}
        <div
          className={`lg:hidden overflow-hidden transition-all duration-300 ease-in-out ${
            isOpen ? "max-h-80 opacity-100" : "max-h-0 opacity-0"
          }`}
        >
          <div className="border-t border-gray-200 py-4 space-y-4">
            {navLinks.map((link) => (
              <button
                key={link.name}
                onClick={link.action}
                className="block w-full text-left px-2 text-gray-700 hover:text-black font-medium transition-colors duration-300"
              >
                {link.name}
              </button>
            ))}

            <button
              onClick={() => scrollToSection("cities")}
              className="flex items-center space-x-2 text-gray-700 hover:text-black transition-colors duration-300 px-2"
            >
              <MapPin className="h-4 w-4" />
              <span className="font-medium">Deliver to</span>
            </button>

            <button
              onClick={() => {
                onSignInClick()
                setIsOpen(false)
              }}
              className="block w-full text-left px-2 text-gray-700 hover:text-black font-medium transition-colors duration-300"
            >
              Sign in
            </button>

            <button
              onClick={() => {
                onSignUpClick()
                setIsOpen(false)
              }}
              className="btn-primary mx-2"
            >
              Sign up
            </button>
          </div>
        </div>
      </div>
    </nav>
  )
}

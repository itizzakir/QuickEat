"use client"

import { useState } from "react"
import Navbar from "../components/Navbar"
import HeroSection from "../components/HeroSection"
import RestaurantSection from "../components/RestaurantSection"
import CitiesSection from "../components/CitiesSection"
import Footer from "../components/Footer"
import AuthModal from "../components/AuthModal"

export default function LandingPage() {
  const [showAuthModal, setShowAuthModal] = useState(false)
  const [authMode, setAuthMode] = useState("signin")

  const handleSignInClick = () => {
    setAuthMode("signin")
    setShowAuthModal(true)
  }

  const handleSignUpClick = () => {
    setAuthMode("signup")
    setShowAuthModal(true)
  }

  const handleSwitchMode = () => {
    setAuthMode(authMode === "signin" ? "signup" : "signin")
  }

  const handleRestaurantClick = (restaurant) => {
    // Save the restaurant ID to local storage to redirect after login
    localStorage.setItem("redirectRestaurantId", restaurant.id)
    handleSignInClick()
  }

  return (
    <div className="min-h-screen">
      <Navbar onSignInClick={handleSignInClick} onSignUpClick={handleSignUpClick} />
      <HeroSection />
      <RestaurantSection onRestaurantClick={handleRestaurantClick} />
      <CitiesSection />
      <Footer />

      <AuthModal
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
        mode={authMode}
        onSwitchMode={handleSwitchMode}
      />
    </div>
  )
}

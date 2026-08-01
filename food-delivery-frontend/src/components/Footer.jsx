"use client"

import { useState, useEffect } from "react"
import { Facebook, Twitter, Instagram, Youtube, Mail, Phone, MapPin, ChefHat, Download } from "lucide-react"

export default function Footer() {
  const [isVisible, setIsVisible] = useState(false)
  const [email, setEmail] = useState("")

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true)
        }
      },
      { threshold: 0.1 },
    )

    const element = document.getElementById("footer")
    if (element) observer.observe(element)

    return () => observer.disconnect()
  }, [])

  const handleNewsletterSubmit = (e) => {
    e.preventDefault()
    console.log("Newsletter subscription:", email)
    setEmail("")
    alert("Thank you for subscribing to our newsletter!")
  }

  return (
    <footer id="footer" className="bg-gradient-to-br from-gray-900 via-black to-gray-900 text-white">
      {/* Newsletter Section */}
      <div className="border-b border-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div
            className={`text-center transform transition-all duration-1000 ${
              isVisible ? "translate-y-0 opacity-100" : "translate-y-10 opacity-0"
            }`}
          >
            <h3 className="text-3xl font-bold mb-4">Stay updated with QuickBite</h3>
            <p className="text-gray-400 mb-8 max-w-2xl mx-auto">
              Get the latest updates on new restaurants, exclusive deals, and special offers delivered straight to your
              inbox.
            </p>

            <form onSubmit={handleNewsletterSubmit} className="max-w-md mx-auto">
              <div className="flex gap-4">
                <div className="flex-1">
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Enter your email"
                    className="w-full px-4 py-3 bg-white/10 backdrop-blur-sm border border-gray-600 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none transition-all duration-300 text-white placeholder-gray-400"
                    required
                  />
                </div>
                <button
                  type="submit"
                  className="bg-gradient-to-r from-primary-500 to-primary-600 text-white px-6 py-3 rounded-xl font-semibold hover:from-primary-600 hover:to-primary-700 transition-all duration-300 hover:scale-105 transform shadow-lg"
                >
                  Subscribe
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>

      {/* Main Footer Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12">
          {/* Company Info */}
          <div
            className={`lg:col-span-1 transform transition-all duration-1000 delay-200 ${
              isVisible ? "translate-y-0 opacity-100" : "translate-y-10 opacity-0"
            }`}
          >
            <div className="flex items-center space-x-3 mb-6">
              <div className="p-2 bg-gradient-to-r from-primary-500 to-primary-600 rounded-xl">
                <ChefHat className="h-8 w-8 text-white" />
              </div>
              <div className="text-2xl font-bold">
                Quick<span className="text-primary-500">Bite</span>
              </div>
            </div>
            <p className="text-gray-400 mb-6 leading-relaxed">
              Your favorite meals delivered fast from restaurants near you. Experience the best food delivery service
              with over 10,000+ restaurants.
            </p>

            {/* App Download Buttons */}
            <div className="space-y-3">
              <button className="flex items-center space-x-3 bg-white/10 backdrop-blur-sm border border-gray-600 rounded-xl px-4 py-3 hover:bg-white/20 transition-all duration-300 hover:scale-105 transform w-full">
                <Download className="h-6 w-6 text-primary-500" />
                <div className="text-left">
                  <div className="text-xs text-gray-400">Download on the</div>
                  <div className="font-semibold">App Store</div>
                </div>
              </button>
              <button className="flex items-center space-x-3 bg-white/10 backdrop-blur-sm border border-gray-600 rounded-xl px-4 py-3 hover:bg-white/20 transition-all duration-300 hover:scale-105 transform w-full">
                <Download className="h-6 w-6 text-primary-500" />
                <div className="text-left">
                  <div className="text-xs text-gray-400">Get it on</div>
                  <div className="font-semibold">Google Play</div>
                </div>
              </button>
            </div>
          </div>

          {/* Quick Links */}
          <div
            className={`transform transition-all duration-1000 delay-300 ${
              isVisible ? "translate-y-0 opacity-100" : "translate-y-10 opacity-0"
            }`}
          >
            <h3 className="font-bold text-xl mb-6 text-primary-500">Company</h3>
            <ul className="space-y-4">
              {["About us", "Careers", "Press", "Blog", "Investor Relations", "Gift Cards"].map((item, index) => (
                <li key={item}>
                  <a
                    href="#"
                    className="text-gray-400 hover:text-white transition-colors duration-300 hover:translate-x-2 transform inline-block"
                    style={{ transitionDelay: `${index * 50}ms` }}
                  >
                    {item}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Support */}
          <div
            className={`transform transition-all duration-1000 delay-400 ${
              isVisible ? "translate-y-0 opacity-100" : "translate-y-10 opacity-0"
            }`}
          >
            <h3 className="font-bold text-xl mb-6 text-primary-500">Support</h3>
            <ul className="space-y-4">
              {["Help Center", "Safety", "Contact us", "Terms of Service", "Privacy Policy", "Accessibility"].map(
                (item, index) => (
                  <li key={item}>
                    <a
                      href="#"
                      className="text-gray-400 hover:text-white transition-colors duration-300 hover:translate-x-2 transform inline-block"
                      style={{ transitionDelay: `${index * 50}ms` }}
                    >
                      {item}
                    </a>
                  </li>
                ),
              )}
            </ul>
          </div>

          {/* Contact Info */}
          <div
            className={`transform transition-all duration-1000 delay-500 ${
              isVisible ? "translate-y-0 opacity-100" : "translate-y-10 opacity-0"
            }`}
          >
            <h3 className="font-bold text-xl mb-6 text-primary-500">Contact</h3>
            <div className="space-y-4">
              <div className="flex items-center space-x-3 text-gray-400">
                <Phone className="h-5 w-5 text-primary-500 flex-shrink-0" />
                <span>+91 12345 67890</span>
              </div>
              <div className="flex items-center space-x-3 text-gray-400">
                <Mail className="h-5 w-5 text-primary-500 flex-shrink-0" />
                <span>support@quickbite.com</span>
              </div>
              <div className="flex items-start space-x-3 text-gray-400">
                <MapPin className="h-5 w-5 text-primary-500 mt-1 flex-shrink-0" />
                <span>56 Dukan Street, Indore, MP 452001</span>
              </div>
            </div>

            {/* Social Media */}
            <div className="mt-8">
              <h4 className="font-semibold mb-4">Follow us</h4>
              <div className="flex space-x-4">
                {[
                  { icon: Facebook, color: "hover:text-blue-500" },
                  { icon: Twitter, color: "hover:text-blue-400" },
                  { icon: Instagram, color: "hover:text-pink-500" },
                  { icon: Youtube, color: "hover:text-red-500" },
                ].map(({ icon: Icon, color }, index) => (
                  <a
                    key={index}
                    href="#"
                    className={`p-3 bg-white/10 backdrop-blur-sm border border-gray-600 rounded-xl text-gray-400 ${color} transition-all duration-300 hover:scale-110 transform hover:bg-white/20`}
                  >
                    <Icon className="h-5 w-5" />
                  </a>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Bar */}
      <div className="border-t border-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div
            className={`flex flex-col sm:flex-row justify-between items-center space-y-4 sm:space-y-0 transform transition-all duration-1000 delay-600 ${
              isVisible ? "translate-y-0 opacity-100" : "translate-y-10 opacity-0"
            }`}
          >
            <div className="text-gray-400 text-sm text-center sm:text-left">
              &copy; 2024 QuickBite. All rights reserved. Made with ❤️ for food lovers.
            </div>
            <div className="flex space-x-6 text-sm text-gray-400">
              <a href="#" className="hover:text-white transition-colors duration-300">
                Terms
              </a>
              <a href="#" className="hover:text-white transition-colors duration-300">
                Privacy
              </a>
              <a href="#" className="hover:text-white transition-colors duration-300">
                Cookies
              </a>
            </div>
          </div>
        </div>
      </div>
    </footer>
  )
}

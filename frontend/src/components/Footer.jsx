import { Mail, Phone, MapPin, Facebook, Twitter, Linkedin } from 'lucide-react'
import { Link } from 'react-router-dom'

function Footer() {
  const currentYear = new Date().getFullYear()

  return (
    <footer className="bg-gradient-to-r from-blue-900 to-blue-800 text-white mt-8 sm:mt-12 lg:mt-16">
      {/* Main Footer Content */}
      <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-6 py-6 sm:py-8 lg:py-12">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 lg:gap-8">
          {/* Company Info */}
          <div className="space-y-3">
            <h3 className="text-base sm:text-lg font-semibold text-white">eSync SMS</h3>
            <p className="text-xs sm:text-sm text-blue-100">
              Comprehensive School Management System designed to streamline educational operations.
            </p>
            <div className="flex gap-3 pt-2">
              <a href="#" className="text-blue-100 hover:text-white transition-colors p-1.5 hover:bg-blue-700 rounded-full">
                <Facebook size={16} className="sm:size-5" />
              </a>
              <a href="#" className="text-blue-100 hover:text-white transition-colors p-1.5 hover:bg-blue-700 rounded-full">
                <Twitter size={16} className="sm:size-5" />
              </a>
              <a href="#" className="text-blue-100 hover:text-white transition-colors p-1.5 hover:bg-blue-700 rounded-full">
                <Linkedin size={16} className="sm:size-5" />
              </a>
            </div>
          </div>

          {/* Quick Links */}
          <div className="space-y-2">
            <h4 className="text-sm sm:text-base font-semibold text-white mb-3">Quick Links</h4>
            <ul className="space-y-2 text-xs sm:text-sm">
              <li>
                <a href="/" className="text-blue-100 hover:text-white transition-colors">
                  Dashboard
                </a>
              </li>
              <li>
                <a href="/students" className="text-blue-100 hover:text-white transition-colors">
                  Students
                </a>
              </li>
              <li>
                <a href="/teachers" className="text-blue-100 hover:text-white transition-colors">
                  Teachers
                </a>
              </li>
              <li>
                <a href="/classrooms" className="text-blue-100 hover:text-white transition-colors">
                  Classrooms
                </a>
              </li>
            </ul>
          </div>

          {/* Features */}
          <div className="space-y-2">
            <h4 className="text-sm sm:text-base font-semibold text-white mb-3">Features</h4>
            <ul className="space-y-2 text-xs sm:text-sm">
              <li>
                <a href="#" className="text-blue-100 hover:text-white transition-colors">
                  Student Management
                </a>
              </li>
              <li>
                <a href="#" className="text-blue-100 hover:text-white transition-colors">
                  Attendance Tracking
                </a>
              </li>
              <li>
                <a href="#" className="text-blue-100 hover:text-white transition-colors">
                  Grade Management
                </a>
              </li>
              <li>
                <a href="#" className="text-blue-100 hover:text-white transition-colors">
                  Fee Management
                </a>
              </li>
            </ul>
          </div>

          {/* Contact Info */}
          <div className="space-y-3">
            <h4 className="text-sm sm:text-base font-semibold text-white mb-3">Contact Us</h4>
            <div className="space-y-2 text-xs sm:text-sm">
              <div className="flex gap-2 items-start">
                <Phone size={16} className="flex-shrink-0 mt-0.5" />
                <a href="tel:+260123456789" className="text-blue-100 hover:text-white transition-colors">
                  +260 1 234 56789
                </a>
              </div>
              <div className="flex gap-2 items-start">
                <Mail size={16} className="flex-shrink-0 mt-0.5" />
                <a href="mailto:support@esync.com" className="text-blue-100 hover:text-white transition-colors break-all">
                  support@esync.com
                </a>
              </div>
              <div className="flex gap-2 items-start">
                <MapPin size={16} className="flex-shrink-0 mt-0.5" />
                <p className="text-blue-100">
                  123 School Street<br />
                  Lusaka, Zambia
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Footer Divider */}
      <div className="border-t border-blue-700"></div>

      {/* Bottom Footer */}
      <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-6 py-4 sm:py-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4 text-xs sm:text-sm text-blue-100">
          <p>
            © {currentYear} eSync School Management System. All rights reserved.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 sm:gap-6">
            <a href="#" className="hover:text-white transition-colors">
              Privacy Policy
            </a>
            <a href="#" className="hover:text-white transition-colors">
              Terms of Service
            </a>
            <a href="#" className="hover:text-white transition-colors">
              Contact Support
            </a>
          </div>
        </div>
      </div>
    </footer>
  )
}

export default Footer

import { useSettings } from '../contexts/SettingsContext'

function Footer() {
  const { schoolSettings, currentAcademicYear } = useSettings()
  const currentYear = new Date().getFullYear()

  return (
    <footer className="bg-white border-t border-gray-200 mt-8 sm:mt-12 lg:mt-16">
      {/* Main Footer Content */}
      <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-6 py-6 sm:py-8 lg:py-12">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 lg:gap-8">
          {/* School Info */}
          <div className="space-y-3">
            <div className="flex items-start gap-3">
              {schoolSettings.schoolLogo ? (
                <img 
                  src={schoolSettings.schoolLogo} 
                  alt={schoolSettings.schoolName} 
                  className="w-12 h-12 object-contain rounded flex-shrink-0"
                />
              ) : (
                <img src="/logo.png" alt="Logo" className="w-12 h-12 object-contain flex-shrink-0" />
              )}
              <div>
                <h3 className="text-base sm:text-lg font-semibold text-text-dark">{schoolSettings.schoolName}</h3>
                <p className="text-xs sm:text-sm text-text-muted mt-1">{schoolSettings.schoolDescription || 'School Management System'}</p>
              </div>
            </div>
          </div>

          {/* Contact Information */}
          <div className="space-y-2">
            <h4 className="text-sm sm:text-base font-semibold text-text-dark mb-3">Contact</h4>
            <div className="space-y-2 text-xs sm:text-sm text-text-muted">
              {schoolSettings.schoolPhone && (
                <p>
                  <span className="font-medium text-text-dark">Phone:</span> {schoolSettings.schoolPhone}
                </p>
              )}
              {schoolSettings.schoolEmail && (
                <p>
                  <span className="font-medium text-text-dark">Email:</span> {schoolSettings.schoolEmail}
                </p>
              )}
              {schoolSettings.schoolAddress && (
                <p>
                  <span className="font-medium text-text-dark">Address:</span> {schoolSettings.schoolAddress}
                </p>
              )}
            </div>
          </div>

          {/* Academic Year Info */}
          <div className="space-y-2">
            <h4 className="text-sm sm:text-base font-semibold text-text-dark mb-3">Current Academic Year</h4>
            {currentAcademicYear ? (
              <div className="text-xs sm:text-sm text-text-muted space-y-1">
                <p className="font-semibold text-primary-blue text-sm sm:text-base">{currentAcademicYear.year}</p>
                <p>
                  {currentAcademicYear.startDate ? new Date(currentAcademicYear.startDate).toLocaleDateString() : ''} - {currentAcademicYear.endDate ? new Date(currentAcademicYear.endDate).toLocaleDateString() : ''}
                </p>
                {currentAcademicYear.terms && currentAcademicYear.terms.length > 0 && (
                  <p>Terms: {currentAcademicYear.terms.length}</p>
                )}
              </div>
            ) : (
              <p className="text-xs sm:text-sm text-text-muted">No academic year set</p>
            )}
          </div>

          {/* System Settings */}
          <div className="space-y-2">
            <h4 className="text-sm sm:text-base font-semibold text-text-dark mb-3">Settings</h4>
            <div className="space-y-1 text-xs sm:text-sm text-text-muted">
              <p>
                <span className="font-medium text-text-dark">Currency:</span> {schoolSettings.currency}
              </p>
              <p>
                <span className="font-medium text-text-dark">Timezone:</span> {schoolSettings.timezone}
              </p>
              <p>
                <span className="font-medium text-text-dark">Language:</span> {schoolSettings.language}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Footer Divider */}
      <div className="border-t border-gray-200"></div>

      {/* Bottom Footer */}
      <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-6 py-4 sm:py-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4 text-xs sm:text-sm text-text-muted">
          <p>
            © {currentYear} {schoolSettings.schoolName}. All rights reserved.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 sm:gap-6">
            <a href="/settings" className="text-primary-blue hover:text-blue-600 transition-colors font-medium">
              Settings
            </a>
            <p>
              eSync School Management System v1.0
            </p>
          </div>
        </div>
      </div>
    </footer>
  )
}

export default Footer

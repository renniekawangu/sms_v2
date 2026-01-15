import { useState, useEffect } from 'react'
import { Settings as SettingsIcon, School, Calendar, DollarSign, Umbrella } from 'lucide-react'
import { settingsApi } from '../services/api'
import { useToast } from '../contexts/ToastContext'

function Settings() {
  const [activeTab, setActiveTab] = useState('school')
  const [loading, setLoading] = useState(false)
  const { showToast } = useToast()

  // School Settings State
  const [schoolSettings, setSchoolSettings] = useState({
    schoolName: '',
    schoolLogo: '',
    schoolDescription: '',
    schoolPhone: '',
    schoolEmail: '',
    schoolAddress: '',
    currency: '',
    timezone: '',
    language: '',
    academicYearFormat: ''
  })

  // Academic Years State
  const [academicYears, setAcademicYears] = useState([])
  const [currentYear, setCurrentYear] = useState(null)

  // Fee Structures State
  const [feeStructures, setFeeStructures] = useState([])

  // Holidays State
  const [holidays, setHolidays] = useState([])

  // Form States for Creating New Items
  const [showNewAcademicYear, setShowNewAcademicYear] = useState(false)
  const [newAcademicYearForm, setNewAcademicYearForm] = useState({
    year: '',
    startDate: '',
    endDate: '',
    isCurrent: false
  })

  const [showNewFeeStructure, setShowNewFeeStructure] = useState(false)
  const [newFeeStructureForm, setNewFeeStructureForm] = useState({
    academicYear: '',
    classLevel: '',
    fees: []
  })

  const [showNewHoliday, setShowNewHoliday] = useState(false)
  const [newHolidayForm, setNewHolidayForm] = useState({
    name: '',
    startDate: '',
    endDate: '',
    type: 'school',
    description: ''
  })

  // Load data based on active tab
  useEffect(() => {
    loadTabData()
  }, [activeTab])

  const loadTabData = async () => {
    setLoading(true)
    try {
      if (activeTab === 'school') {
        const data = await settingsApi.getSchoolSettings()
        setSchoolSettings({
          schoolName: data.schoolName || '',
          schoolLogo: data.schoolLogo || '',
          schoolDescription: data.schoolDescription || '',
          schoolPhone: data.schoolPhone || '',
          schoolEmail: data.schoolEmail || '',
          schoolAddress: data.schoolAddress || '',
          currency: data.currency || '',
          timezone: data.timezone || '',
          language: data.language || '',
          academicYearFormat: data.academicYearFormat || ''
        })
      } else if (activeTab === 'academic') {
        const data = await settingsApi.getAllAcademicYears()
        setAcademicYears(data.academicYears || [])
        setCurrentYear(data.currentYear)
      } else if (activeTab === 'fees') {
        const data = await settingsApi.getAllFeeStructures()
        setFeeStructures(data || [])
      } else if (activeTab === 'holidays') {
        const data = await settingsApi.getAllHolidays()
        setHolidays(data || [])
      }
    } catch (error) {
      showToast(error.message, 'error')
    } finally {
      setLoading(false)
    }
  }

  const handleSchoolSettingsSubmit = async (e) => {
    e.preventDefault()
    try {
      await settingsApi.updateSchoolSettings(schoolSettings)
      showToast('School settings updated successfully', 'success')
    } catch (error) {
      showToast(error.message, 'error')
    }
  }

  const handleCreateAcademicYear = async (yearData) => {
    try {
      await settingsApi.createAcademicYear(yearData)
      showToast('Academic year created successfully', 'success')
      setShowNewAcademicYear(false)
      setNewAcademicYearForm({ year: '', startDate: '', endDate: '', isCurrent: false })
      loadTabData()
    } catch (error) {
      showToast(error.message, 'error')
    }
  }

  const handleSubmitNewAcademicYear = (e) => {
    e.preventDefault()
    if (!newAcademicYearForm.year || !newAcademicYearForm.startDate || !newAcademicYearForm.endDate) {
      showToast('Please fill in all required fields', 'error')
      return
    }
    handleCreateAcademicYear(newAcademicYearForm)
  }

  const handleSetCurrentYear = async (yearId) => {
    try {
      await settingsApi.setCurrentAcademicYear(yearId)
      showToast('Current academic year updated', 'success')
      loadTabData()
    } catch (error) {
      showToast(error.message, 'error')
    }
  }

  const handleCreateFeeStructure = async (feeData) => {
    try {
      await settingsApi.createFeeStructure(feeData)
      showToast('Fee structure created successfully', 'success')
      setShowNewFeeStructure(false)
      setNewFeeStructureForm({ academicYear: '', classLevel: '', fees: [] })
      loadTabData()
    } catch (error) {
      showToast(error.message, 'error')
    }
  }

  const handleSubmitNewFeeStructure = (e) => {
    e.preventDefault()
    if (!newFeeStructureForm.academicYear || !newFeeStructureForm.classLevel) {
      showToast('Please fill in academic year and class level', 'error')
      return
    }
    handleCreateFeeStructure(newFeeStructureForm)
  }

  const handleCreateHoliday = async (holidayData) => {
    try {
      await settingsApi.createHoliday(holidayData)
      showToast('Holiday created successfully', 'success')
      setShowNewHoliday(false)
      setNewHolidayForm({ name: '', startDate: '', endDate: '', type: 'school', description: '' })
      loadTabData()
    } catch (error) {
      showToast(error.message, 'error')
    }
  }

  const handleSubmitNewHoliday = (e) => {
    e.preventDefault()
    if (!newHolidayForm.name || !newHolidayForm.startDate || !newHolidayForm.endDate) {
      showToast('Please fill in all required fields', 'error')
      return
    }
    handleCreateHoliday(newHolidayForm)
  }

  const tabs = [
    { id: 'school', label: 'School Info', icon: School },
    { id: 'academic', label: 'Academic Years', icon: Calendar },
    { id: 'fees', label: 'Fee Structures', icon: DollarSign },
    { id: 'holidays', label: 'Holidays', icon: Umbrella }
  ]

  return (
    <div className="space-y-3 sm:space-y-4 lg:space-y-6 p-3 sm:p-4 lg:p-6">
      <div className="flex items-start gap-3 mb-6">
        <SettingsIcon className="w-6 sm:w-8 h-6 sm:h-8 text-primary-blue flex-shrink-0" />
        <div>
          <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-text-dark">School Settings</h1>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 sm:gap-2 mb-6 overflow-x-auto border-b border-gray-200">
        {tabs.map((tab) => {
          const Icon = tab.icon
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-1 sm:gap-2 px-2 sm:px-4 py-2 sm:py-3 font-medium text-xs sm:text-sm transition-colors whitespace-nowrap ${
                activeTab === tab.id
                  ? 'text-primary-blue border-b-2 border-primary-blue'
                  : 'text-text-muted hover:text-text-dark'
              }`}
            >
              <Icon size={16} className="hidden sm:inline" />
              <span className="text-xs sm:text-sm">{tab.label}</span>
            </button>
          )
        })}
      </div>

      {/* Content */}
      <div className="bg-white rounded-lg shadow-custom p-3 sm:p-4 lg:p-6">
        {loading ? (
          <div className="text-center py-8 text-text-muted">Loading...</div>
        ) : (
          <>
            {/* School Settings Tab */}
            {activeTab === 'school' && (
              <form onSubmit={handleSchoolSettingsSubmit} className="space-y-4 max-w-3xl">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="col-span-1 md:col-span-2">
                    <label className="block text-sm font-medium text-text-dark mb-2">
                      School Name
                    </label>
                    <input
                      type="text"
                      value={schoolSettings.schoolName}
                      onChange={(e) => setSchoolSettings({ ...schoolSettings, schoolName: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-blue focus:border-transparent"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-text-dark mb-2">School Logo URL</label>
                    <input
                      type="url"
                      value={schoolSettings.schoolLogo}
                      onChange={(e) => setSchoolSettings({ ...schoolSettings, schoolLogo: e.target.value })}
                      placeholder="https://..."
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-blue focus:border-transparent"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-text-dark mb-2">Language</label>
                    <input
                      type="text"
                      value={schoolSettings.language}
                      onChange={(e) => setSchoolSettings({ ...schoolSettings, language: e.target.value })}
                      placeholder="en"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-blue focus:border-transparent"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-text-dark mb-2">Currency Symbol</label>
                    <input
                      type="text"
                      value={schoolSettings.currency}
                      onChange={(e) => setSchoolSettings({ ...schoolSettings, currency: e.target.value })}
                      placeholder="K, $, €"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-blue focus:border-transparent"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-text-dark mb-2">Timezone</label>
                    <input
                      type="text"
                      value={schoolSettings.timezone}
                      onChange={(e) => setSchoolSettings({ ...schoolSettings, timezone: e.target.value })}
                      placeholder="Africa/Lusaka"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-blue focus:border-transparent"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-text-dark mb-2">Academic Year Format</label>
                    <input
                      type="text"
                      value={schoolSettings.academicYearFormat}
                      onChange={(e) => setSchoolSettings({ ...schoolSettings, academicYearFormat: e.target.value })}
                      placeholder="yyyy or yyyy-yyyy"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-blue focus:border-transparent"
                    />
                  </div>

                  <div className="col-span-1 md:col-span-2">
                    <label className="block text-sm font-medium text-text-dark mb-2">Description</label>
                    <textarea
                      value={schoolSettings.schoolDescription}
                      onChange={(e) => setSchoolSettings({ ...schoolSettings, schoolDescription: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-blue focus:border-transparent"
                      rows="3"
                    />
                  </div>

                  <div className="col-span-1 md:col-span-2">
                    <label className="block text-sm font-medium text-text-dark mb-2">Address</label>
                    <textarea
                      value={schoolSettings.schoolAddress}
                      onChange={(e) => setSchoolSettings({ ...schoolSettings, schoolAddress: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-blue focus:border-transparent"
                      rows="3"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-text-dark mb-2">Phone</label>
                    <input
                      type="tel"
                      value={schoolSettings.schoolPhone}
                      onChange={(e) => setSchoolSettings({ ...schoolSettings, schoolPhone: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-blue focus:border-transparent"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-text-dark mb-2">Email</label>
                    <input
                      type="email"
                      value={schoolSettings.schoolEmail}
                      onChange={(e) => setSchoolSettings({ ...schoolSettings, schoolEmail: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-blue focus:border-transparent"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  className="px-6 py-2 bg-primary-blue text-white rounded-lg hover:bg-blue-600 transition-colors"
                >
                  Save Settings
                </button>
              </form>
            )}

            {/* Academic Years Tab */}
            {activeTab === 'academic' && (
              <div>
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-xl font-semibold">Academic Years</h3>
                  <button
                    onClick={() => setShowNewAcademicYear(!showNewAcademicYear)}
                    className="px-4 py-2 text-sm bg-primary-blue text-white rounded hover:bg-blue-600"
                  >
                    {showNewAcademicYear ? 'Cancel' : 'Add New Year'}
                  </button>
                </div>

                {showNewAcademicYear && (
                  <form onSubmit={handleSubmitNewAcademicYear} className="mb-6 p-4 border border-blue-200 rounded-lg bg-blue-50">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-text-dark mb-2">
                          Academic Year *
                        </label>
                        <input
                          type="text"
                          value={newAcademicYearForm.year}
                          onChange={(e) => setNewAcademicYearForm({ ...newAcademicYearForm, year: e.target.value })}
                          placeholder="e.g., 2024 or 2024-2025"
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-blue focus:border-transparent"
                          required
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-text-dark mb-2">
                          Start Date *
                        </label>
                        <input
                          type="date"
                          value={newAcademicYearForm.startDate}
                          onChange={(e) => setNewAcademicYearForm({ ...newAcademicYearForm, startDate: e.target.value })}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-blue focus:border-transparent"
                          required
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-text-dark mb-2">
                          End Date *
                        </label>
                        <input
                          type="date"
                          value={newAcademicYearForm.endDate}
                          onChange={(e) => setNewAcademicYearForm({ ...newAcademicYearForm, endDate: e.target.value })}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-blue focus:border-transparent"
                          required
                        />
                      </div>

                      <div className="flex items-center">
                        <input
                          type="checkbox"
                          id="isCurrent"
                          checked={newAcademicYearForm.isCurrent}
                          onChange={(e) => setNewAcademicYearForm({ ...newAcademicYearForm, isCurrent: e.target.checked })}
                          className="h-4 w-4 rounded border-gray-300"
                        />
                        <label htmlFor="isCurrent" className="ml-2 text-sm font-medium text-text-dark">
                          Set as Current Year
                        </label>
                      </div>
                    </div>

                    <button
                      type="submit"
                      className="mt-4 px-6 py-2 bg-primary-blue text-white rounded-lg hover:bg-blue-600 transition-colors"
                    >
                      Create Academic Year
                    </button>
                  </form>
                )}

                <div className="space-y-2">
                  {academicYears.length === 0 ? (
                    <p className="text-text-muted">No academic years configured</p>
                  ) : (
                    academicYears.map((year) => (
                      <div
                        key={year._id}
                        className="flex items-center justify-between p-4 border border-gray-200 rounded-lg"
                      >
                        <div>
                          <span className="font-medium">{year.year}</span>
                          {year.isCurrent && (
                            <span className="ml-2 px-2 py-1 text-xs bg-green-100 text-green-700 rounded">
                              Current
                            </span>
                          )}
                          <p className="text-sm text-text-muted">
                            {year.startDate ? new Date(year.startDate).toLocaleDateString() : 'Start'} - {year.endDate ? new Date(year.endDate).toLocaleDateString() : 'End'}
                          </p>
                          {year.terms && year.terms.length > 0 && (
                            <p className="text-xs text-text-muted">Terms: {year.terms.length}</p>
                          )}
                        </div>
                        {!year.isCurrent && (
                          <button
                            onClick={() => handleSetCurrentYear(year._id)}
                            className="px-4 py-2 text-sm bg-primary-blue text-white rounded hover:bg-blue-600"
                          >
                            Set as Current
                          </button>
                        )}
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}

            {/* Fee Structures Tab */}
            {activeTab === 'fees' && (
              <div>
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-xl font-semibold">Fee Structures</h3>
                  <button
                    onClick={() => setShowNewFeeStructure(!showNewFeeStructure)}
                    className="px-4 py-2 text-sm bg-primary-blue text-white rounded hover:bg-blue-600"
                  >
                    {showNewFeeStructure ? 'Cancel' : 'Add New Structure'}
                  </button>
                </div>

                {showNewFeeStructure && (
                  <form onSubmit={handleSubmitNewFeeStructure} className="mb-6 p-4 border border-blue-200 rounded-lg bg-blue-50">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-text-dark mb-2">
                          Academic Year *
                        </label>
                        <select
                          value={newFeeStructureForm.academicYear}
                          onChange={(e) => setNewFeeStructureForm({ ...newFeeStructureForm, academicYear: e.target.value })}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-blue focus:border-transparent"
                          required
                        >
                          <option value="">Select Academic Year</option>
                          {academicYears.map((year) => (
                            <option key={year._id} value={year.year}>{year.year}</option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-text-dark mb-2">
                          Class Level *
                        </label>
                        <input
                          type="text"
                          value={newFeeStructureForm.classLevel}
                          onChange={(e) => setNewFeeStructureForm({ ...newFeeStructureForm, classLevel: e.target.value })}
                          placeholder="e.g., Grade 1, Form 1"
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-blue focus:border-transparent"
                          required
                        />
                      </div>
                    </div>

                    <button
                      type="submit"
                      className="mt-4 px-6 py-2 bg-primary-blue text-white rounded-lg hover:bg-blue-600 transition-colors"
                    >
                      Create Fee Structure
                    </button>
                  </form>
                )}

                <div className="space-y-2">
                  {feeStructures.length === 0 ? (
                    <p className="text-text-muted">No fee structures configured</p>
                  ) : (
                    feeStructures.map((fee) => (
                      <div
                        key={fee._id}
                        className="p-4 border border-gray-200 rounded-lg"
                      >
                        <div className="flex justify-between items-start">
                          <div>
                            <span className="font-medium">{fee.classLevel}</span>
                            <p className="text-sm text-text-muted">Academic Year: {fee.academicYear}</p>
                          </div>
                          <span className="text-sm text-text-muted">Payment terms: {fee.paymentTerms?.acceptsPartialPayment ? 'Partial allowed' : 'Full'}</span>
                        </div>

                        {fee.fees && fee.fees.length > 0 ? (
                          <div className="mt-3 space-y-2">
                            {fee.fees.map((item) => (
                              <div key={item._id || item.name} className="flex justify-between text-sm border border-gray-100 rounded px-3 py-2">
                                <div>
                                  <p className="font-medium">{item.name}</p>
                                  {item.description && (
                                    <p className="text-text-muted">{item.description}</p>
                                  )}
                                  {item.dueDate && (
                                    <p className="text-xs text-text-muted">Due: {item.dueDate}</p>
                                  )}
                                </div>
                                <div className="text-right">
                                  <p className="font-semibold text-primary-blue">{item.amount}</p>
                                  {item.optional && (
                                    <p className="text-xs text-text-muted">Optional</p>
                                  )}
                                </div>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <p className="text-sm text-text-muted mt-2">No fees defined</p>
                        )}
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}

            {/* Holidays Tab */}
            {activeTab === 'holidays' && (
              <div>
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-xl font-semibold">School Holidays</h3>
                  <button
                    onClick={() => setShowNewHoliday(!showNewHoliday)}
                    className="px-4 py-2 text-sm bg-primary-blue text-white rounded hover:bg-blue-600"
                  >
                    {showNewHoliday ? 'Cancel' : 'Add Holiday'}
                  </button>
                </div>

                {showNewHoliday && (
                  <form onSubmit={handleSubmitNewHoliday} className="mb-6 p-4 border border-blue-200 rounded-lg bg-blue-50">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="md:col-span-2">
                        <label className="block text-sm font-medium text-text-dark mb-2">
                          Holiday Name *
                        </label>
                        <input
                          type="text"
                          value={newHolidayForm.name}
                          onChange={(e) => setNewHolidayForm({ ...newHolidayForm, name: e.target.value })}
                          placeholder="e.g., Christmas Break"
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-blue focus:border-transparent"
                          required
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-text-dark mb-2">
                          Start Date *
                        </label>
                        <input
                          type="date"
                          value={newHolidayForm.startDate}
                          onChange={(e) => setNewHolidayForm({ ...newHolidayForm, startDate: e.target.value })}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-blue focus:border-transparent"
                          required
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-text-dark mb-2">
                          End Date *
                        </label>
                        <input
                          type="date"
                          value={newHolidayForm.endDate}
                          onChange={(e) => setNewHolidayForm({ ...newHolidayForm, endDate: e.target.value })}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-blue focus:border-transparent"
                          required
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-text-dark mb-2">
                          Holiday Type
                        </label>
                        <select
                          value={newHolidayForm.type}
                          onChange={(e) => setNewHolidayForm({ ...newHolidayForm, type: e.target.value })}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-blue focus:border-transparent"
                        >
                          <option value="school">School Holiday</option>
                          <option value="public">Public Holiday</option>
                          <option value="exam">Exam Break</option>
                        </select>
                      </div>

                      <div className="md:col-span-2">
                        <label className="block text-sm font-medium text-text-dark mb-2">
                          Description
                        </label>
                        <textarea
                          value={newHolidayForm.description}
                          onChange={(e) => setNewHolidayForm({ ...newHolidayForm, description: e.target.value })}
                          placeholder="Optional description"
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-blue focus:border-transparent"
                          rows="2"
                        />
                      </div>
                    </div>

                    <button
                      type="submit"
                      className="mt-4 px-6 py-2 bg-primary-blue text-white rounded-lg hover:bg-blue-600 transition-colors"
                    >
                      Create Holiday
                    </button>
                  </form>
                )}

                <div className="space-y-2">
                  {holidays.length === 0 ? (
                    <p className="text-text-muted">No holidays configured</p>
                  ) : (
                    holidays.map((holiday) => (
                      <div
                        key={holiday._id}
                        className="flex items-center justify-between p-4 border border-gray-200 rounded-lg"
                      >
                        <div>
                          <span className="font-medium">{holiday.name}</span>
                          <p className="text-sm text-text-muted">
                            {holiday.startDate ? new Date(holiday.startDate).toLocaleDateString() : ''}
                            {holiday.endDate ? ` - ${new Date(holiday.endDate).toLocaleDateString()}` : ''}
                          </p>
                          {holiday.type && (
                            <p className="text-xs text-text-muted">Type: {holiday.type}</p>
                          )}
                          {holiday.affectsAttendance !== undefined && (
                            <p className="text-xs text-text-muted">Affects attendance: {holiday.affectsAttendance ? 'Yes' : 'No'}</p>
                          )}
                          {holiday.description && (
                            <p className="text-xs text-text-muted">{holiday.description}</p>
                          )}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}

export default Settings

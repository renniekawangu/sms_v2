/**
 * School Settings Model
 * Stores school configuration, academic years, fees, and holidays
 */

const mongoose = require('mongoose');

// School Settings Schema
const schoolSettingsSchema = new mongoose.Schema({
  schoolName: { type: String, default: 'Capri School' },
  schoolLogo: { type: String, default: null }, // File path or URL
  schoolDescription: { type: String, default: '' },
  schoolPhone: { type: String, default: '' },
  schoolEmail: { type: String, default: '' },
  schoolAddress: { type: String, default: '' },
  currency: { type: String, default: 'K' }, // Currency symbol
  timezone: { type: String, default: 'Africa/Lusaka' },
  language: { type: String, default: 'en' },
  academicYearFormat: { type: String, default: 'yyyy' }, // e.g., "2024", "2023-2024"
  updatedAt: { type: Date, default: Date.now }
});

// Academic Year Schema
const academicYearSchema = new mongoose.Schema({
  year: { type: String, required: true, unique: true }, // e.g., "2024", "2024-2025"
  startDate: { type: Date, required: true },
  endDate: { type: Date, required: true },
  isCurrent: { type: Boolean, default: false },
  terms: [
    {
      name: { type: String, required: true }, // Term 1, Term 2, etc.
      startDate: { type: Date, required: true },
      endDate: { type: Date, required: true },
      isActive: { type: Boolean, default: false }
    }
  ],
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

// Fee Structure Schema
const feeStructureSchema = new mongoose.Schema({
  academicYear: { type: String, required: true }, // Reference to academic year
  classLevel: { type: String, required: true }, // e.g., Grade 1, Form 1
  fees: [
    {
      name: { type: String, required: true }, // e.g., "Tuition", "Registration"
      amount: { type: Number, required: true },
      dueDate: { type: String }, // "2024-01-30"
      optional: { type: Boolean, default: false },
      description: { type: String }
    }
  ],
  paymentTerms: {
    acceptsPartialPayment: { type: Boolean, default: false },
    paymentDeadline: { type: String }, // "2024-12-31"
    latePaymentPenalty: { type: Number, default: 0 }, // Percentage
    discountForEarlyPayment: { type: Number, default: 0 } // Percentage
  },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

// Holiday Schema
const holidaySchema = new mongoose.Schema({
  name: { type: String, required: true }, // e.g., "Christmas Break"
  startDate: { type: Date, required: true },
  endDate: { type: Date, required: true },
  description: { type: String },
  type: { type: String, enum: ['school', 'public', 'exam'], default: 'school' },
  affectsAttendance: { type: Boolean, default: true },
  academicYear: { type: String }, // Optional: if specific to a year
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

// Create models
const SchoolSettings = mongoose.model('SchoolSettings', schoolSettingsSchema);
const AcademicYear = mongoose.model('AcademicYear', academicYearSchema);
const FeeStructure = mongoose.model('FeeStructure', feeStructureSchema);
const Holiday = mongoose.model('Holiday', holidaySchema);

// Helper functions
// Cache for school settings and academic year (5-minute TTL)
let cachedSettings = null;
let cachedAcademicYear = null;
let settingsCacheTime = 0;
let academicYearCacheTime = 0;
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

async function getSchoolSettings() {
  try {
    // Return cached settings if fresh
    if (cachedSettings && (Date.now() - settingsCacheTime) < CACHE_TTL) {
      return cachedSettings;
    }
    
    let settings = await SchoolSettings.findOne().maxTimeMS(3000); // 3-second timeout
    if (!settings) {
      settings = await SchoolSettings.create({});
    }
    
    // Update cache
    cachedSettings = settings;
    settingsCacheTime = Date.now();
    
    return settings;
  } catch (err) {
    // On error, return cached data if available, otherwise return default
    if (cachedSettings) {
      return cachedSettings;
    }
    return {
      schoolName: 'Capri School',
      schoolDescription: '',
      currency: 'K',
      timezone: 'Africa/Lusaka'
    };
  }
}

async function updateSchoolSettings(data) {
  let settings = await SchoolSettings.findOne();
  if (!settings) {
    settings = await SchoolSettings.create(data);
  } else {
    Object.assign(settings, data);
    await settings.save();
  }
  
  // Invalidate cache
  cachedSettings = settings;
  settingsCacheTime = Date.now();
  
  return settings;
}

async function getCurrentAcademicYear() {
  try {
    // Return cached academic year if fresh
    if (cachedAcademicYear && (Date.now() - academicYearCacheTime) < CACHE_TTL) {
      return cachedAcademicYear;
    }
    
    const year = await AcademicYear.findOne({ isCurrent: true }).maxTimeMS(3000); // 3-second timeout
    
    // Update cache
    cachedAcademicYear = year;
    academicYearCacheTime = Date.now();
    
    return year;
  } catch (err) {
    // On error, return cached data or null
    return cachedAcademicYear || null;
  }
}

async function getAllAcademicYears() {
  return await AcademicYear.find().sort({ year: -1 });
}

async function createAcademicYear(yearData) {
  const year = new AcademicYear(yearData);
  return await year.save();
}

async function updateAcademicYear(id, updates) {
  return await AcademicYear.findByIdAndUpdate(id, updates, { new: true });
}

async function getFeeStructure(academicYear, classLevel) {
  return await FeeStructure.findOne({ academicYear, classLevel });
}

async function getAllFeeStructures(academicYear) {
  return await FeeStructure.find({ academicYear });
}

async function createFeeStructure(feeData) {
  const fee = new FeeStructure(feeData);
  return await fee.save();
}

async function updateFeeStructure(id, updates) {
  return await FeeStructure.findByIdAndUpdate(id, updates, { new: true });
}

async function deleteFeeStructure(id) {
  return await FeeStructure.findByIdAndDelete(id);
}

async function getHolidaysByYear(academicYear) {
  return await Holiday.find({ academicYear }).sort({ startDate: 1 });
}

async function getAllHolidays() {
  return await Holiday.find().sort({ startDate: 1 });
}

async function createHoliday(holidayData) {
  const holiday = new Holiday(holidayData);
  return await holiday.save();
}

async function updateHoliday(id, updates) {
  return await Holiday.findByIdAndUpdate(id, updates, { new: true });
}

async function deleteHoliday(id) {
  return await Holiday.findByIdAndDelete(id);
}

module.exports = {
  SchoolSettings,
  AcademicYear,
  FeeStructure,
  Holiday,
  getSchoolSettings,
  updateSchoolSettings,
  getCurrentAcademicYear,
  getAllAcademicYears,
  createAcademicYear,
  updateAcademicYear,
  getFeeStructure,
  getAllFeeStructures,
  createFeeStructure,
  updateFeeStructure,
  deleteFeeStructure,
  getHolidaysByYear,
  getAllHolidays,
  createHoliday,
  updateHoliday,
  deleteHoliday
};

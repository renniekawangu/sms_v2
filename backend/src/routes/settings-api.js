/**
 * School Settings API Routes for Frontend SPA
 * Provides JSON API endpoints for school configuration
 */
const express = require('express');
const { asyncHandler } = require('../middleware/errorHandler');
const { requireAuth, requireRole } = require('../middleware/rbac');
const { ROLES } = require('../config/rbac');
const {
  getSchoolSettings,
  updateSchoolSettings,
  AcademicYear,
  getCurrentAcademicYear,
  getAllAcademicYears,
  createAcademicYear,
  updateAcademicYear,
  getAllFeeStructures,
  createFeeStructure,
  updateFeeStructure,
  deleteFeeStructure,
  getAllHolidays,
  createHoliday,
  deleteHoliday
} = require('../models/school-settings');

const router = express.Router();

// ============= School Settings =============
/**
 * GET /api/settings
 * Get school settings (public read for all authenticated users)
 */
router.get('/', requireAuth, asyncHandler(async (req, res) => {
  const settings = await getSchoolSettings();
  res.json(settings);
}));

/**
 * POST /api/settings
 * Update school settings
 */
router.post('/', requireAuth, requireRole(ROLES.ADMIN), asyncHandler(async (req, res) => {
  const {
    schoolName,
    schoolLogo,
    schoolDescription,
    schoolPhone,
    schoolEmail,
    schoolAddress,
    currency,
    timezone,
    language,
    academicYearFormat
  } = req.body;

  const settings = await updateSchoolSettings({
    schoolName,
    schoolLogo,
    schoolDescription,
    schoolPhone,
    schoolEmail,
    schoolAddress,
    currency,
    timezone,
    language,
    academicYearFormat
  });

  res.json({ message: 'Settings updated', settings });
}));

// ============= Academic Years =============
/**
 * GET /api/settings/academic-years
 * Get all academic years (readable by all authenticated users)
 */
router.get('/academic-years', requireAuth, asyncHandler(async (req, res) => {
  const years = await getAllAcademicYears();
  const current = await getCurrentAcademicYear();

  res.json({
    academicYears: years,
    currentYear: current
  });
}));

/**
 * POST /api/settings/academic-years
 * Create new academic year
 */
router.post('/academic-years', requireAuth, requireRole(ROLES.ADMIN), asyncHandler(async (req, res) => {
  const { year, startDate, endDate, isCurrent } = req.body;

  if (!year || !startDate || !endDate) {
    return res.status(400).json({ error: 'Year, startDate, and endDate are required' });
  }

  const academicYear = await createAcademicYear({
    year,
    startDate: new Date(startDate),
    endDate: new Date(endDate),
    isCurrent: isCurrent || false
  });

  res.status(201).json({ message: 'Academic year created', academicYear });
}));

/**
 * PUT /api/settings/academic-years/:id
 * Update academic year
 */
router.put('/academic-years/:id', requireAuth, requireRole(ROLES.ADMIN), asyncHandler(async (req, res) => {
  const { year, startDate, endDate } = req.body;

  const academicYear = await updateAcademicYear(req.params.id, {
    year,
    startDate: startDate ? new Date(startDate) : undefined,
    endDate: endDate ? new Date(endDate) : undefined
  });

  if (!academicYear) return res.status(404).json({ error: 'Academic year not found' });

  res.json({ message: 'Academic year updated', academicYear });
}));

/**
 * POST /api/settings/academic-years/:id/set-current
 * Set academic year as current
 */
router.post('/academic-years/:id/set-current', requireAuth, requireRole(ROLES.ADMIN), asyncHandler(async (req, res) => {
  try {
    // Clear current year flag from all
    await AcademicYear.updateMany({}, { isCurrent: false });

    // Set this as current
    const academicYear = await AcademicYear.findByIdAndUpdate(
      req.params.id,
      { isCurrent: true },
      { new: true }
    );

    if (!academicYear) return res.status(404).json({ error: 'Academic year not found' });

    res.json({ message: 'Academic year set as current', academicYear });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}));

/**
 * DELETE /api/settings/academic-years/:id
 * Delete academic year
 */
router.delete('/academic-years/:id', requireAuth, requireRole(ROLES.ADMIN), asyncHandler(async (req, res) => {
  await AcademicYear.findByIdAndDelete(req.params.id);
  res.json({ message: 'Academic year deleted' });
}));

// ============= Fee Structures =============
/**
 * GET /api/settings/fee-structures
 * Get all fee structures (readable by all authenticated users)
 */
router.get('/fee-structures', requireAuth, asyncHandler(async (req, res) => {
  const feeStructures = await getAllFeeStructures();
  res.json(feeStructures);
}));

/**
 * POST /api/settings/fee-structures
 * Create new fee structure
 */
router.post('/fee-structures', requireAuth, requireRole(ROLES.ADMIN), asyncHandler(async (req, res) => {
  const { academicYear, classLevel, items = [] } = req.body;

  if (!academicYear || !classLevel) {
    return res.status(400).json({ error: 'Academic year and class level are required' });
  }

  const feeStructure = await createFeeStructure({
    academicYear,
    classLevel,
    items
  });

  res.status(201).json({ message: 'Fee structure created', feeStructure });
}));

/**
 * PUT /api/settings/fee-structures/:id
 * Update fee structure
 */
router.put('/fee-structures/:id', requireAuth, requireRole(ROLES.ADMIN), asyncHandler(async (req, res) => {
  const { items } = req.body;

  const feeStructure = await updateFeeStructure(req.params.id, { items });
  if (!feeStructure) return res.status(404).json({ error: 'Fee structure not found' });

  res.json({ message: 'Fee structure updated', feeStructure });
}));

/**
 * DELETE /api/settings/fee-structures/:id
 * Delete fee structure
 */
router.delete('/fee-structures/:id', requireAuth, requireRole(ROLES.ADMIN), asyncHandler(async (req, res) => {
  const result = await deleteFeeStructure(req.params.id);
  if (!result) return res.status(404).json({ error: 'Fee structure not found' });

  res.json({ message: 'Fee structure deleted' });
}));

// ============= Holidays =============
/**
 * GET /api/settings/holidays
 * Get all holidays (readable by all authenticated users)
 */
router.get('/holidays', requireAuth, asyncHandler(async (req, res) => {
  const holidays = await getAllHolidays();
  res.json(holidays);
}));

/**
 * POST /api/settings/holidays
 * Create new holiday
 */
router.post('/holidays', requireAuth, requireRole(ROLES.ADMIN), asyncHandler(async (req, res) => {
  const { name, startDate, endDate, type } = req.body;

  if (!name || !startDate || !endDate) {
    return res.status(400).json({ error: 'Name, startDate, and endDate are required' });
  }

  const holiday = await createHoliday({
    name,
    startDate: new Date(startDate),
    endDate: new Date(endDate),
    type
  });

  res.status(201).json({ message: 'Holiday created', holiday });
}));

/**
 * DELETE /api/settings/holidays/:id
 * Delete holiday
 */
router.delete('/holidays/:id', requireAuth, requireRole(ROLES.ADMIN), asyncHandler(async (req, res) => {
  const result = await deleteHoliday(req.params.id);
  if (!result) return res.status(404).json({ error: 'Holiday not found' });

  res.json({ message: 'Holiday deleted' });
}));

module.exports = router;

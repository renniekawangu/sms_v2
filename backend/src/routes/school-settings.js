/**
 * School Settings Routes - Admin Only
 * Handles school configuration, academic years, fees, and holidays
 */

const express = require('express');
const { requireAuth } = require('../middleware/auth');
const {
  AcademicYear,
  getSchoolSettings,
  updateSchoolSettings,
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
const { logAction } = require('../utils/auditLogger');
const { CLASS_LEVELS } = require('../models/student');

const router = express.Router();

// Require admin role
router.use(requireAuth('admin'));

/**
 * GET /admin/settings
 * Admin settings dashboard
 */
router.get('/settings', async (req, res) => {
  try {
    const schoolSettings = await getSchoolSettings();
    const academicYears = await getAllAcademicYears();
    const currentYear = academicYears.find(y => y.isCurrent);

    res.render('admin/settings', {
      schoolSettings,
      academicYears,
      currentYear,
      classLevels: CLASS_LEVELS,
      admin: req.session.user
    });
  } catch (err) {
    console.error('Settings Load Error:', err);
    res.status(500).send('Server error');
  }
});

/**
 * POST /admin/settings/school
 * Update school settings
 */
router.post('/settings/school', async (req, res) => {
  try {
    const { schoolName, schoolEmail, schoolPhone, schoolAddress, currency, timezone } = req.body;

    await updateSchoolSettings({
      schoolName,
      schoolEmail,
      schoolPhone,
      schoolAddress,
      currency,
      timezone
    });

    await logAction({
      action: 'school-settings:update',
      actor: req.session.user,
      targetType: 'settings',
      details: { schoolName }
    });

    req.session.successMessage = 'School settings updated successfully';
    res.redirect('/admin/settings#school');
  } catch (err) {
    console.error(err);
    req.session.errorMessage = err.message || 'Failed to update school settings';
    res.redirect('/admin/settings#school');
  }
});

/**
 * GET /admin/settings/academic-years
 * View all academic years
 */
router.get('/settings/academic-years', async (req, res) => {
  try {
    const academicYears = await getAllAcademicYears();
    
    res.render('admin/settings-academic-years', {
      academicYears,
      admin: req.session.user
    });
  } catch (err) {
    console.error(err);
    res.status(500).send('Server error');
  }
});

/**
 * POST /admin/settings/academic-years
 * Create new academic year
 */
router.post('/settings/academic-years', async (req, res) => {
  try {
    const { year, startDate, endDate, termCount } = req.body;

    // Create terms
    const terms = [];
    const start = new Date(startDate);
    const end = new Date(endDate);
    const daysPerTerm = Math.floor((end - start) / (1000 * 60 * 60 * 24 * parseInt(termCount)));

    for (let i = 1; i <= parseInt(termCount); i++) {
      const termStart = new Date(start.getTime() + daysPerTerm * (i - 1) * 24 * 60 * 60 * 1000);
      const termEnd = new Date(start.getTime() + daysPerTerm * i * 24 * 60 * 60 * 1000);

      terms.push({
        name: `Term ${i}`,
        startDate: termStart,
        endDate: termEnd
      });
    }

    await createAcademicYear({
      year,
      startDate,
      endDate,
      terms,
      isCurrent: false
    });

    await logAction({
      action: 'academic-year:create',
      actor: req.session.user,
      targetType: 'academic-year',
      details: { year }
    });

    req.session.successMessage = `Academic year ${year} created successfully`;
    res.redirect('/admin/settings/academic-years');
  } catch (err) {
    console.error(err);
    if (err.code === 11000) {
      req.session.errorMessage = 'Year already exists. Choose a different year label.';
      return res.redirect('/admin/settings/academic-years');
    }
    req.session.errorMessage = err.message || 'Failed to create academic year';
    res.redirect('/admin/settings/academic-years');
  }
});

/**
 * POST /admin/settings/academic-years/:id/update
 * Edit an existing academic year
 */
router.post('/settings/academic-years/:id/update', async (req, res) => {
  try {
    const { year, startDate, endDate, termCount } = req.body;

    const terms = [];
    const start = new Date(startDate);
    const end = new Date(endDate);
    const count = Math.max(parseInt(termCount, 10) || 1, 1);
    const msDay = 24 * 60 * 60 * 1000;
    const totalDays = Math.max(Math.floor((end - start) / msDay), count);
    const daysPerTerm = Math.floor(totalDays / count);

    for (let i = 1; i <= count; i++) {
      const termStart = new Date(start.getTime() + daysPerTerm * (i - 1) * msDay);
      const termEnd = i === count
        ? end
        : new Date(start.getTime() + daysPerTerm * i * msDay);

      terms.push({
        name: `Term ${i}`,
        startDate: termStart,
        endDate: termEnd
      });
    }

    await updateAcademicYear(req.params.id, {
      year,
      startDate,
      endDate,
      terms
    });

    await logAction({
      action: 'academic-year:update',
      actor: req.session.user,
      targetType: 'academic-year',
      targetId: req.params.id,
      details: { year }
    });

    req.session.successMessage = `Academic year ${year} updated successfully`;
    res.redirect('/admin/settings/academic-years');
  } catch (err) {
    console.error(err);
    if (err.code === 11000) {
      req.session.errorMessage = 'Year already exists. Choose a different year label.';
      return res.redirect('/admin/settings/academic-years');
    }
    req.session.errorMessage = err.message || 'Failed to update academic year';
    res.redirect('/admin/settings/academic-years');
  }
});

/**
 * POST /admin/settings/academic-years/:id/set-current
 * Set academic year as current
 */
router.post('/settings/academic-years/:id/set-current', async (req, res) => {
  try {
    // Set all to inactive
    await AcademicYear.updateMany({}, { isCurrent: false });

    // Set this one as current
    await updateAcademicYear(req.params.id, { isCurrent: true });

    await logAction({
      action: 'academic-year:set-current',
      actor: req.session.user,
      targetType: 'academic-year',
      targetId: req.params.id
    });

    req.session.successMessage = 'Current academic year updated';
    res.redirect('/admin/settings/academic-years');
  } catch (err) {
    console.error(err);
    req.session.errorMessage = err.message || 'Failed to set current academic year';
    res.redirect('/admin/settings/academic-years');
  }
});

/**
 * GET /admin/settings/fees
 * View and manage fee structures
 */
router.get('/settings/fees', async (req, res) => {
  try {
    const academicYears = await getAllAcademicYears();
    const selectedYear = req.query.year || (academicYears.find(y => y.isCurrent)?.year || '');
    const feeStructures = selectedYear ? await getAllFeeStructures(selectedYear) : [];

    res.render('admin/settings-fees', {
      feeStructures,
      academicYears,
      selectedYear,
      classLevels: CLASS_LEVELS,
      admin: req.session.user
    });
  } catch (err) {
    console.error(err);
    res.status(500).send('Server error');
  }
});

/**
 * POST /admin/settings/fees
 * Create/Update fee structure
 */
router.post('/settings/fees', async (req, res) => {
  try {
    const { academicYear, classLevel, acceptsPartialPayment, paymentDeadline, latePaymentPenalty, discountForEarlyPayment } = req.body;

    // Parse fees arrays
    const feeNames = Array.isArray(req.body.feeNames) ? req.body.feeNames : [req.body.feeNames];
    const feeAmounts = Array.isArray(req.body.feeAmounts) ? req.body.feeAmounts : [req.body.feeAmounts];
    const feeDueDates = Array.isArray(req.body.feeDueDates) ? req.body.feeDueDates : [req.body.feeDueDates];
    const feeOptionals = Array.isArray(req.body.feeOptionals) ? req.body.feeOptionals : [req.body.feeOptionals];

    // Build fees array
    const fees = feeNames
      .filter(name => name && name.trim()) // Filter out empty names
      .map((name, i) => ({
        name: name.trim(),
        amount: parseFloat(feeAmounts[i]) || 0,
        dueDate: feeDueDates[i] || null,
        optional: feeOptionals[i] === 'true'
      }));

    const feeData = {
      academicYear,
      classLevel,
      fees,
      paymentTerms: {
        acceptsPartialPayment: acceptsPartialPayment === 'on',
        paymentDeadline: paymentDeadline || null,
        latePaymentPenalty: parseFloat(latePaymentPenalty) || 0,
        discountForEarlyPayment: parseFloat(discountForEarlyPayment) || 0
      }
    };

    // Upsert: if structure exists for AY+Class, update; else create
    const existing = await require('../models/school-settings').getFeeStructure(academicYear, classLevel);
    if (existing) {
      await updateFeeStructure(existing._id, feeData);
    } else {
      await createFeeStructure(feeData);
    }

    await logAction({
      action: 'fee-structure:create',
      actor: req.session.user,
      targetType: 'fee-structure',
      details: { academicYear, classLevel }
    });

    req.session.successMessage = `Fee structure for ${classLevel} saved successfully`;
    res.redirect(`/admin/settings/fees?year=${academicYear}`);
  } catch (err) {
    console.error(err);
    req.session.errorMessage = err.message || 'Failed to create fee structure';
    const y = req.body && req.body.academicYear ? req.body.academicYear : '';
    res.redirect(`/admin/settings/fees?year=${encodeURIComponent(y)}`);
  }
});

/**
 * POST /admin/settings/fees/:id/update
 * Update an existing fee structure (fees + payment terms)
 */
router.post('/settings/fees/:id/update', async (req, res) => {
  try {
    const { academicYear, classLevel, acceptsPartialPayment, paymentDeadline, latePaymentPenalty, discountForEarlyPayment } = req.body;

    // Parse fees arrays
    const feeNames = Array.isArray(req.body.feeNames) ? req.body.feeNames : [req.body.feeNames];
    const feeAmounts = Array.isArray(req.body.feeAmounts) ? req.body.feeAmounts : [req.body.feeAmounts];
    const feeDueDates = Array.isArray(req.body.feeDueDates) ? req.body.feeDueDates : [req.body.feeDueDates];
    const feeOptionals = Array.isArray(req.body.feeOptionals) ? req.body.feeOptionals : [req.body.feeOptionals];

    const fees = feeNames
      .filter(name => name && name.trim())
      .map((name, i) => ({
        name: name.trim(),
        amount: parseFloat(feeAmounts[i]) || 0,
        dueDate: feeDueDates[i] || null,
        optional: feeOptionals[i] === 'true'
      }));

    const updates = {
      academicYear,
      classLevel,
      fees,
      paymentTerms: {
        acceptsPartialPayment: acceptsPartialPayment === 'on',
        paymentDeadline: paymentDeadline || null,
        latePaymentPenalty: parseFloat(latePaymentPenalty) || 0,
        discountForEarlyPayment: parseFloat(discountForEarlyPayment) || 0
      }
    };

    await updateFeeStructure(req.params.id, updates);
    req.session.successMessage = `Fee structure for ${classLevel} updated`;
    res.redirect(`/admin/settings/fees?year=${encodeURIComponent(academicYear)}`);
  } catch (err) {
    console.error('Update Fee Structure Error:', err);
    req.session.errorMessage = err.message || 'Failed to update fee structure';
    const y = req.body && req.body.academicYear ? req.body.academicYear : '';
    res.redirect(`/admin/settings/fees?year=${encodeURIComponent(y)}`);
  }
});

/**
 * POST /admin/settings/fees/:id/delete
 * Delete a fee structure
 */
router.post('/settings/fees/:id/delete', async (req, res) => {
  try {
    const { academicYear } = req.body;
    const fs = await deleteFeeStructure(req.params.id);
    req.session.successMessage = `Fee structure for ${fs?.classLevel || ''} deleted`;
    res.redirect(`/admin/settings/fees?year=${encodeURIComponent(academicYear || '')}`);
  } catch (err) {
    console.error('Delete Fee Structure Error:', err);
    req.session.errorMessage = err.message || 'Failed to delete fee structure';
    res.redirect('/admin/settings/fees');
  }
});

/**
 * GET /admin/settings/holidays
 * View and manage holidays
 */
router.get('/settings/holidays', async (req, res) => {
  try {
    const academicYears = await getAllAcademicYears();
    const selectedYear = req.query.year || '';
    const holidays = selectedYear ? await getAllHolidays() : [];

    res.render('admin/settings-holidays', {
      holidays,
      academicYears,
      selectedYear,
      admin: req.session.user
    });
  } catch (err) {
    console.error(err);
    res.status(500).send('Server error');
  }
});

/**
 * POST /admin/settings/holidays
 * Create holiday
 */
router.post('/settings/holidays', async (req, res) => {
  try {
    const { name, startDate, endDate, type, description, academicYear } = req.body;

    await createHoliday({
      name,
      startDate,
      endDate,
      type,
      description,
      academicYear,
      affectsAttendance: true
    });

    await logAction({
      action: 'holiday:create',
      actor: req.session.user,
      targetType: 'holiday',
      details: { name }
    });

    req.session.successMessage = `Holiday "${name}" created successfully`;
    res.redirect(`/admin/settings/holidays?year=${academicYear}`);
  } catch (err) {
    console.error(err);
    req.session.errorMessage = err.message || 'Failed to create holiday';
    const y = req.body && req.body.academicYear ? req.body.academicYear : '';
    res.redirect(`/admin/settings/holidays?year=${encodeURIComponent(y)}`);
  }
});

/**
 * POST /admin/settings/holidays/:id/delete
 * Delete holiday
 */
router.post('/settings/holidays/:id/delete', async (req, res) => {
  try {
    const holiday = await deleteHoliday(req.params.id);

    await logAction({
      action: 'holiday:delete',
      actor: req.session.user,
      targetType: 'holiday',
      targetId: req.params.id,
      details: { name: holiday?.name }
    });

    req.session.successMessage = 'Holiday deleted successfully';
    res.redirect('/admin/settings/holidays');
  } catch (err) {
    console.error(err);
    req.session.errorMessage = err.message || 'Failed to delete holiday';
    res.redirect('/admin/settings/holidays');
  }
});

module.exports = router;

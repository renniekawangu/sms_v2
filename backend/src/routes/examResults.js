const express = require('express')
const router = express.Router()
const ExamResult = require('../models/examResult')
const { Exam } = require('../models/exam')
const { Student } = require('../models/student')
const { Subject } = require('../models/subjects')
const { Classroom } = require('../models/classroom')
const { requireAuth, requireRole } = require('../middleware/rbac')

// Debug: Get all exam results (no filtering)
router.get(
  '/results/debug/all',
  requireAuth,
  async (req, res) => {
    try {
      const allResults = await ExamResult.find({})
        .populate('exam', 'name')
        .populate('student', 'name')
        .populate('classroom', 'grade section')
        .lean()
        .limit(50)

      console.log(`Total results in DB: ${allResults.length}`)
      allResults.forEach((r, i) => {
        console.log(`[${i}] Student: ${r.student?.name}, Exam: ${r.exam?.name}, Year: ${r.academicYear}, Term: ${r.term}`)
      })

      res.json({
        success: true,
        total: allResults.length,
        results: allResults
      })
    } catch (err) {
      res.status(500).json({ error: err.message })
    }
  }
)

// Get all exam results (with filtering)
router.get(
  '/results',
  requireAuth,
  requireRole('admin', 'head-teacher', 'teacher'),
  async (req, res) => {
    try {
      const { academicYear, term, examId, studentId, classroomId, status, examType } = req.query
      
      let filter = {}
      if (academicYear) filter.academicYear = academicYear
      if (term) filter.term = term
      if (examId) filter.exam = examId
      if (studentId) filter.student = studentId
      if (classroomId) filter.classroom = classroomId
      if (status) filter.status = status

      // If examType is provided, first find exams with that type, then filter results
      if (examType) {
        const exams = await Exam.find({ examType }).select('_id')
        const examIds = exams.map(e => e._id)
        filter.exam = { $in: examIds }
      }

      console.log('GET /results query:', { academicYear, term, examId, studentId, classroomId, status, examType })
      console.log('Filter object:', filter)

      const results = await ExamResult.find(filter)
        .populate('exam', 'name date totalMarks examType')
        .populate('student', 'firstName lastName email')
        .populate('classroom', 'grade section')
        .populate('subjectResults.subject', 'name code')
        .sort({ createdAt: -1 })
        .limit(100)

      console.log(`Found ${results.length} results with filter:`, filter)
      if (results.length > 0) {
        console.log('First result after populate:', JSON.stringify({
          _id: results[0]._id,
          exam: results[0].exam,
          student: results[0].student,
          classroom: results[0].classroom,
          totalScore: results[0].totalScore
        }, null, 2))
      }

      res.json({
        success: true,
        count: results.length,
        results
      })
    } catch (err) {
      console.error('Error fetching exam results:', err)
      res.status(500).json({ error: 'Failed to fetch exam results' })
    }
  }
)

// Get single exam result
router.get('/results/:id', requireAuth, async (req, res) => {
  try {
    const result = await ExamResult.findById(req.params.id)
      .populate('exam')
      .populate('student', 'firstName lastName email')
      .populate('classroom')
      .populate('subjectResults.subject')
      .populate('submittedBy', 'firstName lastName email')
      .populate('approvedBy', 'firstName lastName email')

    if (!result) {
      return res.status(404).json({ error: 'Result not found' })
    }

    res.json(result)
  } catch (err) {
    console.error('Error fetching exam result:', err)
    res.status(500).json({ error: 'Failed to fetch exam result' })
  }
})

// Get student's results
router.get(
  '/results/student/:studentId',
  requireAuth,
  async (req, res) => {
    try {
      const { academicYear, term } = req.query
      
      let filter = { student: req.params.studentId }
      if (academicYear) filter.academicYear = academicYear
      if (term) filter.term = term

      const results = await ExamResult.find(filter)
        .populate('exam', 'name date')
        .populate('subjectResults.subject', 'name code')
        .sort({ academicYear: -1, term: -1 })

      res.json({
        success: true,
        results
      })
    } catch (err) {
      console.error('Error fetching student results:', err)
      res.status(500).json({ error: 'Failed to fetch results' })
    }
  }
)

// Get classroom results for an exam
router.get(
  '/results/exam/:examId/classroom/:classroomId',
  requireAuth,
  async (req, res) => {
    try {
      const results = await ExamResult.find({
        exam: req.params.examId,
        classroom: req.params.classroomId
      })
        .populate('student', 'name email')
        .populate('subjectResults.subject', 'name')
        .sort({ 'student.name': 1 })

      // Calculate statistics
      const stats = {
        totalStudents: results.length,
        passedCount: results.filter(r => r.overallGrade !== 'F').length,
        failedCount: results.filter(r => r.overallGrade === 'F').length,
        classAverage: results.length > 0 
          ? (results.reduce((sum, r) => sum + r.percentage, 0) / results.length).toFixed(2)
          : 0,
        highestScore: Math.max(...results.map(r => r.totalScore)),
        lowestScore: Math.min(...results.map(r => r.totalScore))
      }

      res.json({
        success: true,
        results,
        statistics: stats
      })
    } catch (err) {
      console.error('Error fetching classroom exam results:', err)
      res.status(500).json({ error: 'Failed to fetch results' })
    }
  }
)

// Create/submit exam result
router.post(
  '/results',
  requireAuth,
  requireRole('admin', 'teacher', 'head-teacher'),
  async (req, res) => {
    try {
      const {
        exam,
        student,
        classroom,
        academicYear,
        term,
        subjectResults,
        totalScore,
        totalMaxMarks
      } = req.body

      // Validate required fields
      if (!exam || !student || !classroom || !subjectResults || !totalScore) {
        return res.status(400).json({ 
          error: 'Missing required fields: exam, student, classroom, subjectResults, totalScore' 
        })
      }

      // Check for duplicate
      let existingResult = await ExamResult.findOne({
        exam,
        student,
        classroom
      })

      if (existingResult) {
        // Update existing
        existingResult.subjectResults = subjectResults
        existingResult.totalScore = totalScore
        existingResult.totalMaxMarks = totalMaxMarks || 100
        existingResult.academicYear = academicYear
        existingResult.term = term
        existingResult.status = 'draft'
        existingResult.updatedAt = new Date()

        await existingResult.save()

        // Populate before returning
        const populatedResult = await ExamResult.findById(existingResult._id)
          .populate('exam', 'name')
          .populate('student', 'firstName lastName')
          .populate('classroom', 'grade section')
          .populate('subjectResults.subject', 'name')

        return res.json({
          success: true,
          message: 'Result updated successfully',
          result: populatedResult
        })
      }

      // Create new result
      const newResult = new ExamResult({
        exam,
        student,
        classroom,
        academicYear,
        term,
        subjectResults,
        totalScore,
        totalMaxMarks: totalMaxMarks || 100,
        status: 'draft'
      })

      await newResult.save()

      const populatedResult = await ExamResult.findById(newResult._id)
        .populate('exam', 'name')
        .populate('student', 'firstName lastName')
        .populate('classroom', 'grade section')
        .populate('subjectResults.subject', 'name')

      res.status(201).json({
        success: true,
        message: 'Result created successfully',
        result: populatedResult
      })
    } catch (err) {
      console.error('Error creating exam result:', err)
      res.status(500).json({ error: err.message || 'Failed to create result' })
    }
  }
)

// Batch submit results
router.post(
  '/results/batch',
  requireAuth,
  requireRole('admin', 'teacher', 'head-teacher'),
  async (req, res) => {
    try {
      const { examId, classroomId, academicYear, term, results } = req.body

      console.log('Batch create request:', { examId, classroomId, academicYear, term, resultsCount: results?.length })

      if (!examId || !classroomId || !results || !Array.isArray(results)) {
        return res.status(400).json({
          error: 'Missing required fields: examId, classroomId, results (array)'
        })
      }

      const createdResults = []
      const updatedResults = []
      const errors = []

      for (let i = 0; i < results.length; i++) {
        try {
          const resultData = results[i]
          
          // Check if result already exists for this student+exam combination
          const existingResult = await ExamResult.findOne({
            student: resultData.studentId,
            exam: examId,
            classroom: classroomId
          })

          console.log(`Checking student ${resultData.studentId}: ${existingResult ? 'EXISTS' : 'NEW'}`)

          if (existingResult) {
            // Update existing result
            existingResult.subjectResults = resultData.subjectResults
            existingResult.totalScore = resultData.totalScore
            existingResult.totalMaxMarks = resultData.totalMaxMarks || 100
            existingResult.academicYear = academicYear || new Date().getFullYear().toString()
            existingResult.term = term || 'term1'
            await existingResult.save()
            updatedResults.push(existingResult)
            console.log(`Updated result for student: ${resultData.studentId}`)
          } else {
            // Create new result
            const newResult = new ExamResult({
              exam: examId,
              student: resultData.studentId,
              classroom: classroomId,
              academicYear: academicYear || new Date().getFullYear().toString(),
              term: term || 'term1',
              subjectResults: resultData.subjectResults,
              totalScore: resultData.totalScore,
              totalMaxMarks: resultData.totalMaxMarks || 100,
              status: 'draft',
              submittedBy: req.user.id
            })

            await newResult.save()
            createdResults.push(newResult)
            console.log(`Created result for student: ${resultData.studentId}`)
          }
        } catch (itemErr) {
          console.error(`Error saving result for student ${results[i].studentId}:`, itemErr.message)
          errors.push({
            index: i,
            studentId: results[i].studentId,
            error: itemErr.message
          })
        }
      }

      const totalProcessed = createdResults.length + updatedResults.length
      console.log(`Batch complete: ${createdResults.length} created, ${updatedResults.length} updated, ${errors.length} errors`)
      
      // Populate all results before returning
      const allResultIds = [...createdResults, ...updatedResults].map(r => r._id)
      console.log('Populating results:', allResultIds)
      
      const populatedResults = await ExamResult.find({
        _id: { $in: allResultIds }
      })
        .populate('exam', 'name date totalMarks')
        .populate('student', 'firstName lastName email')
        .populate('classroom', 'grade section')
        .populate('subjectResults.subject', 'name code')
      
      console.log(`Populated ${populatedResults.length} results`)
      
      res.json({
        success: true,
        message: `${totalProcessed} results processed (${createdResults.length} created, ${updatedResults.length} updated)`,
        createdCount: createdResults.length,
        updatedCount: updatedResults.length,
        errorCount: errors.length,
        results: populatedResults,
        errors: errors.length > 0 ? errors : undefined
      })
    } catch (err) {
      console.error('Error batch creating results:', err)
      res.status(500).json({ error: 'Failed to batch create results', details: err.message })
    }
  }
)

// Update exam result
router.put(
  '/results/:id',
  requireAuth,
  requireRole('admin', 'teacher', 'head-teacher'),
  async (req, res) => {
    try {
      const { subjectResults, totalScore, totalMaxMarks, remarks } = req.body

      const result = await ExamResult.findById(req.params.id)
      if (!result) {
        return res.status(404).json({ error: 'Result not found' })
      }

      if (subjectResults) result.subjectResults = subjectResults
      if (totalScore !== undefined) result.totalScore = totalScore
      if (totalMaxMarks) result.totalMaxMarks = totalMaxMarks
      if (remarks) result.remarks = remarks
      result.updatedAt = new Date()

      await result.save()

      const updatedResult = await ExamResult.findById(result._id)
        .populate('exam', 'name')
        .populate('student', 'name')
        .populate('subjectResults.subject', 'name')

      res.json({
        success: true,
        message: 'Result updated successfully',
        result: updatedResult
      })
    } catch (err) {
      console.error('Error updating exam result:', err)
      res.status(500).json({ error: 'Failed to update result' })
    }
  }
)

// Submit result (change status from draft to submitted)
router.post(
  '/results/:id/submit',
  requireAuth,
  requireRole('admin', 'teacher', 'head-teacher'),
  async (req, res) => {
    try {
      const result = await ExamResult.findById(req.params.id)
      if (!result) {
        return res.status(404).json({ error: 'Result not found' })
      }

      result.status = 'submitted'
      result.submittedBy = req.user.id
      result.submittedAt = new Date()

      await result.save()

      res.json({
        success: true,
        message: 'Result submitted successfully',
        result
      })
    } catch (err) {
      console.error('Error submitting result:', err)
      res.status(500).json({ error: 'Failed to submit result' })
    }
  }
)

// Approve result (admin only)
router.post(
  '/results/:id/approve',
  requireAuth,
  requireRole('admin', 'head-teacher'),
  async (req, res) => {
    try {
      const result = await ExamResult.findById(req.params.id)
      if (!result) {
        return res.status(404).json({ error: 'Result not found' })
      }

      result.status = 'approved'
      result.approvedBy = req.user.id
      result.approvedAt = new Date()

      await result.save()

      res.json({
        success: true,
        message: 'Result approved successfully',
        result
      })
    } catch (err) {
      console.error('Error approving result:', err)
      res.status(500).json({ error: 'Failed to approve result' })
    }
  }
)

// Publish result (make visible to students)
router.post(
  '/results/:id/publish',
  requireAuth,
  requireRole('admin', 'head-teacher'),
  async (req, res) => {
    try {
      const result = await ExamResult.findByIdAndUpdate(
        req.params.id,
        { status: 'published' },
        { new: true }
      )

      if (!result) {
        return res.status(404).json({ error: 'Result not found' })
      }

      res.json({
        success: true,
        message: 'Result published successfully',
        result
      })
    } catch (err) {
      console.error('Error publishing result:', err)
      res.status(500).json({ error: 'Failed to publish result' })
    }
  }
)

// Delete exam result
router.delete(
  '/results/:id',
  requireAuth,
  requireRole('admin', 'teacher'),
  async (req, res) => {
    try {
      const result = await ExamResult.findByIdAndDelete(req.params.id)

      if (!result) {
        return res.status(404).json({ error: 'Result not found' })
      }

      res.json({
        success: true,
        message: 'Result deleted successfully'
      })
    } catch (err) {
      console.error('Error deleting result:', err)
      res.status(500).json({ error: 'Failed to delete result' })
    }
  }
)

// Get exam statistics
router.get(
  '/results/stats/exam/:examId',
  requireAuth,
  async (req, res) => {
    try {
      const { classroomId, term } = req.query

      let filter = { exam: req.params.examId }
      if (classroomId) filter.classroom = classroomId
      if (term) filter.term = term

      const results = await ExamResult.find(filter)

      if (results.length === 0) {
        return res.json({
          success: true,
          statistics: {
            totalResults: 0,
            averageScore: 0,
            highestScore: 0,
            lowestScore: 0,
            gradeDistribution: {}
          }
        })
      }

      const scores = results.map(r => r.totalScore)
      const gradeDistribution = {}

      results.forEach(r => {
        gradeDistribution[r.overallGrade] = (gradeDistribution[r.overallGrade] || 0) + 1
      })

      res.json({
        success: true,
        statistics: {
          totalResults: results.length,
          averageScore: (scores.reduce((a, b) => a + b) / scores.length).toFixed(2),
          highestScore: Math.max(...scores),
          lowestScore: Math.min(...scores),
          passCount: results.filter(r => r.overallGrade !== 'F').length,
          failCount: results.filter(r => r.overallGrade === 'F').length,
          gradeDistribution
        }
      })
    } catch (err) {
      console.error('Error fetching exam statistics:', err)
      res.status(500).json({ error: 'Failed to fetch statistics' })
    }
  }
)

module.exports = router

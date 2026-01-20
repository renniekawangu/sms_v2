const Joi = require('joi');

const roles = ['admin', 'student', 'teacher', 'head-teacher', 'accounts'];

const classLevelValues = [
  'Baby Class',
  'Nursery',
  'PP1',
  'PP2',
  'Grade 1',
  'Grade 2',
  'Grade 3',
  'Grade 4',
  'Grade 5',
  'Grade 6',
  'Grade 7'
];

const studentCreateSchema = Joi.object({
  firstName: Joi.string().trim().min(2).required(),
  lastName: Joi.string().trim().min(2).required(),
  password: Joi.string().min(6).required(),
  dateOfBirth: Joi.date().required(),
  address: Joi.string().min(3).required(),
  phone: Joi.string().min(5).required(),
  classLevel: Joi.string().valid(...classLevelValues).optional(),
  stream: Joi.string().allow('', null).optional()
});

const studentUpdateSchema = Joi.object({
  firstName: Joi.string().trim().min(2).required(),
  lastName: Joi.string().trim().min(2).required(),
  dateOfBirth: Joi.date().required(),
  address: Joi.string().min(3).required(),
  phone: Joi.string().min(5).required(),
  classLevel: Joi.string().valid(...classLevelValues).optional(),
  stream: Joi.string().allow('', null).optional()
});

const staffCreateSchema = Joi.object({
  firstName: Joi.string().trim().min(2).required(),
  lastName: Joi.string().trim().min(2).required(),
  email: Joi.string().email().required(),
  role: Joi.string().valid('teacher', 'head-teacher', 'accounts').required(),
  password: Joi.string().min(6).required(),
  address: Joi.string().min(3).required(),
  phone: Joi.string().min(5).required()
});

const staffUpdateSchema = Joi.object({
  firstName: Joi.string().trim().min(2).required().messages({
    'string.empty': 'First name is required',
    'string.min': 'First name must be at least 2 characters',
    'any.required': 'First name is required'
  }),
  lastName: Joi.string().trim().min(2).required().messages({
    'string.empty': 'Last name is required',
    'string.min': 'Last name must be at least 2 characters',
    'any.required': 'Last name is required'
  }),
  email: Joi.string().email().required(),
  role: Joi.string().valid('teacher', 'head-teacher', 'accounts').optional(),
  address: Joi.string().min(3).required(),
  phone: Joi.string().min(5).required()
});

const userCreateSchema = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().min(6).required(),
  role: Joi.string().valid(...roles).required(),
  firstName: Joi.string().trim().min(2).required(),
  lastName: Joi.string().trim().min(2).required(),
  address: Joi.string().min(3).required(),
  phone: Joi.string().min(5).required(),
  dateOfBirth: Joi.alternatives().conditional('role', {
    is: 'student',
    then: Joi.date().required(),
    otherwise: Joi.any().optional()
  })
});

const userUpdateSchema = Joi.object({
  email: Joi.string().email().required(),
  role: Joi.string().valid(...roles).required(),
  password: Joi.string().min(6).allow('', null).optional(),
  firstName: Joi.string().trim().min(2).allow('').optional(),
  lastName: Joi.string().trim().min(2).allow('').optional(),
  phone: Joi.string().min(5).allow('').optional(),
  address: Joi.string().min(3).allow('').optional(),
  dateOfBirth: Joi.date().allow('', null).optional(),
  classLevel: Joi.string().valid(...classLevelValues).allow('', null).optional(),
  stream: Joi.string().allow('', null).optional()
});

function validate(schema) {
  return (req, res, next) => {
    const { error, value } = schema.validate(req.body, { abortEarly: false, stripUnknown: true });
    if (error) {
      const errors = error.details.map(d => d.message);
      // Store errors in session flash for SSR routes (if needed)
      req.validationErrors = errors;
      
      // For API routes, return JSON response instead of rendering HTML
      // Check if this is an API request (has /api prefix or Accept: application/json header)
      const isApiRequest = req.path.startsWith('/api') || 
                          req.get('Accept')?.includes('application/json') ||
                          req.get('Content-Type')?.includes('application/json');
      
      if (isApiRequest) {
        return res.status(400).json({
          success: false,
          message: 'Validation Error',
          errors: errors
        });
      }
      
      // For SSR routes, render error page
      return res.status(400).render('error', { 
        title: 'Validation Error',
        message: 'Please correct the following errors:',
        errors: errors 
      });
    }
    req.body = value;
    next();
  };
}

module.exports = {
  validate,
  studentCreateSchema,
  studentUpdateSchema,
  staffCreateSchema,
  staffUpdateSchema,
  userCreateSchema,
  userUpdateSchema
};

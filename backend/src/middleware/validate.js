const roles = ['admin', 'student', 'teacher', 'head-teacher', 'accounts', 'parent'];

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

const isPlainObject = (value) => value && typeof value === 'object' && !Array.isArray(value);

const normalizeString = (value) => (typeof value === 'string' ? value.trim() : value);

const isValidEmail = (value) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);

const parseDate = (value) => {
  if (value === undefined || value === null || value === '') return undefined;
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
};

const validate = (schema) => (req, res, next) => {
  const result = schema(req.body);

  if (result.errors.length > 0) {
    return res.status(400).json({
      success: false,
      message: 'Validation Error',
      errors: result.errors
    });
  }

  req.body = result.value;
  return next();
};

const loginSchema = (payload) => {
  const data = isPlainObject(payload) ? payload : {};
  const email = normalizeString(data.email);
  const password = typeof data.password === 'string' ? data.password : '';
  const errors = [];

  if (!email) {
    errors.push('Email or student ID is required');
  }

  if (!password) {
    errors.push('Password is required');
  }

  return {
    errors,
    value: { email, password }
  };
};

const userCreateSchema = (payload) => {
  const data = isPlainObject(payload) ? payload : {};
  const email = normalizeString(data.email)?.toLowerCase();
  const password = typeof data.password === 'string' ? data.password : '';
  const role = normalizeString(data.role);
  const name = normalizeString(data.name);
  const phone = normalizeString(data.phone);
  const date_of_join = parseDate(data.date_of_join);
  const errors = [];

  if (!email) {
    errors.push('Email is required');
  } else if (!isValidEmail(email)) {
    errors.push('Email must be valid');
  }

  if (!password) {
    errors.push('Password is required');
  } else if (password.length < 6) {
    errors.push('Password must be at least 6 characters long');
  }

  if (!role) {
    errors.push('Role is required');
  } else if (!roles.includes(role)) {
    errors.push(`Role must be one of: ${roles.join(', ')}`);
  }

  if (date_of_join === null) {
    errors.push('date_of_join must be a valid date');
  }

  return {
    errors,
    value: {
      email,
      password,
      role,
      name,
      phone,
      date_of_join
    }
  };
};

const userUpdateSchema = (payload) => {
  const data = isPlainObject(payload) ? payload : {};
  const value = {};
  const errors = [];

  if (Object.prototype.hasOwnProperty.call(data, 'email')) {
    const email = normalizeString(data.email)?.toLowerCase();
    if (!email) {
      errors.push('Email cannot be empty');
    } else if (!isValidEmail(email)) {
      errors.push('Email must be valid');
    } else {
      value.email = email;
    }
  }

  if (Object.prototype.hasOwnProperty.call(data, 'password')) {
    const password = typeof data.password === 'string' ? data.password : '';
    if (!password) {
      errors.push('Password cannot be empty');
    } else if (password.length < 6) {
      errors.push('Password must be at least 6 characters long');
    } else {
      value.password = password;
    }
  }

  if (Object.prototype.hasOwnProperty.call(data, 'role')) {
    const role = normalizeString(data.role);
    if (!role) {
      errors.push('Role cannot be empty');
    } else if (!roles.includes(role)) {
      errors.push(`Role must be one of: ${roles.join(', ')}`);
    } else {
      value.role = role;
    }
  }

  if (Object.prototype.hasOwnProperty.call(data, 'name')) {
    value.name = normalizeString(data.name);
  }

  if (Object.prototype.hasOwnProperty.call(data, 'phone')) {
    value.phone = normalizeString(data.phone);
  }

  if (Object.prototype.hasOwnProperty.call(data, 'date_of_join')) {
    const date_of_join = parseDate(data.date_of_join);
    if (date_of_join === null) {
      errors.push('date_of_join must be a valid date');
    } else {
      value.date_of_join = date_of_join;
    }
  }

  return { errors, value };
};

const studentCreateSchema = (payload) => {
  const data = isPlainObject(payload) ? payload : {};
  const errors = [];
  const value = {
    firstName: normalizeString(data.firstName),
    lastName: normalizeString(data.lastName),
    password: typeof data.password === 'string' ? data.password : '',
    address: normalizeString(data.address),
    phone: normalizeString(data.phone),
    stream: normalizeString(data.stream),
    classLevel: normalizeString(data.classLevel)
  };
  const dateOfBirth = parseDate(data.dateOfBirth);

  if (!value.firstName) errors.push('First name is required');
  if (!value.lastName) errors.push('Last name is required');
  if (!value.password || value.password.length < 6) errors.push('Password must be at least 6 characters long');
  if (!value.address) errors.push('Address is required');
  if (!value.phone) errors.push('Phone is required');
  if (dateOfBirth === null || !dateOfBirth) errors.push('dateOfBirth is required and must be valid');
  if (value.classLevel && !classLevelValues.includes(value.classLevel)) {
    errors.push(`classLevel must be one of: ${classLevelValues.join(', ')}`);
  }

  value.dateOfBirth = dateOfBirth || undefined;
  return { errors, value };
};

const studentUpdateSchema = (payload) => {
  const data = isPlainObject(payload) ? payload : {};
  const errors = [];
  const value = {
    firstName: normalizeString(data.firstName),
    lastName: normalizeString(data.lastName),
    address: normalizeString(data.address),
    phone: normalizeString(data.phone),
    stream: normalizeString(data.stream),
    classLevel: normalizeString(data.classLevel)
  };
  const dateOfBirth = parseDate(data.dateOfBirth);

  if (!value.firstName) errors.push('First name is required');
  if (!value.lastName) errors.push('Last name is required');
  if (!value.address) errors.push('Address is required');
  if (!value.phone) errors.push('Phone is required');
  if (dateOfBirth === null || !dateOfBirth) errors.push('dateOfBirth is required and must be valid');
  if (value.classLevel && !classLevelValues.includes(value.classLevel)) {
    errors.push(`classLevel must be one of: ${classLevelValues.join(', ')}`);
  }

  value.dateOfBirth = dateOfBirth || undefined;
  return { errors, value };
};

const staffCreateSchema = (payload) => {
  const data = isPlainObject(payload) ? payload : {};
  const role = normalizeString(data.role);
  const email = normalizeString(data.email)?.toLowerCase();
  const password = typeof data.password === 'string' ? data.password : '';
  const errors = [];
  const value = {
    firstName: normalizeString(data.firstName),
    lastName: normalizeString(data.lastName),
    email,
    role,
    password,
    address: normalizeString(data.address),
    phone: normalizeString(data.phone)
  };

  if (!value.firstName) errors.push('First name is required');
  if (!value.lastName) errors.push('Last name is required');
  if (!email || !isValidEmail(email)) errors.push('Email must be valid');
  if (!['teacher', 'head-teacher', 'accounts'].includes(role)) errors.push('Role must be teacher, head-teacher, or accounts');
  if (!password || password.length < 6) errors.push('Password must be at least 6 characters long');
  if (!value.address) errors.push('Address is required');
  if (!value.phone) errors.push('Phone is required');

  return { errors, value };
};

const staffUpdateSchema = (payload) => {
  const data = isPlainObject(payload) ? payload : {};
  const role = normalizeString(data.role);
  const email = normalizeString(data.email)?.toLowerCase();
  const errors = [];
  const value = {
    firstName: normalizeString(data.firstName),
    lastName: normalizeString(data.lastName),
    email,
    role,
    address: normalizeString(data.address),
    phone: normalizeString(data.phone)
  };

  if (!value.firstName) errors.push('First name is required');
  if (!value.lastName) errors.push('Last name is required');
  if (!email || !isValidEmail(email)) errors.push('Email must be valid');
  if (role && !['teacher', 'head-teacher', 'accounts'].includes(role)) errors.push('Role must be teacher, head-teacher, or accounts');
  if (!value.address) errors.push('Address is required');
  if (!value.phone) errors.push('Phone is required');

  return { errors, value };
};

module.exports = {
  validate,
  loginSchema,
  userCreateSchema,
  userUpdateSchema,
  studentCreateSchema,
  studentUpdateSchema,
  staffCreateSchema,
  staffUpdateSchema
};

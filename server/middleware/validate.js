const { z } = require('zod');

const monitorSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters').max(100),
  url: z.string().url('Must be a valid URL'),
  interval: z.number().int().min(30).max(3600).optional(),
});

const updateMonitorSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters').max(100).optional(),
  url: z.string().url('Must be a valid URL').optional(),
  interval: z.number().int().min(30).max(3600).optional(),
});

const registerSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters').max(50),
  email: z.string().email('Must be a valid email'),
  password: z.string().min(6, 'Password must be at least 6 characters').max(100),
});

const loginSchema = z.object({
  email: z.string().email('Must be a valid email'),
  password: z.string().min(1, 'Password is required'),
});

function validate(schema) {
  return (req, res, next) => {
    const result = schema.safeParse(req.body);

    if (!result.success) {
      const issues = result.error.issues || result.error.errors || [];
      return res.status(400).json({
        error: 'Validation failed',
        details: issues.map((err) => ({
          field: err.path.join('.'),
          message: err.message,
        })),
      });
    }

    req.body = result.data;
    next();
  };
}

module.exports = { validate, monitorSchema, updateMonitorSchema, registerSchema, loginSchema };
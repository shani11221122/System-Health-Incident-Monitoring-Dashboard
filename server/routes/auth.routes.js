const express = require('express');
const router = express.Router();
const { register, login, getMe } = require('../controller/auth');
const { validate, registerSchema, loginSchema } = require('../middleware/validate');
const { auth } = require('../middleware/auth');

router.post('/register', validate(registerSchema), register);
router.post('/login', validate(loginSchema), login);
router.get('/me', auth, getMe);

module.exports = router;
import express from 'express';

import { getMe, login, logout, signup } from '../controllers/authController.js';
import {protectRoute}  from '../middleware/protectroute.js';

const router=express.Router();

router.get("/me",protectroute,getMe)
router.post("/signup",signup);
router.post("/login",login);
router.post("/logout",logout);
export default router;
import express from 'express';
import { protectRoute } from '../middleware/protectroute.js';
import { getNotifications,deleteNotifications } from '../controllers/notificationController.js';

const router = express.Router();

router.get("/",protectRoute,getNotifications);
router.delete("/",protectRoute,deleteNotifications);

export default router;
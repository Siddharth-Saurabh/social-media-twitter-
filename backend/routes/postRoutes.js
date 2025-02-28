import express from 'express';
import { protectRoute } from '../middleware/protectroute.js';
import { createPost ,deletePost,commentOnPost,likeUnlikePost} from '../controllers/postController.js';

const router=express.Router();

router.post("/create",protectRoute,createPost);
router.post("/like/:id",protectRoute,likeUnlikePost);
router.post("/comment/:id",protectRoute,commentOnPost);
router.delete("/:id",protectRoute,deletePost);

export default router;
import User from "../models/userModel.js";
import Post from "../models/postModel.js";
import { v2 as cloudinary } from 'cloudinary';
import Notification from "../models/notificationModel.js";

export const createPost = async (req, res) => {
    try {
        const { text } = req.body;
        let { img } = req.body;
        const userId = req.user._id.toString();

        const user = await User.findById(userId);
        if (!user) return res.status(404).json({ message: "User not found" });

        if (!text && !img) {
            return res.status(400).json({ error: "Post must have text or image" });
        }

        if (img) {
            const uploadedResponse = await cloudinary.uploader.upload(img);
            img = uploadedResponse.secure_url;
        }

        const newPost = new Post({
            user: userId,
            text,
            img
        });

        await newPost.save();

        res.status(201).json(newPost);
    } catch (error) {
        res.status(500).json({ error: error.message });
        console.log("error in createPost controller", error);
    }
}
export const deletePost = async (req,res) => {
    try{
        const post = await Post.findById(req.params.id);
        if(!post){
            return res.status(404).json({error: "Post not found"});
        }
        if(post.user.toString() !== req.user._id.toString()) {
            return res.status(401).json({error:"you are not authorized to delete this post"});
        }
        if(post.img){
            const imgId = post.img.split('/').slice(-1)[0].split('.')[0];
            await cloudinary.uploader.destroy(imgId);
        }

        await Post.findByIdAndDelete(req.params.id);

        res.status(200).json({message:"post deleted suecessfully"});
    } catch(error){
        console.log("error in deletePost controller", error);
        res.status(500).json({ error: error.message });
    }
}
export const commentOnPost=async(req,res)=>{
    try{
        const {text} = req.body;
        const postId = req.params.id;
        const userId=req.user._id;

        if(!text){
            return res.status(400).json({error:"text field is required"});
        }
        const post = await Post.findById(postId);

        if(!post){
            return res.status(404).json({error:"post not found"});
        }

        const comment ={user:userId,text}
        post.comments.push(comment);
        await post.save();
        
        res.status(200).json(post);

    }catch(error){
     console.log("error in commentonPost controller: ",error);
     res.status(500).json({error:"internal server error"});   
    }
}
export const likeUnlikePost = async (req, res) => {
    try {
        const userId = req.user._id;
        const { id: postId } = req.params;

        const post = await Post.findById(postId);

        if (!post) {
            return res.status(404).json({ error: "Post not found" });
        }

        const userLikedPost = post.likes.includes(userId);

        if (userLikedPost) {
            await Post.updateOne({ _id: postId }, { $pull: { likes: userId } });
            await User.updateOne({_id: userId},{$pull: {likedPosts: postId}});
            return res.status(200).json({ message: "Post unliked successfully" });
        } else {
            post.likes.push(userId);
            await User.updateOne({_id: userId},{$push: {likedPosts: postId}});
            await post.save();

            const notification = new Notification({
                from: userId,
                to: post.user,
                type: "like"
            });

            await notification.save();

            return res.status(200).json({ message: "Post liked successfully" });
        }

    } catch (error) {
        console.log("error in likeUnlikePost controller:", error);
        res.status(500).json({ error: "Internal server error" });
    }
}
export const getAllPosts = async (req, res) => {
    try {
        const posts = await Post.find()
            .sort({ createdAt: -1 })
            .populate({
                path: "user",
                select: "-password"
            })
            .populate({
                path: "comments.user",
                select: "username"
            });

        res.status(200).json(posts);
    } catch (error) {
        console.log("Error in getAllPosts controller:", error);
        res.status(500).json({ error: "Internal server error" });
    }
}
export const getLikedPosts = async (req, res) => {
    const userId = req.params.id;
    try {
        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ error: "User not found" });
        }

        // Find posts where the user has liked them
        const likedPosts = await Post.find({ likes: userId })
            .populate({
                path: "user",
                select: "-password"
            })
            .populate({
                path: "comments.user",
                select: "-password"
            })
            .sort({ createdAt: -1 }); // Sort by most recent

        res.status(200).json(likedPosts);
    } catch (error) {
        console.log("Error in getLikedPosts controller:", error);
        res.status(500).json({ error: "Internal server error" });
    }
}
export const getFollowingPosts = async (req, res) => {
    try {
        const userId = req.user._id;

        // Find the current user to get the list of followings
        const user = await User.findById(userId).select("following");
        if (!user) {
            return res.status(404).json({ error: "User not found" });
        }

        // Get posts from users the current user is following
        const followingPosts = await Post.find({ user: { $in: user.following } })
            .populate({
                path: "user",
                select: "-password"
            })
            .populate({
                path: "comments.user",
                select: "-password"
            })
            .sort({ createdAt: -1 }); // Sort by most recent

        res.status(200).json(followingPosts);
    } catch (error) {
        console.log("Error in getFollowingPosts controller:", error);
        res.status(500).json({ error: "Internal server error" });
    }
}

export const getUserPosts = async (req, res) => {
    try {
        const userId = req.params.id;

        // Check if the user exists
        const user = await User.findById(userId).select("-password");
        if (!user) {
            return res.status(404).json({ error: "User not found" });
        }

        // Get all posts by the user
        const userPosts = await Post.find({ user: userId })
            .populate({
                path: "user",
                select: "-password"
            })
            .populate({
                path: "comments.user",
                select: "-password"
            })
            .sort({ createdAt: -1 }); // Sort by most recent

        res.status(200).json(userPosts);
    } catch (error) {
        console.log("Error in getUserPosts controller:", error);
        res.status(500).json({ error: "Internal server error" });
    }
}

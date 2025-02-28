import Notification from "../models/notificationModel.js";
import User from "../models/userModel.js";
import bcrypt from "bcryptjs";
import {v2 as cloudinary} from 'cloudinary';
// Get User Profile
export const getUserProfile = async (req, res) => {
    const { username } = req.params;

    try {
        const user = await User.findOne({ username }).select("-password");
        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }
        // Send user profile data
        res.status(200).json(user);
    } catch (error) {
        res.status(500).json({ message: "Server Error" });
        console.log("error in get user profile", error);
    }
}

// Follow / Unfollow User
export const followUnfollowUser = async (req, res) => {
    try {
        const { id } = req.params;

        // Check if the user is trying to follow themselves
        if (id === req.user._id.toString()) {
            return res.status(400).json({ message: "You cannot follow yourself" });
        }

        const userToModify = await User.findById(id);
        const currentUser = await User.findById(req.user._id);

        if (!userToModify || !currentUser) {
            return res.status(404).json({ message: "User not found" });
        }

        // Check if the current user is already following the user to modify
        const isFollowing = userToModify.followers.includes(req.user._id);

        if (isFollowing) {
            // Unfollow the user
            await User.findByIdAndUpdate(id, { $pull: { followers: req.user._id } });
            await User.findByIdAndUpdate(req.user._id, { $pull: { following: id } });
            res.status(200).json({ message: "User unfollowed successfully" });
        } else {
            // Follow the user
            await User.findByIdAndUpdate(id, { $push: { followers: req.user._id } });
            await User.findByIdAndUpdate(req.user._id, { $push: { following: id } });
            const newNotification = new Notification({
                type: "follow",
                from: req.user._id, 
                to: userToModify._id
            })
            await newNotification.save();

            res.status(200).json({ message: "User followed successfully" });
        }

    } catch (error) {
        res.status(500).json({ message: "Server Error" });
        console.log("error in follow unfollow user", error);
    }
}

//suggestion of Users
export const getSuggestedUsers = async (req, res) => {
    try{
        const userId=req.user._id;
        const userFollowedByMe=await User.findById(userId).select("following");
        const users = await User.aggregate([
            {
                $match:{
                    _id: {$ne:userId}
                }
            },
            {$sample:{size:10}}
        ])
        const filteredUsers=users.filter(user=>!userFollowedByMe.following.includes(user._id));
        const suggestedUsers=filteredUsers.slice(0,4);

        suggestedUsers.forEach((user)=>(user.password=undefined));
        res.status(200).json(suggestedUsers);

    }catch(error){
        res.status(500).json({ message: "Server Error" });
        console.log("error in get suggested users", error);
    }
};

// update the User Profile
export const updateUser = async (req, res) => {
    const { fullName, email, username, currentPassword, newPassword, bio, link } = req.body;
    let { profileImg, coverImg } = req.body;

    try {
        const userId = req.user._id;
        let user = await User.findById(userId);

        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        // Validate Passwords
        if ((currentPassword && !newPassword) || (!currentPassword && newPassword)) {
            return res.status(400).json({ message: "Please enter both current and new password" });
        }

        if (currentPassword && newPassword) {
            const isMatch = await bcrypt.compare(currentPassword, user.password);

            if (!isMatch) {
                return res.status(400).json({ message: "Current password does not match" });
            }

            if (newPassword.length < 6) {
                return res.status(400).json({ message: "Password must be at least 6 characters" });
            }

            // Hash the new password and update user.password
            const salt = await bcrypt.genSalt(10);
            user.password = await bcrypt.hash(newPassword, salt);
        }

        // Update Profile Image
        if (profileImg) {
            if (user.profileImg) {
                const publicId = user.profileImg.split('/').pop().split('.')[0];
                await cloudinary.uploader.destroy(publicId);
            }
            const uploadedResponse = await cloudinary.uploader.upload(profileImg);
            profileImg = uploadedResponse.secure_url;
        }

        // Update Cover Image
        if (coverImg) {
            if (user.coverImg) {
                const publicId = user.coverImg.split('/').pop().split('.')[0];
                await cloudinary.uploader.destroy(publicId);
            }
            const uploadedResponse = await cloudinary.uploader.upload(coverImg);
            coverImg = uploadedResponse.secure_url;
        }

        // Update Other User Details
        user.fullName = fullName || user.fullName;
        user.email = email || user.email;
        user.username = username || user.username;
        user.bio = bio || user.bio;
        user.link = link || user.link;
        user.profileImg = profileImg || user.profileImg;
        user.coverImg = coverImg || user.coverImg;

        // Save Updated User
        await user.save();
        user.password = undefined;
        return res.status(200).json(user);
    } catch (error) {
        res.status(500).json({ message: "Server Error" });
        console.log("error in updateUser", error);
    }
};

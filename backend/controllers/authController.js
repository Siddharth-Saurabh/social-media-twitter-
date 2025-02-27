import User from "../models/userModel.js";
import bcrypt from 'bcryptjs';
import { generateTokenAndSetCookie } from "../lib/utils/generateToken.js";

export const signup = async (req,res)=>{
    try{
        const{fullName,username,email,password} = req.body;

        const emailRegex=/^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if(!emailRegex.test(email)){
            return res.status(401).send('Email is not valid');
        }
        const existingUser = await User.findOne({username});
        if(existingUser){
            return res.status(409).send('Username is already taken');
        }
        const existingEmail = await User.findOne({email});
            if(existingEmail){
                return res.status(409).send('Email is already registered');
            }
        if(password.length<6){
            return res.status(401).send('Password must be at least 6 characters');
        }
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        const newUser = new User({
            fullName:fullName,
            username:username,
            email:email,
            password: hashedPassword
        });

        if(newUser){
            generateTokenAndSetCookie(newUser._id,res);
            await newUser.save();
            res.status(201).json({
                _id:newUser._id,
                username:newUser.username,
                email:newUser.email,
                followers:newUser.followers,
                following:newUser.following,
                profileImg:newUser.profileImg,
                coverImg:newUser.coverImg,
                bio:newUser.bio,
                link:newUser.link
            });
        }else{
            res.status(400).send('Invalid user data');
        }

    }catch(error){
        res.status(500).send('Internal Server Error');
    }
}
export const login = async (req,res)=>{
    try{
        const{username,password} = req.body;
        const user = await User.findOne({username});
        if(!user){
            return res.status(404).send('User not found');
        }
        const isPasswordCorrect= await bcrypt.compare(password,user?.password||"");
        if(!isPasswordCorrect){
            return res.status(401).send('Invalid credentials');
        }
        generateTokenAndSetCookie(user._id,res);
        res.status(200).json({
            _id:user._id,
            username:user.username,
            email:user.email,
            followers:user.followers,
            following:user.following,
            profileImg:user.profileImg,
            coverImg:user.coverImg,
            bio:user.bio,
            link:user.link
        });

    }catch(error){
        res.status(500).send('Internal Server Error');
        console.log("error in login controller",error);
    }
}
export const logout = async (req,res)=>{
    try{
        res.cookie("jwt","",{maxAge:0});
        res.status(200).send('Logged out successfully');
    }catch(error){
        console.log("error in logout controller",error.message);
        res.status(500).send('Internal Server Error');
    }
}

export const getMe=async(req,res)=>{
    try{
        const user = await User.findById(req.user._id).select("-password");
        res.status(200).json(user);
    }catch(error){
        console.log("error in getMe controller",error.message);
        res.status(500).send('Internal Server Error');
    }
}
import User from "../models/userModel.js";
import jwt from 'jsonwebtoken';


export const protectRoute = async (req,res,next)=>{
    try{
        const token =req.cookies.jwt;
        if(!token){
            return res.status(401).send('Unauthorized access');
        }
        const decoded = jwt.verify(token,process.env.JWT_SECRET);

        if(!decoded){
            return res.status(401).send('Unauthorized access');
        }
        req.user = await User.findById(decoded.userId).select("-password");

        if(!req.user){
            return res.status(401).send('Unauthorized access');
        }
        
        next();
    }catch(error){
        console.log("error in protectRoute middleware",error);
        res.status(401).send('Unauthorized access');
    }
}
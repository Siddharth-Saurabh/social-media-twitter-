import express from 'express';
import dotenv from 'dotenv';
import cookieParser from 'cookie-parser';
import {v2 as cloudinary} from 'cloudinary';

import authRoutes from './routes/authRoute.js';
import connectMongoDB from './db/connectMongo.js';
import userRoutes from './routes/userRoutes.js'
import postRoutes from './routes/postRoutes.js'
import notificationRoutes from './routes/notificationRoutes.js'
dotenv.config();

const app=express();
const PORT=process.env.PORT || 5000;

cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
})
app.use(cookieParser())
app.use(express.json());
app.use(express.urlencoded({extended:true}));



app.use('/api/auth',authRoutes);
app.use('/api/users',userRoutes)
app.use("/api/posts",postRoutes);
app.use("/api/notifications",notificationRoutes)

app.listen(PORT,()=>{
    console.log('Server started at http://localhost:8000');
    connectMongoDB();
})
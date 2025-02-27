import express from 'express';
import dotenv from 'dotenv';

import authRoutes from './routes/authRoute.js';
import connectMongoDB from './db/connectMongo.js';
import cookieParser from 'cookie-parser';

const app=express();
dotenv.config();
app.use(express.json());
app.use(express.urlencoded({extended:true}));
const PORT=process.env.PORT || 5000;
app.use(cookieParser())

app.use('/api/auth',authRoutes);

app.listen(PORT,()=>{
    console.log('Server started at http://localhost:8000');
    connectMongoDB();
})
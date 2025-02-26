import mongoose from 'mongoose';

const connectMongoDB= async()=>{
    try{
        const con = await mongoose.connect(process.env.MONGO_URI);
        console.log(`MongoDB Connected: ${con.connection.host}`);
    }
    catch(error){
        console.log('Error:',error);
        process.exit(1);
    }
}
export default connectMongoDB;
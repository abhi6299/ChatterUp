import mongoose from "mongoose";

const url = process.env.DB_URL+"ChatterUp";
export const connect = async() => {
    await mongoose.connect(url,{
        useNewUrlParser:true,
        useUnifiedTopology:true
    }); 
    console.log("DB is connected");
}
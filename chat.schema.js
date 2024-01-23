import mongoose from 'mongoose';

export const chatSchema = new mongoose.Schema({
    username:String,
    profile:String,
    text:String,
    timestamp:Date 
})
export const chatModel = mongoose.model('chats',chatSchema);
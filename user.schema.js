import mongoose from 'mongoose';

export const userSchema = new mongoose.Schema({
    activeUser : String
})
export const userModel = mongoose.model('users',userSchema);
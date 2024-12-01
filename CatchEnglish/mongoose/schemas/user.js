const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
    userid: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    name: { type: String, required: true },
    dob: { type: Date, required: true },
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now },
    character: { type: String },
    correctAnswers:{type:Number,default:0} 
});

const User = mongoose.model("User", userSchema);
module.exports = User;

// backend/models/User.js
const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
    name: String,
    email: { type: String, unique: true },
    password: String,
    nic: { type: String, required: true, unique: true },
    age: { type: Number, required: true },
    gender: { type: String, required: true },
    profilePic: { 
        data: Buffer,
        contentType: String
    }
}, { timestamps: true });

module.exports = mongoose.model('User', userSchema);
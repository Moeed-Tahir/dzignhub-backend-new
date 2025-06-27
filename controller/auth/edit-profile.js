const User = require("../../models/User");
const bcrypt = require("bcryptjs");
var jwt = require("jsonwebtoken");
const asyncWrapper = require("../../middleware/async")
const { createClient } = require('@supabase/supabase-js');


const supabase = createClient(
    "https://qnlscpmwamswjhhoorwt.supabase.co",
    "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFubHNjcG13YW1zd2poaG9vcnd0Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MDc4MDMzMSwiZXhwIjoyMDY2MzU2MzMxfQ.52UneeW6RjFP9Rf-VG0F6jX6KiGiEIX25cdr2M3xCtg",
    {
        auth: {
            autoRefreshToken: false,
            persistSession: false
        }
    }
);
const editProfile = asyncWrapper(async (req, res) => {

    const { name, location, bio } = req.body;
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) {
        return res.status(401).json({ message: 'Unauthorized', type: 'error' });
    }


    const verification = jwt.verify(token, process.env.JWT_SECRET_KEY);
    if (!verification) {
        return res.status(200).json({ type: "error", message: "Invalid Token" })
    }


    let user = await User.findOne({ email: verification.email })
    console.log(user)
    if (!user) {
        return res.status(400).json({ message: "The email you entered is not registered", type: "error", field: "email" })
    }

    let avatarUrl = null;
    const avatar = req.files?.avatar?.[0];
    if (avatar) {
        console.log("Uploading avatar image...");
        avatarUrl = await processImageFile(avatar, "allmyai-content", 'avatar');
        console.log("Start image uploaded:", avatarUrl);
    }

    await User.findByIdAndUpdate(user._id, {
        $set: {
            avatar:avatarUrl || user.avatar,
            name: name || user.name,
            location: location || user.location,
            bio: bio || user.bio
        }
    }, { new: true, runValidators: true })
        .then(updatedUser => {
            return res.status(200).json({ type: "success", message: "Profile updated successfully", user: updatedUser });
        })
        .catch(err => {
            return res.status(400).json({ type: "error", message: "Error updating profile", error: err.message });
        });

})

// Process uploaded image file to get URL
const processImageFile = async (file, bucketName, prefix) => {
    if (!file) return null;
    
    const fileName = `${prefix}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}.jpg`;
    const fileBuffer = file.buffer || await streamToBuffer(file);
    
    return await uploadFile(bucketName, fileName, fileBuffer, 'image/jpeg');
};

async function streamToBuffer(stream) {
    const chunks = [];
    const reader = stream.getReader();

    try {
        while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            chunks.push(value);
        }
    } finally {
        reader.releaseLock();
    }

    return Buffer.concat(chunks);
}

// Upload file (image or video) to Supabase
const uploadFile = async (bucketName, fileName, fileBuffer, contentType) => {
    try {
        const { data, error } = await supabase.storage
            .from(bucketName)
            .upload(fileName, fileBuffer, {
                contentType: contentType,
                cacheControl: '3600',
                upsert: true
            });

        if (error) {
            throw error;
        }

        // Get public URL
        const { data: { publicUrl } } = supabase.storage
            .from(bucketName)
            .getPublicUrl(fileName);

        return publicUrl;
    } catch (error) {
        console.error("Upload error:", error);
        throw error;
    }
};

module.exports = editProfile
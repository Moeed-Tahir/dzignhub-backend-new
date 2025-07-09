const User = require("../../models/User");
const jwt = require("jsonwebtoken");
const asyncWrapper = require("../../middleware/async");

const updateOnboarding = asyncWrapper(async (req, res) => {
    try {
        const token = req.headers.authorization?.split(' ')[1];
        if (!token) {
            return res.status(401).json({ message: 'Unauthorized', type: 'error' });
        }

        console.log("Received token:", token);

        const verification = jwt.verify(token, process.env.JWT_SECRET_KEY);
        console.log("Decoded verification:", verification); 
        const user = await User.findById(verification.userId);

        if (!user) {
            return res.status(404).json({ type: "error", message: "User not found" });
        }

        const { 
            // Tab 1 data
            userType,
            creationGoals,
            
            // Tab 2 data
            brandWords,
            brandTone,
            customBrandTones,
            designStyle,
            
            // Progress tracking
            currentStep,
            isCompleted 
        } = req.body;

        // Build update object - only update fields that are provided
        const updateData = {};

        // Update progress tracking
        if (currentStep !== undefined) {
            updateData['onboarding.currentStep'] = currentStep;
        }
        if (isCompleted !== undefined) {
            updateData['onboarding.isCompleted'] = isCompleted;
        }

        // Update Tab 1 data (Let's Start)
        if (userType !== undefined) {
            updateData['onboarding.userType'] = userType;
        }
        if (creationGoals !== undefined) {
            updateData['onboarding.creationGoals'] = creationGoals;
        }

        // Update Tab 2 data (Design Your Direction)
        if (brandWords !== undefined) {
            updateData['onboarding.brandWords'] = brandWords;
        }
        if (brandTone !== undefined) {
            updateData['onboarding.brandTone'] = brandTone;
        }
        if (customBrandTones !== undefined) {
            updateData['onboarding.customBrandTones'] = customBrandTones;
        }
        if (designStyle !== undefined) {
            updateData['onboarding.designStyle'] = designStyle;
        }

        // Update user document
        await User.findByIdAndUpdate(verification.userId, updateData, { new: true });

        res.status(200).json({ 
            type: "success", 
            message: "Onboarding updated successfully",
            step: currentStep
        });

    } catch (error) {
        console.error('Error updating onboarding:', error);
        res.status(500).json({ type: "error", message: "Something went wrong" });
    }
});

module.exports = updateOnboarding;
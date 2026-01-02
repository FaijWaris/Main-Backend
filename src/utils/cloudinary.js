import { v2 as cloudinary } from "cloudinary";
import fs from "fs";
import { ApiError } from "./ApiError.js";

const ensureCloudinaryCredentials = () => {
    const cloudName = process.env.CLOUDINARY_CLOUD_NAME?.trim();
    const apiKey = process.env.CLOUDINARY_API_KEY?.trim();
    const apiSecret = process.env.CLOUDINARY_API_SECRET?.trim();

    if (!cloudName || !apiKey || !apiSecret) {
        throw new ApiError(500, "Cloudinary environment variables are missing");
    }

    cloudinary.config({
        cloud_name: cloudName,
        api_key: apiKey,
        api_secret: apiSecret,
        secure: true,
    });
};

const uploadOnCloudinary = async (localFilePath) => {
    if (!localFilePath) return null;

    try {
        ensureCloudinaryCredentials();

        // ✅ Upload file to Cloudinary
        const response = await cloudinary.uploader.upload(localFilePath, {
            resource_type: "auto",
        });

        // ✅ File successfully uploaded → delete local file
        if (fs.existsSync(localFilePath)) {
            fs.unlinkSync(localFilePath);
        }

        return response;

    } catch (error) {
        // ❌ Upload failed → still clean up local file
        if (fs.existsSync(localFilePath)) {
            fs.unlinkSync(localFilePath);
        }

        if (error?.http_code === 401) {
            throw new ApiError(
                500,
                "Cloudinary credentials were rejected. Verify CLOUDINARY_* values."
            );
        }

        throw new ApiError(500, error?.message || "Cloudinary upload failed");
    }
};

export { uploadOnCloudinary };



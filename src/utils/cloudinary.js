import {v2 as cloudinary} from 'cloudinary';
import fs from 'fs';



(async function() {

    // Configuration
    cloudinary.config({ 
        cloud_name: process.env.CLOUDINARY_CLOUD_NAME, 
        api_key:process.env.CLOUDINARY_API_KEY,
        api_secret:process.env.CLOUDINARY_API_SECRET,
 
    })});

const uploadOnCloudinary=async(localFilePath)=>{
    try {
        if (!localFilePath) return null;
        // Upload file to Cloudinary
        const response=await cloudinary.uploader.upload(localFilePath,{
            resource_type:'auto',
            
        
            
        });
        // file upload succesfully
        console.log("file is uploadded on cloudinary",response.url);
        return response;
    } catch (error) {
        fs.unlinkSync(localFilePath);// delete the file from local storage
        return null;
    }
}
export const registerUser = async (req, res, next) => {
  try {
    const { fullname, username, email, password } = req.body;

    if ([fullname, username, email, password].some(
      field => !field || field.trim() === ""
    )) {
      throw new ApiError("All fields are required", 400);
    }

    const existedUser = await User.findOne({
      $or: [{ username }, { email }],
    });

    if (existedUser) {
      throw new ApiError("User already exists", 409);
    }

    const avatarLocalPath = req.files?.avatar?.[0]?.path;
    const coverImageLocalPath = req.files?.coverImage?.[0]?.path || null;

    if (!avatarLocalPath) {
      throw new ApiError("Avatar is required", 400);
    }

    res.status(201).json({
      success: true,
      message: "Validation passed",
    });

  } catch (error) {
    next(error);
  }
};
;    
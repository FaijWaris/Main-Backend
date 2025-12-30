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
export {uploadOnCloudinary};    
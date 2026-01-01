import { asyncHandler } from "../utils/asyncHandler.js";
import {User} from "../models/user.model.js";
import { ApiEroor } from "../utils/ApiError.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";
import { ApiResponse } from "../utils/ApiResponse.js";
const registerUser = asyncHandler(async (req, res) => {
   //get user detail from frontend from postman
   //validation can be added here or using mongoose schema validation not empty
   //check if user already exists :username or email
   //avatar and cover image can be uploaded to cloudinary and get the url
   //avataar check succesfully upload or not
   //create user object-create entry in db
   //remove password and refresh token filedl from response
   //check for user creation
   //return response to frontend
   const {fullname,username,email}=req.body
   console.log("email :",email);
   ;
  
  if (
    [fullname,username,email,password].some((field) =>
       field?.trim()=="")
  ) {
    throw new ApiEroor("All fields are required", 400);
  }
   const existedUser=User.findOne({
    $or: [{ username }, { email }],
  }) 
    if(existedUser){
      throw new ApiEroor("User already exists", 409);
    }
    const avatarLocalPath=req.files?.avatar[0]?.path;
    const coverImageLocalPath=req.files?.coverImage[0]?.path;
    if(!avatarLocalPath){
      throw new ApiEroor("Avatar is required",400);
    }
    const avatar=await uploadOnCloudinary(avatarLocalPath);
    const coverImage=await uploadOnCloudinary(coverImageLocalPath)
    if (!avatar) {
       throw new ApiEroor("Avatar is required",400);
    }
    const user=await User.create({
      fullname,
      avatar:avatar.url,
      coverImage:coverImage?.url || "",
      username:username.toLowerCase(),
      email,
      password,
    })
    const createdUser=await User.findById(user._id).select("-password ,-refreshToken")
    if(!createdUser){
      throw new ApiEroor("User creation failed",500);
    }
    return res.status(201).json(new ApiResponse(200,"User created successfully",createdUser));

  });

export { registerUser };
import { asyncHandler } from "../utils/asyncHandler.js";
import User from "../models/user.model.js";
import { ApiError } from "../utils/ApiError.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";
import { ApiResponse } from "../utils/ApiResponse.js";

const generateAccessAndRefereshTokens = async(userId)=>{
  try {
    const user = await User.findById(userId)
    const accessToken = user.generateAccessToken()
    const refreshToken = user.generateRefreshToken()
     user.refreshToken = refreshToken
      await user.save({validateBeforeSave: false})
      return {accessToken,refreshToken}
  } catch (error) {
    throw new ApiError(500,"Something went wrong while generating refresh and access token")
  }
}

const registerUser = asyncHandler(async (req, res) => {
  const { fullname, username, email, password } = req.body;

  // 1. Validation
  if ([fullname, username, email, password].some((field) => !field || field.trim() === "")) {
    throw new ApiError(400, "All fields are required");
  }

  // 2. Check if user exists
  const existedUser = await User.findOne({
    $or: [{ username }, { email }],
  });
  if (existedUser) {
    throw new ApiError(409, "User with email or username already exists");
  }

  // 3. Debug: log received files
  console.log("Files received:", req.files);

  // 4. Get file paths
  const avatarLocalPath = req.files?.avatar?.[0]?.path;
  const coverImageLocalPath = req.files?.coverImage?.[0]?.path;
//  console.log(req.files);
 
  console.log("Avatar local path:", avatarLocalPath);
  console.log("Cover image local path:", coverImageLocalPath);

  if (!avatarLocalPath) {
    throw new ApiError(400, "Avatar file is required");
  }

  // 5. Upload files to Cloudinary
  const avatar = await uploadOnCloudinary(avatarLocalPath);
  if (!avatar) {
    throw new ApiError(400, "Avatar upload to cloud failed");
  }

  // Cover image is optional
  let coverImage = null;
  if (coverImageLocalPath) {
    coverImage = await uploadOnCloudinary(coverImageLocalPath);
    if (!coverImage) {
      console.warn("Cover image upload failed, proceeding without it.");
    }
  }

  // 6. Create user document
  const user = await User.create({
    fullname,
    avatar: avatar.secure_url || avatar.url, // use secure_url if available
    coverImage: coverImage?.secure_url || coverImage?.url || "",
    username: username.toLowerCase(),
    email,
    password,
  });

  // 7. Fetch user without sensitive fields
  const createdUser = await User.findById(user._id).select("-password -refreshToken");

  if (!createdUser) {
    throw new ApiError(500, "Something went wrong while registering the user");
  }

  // 8. Respond success
  return res.status(201).json(
    new ApiResponse(200, "User registered successfully", createdUser)
  );
});
const loginUser=asyncHandler(async(req,res)=>{
  const{email,username,password}= req.body
  if (!username||!email) {
    throw new ApiError(400,"username or email required")
  }
    const user = await User.findOne({
    $or:[{username},{email}]
  })
  if (!user) {
    throw new ApiError(404,"user does not exist")
  }
  const isPasswordValid = await user.isPasswordCorrect(password)
   if (!isPasswordValid) {
    throw new ApiError(401,"Password incorrect")
  }
  const {accessToken,refreshToken} = await
   generateAccessAndRefereshTokens(user._id)

   const loggedInUser = await User.findById(user._id).select("-password -refreshToken")
  const option = {
    httpOnly: true,
    secure: true
  }
  return res
  .status(200)
  .cookie("accessToken",accessToken,option)
  .cookie("refreshToken",refreshToken,option)
  .json(
    new ApiResponse(
      200,
      {
       user: loggedInUser, accessToken,refreshToken
    },
    "User logged in successfully"
  )
  )
  const logoutUser = asyncHandler(async(req,res)=>{
   await  User.findByIdAndUpdate(req.user._id,
      {
        $set: {
          refreshToken:undefined
        }
      },
      {
        new: true
      }
     )
     const option = {
    httpOnly: true,
    secure: true
  }
  return res
  .status(200)
  .clearCookie("accessToken",option)
  .clearCookie("refreshToken",option)
  .json(new ApiResponse(200, {},"User logged Out"))
  })


});

export { registerUser,loginUser,logoutUser };

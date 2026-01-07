import { asyncHandler } from "../utils/asyncHandler.js";
import User from "../models/user.model.js";
import { ApiError } from "../utils/ApiError.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import jwt from "jsonwebtoken"
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
  if (!username && !email) {
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
  ));
});
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
});
const refreshAccessToken = asyncHandler(async(req,res)=>{
  const incomingRefresshToken = req.cookies.refreshToken || req.body.refreshToken

  if (!incomingRefresshToken) {
    throw new ApiError(401,"unauthorized request")
  }
try {
    const decodedToken = jwt.verify(
      incomingRefresshToken,
      process.env.REFRESH_TOKEN_SECRET
    )
  
    const user = await User.findById(decodedToken?._id)
    
    if (!user) {
      throw new ApiError(401,"Invalid RefreshToken")
    }
    if (incomingRefresshToken != user?.refreshToken) {
       throw new ApiError(401,"Refresh tokein is expired or used")
    }
    const option = {
      httpOnly: true,
      secure: true
    }
   const {accessToken ,newRefreshToken} = await generateAccessAndRefereshTokens(user._id)
  
  
     return res
    .status(200)
    .cookie("accessToken",accessToken,option)
    .cookie("refreshToken",newRefreshToken,option)
    .json(new ApiResponse(200, {accessToken,refreshToken:newRefreshToken},"Access token refreshed"))
} catch (error) {
  throw new ApiError(401,error?.message || "invalid refresh token")
}

});

const changeCurrentPassword= asyncHandler(async(req,res)=>{
  const {oldPassword, newPassword} = req.body
const user = await User.findById( req.user?._id)
 const isPasswordCorrect = await user.isPasswordCorrect(oldPassword)
 if (!isPasswordCorrect) {
    throw new ApiError(400,"incorrect password")
 }
 user.password = newPassword
  await user.save({validateBeforeSave: false})

  return res.status(200)
  .json(new ApiResponse(200,{},"password changed successfully"))

})

const getCurrentUser = asyncHandler(async(req,res)=>{
  return res.status(200)
  .json(new ApiResponse(200,req.user,"current user fetched succesfully"))
})

const updateAccountDetails = asyncHandler(async(req,res)=>{ 
  const {fullname,email,} = req.body
  if (!fullname || !email) {
     throw new ApiError(400,"All fields are required")
  }
 const user= await User.findByIdAndUpdate(req.user?._id,
    {
      $set:{
        fullname,
         email
      }
    },
    {new : true}).select("-password")
  return res.status(200)
  .json(new ApiResponse(200,"account details updated successfully"))
})

const updateUserAvatar = asyncHandler(async (req, res) => {
  const avatarLocalPath = req.file?.path;

  if (!avatarLocalPath) {
    throw new ApiError(400, "Avatar file is missing");
  }

  // 1️⃣ Get existing user (REFERENCE SOURCE)
  const existingUser = await User.findById(req.user?._id);
  if (!existingUser) {
    throw new ApiError(404, "User not found");
  }

  const oldAvatarUrl = existingUser.avatar;

  // 2️⃣ Upload new avatar
  const avatar = await uploadOnCloudinary(avatarLocalPath);
  if (!avatar?.url) {
    throw new ApiError(400, "Error while uploading avatar");
  }

  // 3️⃣ Update DB
  const user = await User.findByIdAndUpdate(
    req.user?._id,
    {
      $set: {
        avatar: avatar.url,
      },
    },
    { new: true }
  ).select("-password");

  // 4️⃣ Delete old avatar from Cloudinary
  if (oldAvatarUrl) {
    await deleteFromCloudinary(oldAvatarUrl);
  }

  // 5️⃣ Response
  return res
    .status(200)
    .json(new ApiResponse(200, user, "Avatar updated successfully"));
});

const updateUserCoverImage = asyncHandler(async (req, res) => {
  const coverImageLocalPath = req.file?.path;

  if (!coverImageLocalPath) {
    throw new ApiError(400, "Cover image file is missing");
  }

  // 1️⃣ Get existing user (REFERENCE SOURCE)
  const existingUser = await User.findById(req.user?._id);
  if (!existingUser) {
    throw new ApiError(404, "User not found");
  }

  const oldCoverImageUrl = existingUser.coverImage;

  // 2️⃣ Upload new cover image
  const coverImage = await uploadOnCloudinary(coverImageLocalPath);
  if (!coverImage?.url) {
    throw new ApiError(400, "Error while uploading cover image");
  }

  // 3️⃣ Update DB with new cover image
  const user = await User.findByIdAndUpdate(
    req.user?._id,
    {
      $set: {
        coverImage: coverImage.url,
      },
    },
    { new: true }
  ).select("-password");

  // 4️⃣ Delete old cover image from Cloudinary
  if (oldCoverImageUrl) {
    await deleteFromCloudinary(oldCoverImageUrl);
  }

  // 5️⃣ Response
  return res
    .status(200)
    .json(new ApiResponse(200, user, "Cover image updated successfully"));
});

const getUserChannelProfile = asyncHandler(async(req,res)=>{
   const {username} = req.params

   if (!username?.trim()) {
    throw new ApiError(400,"username is missing")
   }
 const channel = await User.aggregate([
  {
    $match:{
      username:username?.toLowerCase()
    }
  },
  {
    $lookup:{
      from:"subscriptions",
      localField:"_id",
      foreignField:"channel",
      as:"subscribers"
    }
  },
  {
     $lookup:{
      from:"subscriptions",
      localField:"_id",
      foreignField:"subscriber",
      as:"subscribedto"
  }
},
{
  $addFields:{
    subscribercount:{
      $size:"$subscribers"
    },
    channelsSubscribedToCount:{
      $size:"$subscribedto"
    },
    isSubscribed:{
      $cond:{
        if:{$in:[req.user?._id,"$subscribers.subscriber"]},
        then:true,
        else:false
      }
    }
  }
},
{
  $project:{
    fullname: 1,
    username: 1,
     subscribercount:1,
     channelsSubscribedToCount:1,
     isSubscribed:1,
     avatar:1,
     coverImage:1,
     email:1


  }
}
 ])
if (!channel?.length) {
  throw new ApiError(404,"channel does not exists")
}
return res.status(200)
.json(new ApiResponse(200,channel[0],"User channel fetched sucesfully"))
 


})

const GetWatchHistory = asyncHandler(async(req,res)=>{
  const user = await User.aggregate([
    {
      $match:{
        _id:new mongoose.Types.ObjectId(req.user._id)
      }
    },
    {
      $lookup:{
        from:"video",
        localField:"watch history",
        foreignField:"_id",
        as:"watch history",
        pipeline:[
          {
            $lookup:{
              from:"users",
              localField:"owner",
              foreignField:"_id",
              as:"owner",
              pipeline:[
                {
                  $project:{
                    fullname: 1,
                    username:1,
                    avatar:1

                  }
                }
              ]
            }
          },
          {
            $addFields:{
             owner:{
              $first:"$owner"
             }
            }
          }
        ]
      }
    }
  ])

  return res.status(200)
  .json(new ApiResponse(user[0].watchHistory,"Watch HIstory fetched successfully"))
})


export { registerUser,
  loginUser,
  logoutUser,
  refreshAccessToken,
  changeCurrentPassword,
  getCurrentUser,
  updateAccountDetails,
  updateUserAvatar,
  updateUserCoverImage,
  getUserChannelProfile,
  GetWatchHistory
};

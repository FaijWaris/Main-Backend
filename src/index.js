// require('dotenv').config({path:'./.env'});  
// consistency ko break krta , lekin upr wale code me chl sb jayega but 
//isse jyada ek aur hai 
import dotenv from "dotenv";
import connectDB from "./db/index.js"; // or your DB connection file
import { app } from "./app.js";

// Load environment variables immediately
dotenv.config({
    path: './.env'
});

// Start the server only after DB is connected
connectDB()
.then(() => {
    app.listen(process.env.PORT || 8000, () => {
        console.log(`Server is running at port : ${process.env.PORT}`);
    });
})
.catch((err) => {
    console.log("MONGO db connection failed !!! ", err);
});














// ifhi bna ke bhi connect kr skte hai 1st approach
// import express from "express";
// const app = express();
// (async () => {
//   try{
//    await mongoose.connect(`${proecess.env.MONGODB_URI}/${DB_NAME}`)
//    app.on("error", (error) => {
//     console.error("ERROR:", error);
//     throw error;
//   })

//   app.listen(process.env.PORT, () => {
//     console.log(`Server is running on port ${process.env.PORT}`);
// })
// }
//   catch(error){
//     console.error("ERROR:",error);
//     throw error;
//   }
// })()
// require('dotenv').config({path:'./.env'});  
// consistency ko break krta , lekin upr wale code me chl sb jayega but 
//isse jyada ek aur hai 
import dotenv from "dotenv";
import connectDB from "./db/index.js";
dotenv.config({path:'./.env'});
 

connectDB()
.then(()=>{
    app.listen(process.env.PORT || 8000,()=>{
       console.log(`server is runnning at a port:${process.env.PORT}`);;
         })
          app.on("error", (error) => {
           console.error("ERROR:", error);
           throw error;
  })

})
.catch((error)=>{
    console.log("Mongo db connection error",error);
    
})














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
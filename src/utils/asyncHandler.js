// ek method banayega aur usko export krega
// YE PROMISE WALA HAI
const asyncHandler=(requestHandler)=>{
  return (req,res,next)=>{
    Promise.resolve(requestHandler(req,res,next)).catch((error) =>next(error))
   }
}

export{asyncHandler};



// const asyncHandler=()=>{}
// const asyncHandler=(func)=>()=>{}
// const asyncHandler=(func)=>async()=>{}

// TRY CATCH WALA HAI YE

// const asyncHandler=(fn)=>async(req,res,next)=>{
//     try {
//        await fn(req,res,next); 
//     } catch (error) {
//         res.status(error.code||500).json({
//             success:false,
//             message:error.message||"Internal Server Error",
//         })
//     }
// }
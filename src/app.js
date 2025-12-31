// Import Express framework to create server and handle routes
import express from "express";

// Import CORS middleware to allow frontend-backend communication
import cors from "cors";

// Import cookie-parser to read cookies from incoming requests
import cookieParser from "cookie-parser";

// Create an Express application instance
const app = express();

// Enable CORS (Cross-Origin Resource Sharing)
// Allows requests from the frontend URL defined in environment variables
// credentials: true → allows cookies (JWT, session) to be sent with requests
app.use(cors({
    origin: process.env.CORS_ORIGIN, // e.g. http://localhost:5173
    credentials: true,
}));

// Parse incoming JSON request bodies
// limit: '16kb' → protects server from large payload attacks
// Makes JSON data available in req.body
app.use(express.json({ limit: '16kb' }));

// Parse URL-encoded data (form submissions)
// extended: true → allows nested objects in form data
// limit: '16kb' → security & performance protection
app.use(express.urlencoded({ extended: true, limit: '16kb' }));

// Serve static files from the "public" folder
// Example: public/image.png → http://localhost:8000/image.png
// Used for images, uploads, PDFs, etc.
app.use(express.static('public'));

// Parse cookies sent by the browser
// Makes cookies available as req.cookies
// Commonly used for authentication (JWT in cookies)
app.use(cookieParser());


//routes importing
import userRouter from './routes/user.routes.js';



//routes declarition
app.use("/api/v1/users",userRouter);
//http://localhost:8000/api/v1/users/register

// Export app so it can be used in server/index.js or main file
export { app };

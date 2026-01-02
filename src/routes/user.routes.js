import {Router} from 'express';
import { registerUser } from '../controllers/user.controller.js';
import {ApiError} from '../utils/ApiError.js';
import {upload} from "../middlewares/multer.middleware.js"
const router= Router()
// In your user.routes.js
router.route("/register").post(
    upload.fields([
        { name: "avatar", maxCount: 1 },
        { name: "coverImage", maxCount: 1 }
    ]),
    registerUser
);


export default router;
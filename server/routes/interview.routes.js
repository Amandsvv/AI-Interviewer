import express from "express"
import isAuth from "../middlewares/isAuth.js"
import { upload } from "../middlewares/multer.js"
import { analyzeResume, finishInterview, generatequestions, submitAnswer } from "../controllers/interview.controllers.js"

const interviewRouter = express.Router()

interviewRouter.post("/resume", isAuth, upload.single("resume"), analyzeResume);
interviewRouter.post("/generate-questions", isAuth, generatequestions);
interviewRouter.post("/submit-answer", isAuth, submitAnswer);
interviewRouter.post("/finish", isAuth, finishInterview);

export default interviewRouter;
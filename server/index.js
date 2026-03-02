import express from "express";
import dotenv from "dotenv";
import connectDB from "./config/db.js";
import cookieParser from "cookie-parser";
import cors from "cors"

dotenv.config();

const app = express();

app.use(cors({
    origin: process.env.FRONTEND_URL || "http://localhost:5173",
    credentials:true
}))
const PORT = process.env.PORT || 6000;
app.use(express.json())
app.use(cookieParser())

import authRouter from "./routes/auth.routes.js";
import userRouter from "./routes/user.routes.js";
app.use("/api/auth",authRouter);
app.use("/api/user",userRouter)

connectDB()
.then(() => {
    app.listen(PORT, ()=> {
        console.log("Server is running on port : 8000");
    })
})
.catch((error) => {
    console.log("MOngoDB Connection Failed : ", error);
})

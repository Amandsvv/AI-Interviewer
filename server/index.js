import express from "express";
import dotenv from "dotenv";
import connectDB from "./config/db.js";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 6000;

app.get("/", (req,res)=>{
    return res.json({message : "server started"});
})

connectDB()
.then(() => {
    app.listen(PORT, ()=> {
        console.log("Server is running on port : 8000");
    })
})
.catch((error) => {
    console.log("MOngoDB Connection Failed : ", error);
})

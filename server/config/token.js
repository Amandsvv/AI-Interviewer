import jwt from "jsonwebtoken";

const genToken = async (userId) => { // Removed async (jwt.sign is synchronous by default)
    try {
        const secret = process.env.JWT_SECRET;

        if (!secret) {
            throw new Error("JWT_SECRET is missing from process.env");
        }

        // Wrap userId in an object for better structure
        const token = jwt.sign({ userId }, secret, { expiresIn: "7d" });
        return token;
    } catch (error) {
        console.error("JWT Signing Error:", error.message);
        return null; 
    }
}

export default genToken;
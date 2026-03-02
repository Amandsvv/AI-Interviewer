import jwt from "jsonwebtoken";

const isAuth = async (req, res, next) => {
    try {
        // 1. Get token from cookies
        const { token } = req.cookies;

        // 2. Check if token exists
        if (!token) {
            return res.status(401).json({ message: "No token provided, access denied" });
        }

        // 3. Verify the token (Move this OUTSIDE the if block)
        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        if (!decoded) {
            return res.status(401).json({ message: "Invalid token" });
        }

        // 4. Attach the ID to the request object for use in other routes
        req.userId = decoded.userId; 
        
        // 5. Move to the next middleware/controller
        next();

    } catch (error) {
        // jwt.verify throws an error if the token is expired or tampered with
        return res.status(401).json({ message: "Unauthorized: Invalid or expired token" });
    }
}

export default isAuth;
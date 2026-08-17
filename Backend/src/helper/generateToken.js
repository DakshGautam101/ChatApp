import jwt from "jsonwebtoken";

export default function generateToken(user, version) {
    let id;
    let tokenVersion = 0;

    if (user && typeof user === "object") {
        id = user._id || user.id;
        tokenVersion = typeof user.tokenVersion === "number" ? user.tokenVersion : 0;
    } else {
        id = user;
        tokenVersion = typeof version === "number" ? version : 0;
    }

    return jwt.sign(
        { id: String(id), tokenVersion },
        process.env.JWT_SECRET,
        { expiresIn: "7d" }
    );
}
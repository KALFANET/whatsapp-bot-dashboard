const jwt = require('jsonwebtoken');
require('dotenv').config();

const verifySignedUrl = (req, res, next) => {
    const token = req.query.token;
    if (!token) {
        return res.status(403).json({ error: "❌ Access denied. No token provided." });
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.fileName = decoded.file;
        next();
    } catch (error) {
        return res.status(403).json({ error: "❌ Invalid or expired token." });
    }
};

module.exports = verifySignedUrl;
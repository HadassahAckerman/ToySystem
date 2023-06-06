const jwt = require("jsonwebtoken");
const { config } = require("../config/secret")

// פונקצית מידל וואר שבודקת טוקן
// middleware
exports.auth = async (req, res, next) => {
    let token = req.header("x-api-key")
    if (!token) {
        return res.status(401).json({ msg: "You need to send token to this endpoint url" })
    }
    try {
        let decodeToken = jwt.verify(token, config.tokenSecret);
        req.tokenData = decodeToken;
        next()
    }
    catch (err) {
        console.log(err);
        return res.status(401).json({ msg: "Token is not valid or expired, login again or you're a hacker" })
    }
}


exports.authAdmin = (req, res, next) => {
    let token = req.header("x-api-key")
    if (!token) {
        return res.status(401).json({ msg: "You need to send token to this endpoint url" })
    }
    try {
        let decodeToken = jwt.verify(token, config.tokenSecret);
        if (decodeToken.role != "ADMIN") {
            return res.status(401).json({ msg: "Token is invalid or expired, code 3" })
        }
        req.tokenData = decodeToken;
        next()
    }
    catch (err) {
        console.log(err);
        return res.status(401).json({ msg: "Token is not valid or expired, login again or you're a hacker" })
    }
}
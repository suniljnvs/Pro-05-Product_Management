const jwt = require("jsonwebtoken");

const authentication = async function (req, res, next) {
    try {

        let bearToken = req.headers["authorization"];
        if (!bearToken) bearToken = req.headers["Authorization"]
        if (!bearToken) {
            return res.status(400).send({ status: false, message: "Token not present, login again " })
        };

        let token = bearToken.split(" ")[1];

        let decodedToken = jwt.verify(token, "//groupNumber_15||best_coders//");

        req.userId = decodedToken.userId;

        next();

    } catch (error) {
        res.status(500).send({ status: false, message: error.message })
    }
}



module.exports = { authentication }
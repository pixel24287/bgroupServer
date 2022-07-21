const jwt = require('jsonwebtoken');

const verifyToken = async (req, res, next) => {
    const authHeader = req.headers.token; 

    if(authHeader){   
        //access token 값 만료 검증
        const token = authHeader.split(' ')[1];
        jwt.verify(token, process.env.JWT, (err, user) => {
            if (err) {
                //access token이 만료인지 확인 'jwt expired'
                return res.status(400).json(err.message);
            } else {
                req.user = user;
                next();
            }
        })
    } else{
        return res.status(401).json('You are not authenticated!');
    }
}
const verifyTokenAndAuthorization = (req, res, next) => {
    verifyToken (req, res, () => {
        if (String(req.user.id) === req.params.id || req.user.isAdmin) {
            next();
        } else {
            return res.status(403).json('You are not alowed to do that!');
        }
    })
}
const verifyTokenAndAdmin = (req, res, next) => {
    verifyToken (req, res, () => {
        if (String(req.user.id) === req.params.id && req.user.isAdmin) {
            next();
        } else {
            return res.status(403).json('You are not alowed to do that!');
        }
    })
}
const verifyTokenAndCheckAdmin = (req, res) => {
    let isAdmin = false
    const authHeader = req.headers.token; 

    if(authHeader){   
        //access token 값 만료 검증
        const token = authHeader.split(' ')[1];
        jwt.verify(token, process.env.JWT, (err, user) => {
            if (!err) {
                if (String(user.id) === req.params.id && user.isAdmin) {
                    isAdmin = true;
                }
            }
        })
    }
    return isAdmin;
}

module.exports = {verifyToken, verifyTokenAndAuthorization, verifyTokenAndAdmin, verifyTokenAndCheckAdmin}
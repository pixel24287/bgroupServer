const router = require('express').Router();
const jwt = require('jsonwebtoken');
//const redisClient = require('../redis')

//1. access token 만료, refresh token 만료 : 새로 로그인
//2. access token 만료, refresh token 만료되지 않음 : 새로운 access token을 발급
//3. access token 만료되지 않음, refresh token 만료 : 새로운 refresh token을 발급
//4. access token 만료되지 않음, refresh token 만료되지 않음 : refresh 할 필요 없음
router.get('/', async (req, res) => {
    const authHeader = req.headers.token; 
    const authRefreshHeader = req.headers.refreshtoken;

    let accessExpired = false;
    let refreshExpired = false;

    //header의 token 존재여부 확인
    if(authHeader && authRefreshHeader){

        //access token 값 만료 검증
        const token = authHeader.split(' ')[1];
        jwt.verify(token, process.env.JWT, (err, user) => {
            if (err) {
                //access token이 만료인지 확인
                if (err.message !== 'jwt expired') {
                    return res.status(403).json('token is not veried!');
                } else {
                    accessExpired = true;
                }
            }
        })

        //refresh token 값 만료 검증
        jwt.verify(authRefreshHeader, process.env.JWT, (err, refresh) => {
            if (err) {
                //access token이 만료인지 확인
                if (err.message !== 'jwt expired') {
                    return res.status(403).json('token is not veried!');
                } else {
                    refreshExpired = true;
                }
            }

        })
        
        if(accessExpired && refreshExpired) {
            //1
        } else if(accessExpired && !refreshExpired) {
            //2
        } else if(!accessExpired && refreshExpired) {
            //3
        } else if(!accessExpired && !refreshExpired) {
            //4
        }
        //refresh token이 만료가 아니라면 2. 새로운 access token 발급
        const accessToken = jwt.sign({
            id : refresh.id,
            isAdmin : refresh.isAdmin
        },
        process.env.JWT,
        {
            expiresIn : '1s'
        })
        return res.status(201).json({accessToken : accessToken})

    } else{
        return res.status(401).json('You are not authenticated!');
    }
})

router.get('/ssr', async (req, res) => {
    const authRefreshHeader = req.headers.refreshtoken;

    //header의 refresh token 존재여부 확인
    if(authRefreshHeader){
        //refresh token 값 만료 검증
        jwt.verify(authRefreshHeader, process.env.JWT, (err, refresh) => {
            //refresh token이 만료인지 확인, 1. 만료라면 새로 로그인
            if (err) {
                return res.status(403).json('refresh expired');
            }
            //refresh token이 만료가 아니라면 2. 새로운 access token 발급
            const accessToken = jwt.sign({
                id : refresh.id,
                isAdmin : refresh.isAdmin
            },
            process.env.JWT,
            {
                expiresIn : '15m'
            })
            return res.status(201).json({accessToken : accessToken})
        })
    } else{
        return res.status(401).json('You are not authenticated!');
    }
})

/*router.get('/:id', async (req, res, next) => {
    await redisClient.connect();
    const authHeader = req.headers.token; 
    const authRefreshHeader = req.headers.refreshtoken;
    const redisRefresh = await redisClient.get(req.params.id);

    //header의 token 존재여부 확인
    if(authHeader && authRefreshHeader){
        //redis의 저장값과 유저의 값 비교, 검증
        if (redisRefresh !== authRefreshHeader) return res.status(403).json('refresh token is not authenticated!');

        //access token 값 만료 검증
        const token = authHeader.split(' ')[1];
        jwt.verify(token, process.env.JWT, (err, user) => {
            //access token이 만료일때
            if (err) {
                //access token이 만료인지 확인
                if (err.message !== 'jwt expired') {
                    return res.status(403).json('token is not veried!');
                }

                //refresh token 값 만료 검증
                jwt.verify(authRefreshHeader, process.env.JWT, (err, refresh) => {
                    //refresh token이 만료인지 확인, 1. 만료라면 새로 로그인
                    if (err) {
                        return res.status(403).json(err);
                    }

                    //refresh token이 만료가 아니라면 2. 새로운 access token 발급
                    const accessToken = jwt.sign({
                        id : refresh.id,
                        isAdmin : refresh.isAdmin
                    },
                    process.env.JWT,
                    {
                        expiresIn : '1s'
                    })
                    return res.status(201).json({accessToken : accessToken})
                })
            }
            //access token이 만료가 아니라면 3. refresh 할 필요 없음
            else {
                return res.status(200).json('token is good.')
            }
        })
        
    } else{
        return res.status(401).json('You are not authenticated!');
    }
})*/

module.exports = router;
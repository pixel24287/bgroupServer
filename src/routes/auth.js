const router = require('express').Router();
const pool = require('../mysql');
//const redisClient = require('../redis')
const CryptoJS = require('crypto-js');
const jwt = require('jsonwebtoken');

const {verifyToken, verifyTokenAndAuthorization, verifyTokenAndAdmin, verifyTokenAndCheckAdmin} = require('./verifyToken');

router.post('/check/email', async(req, res) => {
    const conn = await pool.getConnection();
    try {
        await conn.beginTransaction();
        //emali 중복 조회
        const ins1 = await conn.query('SELECT EXISTS (SELECT email FROM `user` WHERE email = ? LIMIT 1) AS success', [req.body.email]);
        if (ins1[0][0].success) return res.status(401).json("Duplicate Email");
        conn.commit();
        return res.status(200).json("Good");
    } catch (err) {
        console.log(err);
        await conn.rollback()
        return res.status(500);
    } finally{
        conn.release();
    }
});

router.post('/check/user_id', async (req, res) => {
    const conn = await pool.getConnection();
    try {

        await conn.beginTransaction();
        //nick_name 중복 조회
        const ins1 = await conn.query('SELECT EXISTS (SELECT user_id FROM `user` WHERE user_id = ? LIMIT 1) AS success', [req.body.user_id]);
        if (ins1[0][0].success) return res.status(401).json("Duplicate ID");
        await conn.commit();
        return res.status(200).json("Good");

    } catch (err) {
        console.log(err)
        await conn.rollback();
        return res.status(500);
    } finally {
        conn.release()
    }
});

router.post('/register', async (req, res) => {
    //db에 넣을 객체 생성
    const newUser = {
        user_id : req.body.user_id,
        user_pw : CryptoJS.AES.encrypt(
            req.body.user_pw, process.env.CRYPTO
        ).toString(),
        email : req.body.email,
        email2 : req.body.email2,
        nick_name : req.body.nick_name,
        is_admin : 0,
    }

    const conn = await pool.getConnection()
    try {
        await conn.beginTransaction();

        //db에 users 객체 넣기
        const ins1 = await conn.query('INSERT INTO `user` SET ?', [newUser]);
        await conn.commit();
        return res.send('success').status(201);
    } catch (err) {
        console.log(err);
        await conn.rollback();
        return res.status(500);
    } finally {
        conn.release();
    }
});

router.post('/login', async (req, res) => {
    const conn = await pool.getConnection();
    //await redisClient.connect();
    try {
        await conn.beginTransaction();

        //nick_name으로 정보 조회
        const ins1 = await conn.query('SELECT id, nick_name, user_pw, email, is_admin FROM `user` WHERE user_id = ? LIMIT 1', [req.body.user_id]);
        const user = ins1[0][0];
        //값이 없다면 에러 전송
        if (!user) return res.status(401).json("Wrong credentials!");

        //db에 가져온 비밀번호와 유저가 입력한 비밀번호 일치 확인
        const hash_password = CryptoJS.AES.decrypt(
            user.user_pw, process.env.CRYPTO
        );
        const origin_password = hash_password.toString(CryptoJS.enc.Utf8);
        if (origin_password !== req.body.user_pw) return res.status(401).json("Wrong credentials!");
        
        //access token 발급
        const accessToken = jwt.sign({
            id : user.id,
            isAdmin : user.is_admin,
            nick_name : user.nick_name,
            email : user.email
        },
        process.env.JWT,
        {
            expiresIn : '99d'
        })

        //refresh token 발급
        const refreshToken = jwt.sign({
            id : user.id,
            isAdmin : user.is_admin,
            nick_name : user.nick_name,
            email : user.email,
            suspension : user.suspension
        },
            process.env.JWT,
        {
            expiresIn : '14d'
        })

        //refresh token이 redis에 있는지 확인 후 발급
        // const redisRefresh = await redisClient.get(user.id);
        // //redis refresh 만료 확인
        // let refreshToken
        // jwt.verify(redisRefresh, process.env.JWT, async (err, refresh) => {
        //     //로그아웃, 만료시 refresh token 새로 생성, 저장
        //     if (err) {
        //         refreshToken = jwt.sign({
        //             id : user.id,
        //             isAdmin : user.is_admin
        //         },
        //         process.env.JWT,
        //         {
        //             expiresIn : '14d'
        //         })
        //         //redis에 유저 id 값을 바탕으로 refresh token 저장
        //         await redisClient.set(user.id, refreshToken);
        //     } 
        //     //만료가 아니라면 redis에서 가져온 token 사용
        //     else {
        //         refreshToken = redisRefresh;
        //     }
        // })
        
        await conn.commit();
        return res.status(200).json({accessToken, refreshToken})
    } catch (err) {
        console.log(err);
        await conn.rollback();
        return res.status(500).json('error')
    } finally {
        await conn.release()
    }
})

//Get All User List
router.get('/all/:id', verifyTokenAndAdmin, async (req, res) => {
    const conn = await pool.getConnection();
    try {
        await conn.beginTransaction();
        const ins1 = await conn.query('SELECT * FROM `user`');
        await conn.commit();
        return res.status(201).json(ins1[0]);
    } catch(err) {
        console.log(err);
        await conn.rollback();
        return res.status(500).json('error');
    } finally {
        conn.release();
    }
});


module.exports = router;
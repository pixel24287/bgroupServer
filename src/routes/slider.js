const router = require('express').Router();
const {verifyToken, verifyTokenAndAuthorization, verifyTokenAndAdmin, verifyTokenAndCheckAdmin} = require('./verifyToken');
const pool = require('../mysql');
const multer = require('multer');
const multerS3 = require('multer-s3')
const aws = require('aws-sdk')

//multer image upload setting
//aws.S3 객체를 생성하고 s3에 담음 
const s3 = new aws.S3({
    accessKeyId: process.env.S3_ACCESS_KEY_ID,
    secretAccessKey: process.env.S3_SECRET_ACCESS_KEY,
    region: 'ap-northeast-2'
})

const upload = multer({
    storage: multerS3({
        s3: s3,
        bucket: 'bgroup.link',
        metadata: function (req, file, cb) {
            cb(null, {fieldName: file.fieldname});
        },
        key: function (req, file, cb) {
            cb(null, Date.now().toString())
        },
        acl: 'public-read-write'
    }),
    limits: { fileSize: 5 * 1024 * 1024 },
})

//Create
router.post('/', upload.array("files", 3), async (req, res) => {
    const conn = await pool.getConnection();
    try {
        await conn.beginTransaction();
        if (req.files.length > 0) {
            const newSlider = {
                title : req.files[0].originalname.split('.')[0],
                url : req.files[0].location
            }
            const ins1 = await conn.query('INSERT INTO `slider` SET ?', [newSlider]);
            await conn.commit();
            res.json(req.files[0]);
        }
    } catch(err) {
        console.log(err);
        await conn.rollback();
        return res.status(500).json('error');
    } finally {
        conn.release();
    }
})

//Get TotalPage
router.get('/total_page', async (req, res) => {
    const conn = await pool.getConnection();
    try {
        await conn.beginTransaction();
        const ins1 = await conn.query('SELECT COUNT(*) as count FROM `slider`')
        await conn.commit();
        return res.status(201).json(ins1[0][0].count);
    } catch(err) {
        console.log(err);
        await conn.rollback();
        return res.status(500).json('error');
    } finally {
        conn.release();
    }
});

//Get List
router.get('/all', async (req, res) => {
    const conn = await pool.getConnection();
    try {
        await conn.beginTransaction();
        const ins1 = await conn.query('SELECT * FROM `slider`;');
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

//Get List
router.get('/list/:id', async (req, res) => {
    const conn = await pool.getConnection();
    try {
        await conn.beginTransaction();
        const pageNumber = Number(req.params.id) * 12;
        const ins1 = await conn.query('SELECT * FROM `slider` LIMIT ?, 12;', [pageNumber]);
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

//Delete
router.delete('/:id', verifyTokenAndAdmin, async (req, res) => {
    const conn = await pool.getConnection();
    try {
        await conn.beginTransaction();
        await conn.query('DELETE FROM `slider` WHERE url = ?', [req.body.url]);
        console.log(req.body.url.split('/')[4])
        const params = {
            Bucket: "bgroup.link",
            Key: req.body.url.split('/')[4]
        };
        s3.deleteObject(params, function(err, data) {
            if (err) console.log(err, err.stack);
            else console.log(data);
          });
        await conn.commit();
        return res.status(201).json('success');
    } catch(err) {
        console.log(err);
        await conn.rollback();
        return res.status(500).json('error');
    } finally {
        conn.release();
    }
});


module.exports = router
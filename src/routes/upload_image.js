const router = require('express').Router();
const {verifyToken, verifyTokenAndAuthorization, verifyTokenAndAdmin, verifyTokenAndCheckAdmin} = require('./verifyToken');
const multer = require('multer');
const multerS3 = require('multer-s3')
const aws = require('aws-sdk')
const pool = require('../mysql');

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


router.post('/',upload.array("files", 3), (req, res) => {
    try {
        if (req.files.length > 0) {
        res.json(req.files[0]);
        }
    } catch (err) {
        console.log(err)
        return res.status(500).json('error');
    }
})

//Delete Admin
router.delete('/admin/:id/:ids', verifyTokenAndAdmin, async (req, res) => {
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();
    await Promise.all(req.body.url.map(async (val, index) => {
      if(val.reply_count) {
      }
    }))
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
const router = require('express').Router();
const {verifyToken, verifyTokenAndAuthorization, verifyTokenAndAdmin, verifyTokenAndCheckAdmin} = require('./verifyToken');
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

//Delete
router.delete('/:id', verifyTokenAndAdmin, async (req, res) => {
  try {
    const params = {
        Bucket: "bgroup.link",
        Key: req.body.url.split('/')[4]
    };
    s3.deleteObject(params, function(err, data) {
        if (err) console.log(err, err.stack);
        else console.log(data);
      });
    return res.status(201).json('success');
  } catch(err) {
    console.log(err);
    return res.status(500).json('error');
  }
});

module.exports = router
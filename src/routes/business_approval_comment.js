const router = require('express').Router();
const pool = require('../mysql');
const {verifyToken, verifyTokenAndAuthorization, verifyTokenAndAdmin, verifyTokenAndCheckAdmin} = require('./verifyToken');

//Create
router.post('/:id', verifyTokenAndAuthorization, async (req, res) => {
    const conn = await pool.getConnection();
    try {
        await conn.beginTransaction();

        const verifyAdmin = verifyTokenAndCheckAdmin(req, res)
        if (verifyAdmin) {
            await conn.query('UPDATE business_approval SET admin_inquiry = 1 WHERE id = ?'
            , [req.body.post_id]);
        }
        
        const ins0 = await conn.query('SELECT nick_name FROM `user` WHERE id = ?', [req.params.id]);
        const newBusinessApprovalComment = {
            user_id : req.params.id,
            business_approval_id : req.body.post_id,
            description : req.body.descriptions,
            nick_name : ins0[0][0].nick_name,
            reply_count : 0,
            admin : verifyAdmin ? 1 : 0
        }
        const ins1 = await conn.query('INSERT INTO `business_approval_comment` SET ?', [newBusinessApprovalComment]);
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
//Create Reply
router.post('/reply/:id', verifyTokenAndAuthorization, async (req, res) => {
    const conn = await pool.getConnection();
    try {
        await conn.beginTransaction();
        const verifyAdmin = verifyTokenAndCheckAdmin(req, res)
        const ins0 = await conn.query('SELECT nick_name FROM `user` WHERE id = ?', [req.params.id]);
        const newBusinessApprovalReply = {
            user_id : req.params.id,
            business_approval_comment_id : req.body.comment_id,
            description : req.body.descriptions,
            nick_name : ins0[0][0].nick_name,
            admin : verifyAdmin ? 1 : 0
        }
        const ins1 = await conn.query('INSERT INTO `business_approval_reply` SET ?', [newBusinessApprovalReply]);
        const ins2 = await conn.query('SELECT reply_count FROM `business_approval_comment` WHERE id = ?', [req.body.comment_id]);
        const reply_count = ins2[0][0].reply_count + 1;
        const ins3 = await conn.query('UPDATE `business_approval_comment` SET reply_count = ? WHERE id = ?', [reply_count, req.body.comment_id]);
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

//Update Comment
router.put('/:id', verifyTokenAndAuthorization, async (req, res) => {
    const conn = await pool.getConnection();
    try {
        await conn.beginTransaction();
        await conn.query('UPDATE `business_approval_comment` SET `description` = ? WHERE id = ?', [req.body.description, req.body.comment_id]);
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

//Update Reply
router.put('/reply/:id', verifyTokenAndAuthorization, async (req, res) => {
    const conn = await pool.getConnection();
    try {
        await conn.beginTransaction();
        await conn.query('UPDATE `business_approval_reply` SET `description` = ? WHERE id = ?', [req.body.description, req.body.comment_id]);
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

//Delete Comment
router.delete('/:id', verifyTokenAndAuthorization, async (req, res) => {
    const conn = await pool.getConnection();
    try {
        await conn.beginTransaction();
        const ins1 = await conn.query('SELECT id FROM `business_approval_reply` WHERE business_approval_comment_id = ?', [req.body.comment_id]);
        await Promise.all(ins1[0].map(async () => {
            await conn.query('DELETE FROM `business_approval_reply` WHERE business_approval_comment_id = ?', [req.body.comment_id]);
        }))
        await conn.query('DELETE FROM `business_approval_comment` WHERE id = ?', [req.body.comment_id]);
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

//Delete Reply
router.delete('/reply/:id', verifyTokenAndAuthorization, async (req, res) => {
    const conn = await pool.getConnection();
    try {
        await conn.beginTransaction();
        await conn.query('DELETE FROM `business_approval_reply` WHERE id = ?', [req.body.comment_id]);
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
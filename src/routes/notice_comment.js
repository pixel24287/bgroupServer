const router = require('express').Router();
const pool = require('../mysql');
const {verifyToken, verifyTokenAndAuthorization, verifyTokenAndAdmin, verifyTokenAndCheckAdmin} = require('./verifyToken');

//Create
router.post('/:id', verifyTokenAndAuthorization, async (req, res) => {
    const conn = await pool.getConnection();
    try {
        await conn.beginTransaction();
        const verifyAdmin = verifyTokenAndCheckAdmin(req, res)
        const ins0 = await conn.query('SELECT nick_name FROM `user` WHERE id = ?', [req.params.id]);
        const newNoticeComment = {
            user_id : req.params.id,
            notice_id : req.body.post_id,
            description : req.body.descriptions,
            nick_name : ins0[0][0].nick_name,
            reply_count : 0,
            admin : verifyAdmin ? 1 : 0
        }
        const ins1 = await conn.query('INSERT INTO `notice_comment` SET ?', [newNoticeComment]);
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
        const newNoticeReply = {
            user_id : req.params.id,
            notice_comment_id : req.body.comment_id,
            description : req.body.descriptions,
            nick_name : ins0[0][0].nick_name,
            admin : verifyAdmin ? 1 : 0
        }
        const ins1 = await conn.query('INSERT INTO `notice_reply` SET ?', [newNoticeReply]);
        
        const ins2 = await conn.query('SELECT reply_count FROM `notice_comment` WHERE id = ?', [req.body.comment_id]);
        const reply_count = ins2[0][0].reply_count + 1;
        const ins3 = await conn.query('UPDATE `notice_comment` SET reply_count = ? WHERE id = ?', [reply_count, req.body.comment_id]);
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
        await conn.query('UPDATE `notice_comment` SET `description` = ? WHERE id = ?', [req.body.description, req.body.comment_id]);
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
        await conn.query('UPDATE `notice_reply` SET `description` = ? WHERE id = ?', [req.body.description, req.body.comment_id]);
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
        const ins1 = await conn.query('SELECT id FROM `notice_reply` WHERE notice_comment_id = ?', [req.body.comment_id]);
        await Promise.all(ins1[0].map(async () => {
            await conn.query('DELETE FROM `notice_reply` WHERE notice_comment_id = ?', [req.body.comment_id]);
        }))
        await conn.query('DELETE FROM `notice_comment` WHERE id = ?', [req.body.comment_id]);
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
        await conn.query('DELETE FROM `notice_reply` WHERE id = ?', [req.body.comment_id]);
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
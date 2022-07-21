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
            await conn.query('UPDATE inquire SET admin_inquiry = 1 WHERE id = ?'
            , [req.body.post_id]);
        }

        const ins0 = await conn.query('SELECT nick_name FROM `user` WHERE id = ?', [req.params.id]);
        const newInquireComment = {
            user_id : req.params.id,
            inquire_id : req.body.post_id,
            description : req.body.descriptions,
            nick_name : ins0[0][0].nick_name,
            reply_count : 0,
            admin : verifyAdmin ? 1 : 0
        }
        const ins1 = await conn.query('INSERT INTO `inquire_comment` SET ?', [newInquireComment]);
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
        const newInquireReply = {
            user_id : req.params.id,
            inquire_comment_id : req.body.comment_id,
            description : req.body.descriptions,
            nick_name : ins0[0][0].nick_name,
            admin : verifyAdmin ? 1 : 0
        }
        const ins1 = await conn.query('INSERT INTO `inquire_reply` SET ?', [newInquireReply]);
        const ins2 = await conn.query('SELECT reply_count FROM `inquire_comment` WHERE id = ?', [req.body.comment_id]);
        const reply_count = ins2[0][0].reply_count + 1;
        const ins3 = await conn.query('UPDATE `inquire_comment` SET reply_count = ? WHERE id = ?', [reply_count, req.body.comment_id]);
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
        await conn.query('UPDATE `inquire_comment` SET `description` = ? WHERE id = ?', [req.body.description, req.body.comment_id]);
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
        await conn.query('UPDATE `inquire_reply` SET `description` = ? WHERE id = ?', [req.body.description, req.body.comment_id]);
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
        const ins1 = await conn.query('SELECT id FROM `inquire_reply` WHERE inquire_comment_id = ?', [req.body.comment_id]);
        await Promise.all(ins1[0].map(async () => {
            await conn.query('DELETE FROM `inquire_reply` WHERE inquire_comment_id = ?', [req.body.comment_id]);
        }))
        await conn.query('DELETE FROM `inquire_comment` WHERE id = ?', [req.body.comment_id]);
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
        await conn.query('DELETE FROM `question_reply` WHERE id = ?', [req.body.comment_id]);
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
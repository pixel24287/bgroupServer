const router = require('express').Router();
const pool = require('../mysql');
const {verifyToken, verifyTokenAndAuthorization, verifyTokenAndAdmin, verifyTokenAndCheckAdmin} = require('./verifyToken');

//Create
router.post('/:id', verifyTokenAndAdmin, async (req, res) => {
    const conn = await pool.getConnection();
    try {
        await conn.beginTransaction();
        const ins0 = await conn.query('SELECT nick_name FROM `user` WHERE id = ?', [req.params.id]);
        const newNotice = {
            user_id : req.params.id,
            title : req.body.title,
            descriptions : req.body.descriptions,
            search_descriptions : req.body.search_descriptions,
            main : 0,
            nick_name : ins0[0][0].nick_name
        }
        const ins1 = await conn.query('INSERT INTO `notice` SET ?', [newNotice]);
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

//Get Check List TotalPage
router.get('/list/total_page', async (req, res) => {
    const conn = await pool.getConnection();
    try {
        await conn.beginTransaction();
        const ins1 = await conn.query('SELECT COUNT(*) as count FROM `notice` WHERE main = 0;')
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
router.get('/list/:id', async (req, res) => {
    const conn = await pool.getConnection();
    try {
        await conn.beginTransaction();
        const pageNumber = Number(req.params.id) * 10;
        const ins1 = await conn.query('SELECT id, user_id, title, nick_name, created_at FROM `notice` LIMIT ?, 10;', [pageNumber]);
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

//Get Search List
router.post('/list/search/:id', async (req, res) => {
    const conn = await pool.getConnection();
    try {
        await conn.beginTransaction();
        const pageNumber = Number(req.params.id) * 10;
        let list
        let count
        const search = `%${req.body.search}%`
        if(req.body.select === 'title+desc') {
            const ins1 = await conn.query(`SELECT * FROM notice WHERE title LIKE ? OR search_descriptions LIKE ? LIMIT ?, 10;`, [search, search, pageNumber]);
            const ins2 = await conn.query(`SELECT COUNT(*) as count FROM notice WHERE title LIKE ? OR search_descriptions LIKE ?;`, [search, search]);
            list = ins1[0]
            count = ins2[0][0].count
        } else if(req.body.select === 'title') {
            const ins1 = await conn.query(`SELECT * FROM notice WHERE title LIKE ? LIMIT ?, 10;`, [search, pageNumber]);
            const ins2 = await conn.query(`SELECT COUNT(*) as count FROM notice WHERE title LIKE ?;`, [search]);
            list = ins1[0]
            count = ins2[0][0].count
        } else if(req.body.select === 'desc') {
            const ins1 = await conn.query(`SELECT * FROM notice WHERE search_descriptions LIKE ? LIMIT ?, 10;`, [search, pageNumber]);
            const ins2 = await conn.query(`SELECT COUNT(*) as count FROM notice WHERE search_descriptions LIKE ?;`, [search]);
            list = ins1[0]
            count = ins2[0][0].count
        } else if(req.body.select === 'nick_name') {
            const ins1 = await conn.query(`SELECT * FROM notice WHERE nick_name LIKE ? LIMIT ?, 10;`, [search, pageNumber]);
            const ins2 = await conn.query(`SELECT COUNT(*) as count FROM notice WHERE nick_name LIKE ?;`, [search]);
            list = ins1[0]
            count = ins2[0][0].count
        } else {
            return res.status(404).json('select error')
        }
        await conn.commit();

        return res.status(201).json({list : list, count : count});
    } catch(err) {
        console.log(err);
        await conn.rollback();
        return res.status(500).json('error');
    } finally {
        conn.release();
    }
});


//Get TotalPage
router.get('/total_page', async (req, res) => {
    const conn = await pool.getConnection();
    try {
        await conn.beginTransaction();
        const ins1 = await conn.query('SELECT COUNT(*) as count FROM `notice`')
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

//Get Data
router.get('/:id', async (req, res) => {
    const conn = await pool.getConnection();
    try {
        await conn.beginTransaction();
        const ins1 = await conn.query('SELECT * FROM `notice` WHERE id = ?', [req.params.id]);
        const ins2 = await conn.query('SELECT * FROM `notice_comment` WHERE notice_id = ?', [req.params.id]);
        const comment = await Promise.all(ins2[0].map(async (val, index) => {
            if(val.reply_count) {
                const ins3 = await conn.query('SELECT * FROM `notice_reply` WHERE notice_comment_id = ?', [val.id]);
                val.reply = ins3[0]
            }
            return val
        }))
        await conn.commit();
        return res.status(201).json({notice : ins1[0][0], comment : comment});
    } catch(err) {
        console.log(err);
        await conn.rollback();
        return res.status(500).json('error');
    } finally {
        conn.release();
    }
});

//Update Data
router.put('/:id', verifyTokenAndAdmin, async (req, res) => {
    const conn = await pool.getConnection();
    try {
        await conn.beginTransaction();
        await conn.query('UPDATE notice SET `title` = ?, `descriptions` = ?, `search_descriptions` = ? WHERE id = ? AND user_id = ?', [req.body.title, req.body.descriptions, req.body.search_descriptions, req.body.postId, req.params.id]);
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

//Delete Data
router.delete('/:id', verifyTokenAndAdmin, async (req, res) => {
    const conn = await pool.getConnection();
    try {
        await conn.beginTransaction();
        const ins1 = await conn.query('SELECT id, reply_count FROM `notice_comment` WHERE notice_id = ?', [req.body.postId]);
        await Promise.all(ins1[0].map(async (val, index) => {
            if(val.reply_count) {
                await conn.query('DELETE FROM `notice_reply` WHERE notice_comment_id = ?', [val.id]);
            }
        }))
        await conn.query('DELETE FROM `notice_comment` WHERE notice_id = ?', [req.body.postId]);
        await conn.query('DELETE FROM `notice` WHERE id = ?', [req.body.postId]);
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

//Create Notice Main
router.post('/main/:id', verifyTokenAndAdmin, async (req, res) => {
    const conn = await pool.getConnection();
    try {
        await conn.beginTransaction();
        await conn.query('UPDATE notice SET `main` = 1 WHERE id = ?', [req.body.id]);
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

//Get Notice Main List
router.get('/main/list', async (req, res) => {
    const conn = await pool.getConnection();
    try {
        await conn.beginTransaction();
        const ins1 = await conn.query('SELECT id, user_id, title, nick_name, created_at FROM `notice` WHERE `main` = 1;');
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

//Get Notice Not Main List
router.get('/not/main/list/:id', async (req, res) => {
    const conn = await pool.getConnection();
    try {
        await conn.beginTransaction();
        const pageNumber = Number(req.params.id) * 10;
        const ins1 = await conn.query('SELECT id, user_id, title, nick_name, created_at FROM `notice` WHERE `main` = 0 LIMIT ?, 10;', [pageNumber]);
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

//Delete Notice Main
router.put('/main/:id/:ids', verifyTokenAndAdmin, async (req, res) => {
    const conn = await pool.getConnection();
    try {
        await conn.beginTransaction();
        await conn.query('UPDATE notice SET `main` = 0 WHERE id = ?', [req.params.ids]);
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
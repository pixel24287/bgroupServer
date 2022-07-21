const router = require('express').Router();
const pool = require('../mysql');
const {verifyToken, verifyTokenAndAuthorization, verifyTokenAndAdmin, verifyTokenAndCheckAdmin} = require('./verifyToken');

//Create
router.post('/:id', verifyTokenAndAuthorization, async (req, res) => {
    const conn = await pool.getConnection();
    try {
        await conn.beginTransaction();
        const ins0 = await conn.query('SELECT nick_name FROM `user` WHERE id = ?', [req.params.id]);
        const newOrderRegistration = {
            user_id : req.params.id,
            title : req.body.title,
            descriptions : req.body.descriptions,
            search_descriptions : req.body.search_descriptions,
            nick_name : ins0[0][0].nick_name,
            admin_inquiry : 0
        }
        const ins1 = await conn.query('INSERT INTO `order_registration` SET ?', [newOrderRegistration]);
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

//Get Check List
router.get('/check/:id', async (req, res) => {
    const conn = await pool.getConnection();
    try {
        await conn.beginTransaction();
        const pageNumber = Number(req.params.id) * 10;
        const ins1 = await conn.query('SELECT id, title, nick_name, admin_inquiry, created_at FROM `order_registration` WHERE admin_inquiry = 1 LIMIT ?, 10;', [pageNumber]);
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

//Get No Check List
router.get('/no/check', async (req, res) => {
    const conn = await pool.getConnection();
    try {
        await conn.beginTransaction();
        const ins1 = await conn.query('SELECT id, title, nick_name, admin_inquiry, created_at FROM `order_registration` WHERE admin_inquiry = 0;');
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

//Get Check List 
router.get('/check_user/:id/:ids', async (req, res) => {
    const conn = await pool.getConnection();
    try {
        await conn.beginTransaction();
        const pageNumber = Number(req.params.id) * 10;
        const ins1 = await conn.query('SELECT id, title, nick_name, admin_inquiry, created_at FROM `order_registration` WHERE admin_inquiry = 1 AND nick_name = ? LIMIT ?, 10;', [req.params.ids, pageNumber]);
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

//Get No Check List
router.get('/no/check_user/:ids', async (req, res) => {
    const conn = await pool.getConnection();
    try {
        await conn.beginTransaction();
        const ins1 = await conn.query('SELECT id, title, nick_name, admin_inquiry, created_at FROM `order_registration` WHERE admin_inquiry = 0 AND nick_name = ?;', [req.params.ids]);
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

//Get All Check List
router.get('/check/list/:id', verifyTokenAndAdmin, async (req, res) => {
    const conn = await pool.getConnection();
    try {
        await conn.beginTransaction();
        const ins1 = await conn.query('SELECT * FROM `order_registration` WHERE admin_inquiry = 1;');
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

//Get All No Check List
router.get('/no/check/list/:id', verifyTokenAndAdmin, async (req, res) => {
    const conn = await pool.getConnection();
    try {
        await conn.beginTransaction();
        const ins1 = await conn.query('SELECT * FROM `order_registration` WHERE admin_inquiry = 0;');
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

//Get Check List TotalPage
router.get('/list/total_page', async (req, res) => {
    const conn = await pool.getConnection();
    try {
        await conn.beginTransaction();
        const ins1 = await conn.query('SELECT COUNT(*) as count FROM `order_registration` WHERE admin_inquiry = 1;')
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

//Get Check List TotalPage
router.get('/list/total_page/:id', async (req, res) => {
    const conn = await pool.getConnection();
    try {
        await conn.beginTransaction();
        const ins1 = await conn.query('SELECT COUNT(*) as count FROM `order_registration` WHERE admin_inquiry = 1 AND nick_name = ?;', [req.params.id])
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
        const ins1 = await conn.query('SELECT id, user_id, title, nick_name, admin_inquiry, created_at FROM `order_registration` LIMIT ?, 10;', [pageNumber]);
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
            const ins1 = await conn.query(`SELECT * FROM order_registration WHERE title LIKE ? OR search_descriptions LIKE ? LIMIT ?, 10;`, [search, search, pageNumber]);
            const ins2 = await conn.query(`SELECT COUNT(*) as count FROM order_registration WHERE title LIKE ? OR search_descriptions LIKE ?;`, [search, search]);
            list = ins1[0]
            count = ins2[0][0].count
        } else if(req.body.select === 'title') {
            const ins1 = await conn.query(`SELECT * FROM order_registration WHERE title LIKE ? LIMIT ?, 10;`, [search, pageNumber]);
            const ins2 = await conn.query(`SELECT COUNT(*) as count FROM order_registration WHERE title LIKE ?;`, [search]);
            list = ins1[0]
            count = ins2[0][0].count
        } else if(req.body.select === 'desc') {
            const ins1 = await conn.query(`SELECT * FROM order_registration WHERE search_descriptions LIKE ? LIMIT ?, 10;`, [search, pageNumber]);
            const ins2 = await conn.query(`SELECT COUNT(*) as count FROM order_registration WHERE search_descriptions LIKE ?;`, [search]);
            list = ins1[0]
            count = ins2[0][0].count
        } else if(req.body.select === 'nick_name') {
            const ins1 = await conn.query(`SELECT * FROM order_registration WHERE nick_name LIKE ? LIMIT ?, 10;`, [search, pageNumber]);
            const ins2 = await conn.query(`SELECT COUNT(*) as count FROM order_registration WHERE nick_name LIKE ?;`, [search]);
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
        const ins1 = await conn.query('SELECT COUNT(*) as count FROM `order_registration`')
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
router.get('/:id/:ids', verifyTokenAndAuthorization, async (req, res) => {
    const conn = await pool.getConnection();
    try {
        await conn.beginTransaction();
        const ins1 = await conn.query('SELECT * FROM `order_registration` WHERE id = ?', [req.params.ids]);
        const ins2 = await conn.query('SELECT * FROM `order_registration_comment` WHERE order_registration_id = ?', [req.params.ids]);
        const comment = await Promise.all(ins2[0].map(async (val, index) => {
            if(val.reply_count) {
                const ins3 = await conn.query('SELECT * FROM `order_registration_reply` WHERE order_registration_comment_id = ?', [val.id]);
                val.reply = ins3[0]
            }
            return val
        }))
        await conn.commit();
        return res.status(201).json({order_registration : ins1[0][0], comment : comment});
    } catch(err) {
        console.log(err);
        await conn.rollback();
        return res.status(500).json('error');
    } finally {
        conn.release();
    }
});

//Update Data
router.put('/:id', verifyTokenAndAuthorization, async (req, res) => {
    const conn = await pool.getConnection();
    try {
        await conn.beginTransaction();
        await conn.query('UPDATE order_registration SET `title` = ?, `descriptions` = ?, `search_descriptions` = ? WHERE id = ? AND user_id = ?'
        , [req.body.title, req.body.descriptions, req.body.search_descriptions, req.body.postId, req.params.id]);
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

router.delete('/:id', verifyTokenAndAuthorization, async (req, res) => {
    const conn = await pool.getConnection();
    try {
        await conn.beginTransaction();
        const ins1 = await conn.query('SELECT id, reply_count FROM `order_registration_comment` WHERE order_registration_id = ?', [req.body.postId]);
        await Promise.all(ins1[0].map(async (val, index) => {
            if(val.reply_count) {
                await conn.query('DELETE FROM `order_registration_reply` WHERE order_registration_comment_id = ?', [val.id]);
            }
        }))
        await conn.query('DELETE FROM `order_registration_comment` WHERE order_registration_id = ?', [req.body.postId]);
        await conn.query('DELETE FROM `order_registration` WHERE id = ?', [req.body.postId]);
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
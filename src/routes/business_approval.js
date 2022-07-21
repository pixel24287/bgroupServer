const router = require('express').Router();
const pool = require('../mysql');
const {verifyToken, verifyTokenAndAuthorization, verifyTokenAndAdmin, verifyTokenAndCheckAdmin} = require('./verifyToken');

//Create
router.post('/create', async (req, res) => {
    const conn = await pool.getConnection();
    try {
        await conn.beginTransaction();
        const newBusinessApproval = {
            title : req.body.title,
            name : req.body.name,
            nick_name : req.body.nick_name,
            password : req.body.password,
            email : req.body.email,
            phone_number : req.body.phone_number,
            key_sales_channel : req.body.key_sales_channel,
            descriptions : req.body.descriptions,
            search_descriptions : req.body.search_descriptions,
            admin_inquiry : 0
        }
        const ins1 = await conn.query('INSERT INTO `business_approval` SET ?', [newBusinessApproval]);
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
        const ins1 = await conn.query('SELECT id, title, nick_name, admin_inquiry, created_at FROM `business_approval` WHERE admin_inquiry = 1 LIMIT ?, 10;', [pageNumber]);
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
        const ins1 = await conn.query('SELECT id, title, nick_name, admin_inquiry, created_at FROM `business_approval` WHERE admin_inquiry = 0;');
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
        const ins1 = await conn.query('SELECT id, title, nick_name, admin_inquiry, created_at FROM `business_approval` WHERE admin_inquiry = 1 AND nick_name = ? LIMIT ?, 10;', [req.params.ids, pageNumber]);
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
        const ins1 = await conn.query('SELECT id, title, nick_name, admin_inquiry, created_at FROM `business_approval` WHERE admin_inquiry = 0 AND nick_name = ?;', [req.params.ids]);
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
        const ins1 = await conn.query('SELECT * FROM `business_approval` WHERE admin_inquiry = 1;');
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
        const ins1 = await conn.query('SELECT * FROM `business_approval` WHERE admin_inquiry = 0;');
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
        const ins1 = await conn.query('SELECT COUNT(*) as count FROM `business_approval` WHERE admin_inquiry = 1;')
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
        const ins1 = await conn.query('SELECT COUNT(*) as count FROM `business_approval` WHERE admin_inquiry = 1 AND nick_name = ?;', [req.params.id])
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
        const ins1 = await conn.query('SELECT id, title, nick_name, admin_inquiry, created_at FROM `business_approval` LIMIT ?, 10;', [pageNumber]);
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
            const ins1 = await conn.query(`SELECT * FROM business_approval WHERE title LIKE ? OR search_descriptions LIKE ? LIMIT ?, 10;`, [search, search, pageNumber]);
            const ins2 = await conn.query(`SELECT COUNT(*) as count FROM business_approval WHERE title LIKE ? OR search_descriptions LIKE ?;`, [search, search]);
            list = ins1[0]
            count = ins2[0][0].count
        } else if(req.body.select === 'title') {
            const ins1 = await conn.query(`SELECT * FROM business_approval WHERE title LIKE ? LIMIT ?, 10;`, [search, pageNumber]);
            const ins2 = await conn.query(`SELECT COUNT(*) as count FROM business_approval WHERE title LIKE ?;`, [search]);
            list = ins1[0]
            count = ins2[0][0].count
        } else if(req.body.select === 'desc') {
            const ins1 = await conn.query(`SELECT * FROM business_approval WHERE search_descriptions LIKE ? LIMIT ?, 10;`, [search, pageNumber]);
            const ins2 = await conn.query(`SELECT COUNT(*) as count FROM business_approval WHERE search_descriptions LIKE ?;`, [search]);
            list = ins1[0]
            count = ins2[0][0].count
        } else if(req.body.select === 'nick_name') {
            const ins1 = await conn.query(`SELECT * FROM business_approval WHERE nick_name LIKE ? LIMIT ?, 10;`, [search, pageNumber]);
            const ins2 = await conn.query(`SELECT COUNT(*) as count FROM business_approval WHERE nick_name LIKE ?;`, [search]);
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
        const ins1 = await conn.query('SELECT COUNT(*) as count FROM `business_approval`')
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
router.get('/:id/:ids/:idx', async (req, res) => {
    //id : 유저 id (check admin)
    //ids : post id
    //idx : password
    const conn = await pool.getConnection();
    try {
        await conn.beginTransaction();
        const verifyAdmin = verifyTokenAndCheckAdmin(req, res)
        const ins1 = await conn.query('SELECT * FROM `business_approval` WHERE id = ?', [req.params.ids]);
        if (verifyAdmin || ins1[0][0].password === req.params.idx) {
            const ins2 = await conn.query('SELECT * FROM `business_approval_comment` WHERE business_approval_id = ?', [req.params.ids]);
            const comment = await Promise.all(ins2[0].map(async (val, index) => {
                if(val.reply_count) {
                    const ins3 = await conn.query('SELECT * FROM `business_approval_reply` WHERE business_approval_comment_id = ?', [val.id]);
                    val.reply = ins3[0]
                }
                return val
            }))
            await conn.commit();
            return res.status(201).json({business_approval : ins1[0][0], comment : comment});
        } else {
            await conn.commit();
            return res.status(404).json('password is wrong');
        }
        
    } catch(err) {
        console.log(err);
        await conn.rollback();
        return res.status(500).json('error');
    } finally {
        conn.release();
    }
});

//Update Data
router.put('/:id/:ids/:idx', async (req, res) => {
    const conn = await pool.getConnection();
    try {
        await conn.beginTransaction();
        const verifyAdmin = verifyTokenAndCheckAdmin(req, res)
        const ins1 = await conn.query('SELECT * FROM `business_approval` WHERE id = ?', [req.params.ids]);
        if (verifyAdmin || ins1[0][0].password === req.params.idx) {
            
            await conn.query('UPDATE business_approval SET `title` = ?, `nick_name` = ?, `name` = ?, `password` = ?, email = ?, phone_number = ?, key_sales_channel = ?, descriptions = ?, search_descriptions = ? WHERE id = ?'
            , [req.body.title, req.body.nick_name, req.body.name, req.body.password, req.body.email, req.body.phone_number, req.body.key_sales_channel, req.body.descriptions, req.body.search_descriptions, req.params.ids]);
            await conn.commit();
            return res.status(201).json('success');
        } else {
            await conn.commit();
            return res.status(404).json('password is wrong');
        }
    } catch(err) {
        console.log(err);
        await conn.rollback();
        return res.status(500).json('error');
    } finally {
        conn.release();
    }
});

router.delete('/:id/:ids/:idx', async (req, res) => {
    const conn = await pool.getConnection();
    try {
        await conn.beginTransaction();
        const verifyAdmin = verifyTokenAndCheckAdmin(req, res)
        const ins1 = await conn.query('SELECT * FROM `business_approval` WHERE id = ?', [req.params.ids]);
        if (verifyAdmin || ins1[0][0].password === req.params.idx) {
            const ins2 = await conn.query('SELECT id, reply_count FROM `business_approval_comment` WHERE business_approval_id = ?', [req.body.postId]);
            await Promise.all(ins2[0].map(async (val, index) => {
                if(val.reply_count) {
                    await conn.query('DELETE FROM `business_approval_reply` WHERE business_approval_comment_id = ?', [val.id]);
                }
            }))
            await conn.query('DELETE FROM `business_approval_comment` WHERE business_approval_id = ?', [req.body.postId]);
            await conn.query('DELETE FROM `business_approval` WHERE id = ?', [req.body.postId]);
            await conn.commit();
            return res.status(201).json('success');
        } else {
            await conn.commit();
            return res.status(404).json('password is wrong');
        }
    } catch(err) {
        console.log(err);
        await conn.rollback();
        return res.status(500).json('error');
    } finally {
        conn.release();
    }
});

module.exports = router
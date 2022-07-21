const router = require('express').Router();
const pool = require('../mysql');
const {verifyToken, verifyTokenAndAuthorization, verifyTokenAndAdmin, verifyTokenAndCheckAdmin} = require('./verifyToken');

//Create
router.post('/:id/:list_id', verifyTokenAndAdmin, async (req, res) => {
    const conn = await pool.getConnection();
    try {
        await conn.beginTransaction();
        const ins0 = await conn.query('SELECT product_list.delete_list FROM product_list, product_post WHERE product_post.id = ? AND product_post.list_id = product_list.id', [req.body.postId])
        if(ins0[0][0].delete_list) {
            await conn.commit();
            return res.status(405).json('delete');
        }
        const ins1 = await conn.query('SELECT nick_name FROM `user` WHERE id = ?', [req.params.id]);
        const newProduct = {
            user_id : req.params.id,
            list_id : req.params.list_id,
            title : req.body.title,
            descriptions : req.body.descriptions,
            search_descriptions : req.body.search_descriptions,
            nick_name : ins1[0][0].nick_name
        }
        const ins2 = await conn.query('INSERT INTO `product_post` SET ?', [newProduct]);
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

//Get Data List
router.get('/data_list', async (req, res) => {
    const conn = await pool.getConnection();
    try {
        await conn.beginTransaction();
        const ins1 = await conn.query('SELECT id, title FROM `product_list` WHERE delete_list = 0;');
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

//Get Delete Data List
router.get('/delete/data_list', async (req, res) => {
    const conn = await pool.getConnection();
    try {
        await conn.beginTransaction();
        const ins1 = await conn.query('SELECT id, title FROM `product_list` WHERE delete_list = 1;');
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
router.get('/list/:id/:ids', async (req, res) => {
    const conn = await pool.getConnection();
    try {
        await conn.beginTransaction();
        const ins0 = await conn.query('SELECT delete_list FROM `product_list` WHERE id = ?', [req.params.ids]);
        if (ins0[0][0].delete_list) {
            await conn.commit();
            return res.status(405).json('delete');
        }
        const pageNumber = Number(req.params.id) * 10;
        const ins1 = await conn.query('SELECT id, user_id, title, nick_name, created_at FROM `product_post` WHERE list_id=? LIMIT ?, 10;', [req.params.ids, pageNumber]);
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
router.post('/list/search/:id/:ids', async (req, res) => {
    const conn = await pool.getConnection();
    try {
        await conn.beginTransaction();
        const pageNumber = Number(req.params.id) * 10;
        let list
        let count
        const search = `%${req.body.search}%`
        const ins0 = await conn.query('SELECT delete_list FROM `product_list` WHERE id = ?', [req.params.ids]);
        if (ins0[0][0].delete_list) {
            await conn.commit();
            return res.status(405).json('delete');
        }
        if(req.body.select === 'title+desc') {
            const ins1 = await conn.query(`SELECT * FROM product_post WHERE list_id=? AND (title LIKE ? OR search_descriptions LIKE ?) LIMIT ?, 10;`, [req.params.ids, search, search, pageNumber]);
            const ins2 = await conn.query(`SELECT COUNT(*) as count FROM product_post WHERE list_id=? AND (title LIKE ? OR search_descriptions LIKE ?);`, [req.params.ids, search, search]);
            list = ins1[0]
            count = ins2[0][0].count
        } else if(req.body.select === 'title') {
            const ins1 = await conn.query(`SELECT * FROM product_post WHERE list_id=? AND title LIKE ? LIMIT ?, 10;`, [req.params.ids, search, pageNumber]);
            const ins2 = await conn.query(`SELECT COUNT(*) as count FROM product_post WHERE list_id=? AND title LIKE ?;`, [req.params.ids, search]);
            list = ins1[0]
            count = ins2[0][0].count
        } else if(req.body.select === 'desc') {
            const ins1 = await conn.query(`SELECT * FROM product_post WHERE list_id=? AND search_descriptions LIKE ? LIMIT ?, 10;`, [req.params.ids, search, pageNumber]);
            const ins2 = await conn.query(`SELECT COUNT(*) as count FROM product_post WHERE list_id=? AND search_descriptions LIKE ?;`, [req.params.ids, search]);
            list = ins1[0]
            count = ins2[0][0].count
        } else if(req.body.select === 'nick_name') {
            const ins1 = await conn.query(`SELECT * FROM product_post WHERE list_id=? AND nick_name LIKE ? LIMIT ?, 10;`, [req.params.ids, search, pageNumber]);
            const ins2 = await conn.query(`SELECT COUNT(*) as count FROM product_post WHERE list_id=? AND nick_name LIKE ?;`, [req.params.ids, search]);
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
router.get('/total_page/:ids', async (req, res) => {
    const conn = await pool.getConnection();
    try {
        await conn.beginTransaction();
        const ins0 = await conn.query('SELECT delete_list FROM `product_list` WHERE id = ?', [req.params.ids]);
        if (ins0[0][0].delete_list) {
            await conn.commit();
            return res.status(201).json(1);
        }
        const ins1 = await conn.query('SELECT COUNT(*) as count FROM product_post WHERE list_id=?',[req.params.ids])
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
        const ins0 = await conn.query('SELECT * FROM `product_post` WHERE id = ?', [req.params.id]);
        const ins1 = await conn.query('SELECT delete_list FROM `product_list` WHERE id = ?', [ins0[0][0].list_id]);
        if (ins1[0][0].delete_list) {
            await conn.commit();
            return res.status(405).json('delete');
        }
        const ins2 = await conn.query('SELECT * FROM `product_post_comment` WHERE product_post_id = ?', [req.params.id]);
        const comment = await Promise.all(ins2[0].map(async (val, index) => {
            if(val.reply_count) {
                const ins3 = await conn.query('SELECT * FROM `product_post_reply` WHERE product_post_comment_id = ?', [val.id]);
                val.reply = ins3[0]
            }
            return val
        }))
        await conn.commit();
        return res.status(201).json({product : ins0[0][0], comment : comment});
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
        const ins1 = await conn.query('SELECT product_list.delete_list FROM product_list, product_post WHERE product_post.id = ? AND product_post.list_id = product_list.id', [req.body.postId])
        if(ins1[0][0].delete_list) {
            await conn.commit();
            return res.status(405).json('delete');
        }
        await conn.query('UPDATE product_post SET `title` = ?, `descriptions` = ?, `search_descriptions` = ? WHERE id = ? AND user_id = ?', [req.body.title, req.body.descriptions, req.body.search_descriptions, req.body.postId, req.params.id]);
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

//Delete product
router.delete('/:id', verifyTokenAndAdmin, async (req, res) => {
    const conn = await pool.getConnection();
    try {
        await conn.beginTransaction();
        const ins0 = await conn.query('SELECT product_list.delete_list FROM product_list, product_post WHERE product_post.id = ? AND product_post.list_id = product_list.id', [req.body.postId])
        if(ins0[0][0].delete_list) {
            await conn.commit();
            return res.status(405).json('delete');
        }
        const ins1 = await conn.query('SELECT id, reply_count FROM `product_post_comment` WHERE product_post_id = ?', [req.body.postId]);
        await Promise.all(ins1[0].map(async (val, index) => {
            if(val.reply_count) {
                await conn.query('DELETE FROM `product_post_reply` WHERE product_post_comment_id = ?', [val.id]);
            }
        }))
        await conn.query('DELETE FROM `product_post_comment` WHERE product_post_id = ?', [req.body.postId]);
        await conn.query('DELETE FROM `product_post` WHERE id = ?', [req.body.postId]);
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


//Create Product List
router.post('/create/list/:id', verifyTokenAndAdmin, async (req, res) => {
    const conn = await pool.getConnection();
    try {
        await conn.beginTransaction();
        const newProduct = {
            user_id : req.params.id,
            title : req.body.title,
            delete_list : 0
        }
        const ins1 = await conn.query('INSERT INTO `product_list` SET ?', [newProduct]);
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

//Update Product List
router.put('/list/:id', verifyTokenAndAdmin, async (req, res) => {
    const conn = await pool.getConnection();
    try {
        await conn.beginTransaction();
        await conn.query('UPDATE product_list SET `title` = ? WHERE id = ?', [req.body.description, req.body.postId]);
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

//Delete product list
router.delete('/list/:id', verifyTokenAndAdmin, async (req, res) => {
    const conn = await pool.getConnection();
    try {
        await conn.beginTransaction();
        await conn.query('UPDATE product_list SET `delete_list` = 1 WHERE id = ?', [req.body.postId]);
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

//Restore Product List
router.put('/restore/list/:id', verifyTokenAndAdmin, async (req, res) => {
    const conn = await pool.getConnection();
    try {
        await conn.beginTransaction();
        await conn.query('UPDATE product_list SET `delete_list` = 0 WHERE id = ?', [req.body.postId]);
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
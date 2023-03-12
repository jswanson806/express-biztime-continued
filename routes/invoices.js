const express = require("express");
const app = require("../app");
const router = new express.Router();
const ExpressError = require('../expressError')
const db = require("../db");


router.get('/', async (req, res, next) => {
    try {
        const results = await db.query(`SELECT * FROM invoices`);
        if(results.rows.length === 0) {
            throw new ExpressError(`Cannot find users in table 'invoices`, 404);
        }
        console.log("HERE I AM")
        return res.send({invoices: results.rows})
    } catch(e) {
        next(e);
    }
})

router.get('/:id', async (req, res, next) => {
    const { id } = req.params;
    try {
        const results = await db.query(`SELECT * FROM invoices WHERE id=$1`, [id]);
        if(results.rows.length === 0) {
            throw new ExpressError(`Cannot find invoice with id ${id}`, 404);
        }
        return res.status(200).json({invoice: results.rows[0]});
    } catch(e) {
        next(e);
    }
})

router.post('/', async (req, res, next) => {
    try {
        const { comp_code, amt } = req.body;
        const results = await db.query(`INSERT INTO invoices (comp_code, amt) VALUES ($1, $2) RETURNING id, comp_code, amt, paid, add_date, paid_date`, [comp_code, amt]);
        return res.status(201).json({ "invoice": results.rows[0] });
    } catch(e) {
        next(e);
    }
})

router.put('/:id', async (req, res, next) => {
    try {
        const { id } = req.params;
        const { amt } = req.body;
        const results = await db.query(`UPDATE invoices SET amt=$1 WHERE id=$2 RETURNING id, comp_code, amt, paid, add_date, paid_date`, [amt, id]);
        if(results.rows.length === 0) {
            throw new ExpressError(`Cannot find company with id of ${id}`, 404);
        }
        return res.status(200).json({ "invoice": results.rows[0] });
    } catch(e) {
        next(e);
    }
})

router.delete('/:id', async (req, res, next) => {
    try {
        const { id } = req.params;
        const results = await db.query(`DELETE FROM invoices WHERE id=$1 RETURNING id`, [id]);
        if(results.rows.length === 0) {
            throw new ExpressError(`Cannot find invoice with id of ${id}`, 404);
        }
        return res.json({ "status": "deleted" });
        
    } catch(e){
        next(e);
    }
})



module.exports = router;
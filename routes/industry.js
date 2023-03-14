const express = require("express");
const app = require("../app");
const router = new express.Router();
const ExpressError = require('../expressError')
const db = require("../db");

router.get('/', async (req, res, next) => {
    try {
        const indResults = await db.query(`
        SELECT i.ind_code, i.industry, c.code
        FROM industry as i
        RIGHT JOIN company_industry AS ci
        ON i.ind_code = ci.industry_code
        INNER JOIN companies AS c
        ON ci.company_code = c.code`);

        if(indResults.rows.length === 0) {
            throw new ExpressError(`Cannot find any industries`, 404);
        }

        return res.status(200).json(indResults.rows);
    } catch(e) {
        next(e);
    }
})

router.post('/', async (req, res, next) => {
    try {
        const { ind_code, industry } = req.body;
        const results = await db.query(`INSERT INTO industry (ind_code, industry) VALUES ($1, $2) RETURNING industry_code, industry`, [ind_code, industry]);
        return res.status(201).json({ industry: { ind_code, industry } })
    } catch(e) {
        next(e);
    }
})

router.post('/:industry_code', async (req, res, next) => {
    try {
        const { industry_code } = req.params;
        const { company_code } = req.body; 
        const results = await db.query(`INSERT INTO company_industry (company_code, industry_code) VALUES ($1, $2) RETURNING company_code, industry_code`, [company_code, industry_code]);
        return res.status(201).json({industry: { company_code, industry_code }});
    } catch(e) {
        next(e);
    }
})

module.exports = router;


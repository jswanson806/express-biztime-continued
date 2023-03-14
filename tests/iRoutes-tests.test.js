process.env.NODE_ENV = "test";

const request = require("supertest");

const app = require("../app");

let db = require("../db")


beforeEach(async function() {
    await db.query("DELETE FROM invoices");

    await db.query(`INSERT INTO invoices (comp_Code, amt, paid, paid_date)
      VALUES ('apple', 100, false, null),
             ('apple', 200, false, null),
             ('apple', 300, true, '2018-01-01'),
             ('ibm', 400, false, null) RETURNING id`);
})

afterAll(async () => {
    await db.end();
})

describe("/GET /invoices", () => {
    test("Get all invoices", async () => {
        // query the invoices from test db
        const result = await request(app).get('/invoices');

        // check for status 200
        expect(result.statusCode).toBe(200);
        // length of results should be 4 (same as test data inserted in beforeEach)
        expect(result.body.invoices.length).toEqual(4);
    })

    test("Should throw 404 if no invoices are returned", async () => {
        // clear the invoices from test db
        await db.query("DELETE FROM invoices");
        // query the invoices
        const result = await request(app).get('/invoices');
        // invoices were deleted, expect 404 from thrown error
        expect(result.statusCode).toBe(404);
    })
})

describe("/GET /invoices:id", () => {
    test("Get single invoice by id", async () => {
        // get all of the invoices
        const iResult = await request(app).get(`/invoices`);
        // deconstruct id from first invoice returned
        const { id } = iResult.body.invoices[0];
        // request an invoice by id
        const result = await request(app).get(`/invoices/${id}`);

        // check for 200 status
        expect(result.statusCode).toBe(200);
        // check for the company to be 'apple'
        expect(result.body.invoice.comp_code).toEqual('apple');
        // check for the amt to be 100 (unique to the test db)
        expect(result.body.invoice.amt).toEqual(100);
    })

    test("Should throw 404 if no invoice is found by id", async () => {
        // query invoice with id of 1
        const result = await request(app).get('/invoices/1');
        // invoices are incrementing id PK, so invoice with id of 1 should not exist
        expect(result.statusCode).toBe(404);
    })
})

describe("/POST /invoices", () => {
    test("Create a new invoice", async () => {
        // query all invoices
        const iResult = await request(app).get(`/invoices`);
        // check for only 4 invoices returned
        expect(iResult.body.invoices.length).toEqual(4);

        // post request with new ibm invoice with amt of 400
        const results = await request(app)
        .post(`/invoices`)
        .send({comp_code: 'ibm', amt: 400});
    
        // check for status code 201
        expect(results.statusCode).toBe(201);

        // query all invoices
        const newResult = await request(app).get(`/invoices`);
        // check for 5 invoices returned
        expect(newResult.body.invoices.length).toEqual(5);
        // check for ibm on the last invoices added
        expect(newResult.body.invoices[4].comp_code).toEqual('ibm');
        // check for amt on last invoice added to be 400 (unique to this new invoice)
        expect(newResult.body.invoices[4].amt).toEqual(400);
    })
})

describe("/PUT /invoices:id", () => {
    test("Edit a specific invoice", async () => {
        // get all of the invoices
        const iResult = await request(app).get(`/invoices`);
        // deconstruct id from first invoice returned
        const { id } = iResult.body.invoices[0];
        // request an invoice by id
        const result = await request(app).get(`/invoices/${id}`);

        // check for the company to be 'apple'
        expect(result.body.invoice.comp_code).toEqual('apple');
        // check for the amt to be 100 (unique to the test db)
        expect(result.body.invoice.amt).toEqual(100);

        // put request for invoice with id destructured from iResult above
        const newResult = await request(app).put(`/invoices/${id}`).send({ amt: 500 });
        // check for status code 200
        expect(newResult.statusCode).toBe(200);
        // check for new amt to be 500
        expect(newResult.body.invoice.amt).toEqual(500);
    })

    test("Should throw 404 if no invoice is found by id", async () => {
        // query invoice with id of 1
        const result = await request(app).put('/invoices/1').send({ amt:500 });
        // invoices are incrementing id PK, so invoice with id of 1 should not exist
        expect(result.statusCode).toBe(404);
    })
})

describe("/DELETE /invoices:id", () => {
    test("Delete a specific invoice", async () => {
        // query all invoices
        const iResult = await request(app).get(`/invoices`);
        // check for 4 invoices returned
        expect(iResult.body.invoices.length).toEqual(4);
        // destructure id from first invoice returned
        const { id } = iResult.body.invoices[0];
        
        // delete request for invoice matching id
        const result = await request(app).delete(`/invoices/${id}`);

        // query all invoices
        const newResult = await request(app).get(`/invoices`);
        // check for only 3 invoices returned
        expect(newResult.body.invoices.length).toEqual(3);
    })
    test("Should throw 404 if no invoice is found by id", async () => {
        // query invoice with id of 1
        const result = await request(app).delete('/invoices/1');
        // invoices are incrementing id PK, so invoice with id of 1 should not exist
        expect(result.statusCode).toBe(404);
    })
})
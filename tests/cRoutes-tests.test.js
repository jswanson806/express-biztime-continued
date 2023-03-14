process.env.NODE_ENV = "test";

const request = require("supertest");

const app = require("../app");

let db = require("../db")


beforeEach(async function() {
    await db.query("DELETE FROM invoices");
    await db.query("DELETE FROM companies");

    await db.query(`INSERT INTO companies
    VALUES ('apple', 'Apple Computer', 'Maker of OSX.'),
            ('ibm', 'IBM', 'Big blue.')`);

    await db.query(`INSERT INTO invoices (comp_Code, amt, paid, paid_date)
      VALUES ('apple', 100, false, null),
             ('apple', 200, false, null),
             ('apple', 300, true, '2018-01-01'),
             ('ibm', 400, false, null) RETURNING id`);
})

afterAll(async () => {
    await db.end();
})

describe("/GET /companies", () => {
    test("Get all companies", async () => {
        // query the companies from test db
        const result = await request(app).get('/companies');

        // check for status 200
        expect(result.statusCode).toBe(200);
        // length of results should be 2 (same as test data inserted in beforeEach)
        expect(result.body.companies.length).toEqual(2);
    })

    test("Should throw 404 if no companies are returned", async () => {
        // clear the companies from test db
        await db.query("DELETE FROM companies");
        // query the companies
        const result = await request(app).get('/companies');
        // invoices were deleted, expect 404 from thrown error
        expect(result.statusCode).toBe(404);
    })
})

describe("/GET /companies:code", () => {
    test("Get single invoice by id", async () => {

        // request a company by code
        const result = await request(app).get(`/companies/apple`);

        // check for 200 status
        expect(result.statusCode).toBe(200);
        // check for the company name to be 'apple' (unique to the test db)
        expect(result.body.company.code).toEqual('apple');
    })

    test("company object should contain array of invoice id's in result.body.company", async () => {
        // request company by code
        const result = await request(app).get(`/companies/apple`);
        // check for invoices array with length of 3 (invoices inserted in beforeEach)
        expect(result.body.company.invoices.length).toEqual(3);
    })

    test("Should throw 404 if no company is found by code", async () => {
        // query company with code of 'hp'
        const result = await request(app).get('/companies/hp');
        // check for status 404
        expect(result.statusCode).toBe(404);
    })
})

describe("/POST /companies", () => {
    test("Create a new company", async () => {
        // query all companies
        const cResult = await request(app).get(`/companies`);
        // check for only 2 companies returned
        expect(cResult.body.companies.length).toEqual(2);

        // post request with new company
        const results = await request(app)
        .post(`/companies`)
        .send({code: 'hp', name: 'hewlitt packard', description: 'hardware maker'});
    
        // check for status code 201
        expect(results.statusCode).toBe(201);

        // query all companies
        const newResult = await request(app).get(`/companies`);
        // check for 3 companies returned
        expect(newResult.body.companies.length).toEqual(3);
        // check for company code 'hp' in last company added
        expect(newResult.body.companies[2].code).toEqual('hp');
    })
})

describe("/PUT /companies:code", () => {
    test("Edit a specific company", async () => {
        // get all of the companies
        const cResult = await request(app).get(`/companies`);
        // deconstruct code from first company returned
        const { code } = cResult.body.companies[0];
        // request the company by code
        const result = await request(app).get(`/companies/${code}`);

        // check for the company to be 'apple'
        expect(result.body.company.code).toEqual('apple');

        // put request for company with code destructured from cResult above
        const newResult = await request(app).put(`/companies/${code}`).send({ name: 'Google Inc.', description: 'They do the searches'});

        // check for status code 200
        expect(newResult.statusCode).toBe(200);
        // check for code to be "apple"
        expect(newResult.body.company.code).toEqual('apple');
        // check for name to be "Google Inc."
        expect(newResult.body.company.name).toEqual('Google Inc.');
    })

    test("Should throw 404 if no company is found by code", async () => {
        // query invoice with id of 1
        const result = await request(app).put('/companies/google').send({ name: 'Google Inc.', description: 'They do the searches'});
        // check for status 404
        expect(result.statusCode).toBe(404);
    })
})

describe("/DELETE /companies:code", () => {
    test("Delete a specific company", async () => {
        // query all companies
        const cResult = await request(app).get(`/companies`);
        // check for 4 invoices returned
        expect(cResult.body.companies.length).toEqual(2);
        // destructure code from first company returned
        const { code } = cResult.body.companies[0];
        
        // delete request for company matching code
        const result = await request(app).delete(`/companies/${code}`);

        // query all companies
        const newResult = await request(app).get(`/companies`);
        // check for only 1 company returned
        expect(newResult.body.companies.length).toEqual(1);
    })
    test("Should throw 404 if no company is found by code", async () => {
        // query company with code of 'google'
        const result = await request(app).delete('/companies/google');
        // check for status 404
        expect(result.statusCode).toBe(404);
    })
})
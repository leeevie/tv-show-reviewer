// Lab 9: testing

// Imports the server.js file to be tested.
let server = require("../server");
//Assertion (Test Driven Development) and Should, Expect(Behaviour driven development) library
let chai = require("chai");
// Chai HTTP provides an interface for live integration testing of the API's.
let chaiHttp = require("chai-http");
chai.should();
chai.use(chaiHttp); 
const { expect } = chai;
// var assert = chai.assert;

describe("Testing", () => {

    it("Search", done => {
        chai
        .request(server)
        .post("/searchTest").send(
            request = {
            title : "Prodigal Son"
        }) 
        .end((err, res) => {
            expect(res).to.have.status(200);
            // console.log(res);
            res.body.should.have.property("name").eq("Prodigal Son");
            res.body.should.have.property("genres");
            res.body.should.have.property("image");
            res.body.should.have.property("rating");
            res.body.should.have.property("summary");
            done();
        });
    });

    it("Add review", done => {
        chai
        .request(server)
        .post("/add-review").send(
            request = {
            show_name : "Prodigal Son",
            review : "Pretty coolio"
        }) 
        .end((err, res) => {
            expect(res).to.have.status(200);
            done();
        });
    });

    it("Load reviews", done => {
        chai
        .request(server)
        .get("/reviewsTest")
        .end((err, res) => {
            expect(res).to.have.status(200);
            // console.log(res.body);
            expect(res.body).length.should.not.be.eq(0); // since we added a review above
            done();
        });
    });

    it("Should get error for an invalid title search", done => {
        chai
        .request(server)
        .post("/searchTest").send(
            request = {
            title : "$"
        })
        .end((err, res) => {
            expect(res).to.have.status(404);
            done();
        });
    });

  });
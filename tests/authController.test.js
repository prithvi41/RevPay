const request = require("supertest");
const express = require("express");
const authController = require("../controller/authController");
const httpStatusCode = require("../utils/httpStatusCode");
const dbConnection = require("../utils/dbConnection");

// mock businessModel module
jest.mock("../model/business");
const businessModel = require("../model/business");

// mock bcrypt
jest.mock("bcrypt");
const bcrypt = require("bcrypt");

// mock jwtGenerator
jest.mock("../utils/jwtGenerator");
const jwt = require("../utils/jwtGenerator");

const app = express();
app.use(express.json());
// apis endpoints
app.post("/register", authController.registerBusiness);
app.post("/login", authController.loginBusiness);

describe("Auth Controller", () => {
    // for registering a business
    describe("registerBusiness", () => {
        beforeEach(() => {
            businessModel.getBusinessByUserName.mockClear();
            businessModel.createUser.mockClear();
            bcrypt.genSalt.mockClear();
            bcrypt.hash.mockClear();
        });

        afterAll(async () => {
            // Ensure any open handles are closed
            await dbConnection.end();
            jest.restoreAllMocks();
        });

        it("should return 400 if required fields are missing", async () => {
            const res = await request(app).post("/register").send({});
            expect(res.status).toBe(httpStatusCode.BAD_REQUEST);
            expect(res.text).toBe("missing required fields");
        });

        it("should return 401 if password length is less than 8", async () => {
            const res = await request(app)
                .post("/register")
                .send({ user_name: "test", password: "short", business_name: "test" });
            expect(res.status).toBe(httpStatusCode.UNAUTHORIZED);
            expect(res.text).toBe("minimum 8 length of password is required");
        });

        it("should return 400 if business already exists", async () => {
            businessModel.getBusinessByUserName.mockResolvedValue({ rows: [{}] });
            const res = await request(app)
                .post("/register")
                .send({
                    user_name: "test",
                    password: "password123",
                    business_name: "test",
                });
            expect(res.status).toBe(httpStatusCode.BAD_REQUEST);
            expect(res.text).toBe("business already registered");
        });

        it("should register a business and return 201", async () => {
            businessModel.getBusinessByUserName.mockResolvedValue({ rows: [] });
            bcrypt.genSalt.mockResolvedValue("salt");
            bcrypt.hash.mockResolvedValue("hashedpassword");
            businessModel.createUser.mockResolvedValue({});
            const res = await request(app)
                .post("/register")
                .send({
                    user_name: "test",
                    password: "password123",
                    business_name: "test",
                });
            expect(res.status).toBe(httpStatusCode.CREATED);
            expect(res.body.message).toBe("business registered successfully");
        });
    });

    // for logging in a business
    describe("loginBusiness", () => {
        beforeEach(() => {
            businessModel.getBusinessByUserName.mockClear();
            bcrypt.compare.mockClear();
            jwt.jwtGenerator.mockClear();
        });

        it("should return 400 if required fields are missing", async () => {
            const res = await request(app).post("/login").send({});
            expect(res.status).toBe(httpStatusCode.BAD_REQUEST);
            expect(res.text).toBe("missing required fields");
        });

        it("should return 400 if business is not registered", async () => {
            businessModel.getBusinessByUserName.mockResolvedValue({ rows: [] });
            const res = await request(app)
                .post("/login")
                .send({ user_name: "test", password: "password123" });
            expect(res.status).toBe(httpStatusCode.BAD_REQUEST);
            expect(res.text).toBe("business not registered");
        });

        it("should return 400 if password is wrong", async () => {
            businessModel.getBusinessByUserName.mockResolvedValue({
                rows: [{ password: "hashedpassword" }],
            });
            bcrypt.compare.mockResolvedValue(false);
            const res = await request(app)
                .post("/login")
                .send({ user_name: "test", password: "wrongpassword" });
            expect(res.status).toBe(httpStatusCode.BAD_REQUEST);
            expect(res.text).toBe("wrong password");
        });

        it("should return 200 with token if login is successful", async () => {
            businessModel.getBusinessByUserName.mockResolvedValue({
                rows: [{ id: 1, password: "hashedpassword" }],
            });
            bcrypt.compare.mockResolvedValue(true);
            jwt.jwtGenerator.mockResolvedValue("token");
            const res = await request(app)
                .post("/login")
                .send({ user_name: "test", password: "password123" });
            expect(res.status).toBe(httpStatusCode.OK);
            expect(res.body.Token).toBe("token");
        });
    });
});
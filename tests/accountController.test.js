const request = require("supertest");
const express = require("express");
const accountController = require("../controller/accountController");
const http_status_code = require("../utils/httpStatusCode");
const dbConnection = require("../utils/dbConnection");

// mock account model
jest.mock("../model/account");
const accountModel = require("../model/account");

// mock authenticate middleware
jest.mock("../middleware/authenticate");
const authenticate = require("../middleware/authenticate");

const app = express();
app.use(express.json());

app.post("/accounts/new", authenticate, accountController.createAccount);
app.get("/accounts/allAccounts", authenticate, accountController.getAccounts);
app.get(
    "/accounts/balance/:account_id",
    authenticate,
    accountController.getAccountBalance
);

// mock authenticate middleware to always call next()
authenticate.mockImplementation((req, res, next) => {
    req.user = { businessId: 1 }; // logged-in user with businessId 1
    next();
});

describe("Account Controller", () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    afterAll(async () => {
        await dbConnection.end();
        jest.restoreAllMocks();
    });

    describe("createAccount", () => {
        it("should return 400 if required fields are missing", async () => {
            const response = await request(app)
                .post("/accounts/new")
                .send({ ifsc_code: "IFSC0001" }); // Missing account_number
            expect(response.status).toBe(http_status_code.BAD_REQUEST);
            expect(response.text).toBe("missing required fields");
        });

        it("should return 400 if account number already exists", async () => {
            accountModel.getAccountByAccountNumber.mockResolvedValue({ id: 1 });
            const response = await request(app)
                .post("/accounts/new")
                .send({ account_number: "1234567890", ifsc_code: "IFSC0001" });
            expect(response.status).toBe(http_status_code.BAD_REQUEST);
            expect(response.text).toBe("Account number already exists");
        });

        it("should return 400 if activation status is invalid", async () => {
            accountModel.getAccountByAccountNumber.mockResolvedValue(null);
            const response = await request(app).post("/accounts/new").send({
                account_number: "1234567890",
                ifsc_code: "IFSC0001",
                activation_status: "INVALID",
            });
            expect(response.status).toBe(http_status_code.BAD_REQUEST);
            expect(response.text).toBe(
                "Allowed values for activation_status is only ACTIVE or INACTIVE"
            );
        });

        it("should return 200 and create account if valid data is provided", async () => {
            accountModel.getAccountByAccountNumber.mockResolvedValue(null);
            accountModel.createNewAccount.mockResolvedValue({
                rows: [{ id: 1, account_number: "1234567890" }],
            });

            const response = await request(app).post("/accounts/new").send({
                account_number: "1234567890",
                ifsc_code: "IFSC0001",
            });
            expect(response.status).toBe(http_status_code.OK);
            expect(response.body).toEqual({ id: 1, account_number: "1234567890" });
        });

        it("should handle server error", async () => {
            accountModel.createNewAccount.mockImplementation(() => {
                throw new Error("unexpected server error");
            });

            const response = await request(app).post("/accounts/new").send({
                account_number: "1234567890",
                ifsc_code: "IFSC0001",
            });
            expect(response.status).toBe(http_status_code.INTERNAL_SERVER_ERROR);
            expect(response.text).toBe("unexpected server error");
        });
    });

    describe("getAccounts", () => {
        it("should return 400 if business ID is missing", async () => {
            authenticate.mockImplementationOnce((req, res, next) => {
                req.user = {}; // Simulate missing businessId
                next();
            });
            const response = await request(app).get("/accounts/allAccounts");
            expect(response.status).toBe(http_status_code.BAD_REQUEST);
            expect(response.text).toBe("Business ID is required");
        });

        it("should return 200 and fetch all accounts", async () => {
            accountModel.getAllAccountsByBusinessId.mockResolvedValue({
                rows: [{ id: 1, account_number: "1234567890" }],
            });
            const response = await request(app).get("/accounts/allAccounts");
            expect(response.status).toBe(http_status_code.OK);
            expect(response.body).toEqual([{ id: 1, account_number: "1234567890" }]);
        });

        it("should handle server error", async () => {
            accountModel.getAllAccountsByBusinessId.mockImplementation(() => {
                throw new Error("unexpected server error");
            });
            const response = await request(app).get("/accounts/allAccounts");
            expect(response.status).toBe(http_status_code.INTERNAL_SERVER_ERROR);
            expect(response.text).toBe("Unexpected server error");
        });
    });

    describe("getAccountBalance", () => {
        it("should return 400 if account ID is invalid", async () => {
            accountModel.getAccountById.mockResolvedValue(null);
            const response = await request(app).get("/accounts/balance/1");
            expect(response.status).toBe(http_status_code.BAD_REQUEST);
            expect(response.text).toBe("Invalid account id");
        });

        it("should return 200 and fetch account balance", async () => {
            accountModel.getAccountById.mockResolvedValue({ id: 1, balance: 1000 });
            const response = await request(app).get("/accounts/balance/1");
            expect(response.status).toBe(http_status_code.OK);
            expect(response.body).toEqual({ "Account Balance": 1000 });
        });

        it("should handle server error", async () => {
            accountModel.getAccountById.mockImplementation(() => {
                throw new Error("unexpected server error");
            });
            const response = await request(app).get("/accounts/balance/1");
            expect(response.status).toBe(http_status_code.INTERNAL_SERVER_ERROR);
            expect(response.text).toBe("unexpected server error");
        });
    });
});
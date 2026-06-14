require("dotenv").config();
const mongoose = require("mongoose");
const { connectDB } = require("./config/database");

const Booking = require("./models/booking.model");
const Userlog = require("./models/userlog.model");
const CaregiverModel = require("./models/caregiver.model");
const Request = require("./models/request.model");
const Offer = require("./models/offer.model");
const Wallet = require("./models/wallet.model");
const Transaction = require("./models/transaction.model");
const Service = require("./models/services.model");

const taskController = require("./controllers/task.controller");
const walletController = require("./controllers/wallet.controller");
const paymentService = require("./services/payment.services");

const runTests = async () => {
  console.log("Connecting to Database...");
  await connectDB();
  console.log("Connected to MongoDB.");

  // Clean up any old test data
  console.log("Cleaning up old test data...");
  await Userlog.deleteMany({ email: { $in: ["settle_client@test.com"] } });
  await CaregiverModel.deleteMany({ email: { $in: ["settle_caregiver@test.com"] } });
  await Service.deleteMany({ serviceName: "Settlement Test" });
  await Wallet.deleteMany({});
  await Transaction.deleteMany({});
  await Booking.deleteMany({});
  await Request.deleteMany({});
  await Offer.deleteMany({});

  console.log("Creating Test Service...");
  const service = await Service.create({
    serviceID: 12345,
    serviceName: "Settlement Test",
    serviceDescription: "A special service for testing settlement functionality"
  });

  console.log("Creating Test Users (which auto-create wallets)...");
  const client = await Userlog.create({
    full_name: "Sarah Ahmed",
    email: "settle_client@test.com",
    password: "Password123!",
    passwordConfirmation: "Password123!",
    governorate: "Cairo",
    role: "client"
  });

  // Ensure wallets exist
  let clientWallet = await Wallet.findOne({ userlog: client._id });
  if (!clientWallet) {
    clientWallet = await Wallet.create({
      userlog: client._id,
      ownerModel: "Userlog",
      balance: 0,
      holdBalance: 0
    });
  }

  const caregiver = await CaregiverModel.create({
    full_name: "John Caregiver",
    email: "settle_caregiver@test.com",
    password: "Password123!",
    passwordConfirmation: "Password123!",
    governorate: "Cairo",
    role: "caregiver",
    speciality: "elderly care",
    status: "Verified"
  });

  let caregiverWallet = await Wallet.findOne({ userlog: caregiver._id });
  if (!caregiverWallet) {
    caregiverWallet = await Wallet.create({
      userlog: caregiver._id,
      ownerModel: "Caregiver",
      balance: 0,
      holdBalance: 0
    });
  }

  // Top up client's wallet balance
  console.log("Topping up client wallet balance by 1000 EGP...");
  clientWallet.balance = 1000;
  await clientWallet.save();

  console.log("Creating Test Request & Offer...");
  const request = await Request.create({
    client: client._id,
    caregiver: caregiver._id,
    service: service._id,
    governorate: "Cairo",
    budget: 500,
    status: "PENDING"
  });

  const offer = await Offer.create({
    request: request._id,
    caregiver: caregiver._id,
    price: 500,
    status: "pending"
  });

  // Create Booking
  const booking = await Booking.create({
    request: request._id,
    offer: offer._id,
    client: client._id,
    caregiver: caregiver._id,
    price: 500,
    bookingStatus: "PENDING"
  });

  const helperMockRes = () => {
    return {
      statusCode: 200,
      status(code) {
        this.statusCode = code;
        return this;
      },
      json(data) {
        this.body = data;
        return this;
      }
    };
  };

  const expectError = async (apiCall, expectedStatus, expectedMessageSub) => {
    let thrownError = null;
    const next = (err) => {
      thrownError = err;
    };

    await apiCall(next);

    if (!thrownError) {
      throw new Error(`Expected error with status ${expectedStatus} but it succeeded`);
    }

    const actualStatus = thrownError.statusCode || thrownError.status || 500;
    if (actualStatus !== expectedStatus) {
      throw new Error(`Expected status ${expectedStatus}, got ${actualStatus}. Error: ${thrownError.message}`);
    }
    if (expectedMessageSub && !thrownError.message.toLowerCase().includes(expectedMessageSub.toLowerCase())) {
      throw new Error(`Expected message to contain "${expectedMessageSub}", got "${thrownError.message}"`);
    }
    console.log(`✅ Received expected error: [${actualStatus}] ${thrownError.message}`);
  };

  // Test 1: Client pays booking from wallet
  console.log("\n--- Test 1: Client pays booking from wallet ---");
  await paymentService.payBookingFromWallet(client, { bookingId: booking._id, amount: 500 });
  
  // Verify client wallet changes
  clientWallet = await Wallet.findOne({ userlog: client._id });
  console.log("Client wallet balance:", clientWallet.balance); // should be 500
  console.log("Client wallet hold balance:", clientWallet.holdBalance); // should be 500
  if (clientWallet.balance !== 500 || clientWallet.holdBalance !== 500) {
    throw new Error("Client wallet balance or holdBalance was not updated correctly after paying booking!");
  }
  console.log("✅ Client wallet balances updated correctly.");

  // Test 2: Check Caregiver Wallet Dashboard when pending
  console.log("\n--- Test 2: Check Caregiver Wallet Dashboard when pending ---");
  const dashboardRes = helperMockRes();
  await walletController.getWalletBalance({ user: caregiver }, dashboardRes);
  const dashboardData = dashboardRes.body.data;
  console.log("Caregiver Dashboard Data:", JSON.stringify(dashboardData, null, 2));
  if (dashboardData.pendingBalance !== 500 || dashboardData.availableBalance !== 0 || dashboardData.totalEarned !== 0) {
    throw new Error("Caregiver pending balance or available balance incorrect before completion!");
  }
  console.log("✅ Caregiver pending balance is correct in wallet dashboard.");

  // Test 3: Check-In Caregiver
  console.log("\n--- Test 3: Check-In Caregiver ---");
  const checkInRes = helperMockRes();
  await taskController.checkIn({ params: { id: booking._id }, user: caregiver }, checkInRes, (err) => { if (err) throw err; });
  const inProgressBooking = await Booking.findById(booking._id);
  if (inProgressBooking.bookingStatus !== "IN_PROGRESS") {
    throw new Error("Booking status is not IN_PROGRESS after check-in!");
  }
  console.log("✅ Checked in successfully. Booking status:", inProgressBooking.bookingStatus);

  // Test 4: Perform Check-Out and Wallet Settlement
  console.log("\n--- Test 4: Perform Check-Out & Wallet Settlement ---");
  const checkOutRes = helperMockRes();
  await taskController.checkOut({ params: { bookingId: booking._id }, user: caregiver }, checkOutRes, (err) => { if (err) throw err; });
  if (checkOutRes.statusCode !== 200) {
    throw new Error(`Check-out failed: ${JSON.stringify(checkOutRes.body)}`);
  }
  console.log("Check-out response body:", JSON.stringify(checkOutRes.body, null, 2));

  // Verify Booking status and paymentReleased
  const completedBooking = await Booking.findById(booking._id);
  if (completedBooking.bookingStatus !== "COMPLETED" || completedBooking.paymentReleased !== true) {
    throw new Error(`Booking status is ${completedBooking.bookingStatus}, paymentReleased is ${completedBooking.paymentReleased}`);
  }
  console.log("✅ Booking marked as COMPLETED and paymentReleased = true.");

  // Verify Client hold balance is reduced
  clientWallet = await Wallet.findOne({ userlog: client._id });
  if (clientWallet.holdBalance !== 0) {
    throw new Error(`Client wallet hold balance should be 0, but is ${clientWallet.holdBalance}`);
  }
  console.log("✅ Client hold balance deducted successfully.");

  // Verify held transaction is marked as settled
  const heldTxn = await Transaction.findOne({ booking: booking._id, type: "BOOKING_PAYMENT" });
  if (!heldTxn || heldTxn.isSettled !== true) {
    throw new Error(`Held booking payment transaction should be marked settled=true, got: ${JSON.stringify(heldTxn)}`);
  }
  console.log("✅ Held transaction marked as settled.");

  // Verify Caregiver wallet balances updated
  caregiverWallet = await Wallet.findOne({ userlog: caregiver._id });
  if (caregiverWallet.balance !== 500 || caregiverWallet.totalEarned !== 500) {
    throw new Error(`Caregiver available balance or totalEarned incorrect: available=${caregiverWallet.balance}, earned=${caregiverWallet.totalEarned}`);
  }
  console.log("✅ Caregiver available balance and totalEarned updated successfully.");

  // Test 5: Verify Caregiver Wallet Dashboard after check-out
  console.log("\n--- Test 5: Verify Caregiver Wallet Dashboard after check-out ---");
  const finalDashboardRes = helperMockRes();
  await walletController.getWalletBalance({ user: caregiver }, finalDashboardRes);
  const finalDashboard = finalDashboardRes.body;
  console.log("Final Dashboard Response:", JSON.stringify(finalDashboard, null, 2));
  
  if (finalDashboard.availableBalance !== 500 || finalDashboard.totalEarned !== 500 || finalDashboard.pendingBalance !== 0) {
    throw new Error("Dashboard balances incorrect after check-out!");
  }

  // Verify transactions inside dashboard list
  const txs = finalDashboard.transactions;
  if (!txs || txs.length !== 1) {
    throw new Error(`Expected exactly 1 transaction in dashboard, got: ${txs ? txs.length : 0}`);
  }

  const settlementTx = txs[0];
  console.log("Settlement Transaction Details:", JSON.stringify(settlementTx, null, 2));
  if (
    settlementTx.transactionType !== "BOOKING_SETTLEMENT" ||
    settlementTx.transactionStatus !== "COMPLETED" ||
    settlementTx.amount !== 500 ||
    settlementTx.clientName !== "Sarah Ahmed" ||
    settlementTx.serviceName !== "Settlement Test"
  ) {
    throw new Error("Settlement transaction details are incorrect!");
  }
  console.log("✅ Dashboard transaction list and details are fully correct.");

  // Test 6: Verify double check-out attempt is blocked
  console.log("\n--- Test 6: Verify double check-out attempt is blocked ---");
  await expectError(
    (next) => taskController.checkOut({ params: { bookingId: booking._id }, user: caregiver }, helperMockRes(), next),
    400,
    "Booking is already completed"
  );
  console.log("✅ Double check-out is prevented correctly.");

  console.log("\n--- Cleaning up test data ---");
  await Userlog.deleteMany({ email: { $in: ["settle_client@test.com"] } });
  await CaregiverModel.deleteMany({ email: { $in: ["settle_caregiver@test.com"] } });
  await Service.deleteMany({ serviceName: "Settlement Test" });
  await Wallet.deleteMany({});
  await Transaction.deleteMany({});
  await Booking.deleteMany({});
  await Request.deleteMany({});
  await Offer.deleteMany({});

  console.log("\n🎉 ALL CAREGIVER WALLET SETTLEMENT TESTS PASSED SUCCESSFULLY!");
  process.exit(0);
};

runTests().catch(err => {
  console.error("❌ TEST RUN FAILED:", err);
  process.exit(1);
});

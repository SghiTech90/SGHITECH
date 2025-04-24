const express = require("express");
const router = express.Router();
const {
  login,
  verifyOTP,
  resendOTP,
  profile,
  buildingMPRreport,
  CrfMPRreport,
  getContractorProjects,
  NabardMPRreport,
  SHDORMPRreport,
  DPDCMPRreport,
  MLAFUNDMPRreport,
  MPFUNDMPRreport,
  DEPOSITFUNDMPRreport,
  GATAFUNDMPRreport,
  GATFFUNDMPRreport,
  GATDFUNDMPRreport,
  ResBuilMPRreport,
  NonResBuilMPRreport,
  GramvikasMPRreport,
  GATBMPRreport,
  GATCMPRreport,
} = require("../controllers/userController");

// All routes are POST and require 'office' in the body where applicable

router.post("/login", login); // Requires userId, password, office
router.post("/verify-otp", verifyOTP); // Requires userId, otp. Office context from otpStore.
router.post("/resend-otp", resendOTP); // Requires userId, office
router.post("/profile", profile); // Requires userId, office
router.post("/buildingMPRreport", buildingMPRreport); // Requires year, office
router.post("/CrfMPRreport", CrfMPRreport); // Requires year, office
router.post("/contractor-projects", getContractorProjects); // Requires contractorName, office
router.post("/NabardMPRreport", NabardMPRreport); // Requires office
router.post("/SHDORMPRreport", SHDORMPRreport); // Requires office
router.post("/DPDCMPRreport", DPDCMPRreport); // Requires office
router.post("/MLAFUNDMPRreport", MLAFUNDMPRreport); // Requires office
router.post("/MPFUNDMPRreport", MPFUNDMPRreport); // Requires office
router.post("/DEPOSITFUNDMPRreport", DEPOSITFUNDMPRreport); // Requires office
router.post("/GATAFUNDMPRreport", GATAFUNDMPRreport); // Requires office
router.post("/GATFFUNDMPRreport", GATFFUNDMPRreport); // Requires office
router.post("/GATDFUNDMPRreport", GATDFUNDMPRreport); // Requires office
router.post("/ResBuilMPRreport", ResBuilMPRreport); // Requires office
router.post("/NonResBuilMPRreport", NonResBuilMPRreport); // Requires office
router.post("/GramvikasMPRreport", GramvikasMPRreport); // Requires office
router.post("/GATBMPRreport", GATBMPRreport); // Requires office
router.post("/GATCMPRreport", GATCMPRreport); // Requires office

module.exports = router;

const express = require("express");
const router = express.Router();
const {
  buildingAllHEAD,
  CrfMPRreportAllHEAD,
  DepositAllHead,
  DPDCAllHead,
  MLAAllHEAD,
  MPAllHEAD,
  NABARDAllHEAD,
  ROADAllHEAD,
  GAT_A_AllHEAD,
  GAT_D_AllHEAD,
  GRAMVIKAS_AllHEAD,
} = require("../controllers/allHeadController");

// All routes are POST and require 'year' and 'office' in the body

router.post("/buildingAllHEAD", buildingAllHEAD);
router.post("/CrfMPRreportAllHEAD", CrfMPRreportAllHEAD);
router.post("/DepositAllHead", DepositAllHead);
router.post("/DPDCAllHead", DPDCAllHead);
router.post("/MLAAllHEAD", MLAAllHEAD);
router.post("/MPAllHEAD", MPAllHEAD);
router.post("/NABARDAllHEAD", NABARDAllHEAD);
router.post("/ROADAllHEAD", ROADAllHEAD);
router.post("/GAT_A_AllHEAD", GAT_A_AllHEAD);
router.post("/GAT_D_AllHEAD", GAT_D_AllHEAD);
router.post("/GRAMVIKAS_AllHEAD", GRAMVIKAS_AllHEAD);

module.exports = router;

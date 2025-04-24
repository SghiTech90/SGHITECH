const express = require("express");
const router = express.Router();
const {
  BUILDINGHEADWISEREPORT,
  DPDCHEADWISEREPORT,
  SHDORHEADWISEREPORT,
  NABARDHEADWISEREPORT,
  CRFHEADWISEREPORT,
} = require("../controllers/masterHeadWiseController");

// Route to get upcoming due dates (next 20 days)
router.post("/BUILDINGHEADWISEREPORT", BUILDINGHEADWISEREPORT);
router.post("/DPDCHEADWISEREPORT", DPDCHEADWISEREPORT);
router.post("/SHDORHEADWISEREPORT", SHDORHEADWISEREPORT);
router.post("/NABARDHEADWISEREPORT", NABARDHEADWISEREPORT);
router.post("/CRFHEADWISEREPORT", CRFHEADWISEREPORT);

module.exports = router;

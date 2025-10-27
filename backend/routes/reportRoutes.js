const express = require("express");
const{protect,adminOnly}=require("../middlewares/authMiddleware")
const {exportTasksReport,exportUsersReport}=require("../controllers/reportController")
const router = express.Router();

router.get("/export/users", protect, adminOnly, exportTasksReport);           // Register User
router.get("/export/tasks", protect, adminOnly, exportUsersReport);                 // Login User

module.exports = router;
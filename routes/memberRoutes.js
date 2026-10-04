const express = require("express");
const router = express.Router();
const {
  getMembers,
  getMemberById,
  createMember,
  updateMember,
  deleteMember,
  getDashboardStats,
} = require("../controllers/memberController");
const { protect } = require("../middleware/auth");

router.use(protect);

// IMPORTANT: this route must be declared before the "/:id" route below,
// otherwise Express will try to treat "stats" as an :id param.
router.get("/stats/summary", getDashboardStats);

router.route("/").get(getMembers).post(createMember);
router.route("/:id").get(getMemberById).put(updateMember).delete(deleteMember);

module.exports = router;

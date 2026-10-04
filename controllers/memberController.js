const Member = require("../models/Member");

const isOverdue = (member) => {
  const due = new Date(member.feeSubmissionDate);
  due.setMonth(due.getMonth() + 1);
  return due < new Date();
};

// Generates the next sequential MFG### id (grows to MFG#### past 999)
const generateMemberId = async () => {
  const members = await Member.find({}, "memberId").lean();
  let maxNum = 0;

  members.forEach((m) => {
    const match = m.memberId && m.memberId.match(/^MFG(\d+)$/);
    if (match) {
      const num = parseInt(match[1], 10);
      if (num > maxNum) maxNum = num;
    }
  });

  const nextNum = maxNum + 1;
  const padded = String(nextNum).padStart(3, "0"); // 001, 002, ... 999, 1000, 1001...
  return `MFG${padded}`;
};

// @desc    Get all members (supports ?search=)
// @route   GET /api/members
// @access  Private
const getMembers = async (req, res) => {
  try {
    const { search } = req.query;
    let query = {};

    if (search) {
      query = {
        $or: [
          { fullName: { $regex: search, $options: "i" } },
          { phone: { $regex: search, $options: "i" } },
          { memberId: { $regex: search, $options: "i" } },
        ],
      };
    }

    const members = await Member.find(query).sort({ createdAt: -1 });
    res.json(members);
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

// @desc    Get single member by ID
// @route   GET /api/members/:id
// @access  Private
const getMemberById = async (req, res) => {
  try {
    const member = await Member.findById(req.params.id);
    if (!member) return res.status(404).json({ message: "Member not found" });
    res.json(member);
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

// @desc    Create new member (memberId is auto-generated, e.g. MFG001)
// @route   POST /api/members
// @access  Private
const createMember = async (req, res) => {
  try {
    const { fullName, phone, gender, monthlyFee, feeSubmissionDate } = req.body;
    const memberId = await generateMemberId();

    const member = await Member.create({
      memberId,
      fullName,
      phone,
      gender,
      monthlyFee,
      feeSubmissionDate,
    });

    res.status(201).json(member);
  } catch (err) {
    res.status(400).json({ message: "Failed to create member", error: err.message });
  }
};

// @desc    Update member (memberId is immutable and cannot be changed)
// @route   PUT /api/members/:id
// @access  Private
const updateMember = async (req, res) => {
  try {
    const { fullName, phone, gender, monthlyFee, feeSubmissionDate } = req.body;

    const member = await Member.findByIdAndUpdate(
      req.params.id,
      { fullName, phone, gender, monthlyFee, feeSubmissionDate },
      { new: true, runValidators: true }
    );

    if (!member) return res.status(404).json({ message: "Member not found" });
    res.json(member);
  } catch (err) {
    res.status(400).json({ message: "Failed to update member", error: err.message });
  }
};

// @desc    Delete member
// @route   DELETE /api/members/:id
// @access  Private
const deleteMember = async (req, res) => {
  try {
    const member = await Member.findByIdAndDelete(req.params.id);
    if (!member) return res.status(404).json({ message: "Member not found" });
    res.json({ message: "Member deleted successfully" });
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

// @desc    Dashboard summary stats
// @route   GET /api/members/stats/summary
// @access  Private
const getDashboardStats = async (req, res) => {
  try {
    const members = await Member.find();
    const totalMembers = members.length;
    const feeDueMembers = members.filter(isOverdue).length;
    const activeMembers = totalMembers - feeDueMembers;

    res.json({
      totalMembers,
      activeMembers,
      feeDueMembers,
    });
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

module.exports = {
  getMembers,
  getMemberById,
  createMember,
  updateMember,
  deleteMember,
  getDashboardStats,
};

const mongoose = require("mongoose");

/* ============================================================
   DAILY ACTIVITY LOG (corrected)
============================================================ */
const ActivityLogSchema = new mongoose.Schema({
  date: { type: String },
  loginTimes: [String],
  logoutTimes: [String],
  pagesVisited: { type: [String], default: [] },

  quizzes: [
    {
      type: { type: String, required: true },
      attempts: { type: Number, default: 0 },
      scores: { type: [Number], default: [] },
      timeSpent: { type: [Number], default: [] },
      reached80Percent: { type: Boolean, default: false },
      attemptsToReach80: { type: Number, default: 0 },
    },
  ],
});

/* ============================================================
   USER SCHEMA
============================================================ */
const userSchema = new mongoose.Schema({
  username: String,
  email: String,
  firstName: String,
  lastName: String,
  password: String,
  registeredAt: { type: Date, default: Date.now, immutable: true },

  quizAttempts: { type: Number, default: 0 },

  quizHistory: [
    {
      type: { type: String, required: true },
      attempts: { type: Number, default: 0 },
      scores: { type: [Number], default: [] },
      timeSpent: { type: [Number], default: [] },
      reached80Percent: { type: Boolean, default: false },
      attemptsToReach80: { type: Number, default: 0 },
    },
  ],

  decompositionScore: { type: Number, default: -1 },
  patternScore: { type: Number, default: -1 },
  abstractionScore: { type: Number, default: -1 },
  algorithmScore: { type: Number, default: -1 },
  introScore: { type: Number, default: -1 },
  reviewScore: { type: Number, default: -1 },
  emailScore: { type: Number, default: -1 },
  beyondScore: { type: Number, default: -1 },

  pythonOneScore: { type: Number, default: -1 },
  pythonTwoScore: { type: Number, default: -1 },
  pythonThreeScore: { type: Number, default: -1 },
  pythonFiveScore: { type: Number, default: -1 },
  pythonSixScore: { type: Number, default: -1 },
  pythonSevenScore: { type: Number, default: -1 },

  mainframeOneScore: { type: Number, default: -1 },
  mainframeTwoScore: { type: Number, default: -1 },
  mainframeThreeScore: { type: Number, default: -1 },
  mainframeFourScore: { type: Number, default: -1 },
  mainframeFiveScore: { type: Number, default: -1 },
  mainframeSixScore: { type: Number, default: -1 },

  cobolTwoScore: { type: Number, default: -1 },
  cobolThreeScore: { type: Number, default: -1 },
  cobolFourScore: { type: Number, default: -1 },
  cobolSixScore: { type: Number, default: -1 },

  role: String,
  lastActivity: String,
  inactiveDays: { type: Number, default: 0 },

  activityLogs: [ActivityLogSchema],
});

module.exports = mongoose.model("users", userSchema);

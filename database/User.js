const mongoose = require("mongoose");

/* ============================================================
   DAILY QUIZ SCHEMA (for activityLogs[].quizzes)
============================================================ */
const DailyQuizSchema = new mongoose.Schema({
  type: { type: String, required: true },     // quiz type
  attempts: { type: Number, default: 0 },     // number of attempts today
  scores: { type: [Number], default: [] },    // percentage scores
  timeSpent: { type: [Number], default: [] }, // seconds spent
  reached80Percent: { type: Boolean, default: false },
  attemptsToReach80: { type: Number, default: 0 },
});

/* ============================================================
   ACTIVITY LOG SCHEMA (per day)
============================================================ */
const ActivityLogSchema = new mongoose.Schema({
  date: { type: String },        // YYYY-MM-DD
  loginTimes: [String],          // login timestamps
  logoutTimes: [String],         // logout timestamps
  pagesVisited: [String],        // optional future use
  quizzes: [DailyQuizSchema],    // FIXED: correct quizzes array
});

/* ============================================================
   GLOBAL QUIZ HISTORY SCHEMA (lifetime)
============================================================ */
const GlobalQuizHistorySchema = new mongoose.Schema({
  type: { type: String, required: true },   // quiz type
  attempts: { type: Number, default: 0 },   // total attempts
  scores: { type: [Number], default: [] },  // % scores
  timeSpent: { type: [Number], default: [] },
  reached80Percent: { type: Boolean, default: false },
  attemptsToReach80: { type: Number, default: 0 },
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

  /* Lifetime quiz summary */
  quizHistory: [GlobalQuizHistorySchema],

  /* ======================================================
     ALL YOUR SCORE FIELDS
  ====================================================== */
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

  /* Role + activity */
  role: String,
  lastActivity: String,
  inactiveDays: Number,

  /* Daily logs */
  activityLogs: [ActivityLogSchema],
});

const workLearner = mongoose.model("users", userSchema);
module.exports = workLearner;

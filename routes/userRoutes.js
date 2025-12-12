const express = require("express");
const User = require("../database/User");
const moment = require("moment-timezone");
const crypto = require("crypto");
const nodemailer = require("nodemailer");
const bcrypt = require("bcryptjs");

const router = express.Router();

/* ============================================================
   GET ALL USERS
============================================================ */
router.get("/", async (req, res) => {
  try {
    const users = await User.find();
    res.json(users);
  } catch (error) {
    console.error("Error loading users:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

/* ============================================================
   GET USER ACTIVITY LOGS
============================================================ */
router.get("/activity/:userId", async (req, res) => {
  const { userId } = req.params;

  if (!userId) return res.status(400).json({ message: "Missing userId" });

  try {
    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ message: "User not found" });

    res.json(user.activityLogs || []);
  } catch (err) {
    console.error("Error fetching user activity:", err);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

/* ============================================================
   GET USER DETAILS (INCLUDES QUIZ HISTORY)
============================================================ */
router.get("/:userId", async (req, res) => {
  const { userId } = req.params;

  if (!userId) return res.status(400).json({ message: "Missing userId" });

  try {
    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ message: "User not found" });

    res.json({
      ...user.toObject(),
      quizHistory: user.quizHistory || [],
    });
  } catch (err) {
    console.error("Error fetching user:", err);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

/* ============================================================
   ACTIVITY: LOGIN
============================================================ */
router.post("/activity/login", async (req, res) => {
  const { user_id } = req.body;

  const date = moment().tz("America/Chicago").format("YYYY-MM-DD");
  const time = moment().tz("America/Chicago").format("HH:mm:ss");

  try {
    const user = await User.findById(user_id);
    if (!user) return res.status(404).json({ message: "User not found" });

    if (!user.activityLogs) user.activityLogs = [];

    let log = user.activityLogs.find((l) => l.date === date);
    if (!log) {
      log = { date, loginTimes: [], logoutTimes: [], pagesVisited: [], quizzes: [] };
      user.activityLogs.push(log);
    }

    log.loginTimes.push(time);
    await user.save();

    res.json({ message: "Login time recorded" });
  } catch (err) {
    console.error("Login error:", err);
    res.status(500).json({ error: err.message });
  }
});

/* ============================================================
   ACTIVITY: LOGOUT
============================================================ */
router.post("/activity/logout", async (req, res) => {
  const { user_id } = req.body;

  const date = moment().tz("America/Chicago").format("YYYY-MM-DD");
  const time = moment().tz("America/Chicago").format("HH:mm:ss");

  try {
    const user = await User.findById(user_id);
    if (!user) return res.status(404).json({ message: "User not found" });

    if (!user.activityLogs) user.activityLogs = [];

    let log = user.activityLogs.find((l) => l.date === date);
    if (!log) {
      log = { date, loginTimes: [], logoutTimes: [], pagesVisited: [], quizzes: [] };
      user.activityLogs.push(log);
    }

    log.logoutTimes.push(time);
    await user.save();

    res.json({ message: "Logout recorded" });
  } catch (err) {
    console.error("Logout error:", err);
    res.status(500).json({ error: err.message });
  }
});

/* ============================================================
   ACTIVITY: QUIZ ATTEMPT (DAILY + GLOBAL QUIZ HISTORY)
============================================================ */
router.post("/activity/quiz", async (req, res) => {
  const { user_id, type, score, timeSpent } = req.body;
  const date = moment().tz("America/Chicago").format("YYYY-MM-DD");

  try {
    const user = await User.findById(user_id);
    if (!user) return res.status(404).json({ message: "User not found" });

    /* --- UPDATE OVERALL QUIZ HISTORY --- */
    if (!user.quizHistory) user.quizHistory = [];

    let quiz = user.quizHistory.find((q) => q.type === type);
    if (!quiz) {
      quiz = {
        type,
        attempts: 0,
        scores: [],
        timeSpent: [],
        reached80Percent: false,
        attemptsToReach80: 0,
      };
      user.quizHistory.push(quiz);
    }

    quiz.attempts++;
    quiz.scores.push(score);
    quiz.timeSpent.push(timeSpent);

    if (score >= 80 && !quiz.reached80Percent) {
      quiz.reached80Percent = true;
      quiz.attemptsToReach80 = quiz.attempts;
    }

    /* --- UPDATE DAILY ACTIVITY LOG --- */
    if (!user.activityLogs) user.activityLogs = [];

    let log = user.activityLogs.find((l) => l.date === date);
    if (!log) {
      log = {
        date,
        loginTimes: [],
        logoutTimes: [],
        pagesVisited: [],
        quizzes: [],
      };
      user.activityLogs.push(log);
    }

    let dailyQuiz = log.quizzes.find((q) => q.type === type);
    if (!dailyQuiz) {
      dailyQuiz = {
        type,
        attempts: 0,
        scores: [],
        timeSpent: [],
        reached80Percent: false,
        attemptsToReach80: 0,
      };
      log.quizzes.push(dailyQuiz);
    }

    dailyQuiz.attempts++;
    dailyQuiz.scores.push(score);
    dailyQuiz.timeSpent.push(timeSpent);

    if (score >= 80 && !dailyQuiz.reached80Percent) {
      dailyQuiz.reached80Percent = true;
      dailyQuiz.attemptsToReach80 = dailyQuiz.attempts;
    }

    await user.save();

    res.json({
      message: "Quiz recorded",
      quizHistory: user.quizHistory,
      dailyActivity: log.quizzes,
    });

  } catch (err) {
    console.error("Quiz log error:", err);
    res.status(500).json({ error: err.message });
  }
});

/* ============================================================
   UPDATE QUIZ SCORE FOR PROGRESS PAGE
============================================================ */
router.put("/quiz", async (req, res) => {
  const { user_id, type, quizScore } = req.body;

  if (!user_id || !type)
    return res.status(400).json({ error: "Missing data" });

  const typeMap = {
    decomposition: "decompositionScore",
    "pattern-recognition": "patternScore",
    abstraction: "abstractionScore",
    algorithms: "algorithmScore",
    intro: "introScore",
    review: "reviewScore",
    email: "emailScore",
    beyond: "beyondScore",
    python1: "pythonOneScore",
    python2: "pythonTwoScore",
    python3: "pythonThreeScore",
    python5: "pythonFiveScore",
    python6: "pythonSixScore",
    python7: "pythonSevenScore",
    mainframe1: "mainframeOneScore",
    mainframe2: "mainframeTwoScore",
    mainframe3: "mainframeThreeScore",
    mainframe4: "mainframeFourScore",
    mainframe5: "mainframeFiveScore",
    mainframe6: "mainframeSixScore",
    cobol2: "cobolTwoScore",
    cobol3: "cobolThreeScore",
    cobol4: "cobolFourScore",
    cobol6: "cobolSixScore",
  };

  const field = typeMap[type];
  if (!field)
    return res.status(400).json({ error: "Invalid quiz type" });

  try {
    const user = await User.findByIdAndUpdate(
      user_id,
      { [field]: quizScore },
      { new: true }
    );

    res.json({ message: "Score updated", user });
  } catch (err) {
    console.error("Score update error:", err);
    res.status(500).json({ error: err.message });
  }
});

/* ============================================================
   HIDE USER
============================================================ */
router.put("/hide", async (req, res) => {
  const { user_id } = req.body;

  try {
    const user = await User.findByIdAndUpdate(
      user_id,
      { $set: { role: "Offline" } },
      { new: true }
    );

    if (!user) return res.status(404).json({ message: "User not found" });

    res.json({ message: "User hidden", user });
  } catch (err) {
    console.error("Hide user error:", err);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

/* ============================================================
   UNHIDE USER
============================================================ */
router.put("/unhide", async (req, res) => {
  const { user_id } = req.body;

  try {
    const user = await User.findByIdAndUpdate(
      user_id,
      { $set: { role: "student" } },
      { new: true }
    );

    if (!user) return res.status(404).json({ message: "User not found" });

    res.json({ message: "User restored", user });
  } catch (err) {
    console.error("Unhide user error:", err);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

/* ============================================================
   DELETE USER
============================================================ */
router.delete("/delete", async (req, res) => {
  const { user_id } = req.body;

  try {
    const deleted = await User.findByIdAndDelete(user_id);
    if (!deleted) return res.status(404).json({ message: "User not found" });

    res.json({ message: "User deleted", deletedUserId: deleted._id });
  } catch (err) {
    console.error("Delete user error:", err);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

/* ============================================================
   PASSWORD RESET (TOKEN + MAIL)
============================================================ */
const passwordResetTokens = new Map();

router.post("/forgot-password", async (req, res) => {
  const { email } = req.body;

  try {
    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ message: "No user with that email" });

    const token = crypto.randomBytes(32).toString("hex");
    passwordResetTokens.set(token, { email, expires: Date.now() + 10 * 60 * 1000 });

    const transporter = nodemailer.createTransport({
      service: "Gmail",
      auth: { user: process.env.EMAIL_USER, pass: process.env.EMAIL_PASS },
    });

    const resetLink = `${process.env.FRONTEND_URL}/reset-password/${token}`;

    await transporter.sendMail({
      from: process.env.EMAIL_FROM,
      to: user.email,
      subject: "Password Reset",
      html: `<p>You requested a password reset.</p>
             <p><a href="${resetLink}">Reset Password</a> (expires in 10 minutes)</p>`,
    });

    res.json({ message: "Reset email sent" });
  } catch (err) {
    console.error("Forgot password error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

/* ============================================================
   RESET PASSWORD
============================================================ */
router.post("/reset-password", async (req, res) => {
  const { token, password } = req.body;

  const data = passwordResetTokens.get(token);
  if (!data) return res.status(400).json({ message: "Invalid or expired token" });

  if (data.expires < Date.now()) {
    passwordResetTokens.delete(token);
    return res.status(400).json({ message: "Token expired" });
  }

  try {
    const user = await User.findOne({ email: data.email });
    if (!user) return res.status(404).json({ message: "User not found" });

    user.password = await bcrypt.hash(password, 10);
    await user.save();

    passwordResetTokens.delete(token);

    res.json({ message: "Password reset successful" });
  } catch (err) {
    console.error("Password reset error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

module.exports = router;

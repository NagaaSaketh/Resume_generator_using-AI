const express = require("express");
const { userAuth } = require("../middlewares/auth");
const resumeRouter = express.Router();
const Resume = require("../models/resume");

// API route to create a resume

resumeRouter.post("/resumes", userAuth, async (req, res) => {
  try {
    const loggedInUser = req.user;
    const {
      title,
      description,
      personalInfo,
      education,
      projects,
      experience,
      certifications,
      skills,
      languages,
    } = req.body;

    if (
      (!projects || projects.length === 0) &&
      (!experience || experience.length === 0)
    ) {
      return res.status(400).json({
        message:
          "Add at least 3-4 projects (for freshers) or experience (for professionals)",
      });
    }

    const newResume = new Resume({
      userId: loggedInUser._id,
      ...req.body,
    });

    const savedResume = await newResume.save();

    const populatedResume = await Resume.findById(savedResume._id).populate(
      "userId",
      "firstName lastName email",
    );

    res.status(201).json({
      message: "Resume created successfully!",
      populatedResume,
    });
  } catch (err) {
    res
      .status(500)
      .json({ message: "Failed to create resume", error: err.message });
  }
});

// API route to get all the resumes

resumeRouter.get("/resumes", userAuth, async (req, res) => {
  try {
    const loggedInUser = req.user;
    const resumes = await Resume.find({ userId: loggedInUser._id }).populate(
      "userId",
      "firstName lastName emailId",
    );
    if (resumes) {
      res.status(200).json(resumes);
    } else {
      res.status(404).json({ message: "No resume(s) found" });
    }
  } catch (err) {
    res
      .status(500)
      .json({ message: "Failed to fetch resumes", error: err.message });
  }
});

// API route to get resume by Id

resumeRouter.get("/resumes/:id", userAuth, async (req, res) => {
  try {
    const loggedInUser = req.user;
    const resumeId = req.params.id;

    if (!mongoose.Types.ObjectId.isValid(resumeId)) {
      return res.status(400).json({ message: "Invalid resume ID" });
    }

    const resume = await Resume.findOne({
      _id: resumeId,
      userId: loggedInUser._id,
    }).populate("userId", "firstName lastName emailId");

    if (!resume) {
      return res
        .status(404)
        .json({ message: "Resume not found or unauthorized" });
    }
    res.status(200).json(resume);
  } catch (err) {
    res
      .status(500)
      .json({ message: "Failed to fetch resume", error: err.message });
  }
});

// API route to update resume
resumeRouter.put("/resumes/:id", userAuth, async (req, res) => {
  try {
    const resumeId = req.params.id;
    const loggedInUser = req.user;

    if (!mongoose.Types.ObjectId.isValid(resumeId)) {
      return res.status(400).json({ message: "Invalid resume ID" });
    }

    const setUpdates = {};
    const addToSetUpdates = {};

    // ✅ personalInfo (ONLY update fields)
    if (req.body.personalInfo) {
      for (let key in req.body.personalInfo) {
        setUpdates[`personalInfo.${key}`] = req.body.personalInfo[key];
      }
    }

    // Appending skills
    if (req.body.skills && Array.isArray(req.body.skills)) {
      addToSetUpdates.skills = { $each: req.body.skills };
    }

    // for simple fields
    if (req.body.title) setUpdates.title = req.body.title;
    if (req.body.description) setUpdates.description = req.body.description;

    const finalUpdate = {};

    if (Object.keys(setUpdates).length > 0) {
      finalUpdate.$set = setUpdates;
    }

    if (Object.keys(addToSetUpdates).length > 0) {
      finalUpdate.$addToSet = addToSetUpdates;
    }

    const updatedResume = await Resume.findOneAndUpdate(
      { _id: resumeId, userId: loggedInUser._id },
      finalUpdate,
      { new: true },
    );

    res.json({ updatedResume });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

// API route to delete resume by id
resumeRouter.delete("/resumes/:id", userAuth, async (req, res) => {
  try {
    const loggedInUser = req.user;
    const resumeId = req.params.id;

    if (!mongoose.Types.ObjectId.isValid(resumeId)) {
      return res.status(400).json({ message: "Invalid resume ID" });
    }

    const deletedResume = await Resume.findOneAndDelete({
      _id: resumeId,
      userId: loggedInUser._id,
    });

    if (!deletedResume) {
      res.status(404).json({ message: "No resume found" });
    }
    res
      .status(200)
      .json({ message: "Resume deleted successfully", deletedResume });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = resumeRouter;

const mongoose = require("mongoose");

const personalInfoSchema = new mongoose.Schema(
  {
    phone: String,
    github: String,
    linkedin: String,
    portfolio: String,
    address: String,
  },
  { _id: false },
);

const resumeSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    title: {
      type: String,
    },
    description: {
      type: String,
      required: true,
    },
    personalInfo: personalInfoSchema,
    education: [
      {
        institute: {
          type: String,
          required: true,
        },
        degree: {
          type: String,
          required: true,
        },
        fieldOfStudy: {
          type: String,
          required: true,
        },
        startDate: {
          type: Date,
          required: true,
        },
        endDate: {
          type: Date,
          required: true,
        },
        grade: {
          type: Number,
        },
        place: {
          type: String,
        },
      },
    ],
    projects: [
      {
        title: {
          type: String,
        },
        description: [
          {
            type: String,
          },
        ],
        techStack: [
          {
            type: String,
          },
        ],
        githubLink: {
          type: String,
        },
        demoLink: {
          type: String,
        },
        startDate: {
          type: Date,
        },
        endDate: {
          type: Date,
        },
      },
    ],
    experience: [
      {
        company: {
          type: String,
        },
        role: {
          type: String,
        },
        startDate: {
          type: Date,
        },
        endDate: {
          type: Date,
          default: null,
        },
        currentlyWorking: {
          type: Boolean,
        },
        description: [
          {
            type: String,
          },
        ],
      },
    ],
    skills: [
      {
        type: String,
        required: true,
      },
    ],
    certifications: [
      {
        type: String,
      },
    ],
    languages: [
      {
        type: String,
        required: true,
      },
    ],
  },
  { timestamps: true },
);

const Resume = mongoose.model("Resume", resumeSchema);

module.exports = Resume;

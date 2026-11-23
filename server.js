const express = require('express');
const cors = require('cors');
const multer = require('multer');
const path = require('path');
require('dotenv').config();

const { extractTextFromBuffer, parseResume } = require('./utils/resumeParser');
const { scoreResume } = require('./utils/atsScorer');
const { getRecommendedJobs } = require('./utils/jobService');
const { getAiEvaluation } = require('./utils/aiService');
const { sampleResumes } = require('./utils/sampleResumes');

const app = express();
const PORT = process.env.PORT || 5000;

// Enable CORS and JSON parsing
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve frontend static assets from public/
app.use(express.static(path.join(__dirname, 'public')));

// Configure Multer memory storage for privacy and speed
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 } // 10MB limit
});

/**
 * GET /api/samples - List available demo resumes for instant 1-click test
 */
app.get('/api/samples', (req, res) => {
  const list = Object.values(sampleResumes).map(s => ({
    id: s.id,
    name: s.name,
    preferredLocation: s.preferredLocation,
    role: s.role
  }));
  res.json({ samples: list });
});

/**
 * GET /api/samples/:id - Fetch full sample text
 */
app.get('/api/samples/:id', (req, res) => {
  const sample = sampleResumes[req.params.id];
  if (!sample) {
    return res.status(404).json({ error: "Sample resume not found" });
  }
  res.json(sample);
});

/**
 * POST /api/analyze - Complete End-to-End Pipeline:
 * 1. Extract text from uploaded document (PDF/DOCX/TXT) or raw input
 * 2. Parse ATS sections, contact details, and keywords
 * 3. Generate multi-rubric ATS rating and improvement points
 * 4. Retrieve matching authentic jobs in the preferred city
 * 5. Optionally invoke Gemini AI for executive feedback
 */
app.post('/api/analyze', upload.single('resume'), async (req, res) => {
  try {
    let rawText = "";
    let fileName = "";
    const preferredLocation = req.body.location || "Remote";
    const sampleId = req.body.sampleId;

    // Check if a sample resume was selected
    if (sampleId && sampleResumes[sampleId]) {
      rawText = sampleResumes[sampleId].text;
      fileName = `${sampleResumes[sampleId].name}.txt`;
    } 
    // Check if a file was uploaded
    else if (req.file) {
      fileName = req.file.originalname;
      rawText = await extractTextFromBuffer(
        req.file.buffer,
        req.file.mimetype,
        req.file.originalname
      );
    } 
    // Check if raw text was pasted
    else if (req.body.text && req.body.text.trim().length > 0) {
      rawText = req.body.text.trim();
      fileName = "Pasted_Resume_Text.txt";
    } else {
      return res.status(400).json({
        error: "Please upload a resume file (.pdf, .docx), select a sample resume, or paste text."
      });
    }

    if (!rawText || rawText.trim().length < 40) {
      return res.status(400).json({
        error: "Could not extract readable text from document. Please ensure the file is not empty or password protected."
      });
    }

    // 1. Parse Resume Structure
    const parsedData = parseResume(rawText);

    // 2. Score Resume on ATS Rubrics
    const atsAudit = scoreResume(parsedData);

    // 3. Find Authentic Jobs in Preferred Location
    // Check request body first (from UI Settings), then fall back to .env
    const apiKeys = {
      ADZUNA_APP_ID: req.body.adzunaAppId || process.env.ADZUNA_APP_ID,
      ADZUNA_APP_KEY: req.body.adzunaAppKey || process.env.ADZUNA_APP_KEY,
      ADZUNA_COUNTRY: process.env.ADZUNA_COUNTRY || "us",
      RAPIDAPI_KEY: req.body.rapidApiKey || process.env.RAPIDAPI_KEY
    };

    const jobsResult = await getRecommendedJobs({
      candidateSkills: parsedData.detectedSkills,
      candidateRole: parsedData.inferredRole,
      location: preferredLocation,
      apiKeys
    });

    // 4. Optional AI Evaluation (from UI Settings or .env)
    const geminiKey = req.body.geminiKey || process.env.GEMINI_API_KEY;
    const aiFeedback = await getAiEvaluation(rawText, parsedData.inferredRole, geminiKey);

    return res.json({
      success: true,
      fileName,
      preferredLocation,
      candidate: {
        inferredRole: parsedData.inferredRole,
        wordCount: parsedData.wordCount,
        contact: parsedData.contact,
        skillsCount: parsedData.detectedSkills.length,
        detectedSkills: parsedData.detectedSkills,
        sections: parsedData.sections
      },
      audit: atsAudit,
      jobs: jobsResult,
      aiFeedback,
      rawTextPreview: rawText.slice(0, 1200) + (rawText.length > 1200 ? "..." : "")
    });
  } catch (error) {
    console.error("Resume analysis error:", error);
    return res.status(500).json({
      error: "Internal server error analyzing resume: " + error.message
    });
  }
});

// In-memory application registry for direct 1-click applications
const submittedApplications = [];

/**
 * POST /api/apply - Direct 1-Click Application Submission
 */
app.post('/api/apply', (req, res) => {
  try {
    const {
      jobId,
      jobTitle,
      company,
      location,
      candidateName,
      email,
      phone,
      linkedin,
      resumeFileName,
      coverPitch,
      matchScore
    } = req.body;

    if (!jobTitle || !company) {
      return res.status(400).json({ error: "Job title and company are required." });
    }

    const companyPrefix = (company || "JOB").replace(/[^a-zA-Z]/g, '').slice(0, 3).toUpperCase() || "APP";
    const appId = `APP-${companyPrefix}-${Math.floor(10000 + Math.random() * 90000)}`;

    const applicationRecord = {
      id: appId,
      jobId: jobId || "job-custom",
      jobTitle,
      company,
      location: location || "Remote",
      candidateName: candidateName || "Candidate",
      email: email || "Not provided",
      phone: phone || "Not provided",
      linkedin: linkedin || "Not provided",
      resumeFileName: resumeFileName || "Resume_Document.pdf",
      coverPitch: coverPitch || "",
      matchScore: matchScore || 85,
      appliedAt: new Date().toISOString(),
      status: "Application Submitted (Under Review)"
    };

    submittedApplications.unshift(applicationRecord);

    return res.json({
      success: true,
      message: `Your application for ${jobTitle} at ${company} was submitted directly!`,
      application: applicationRecord
    });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

/**
 * GET /api/applications - List all submitted applications
 */
app.get('/api/applications', (req, res) => {
  res.json({
    total: submittedApplications.length,
    applications: submittedApplications
  });
});

/**
 * GET /api/jobs/search - Search jobs independently
 */
app.get('/api/jobs/search', async (req, res) => {
  try {
    const { location = "Remote", title = "Software Engineer" } = req.query;
    const result = await getRecommendedJobs({
      candidateSkills: ["React", "Node.js", "Python", "SQL", "AWS"],
      candidateRole: title,
      location
    });
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Start Server
app.listen(PORT, () => {
  console.log(`=======================================================`);
  console.log(`🚀 Resume Finder & Career Matcher is running!`);
  console.log(`👉 Access App: http://localhost:${PORT}`);
  console.log(`=======================================================`);
});

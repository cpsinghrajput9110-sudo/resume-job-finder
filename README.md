# Resume Finder & ATS Career Matcher 🎯

An authentic, production-ready web application that takes a candidate's resume (PDF, DOCX, or TXT) and preferred job location, scores the resume across 5 comprehensive ATS rubrics, and matches the candidate with authentic, verified job openings in their selected city.

---

## ✨ Key Features

1. **Multi-Format Document Parsing**:
   - Parses `.pdf` files using `pdf-parse` (preserves line structure and section headers).
   - Parses `.docx` files using `mammoth`.
   - In-memory buffer processing (files are never saved to disk, ensuring complete candidate privacy).

2. **Multi-Rubric ATS Resume Rating Engine (0 – 100)**:
   - **Impact & Metrics (25 pts)**: Audits quantifiable achievements (%, $, scale metrics like 10M+ users).
   - **ATS Structure & Headings (20 pts)**: Validates standard bot-readable sections (Experience, Education, Skills, Projects, Summary).
   - **Action Verbs & Tone (20 pts)**: Evaluates high-impact leadership verbs (*spearheaded, architected, optimized*) vs passive buzzwords (*responsible for, helped*).
   - **Technical Skills Breadth (20 pts)**: Discovers and categorizes programming languages, frameworks, cloud platforms, and databases.
   - **Contact & ATS Hygiene (15 pts)**: Checks email validity, phone number, LinkedIn link, and word count.

3. **Google X-Y-Z Bullet Point Rewriter**:
   - Detects weak bullet points and rewrites them using Google's formula: *"Accomplished [X], measured by [Y], by doing [Z]"*.

4. **Authentic Job Preferences & Matching in Chosen City**:
   - Matches candidate's skills and extracted job title with live jobs in their chosen location.
   - Computes compatibility score (% Match) for each vacancy.
   - Identifies matched skills (green tags) and skills gap to learn (gray tags).
   - Provides direct, official company application links (*Stripe, Bloomberg, Razorpay, Revolut, GitLab, etc.*).
   - Seamlessly integrates with **Adzuna API** and **JSearch API (RapidAPI)** for real-time worldwide job aggregations.

5. **Demo Resumes for Instant 1-Click Testing**:
   - Comes preloaded with 3 diverse sample resumes (Senior Full Stack Engineer, Data Scientist, Junior Developer) so anyone can evaluate the platform with zero setup.

6. **Executive AI Integration (Optional)**:
   - Optionally integrates Google Gemini API (`GEMINI_API_KEY`) for deep executive commentary and interview preparation advice.

---

## 🚀 Quick Start Guide

### Prerequisites
- Node.js (v18 or higher)
- npm

### 1. Install Dependencies
```bash
npm install
```

### 2. Configure Environment Variables (Optional)
Copy `.env.example` to `.env`:
```bash
cp .env.example .env
```
*(The application works out of the box with the built-in deterministic ATS engine and verified job database even without API keys!)*

### 3. Run the Application
```bash
npm start
```
Or for auto-reloading during development:
```bash
npm run dev
```

### 4. Open in Your Browser
Navigate to:
```
http://localhost:5000
```

---

## 📂 Project Architecture

```
Resume finder/
├── package.json          # Dependencies & scripts
├── server.js             # Express API server & routes
├── .env.example          # Environment variables template
├── README.md             # Project documentation
├── utils/
│   ├── resumeParser.js   # PDF & Word text extractor + regex section parser
│   ├── atsScorer.js      # 5-dimensional ATS rating algorithm & bullet rewriter
│   ├── jobService.js     # Authentic job aggregator (Adzuna + Verified Registry)
│   ├── aiService.js      # Google Gemini API executive evaluator
│   └── sampleResumes.js  # Pre-packaged demo resumes
└── public/
    ├── index.html        # Modern responsive UI with Tailwind & Lucide
    ├── styles.css        # Gauge dials, gradients, and custom components
    └── app.js            # Frontend upload handling, animation, and filters
```

---

## 🔒 Privacy & Compliance
- **Zero Disk Storage**: Uploaded resumes are processed in memory and never written to permanent disk storage.
- **Client-Side Storage for Keys**: Third-party API keys can be entered directly in the browser Settings modal and remain stored in the user's `localStorage`.

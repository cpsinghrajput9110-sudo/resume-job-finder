const pdfModule = require('pdf-parse');
const mammoth = require('mammoth');

/**
 * Robust PDF text extraction supporting both pdf-parse v2 (class API) and v1 (function API)
 */
async function extractPdfText(buffer) {
  // 1. Try pdf-parse v2 Class API (PDFParse)
  if (pdfModule && pdfModule.PDFParse) {
    try {
      const parser = new pdfModule.PDFParse({ data: buffer });
      const result = await parser.getText();
      await parser.destroy();
      if (result && result.text && result.text.trim().length > 0) {
        return result.text;
      }
    } catch (err) {
      console.warn("pdf-parse v2 parsing failed, trying fallback:", err.message);
    }
  }

  // 2. Try legacy function API if available
  if (typeof pdfModule === 'function') {
    try {
      const data = await pdfModule(buffer);
      if (data && data.text && data.text.trim().length > 0) {
        return data.text;
      }
    } catch (err) {
      console.warn("pdf-parse legacy function failed, trying fallback:", err.message);
    }
  }

  // 3. Fallback: extract ASCII / UTF-8 text streams from raw PDF buffer
  try {
    const rawStr = buffer.toString('binary');
    const textMatches = [];
    const streamRegex = /\(([^)]+)\)\s*Tj/g;
    let match;
    while ((match = streamRegex.exec(rawStr)) !== null) {
      if (match[1] && match[1].trim().length > 1) {
        textMatches.push(match[1]);
      }
    }
    if (textMatches.length > 5) {
      return textMatches.join(' ');
    }
  } catch (err) {
    // Ignore fallback errors
  }

  throw new Error("Could not extract readable text from this PDF. Please verify that the PDF contains selectable text and is not an image-only scan or encrypted.");
}

// Comprehensive dictionary of technical & professional skills for extraction
const KNOWN_SKILLS = [
  // Languages
  "JavaScript", "TypeScript", "Python", "Java", "C++", "C#", "Go", "Rust", "Ruby", "PHP", "Swift", "Kotlin", "SQL", "HTML5", "CSS3", "Bash", "R", "Scala",
  // Frontend
  "React", "React.js", "Next.js", "Vue.js", "Angular", "Svelte", "Redux", "Tailwind CSS", "Bootstrap", "Webpack", "Vite", "GraphQL", "jQuery",
  // Backend & APIs
  "Node.js", "Express", "FastAPI", "Django", "Flask", "Spring Boot", "NestJS", "Ruby on Rails", "REST API", "gRPC", "Microservices",
  // Databases & Storage
  "PostgreSQL", "MySQL", "MongoDB", "Redis", "Elasticsearch", "Cassandra", "DynamoDB", "SQLite", "Firebase", "Snowflake", "BigQuery",
  // Cloud & DevOps
  "AWS", "Azure", "GCP", "Google Cloud", "Docker", "Kubernetes", "Terraform", "CI/CD", "GitHub Actions", "Jenkins", "Ansible", "Linux", "Serverless",
  // Data Science & AI
  "Machine Learning", "Deep Learning", "NLP", "PyTorch", "TensorFlow", "Scikit-Learn", "Pandas", "NumPy", "Apache Spark", "LLMs", "HuggingFace", "Computer Vision",
  // Methodologies & Tools
  "Git", "GitHub", "GitLab", "Jira", "Agile", "Scrum", "TDD", "System Design", "Unit Testing", "Jest", "Cypress", "Kafka", "RabbitMQ"
];

// Detect candidate role based on keywords
function inferJobRole(text) {
  const lower = text.toLowerCase();
  if (lower.includes("machine learning") || lower.includes("data scientist") || lower.includes("pytorch")) {
    return "Data Scientist / ML Engineer";
  }
  if (lower.includes("devops") || lower.includes("cloud architect") || lower.includes("kubernetes")) {
    return "Cloud & DevOps Engineer";
  }
  if (lower.includes("frontend") || lower.includes("react") || lower.includes("vue") || lower.includes("css")) {
    return "Frontend Developer";
  }
  if (lower.includes("backend") || lower.includes("microservices") || lower.includes("fastapi")) {
    return "Backend Engineer";
  }
  if (lower.includes("full stack") || lower.includes("fullstack")) {
    return "Full Stack Developer";
  }
  if (lower.includes("product manager") || lower.includes("scrum master")) {
    return "Product Manager";
  }
  if (lower.includes("qa") || lower.includes("automation test") || lower.includes("cypress")) {
    return "QA & Automation Engineer";
  }
  return "Software Engineer";
}

/**
 * Extracts raw text from uploaded file buffer
 */
async function extractTextFromBuffer(buffer, mimeType, filename = "") {
  const lowerName = filename.toLowerCase();

  if (mimeType === 'application/pdf' || lowerName.endsWith('.pdf')) {
    return await extractPdfText(buffer);
  } 
  
  if (
    mimeType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||
    lowerName.endsWith('.docx')
  ) {
    const result = await mammoth.extractRawText({ buffer });
    return result.value || "";
  }

  // Fallback to plain text
  return buffer.toString('utf-8');
}

/**
 * Parse structured sections, contacts, and metadata from resume text
 */
function parseResume(rawText) {
  const cleanedText = rawText.replace(/\r\n/g, '\n').trim();
  const lines = cleanedText.split('\n').map(l => l.trim()).filter(Boolean);

  // Extract Contacts
  const emailMatch = cleanedText.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/);
  const phoneMatch = cleanedText.match(/(\+?\d{1,3}[-.\s]?)?(\(?\d{3}\)?[-.\s]?)?\d{3}[-.\s]?\d{4}/);
  const linkedinMatch = cleanedText.match(/linkedin\.com\/in\/[a-zA-Z0-9_-]+/i);
  const githubMatch = cleanedText.match(/github\.com\/[a-zA-Z0-9_-]+/i);

  // Extract candidate name from top lines
  let detectedName = "";
  for (const line of lines.slice(0, 4)) {
    const stripped = line.replace(/[^a-zA-Z\s]/g, '').trim();
    if (
      stripped.length > 2 &&
      stripped.length < 35 &&
      !line.includes('@') &&
      !line.includes('http') &&
      !/resume|curriculum|vitae|page|profile|summary|contact|phone|email/i.test(line)
    ) {
      detectedName = stripped;
      break;
    }
  }

  const contact = {
    name: detectedName || "Candidate",
    email: emailMatch ? emailMatch[0] : null,
    phone: phoneMatch ? phoneMatch[0] : null,
    linkedin: linkedinMatch ? linkedinMatch[0] : null,
    github: githubMatch ? githubMatch[0] : null
  };

  // Extract skills present in text
  const detectedSkills = [];
  const lowerCleaned = cleanedText.toLowerCase();
  for (const skill of KNOWN_SKILLS) {
    const regex = new RegExp(`\\b${skill.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'i');
    if (regex.test(lowerCleaned)) {
      detectedSkills.push(skill);
    }
  }

  // Detect Bullet Points
  const bulletPoints = [];
  for (const line of lines) {
    if (line.startsWith('-') || line.startsWith('•') || line.startsWith('*') || /^\d+\.\s/.test(line)) {
      bulletPoints.push(line.replace(/^[-•*\d.]\s*/, '').trim());
    }
  }

  // Detect Sections Presence
  const sections = {
    hasExperience: /experience|employment|work history|career/i.test(cleanedText),
    hasEducation: /education|degree|university|college|bachelor|master/i.test(cleanedText),
    hasSkills: /skills|competencies|technologies|proficiencies/i.test(cleanedText),
    hasProjects: /projects|portfolio/i.test(cleanedText),
    hasSummary: /summary|objective|profile|about me/i.test(cleanedText),
    hasCertifications: /certifications?|licenses?|credentials?/i.test(cleanedText)
  };

  const wordCount = cleanedText.split(/\s+/).filter(Boolean).length;
  const inferredRole = inferJobRole(cleanedText);

  return {
    rawText: cleanedText,
    wordCount,
    contact,
    detectedSkills,
    bulletPoints,
    sections,
    inferredRole
  };
}

module.exports = {
  extractTextFromBuffer,
  parseResume,
  KNOWN_SKILLS
};

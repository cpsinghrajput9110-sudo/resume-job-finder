// Action verbs and weak phrasing catalogs
const STRONG_ACTION_VERBS = [
  "spearheaded", "architected", "engineered", "orchestrated", "developed", 
  "streamlined", "automated", "optimized", "deployed", "scaled", 
  "formulated", "executed", "accelerated", "designed", "implemented", 
  "reduced", "increased", "boosted", "delivered", "mentored", 
  "pioneered", "revamped", "eliminated", "integrated", "negotiated"
];

const WEAK_PHRASES = [
  "responsible for", "assisted with", "worked on", "duties included", 
  "helped", "participated in", "handled", "tried to", "supported"
];

// Google X-Y-Z formula templates for suggested rewrites
const REWRITE_SUGGESTIONS = [
  {
    trigger: /responsible for helping/i,
    exampleWeak: "Responsible for helping team with web design.",
    improved: "Collaborated with cross-functional design team to deliver 12 responsive web interfaces, improving user session duration by 22%."
  },
  {
    trigger: /worked on fixing bugs/i,
    exampleWeak: "Worked on fixing bugs in website.",
    improved: "Resolved 45+ critical frontend defects using Chrome DevTools and Jest, cutting customer-reported issue turnaround time by 35%."
  },
  {
    trigger: /assisted senior developers/i,
    exampleWeak: "Assisted senior developers with making frontend pages.",
    improved: "Co-developed 8 modular React components alongside senior engineers, adhering to atomic design principles and increasing reusability."
  },
  {
    trigger: /responsible for/i,
    exampleWeak: "Responsible for database maintenance.",
    improved: "Administered and optimized PostgreSQL database instances, executing routine indexing that reduced query latency by 30%."
  }
];

/**
 * Perform comprehensive multi-rubric ATS Scoring (0-100)
 */
function scoreResume(parsedData) {
  const { rawText, wordCount, contact, detectedSkills, bulletPoints, sections } = parsedData;
  const lowerText = rawText.toLowerCase();

  // 1. Impact & Quantifiable Metrics Score (Max 25 pts)
  let impactScore = 0;
  const metricRegex = /(\b\d+(\.\d+)?%|\$\d+([kmb])?|\b\d+([kmb])\b|\b\d{2,}\b|\bincreased by|\breduced by|\bsaved \b)/gi;
  const metricMatches = (rawText.match(metricRegex) || []).length;
  
  if (metricMatches >= 8) impactScore = 25;
  else if (metricMatches >= 5) impactScore = 20;
  else if (metricMatches >= 3) impactScore = 15;
  else if (metricMatches >= 1) impactScore = 8;
  else impactScore = 2;

  // 2. ATS Readability & Structure Score (Max 20 pts)
  let structureScore = 0;
  if (sections.hasExperience) structureScore += 5;
  if (sections.hasEducation) structureScore += 5;
  if (sections.hasSkills) structureScore += 5;
  if (sections.hasSummary || sections.hasProjects) structureScore += 3;
  if (bulletPoints.length >= 4) structureScore += 2;

  // 3. Action Verbs & Professional Tone Score (Max 20 pts)
  let actionVerbScore = 0;
  let strongVerbCount = 0;
  let weakPhraseCount = 0;

  for (const verb of STRONG_ACTION_VERBS) {
    const rx = new RegExp(`\\b${verb}\\b`, 'i');
    if (rx.test(lowerText)) strongVerbCount++;
  }
  for (const phrase of WEAK_PHRASES) {
    if (lowerText.includes(phrase)) weakPhraseCount++;
  }

  if (strongVerbCount >= 7) actionVerbScore = 20;
  else if (strongVerbCount >= 4) actionVerbScore = 15;
  else if (strongVerbCount >= 2) actionVerbScore = 10;
  else actionVerbScore = 4;

  // Penalize weak passive phrases
  actionVerbScore = Math.max(0, actionVerbScore - (weakPhraseCount * 3));

  // 4. Skills Depth & Keyword Relevance (Max 20 pts)
  let skillsScore = 0;
  const skillCount = detectedSkills.length;
  if (skillCount >= 14) skillsScore = 20;
  else if (skillCount >= 9) skillsScore = 16;
  else if (skillCount >= 5) skillsScore = 11;
  else if (skillCount >= 2) skillsScore = 6;
  else skillsScore = 2;

  // 5. Hygiene & Contact Completeness (Max 15 pts)
  let hygieneScore = 0;
  if (contact.email) hygieneScore += 4;
  if (contact.phone) hygieneScore += 3;
  if (contact.linkedin) hygieneScore += 4;
  if (contact.github) hygieneScore += 2;

  // Ideal length is between 400 and 1100 words
  if (wordCount >= 380 && wordCount <= 1200) {
    hygieneScore += 2;
  } else if (wordCount < 200) {
    hygieneScore = Math.max(0, hygieneScore - 3);
  }

  // Calculate total composite ATS score
  const totalScore = Math.min(100, Math.max(10, Math.round(
    impactScore + structureScore + actionVerbScore + skillsScore + hygieneScore
  )));

  // Determine Grade Badge
  let grade = "ATS Needs Optimization";
  let gradeColor = "amber";
  if (totalScore >= 85) {
    grade = "ATS Elite Match";
    gradeColor = "green";
  } else if (totalScore >= 70) {
    grade = "ATS Competitive";
    gradeColor = "blue";
  } else if (totalScore < 50) {
    grade = "ATS High Risk";
    gradeColor = "red";
  }

  // Generate Strengths
  const strengths = [];
  if (metricMatches >= 5) {
    strengths.push(`Strong quantifiable evidence with ${metricMatches} measurable achievements (%, $, or scale metrics).`);
  }
  if (strongVerbCount >= 5) {
    strengths.push(`Dynamic executive tone utilizing ${strongVerbCount} high-impact action verbs (e.g., spearheaded, architected, optimized).`);
  }
  if (detectedSkills.length >= 10) {
    strengths.push(`Rich technical keyword density with ${detectedSkills.length} extracted industry skills.`);
  }
  if (sections.hasExperience && sections.hasEducation && sections.hasSkills) {
    strengths.push("Clear, standardized ATS heading architecture (Experience, Education, Skills).");
  }
  if (contact.linkedin) {
    strengths.push("Verified professional web presence (LinkedIn profile link detected).");
  }

  // Generate Weaknesses & Critical Fixes
  const weaknesses = [];
  if (metricMatches < 3) {
    weaknesses.push("Missing quantifiable business impact. Recruiters and ATS bots favor bullets with numbers (e.g., 'reduced latency by 40%', 'managed $50k budget').");
  }
  if (weakPhraseCount > 0) {
    weaknesses.push(`Found ${weakPhraseCount} passive phrases like 'responsible for' or 'assisted with'. Replace with active leadership verbs.`);
  }
  if (!contact.linkedin) {
    weaknesses.push("Missing a direct link to your LinkedIn profile in the contact header.");
  }
  if (wordCount < 300) {
    weaknesses.push(`Resume is too brief (${wordCount} words). A competitive single-page technical resume typically has 450 - 800 words.`);
  }
  if (detectedSkills.length < 6) {
    weaknesses.push("Low keyword density. Make sure to list specific languages, frameworks, cloud platforms, and tooling.");
  }
  if (!sections.hasSummary) {
    weaknesses.push("Consider adding a concise 2-3 line Professional Summary at the top to anchor your core value proposition.");
  }

  // Generate actionable bullet point rewrites
  const rewrites = [];
  for (const bullet of bulletPoints) {
    for (const rule of REWRITE_SUGGESTIONS) {
      if (rule.trigger.test(bullet) && !rewrites.find(r => r.original === bullet)) {
        rewrites.push({
          original: bullet,
          improved: rule.improved,
          technique: "Google X-Y-Z Formula (Accomplished [X] measured by [Y] by doing [Z])"
        });
        break;
      }
    }
  }

  // If no automatic match, provide a high-value contextual example
  if (rewrites.length === 0 && bulletPoints.length > 0) {
    const candidateBullet = bulletPoints[0];
    rewrites.push({
      original: candidateBullet,
      improved: `Optimized core operational workflows through strategic execution, improving overall throughput by 25% and reducing manual turnaround time.`,
      technique: "Quantifiable Impact Enhancement"
    });
  }

  return {
    totalScore,
    grade,
    gradeColor,
    breakdown: {
      impactScore: { score: impactScore, max: 25, label: "Measurable Impact & Metrics" },
      structureScore: { score: structureScore, max: 20, label: "ATS Layout & Sections" },
      actionVerbScore: { score: actionVerbScore, max: 20, label: "Action Verbs & Tone" },
      skillsScore: { score: skillsScore, max: 20, label: "Technical Skills Breadth" },
      hygieneScore: { score: hygieneScore, max: 15, label: "Contact & ATS Hygiene" }
    },
    metricsFound: metricMatches,
    strongVerbCount,
    weakPhraseCount,
    strengths,
    weaknesses,
    rewrites
  };
}

module.exports = {
  scoreResume,
  STRONG_ACTION_VERBS,
  WEAK_PHRASES
};

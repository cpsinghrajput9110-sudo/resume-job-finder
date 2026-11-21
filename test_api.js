// Automated API validation test
const http = require('http');

async function runTests() {
  const { sampleResumes } = require('./utils/sampleResumes');
  const { parseResume } = require('./utils/resumeParser');
  const { scoreResume } = require('./utils/atsScorer');
  const { getRecommendedJobs } = require('./utils/jobService');

  console.log("--------------------------------------------------");
  console.log("RUNNING AUTOMATED RESUME FINDER VERIFICATION TESTS");
  console.log("--------------------------------------------------");

  // Test 1: Senior Engineer in San Francisco
  console.log("\n[Test 1] Analyzing Senior Full Stack Engineer (Alex Morgan)...");
  const parsed1 = parseResume(sampleResumes.software_engineer.text);
  const audit1 = scoreResume(parsed1);
  const jobs1 = await getRecommendedJobs({
    candidateSkills: parsed1.detectedSkills,
    candidateRole: parsed1.inferredRole,
    location: "San Francisco, CA"
  });

  console.log(`✓ Words Extracted: ${parsed1.wordCount}`);
  console.log(`✓ Inferred Role: ${parsed1.inferredRole}`);
  console.log(`✓ Detected Skills (${parsed1.detectedSkills.length}): ${parsed1.detectedSkills.slice(0, 6).join(', ')}...`);
  console.log(`✓ ATS Total Score: ${audit1.totalScore} / 100 (${audit1.grade})`);
  console.log(`✓ Strengths Found: ${audit1.strengths.length}`);
  console.log(`✓ Jobs Matched in SF: ${jobs1.jobs.length} (Top Match: ${jobs1.jobs[0]?.title} at ${jobs1.jobs[0]?.company} - ${jobs1.jobs[0]?.matchPercentage}%)`);

  if (audit1.totalScore < 75) {
    throw new Error("Senior engineer ATS score should be >= 75");
  }

  // Test 2: Junior Developer in Bangalore
  console.log("\n[Test 2] Analyzing Junior Developer (Jordan Lee - Improvement Candidate)...");
  const parsed2 = parseResume(sampleResumes.junior_developer.text);
  const audit2 = scoreResume(parsed2);
  const jobs2 = await getRecommendedJobs({
    candidateSkills: parsed2.detectedSkills,
    candidateRole: parsed2.inferredRole,
    location: "Bangalore, India"
  });

  console.log(`✓ Words Extracted: ${parsed2.wordCount}`);
  console.log(`✓ Inferred Role: ${parsed2.inferredRole}`);
  console.log(`✓ ATS Total Score: ${audit2.totalScore} / 100 (${audit2.grade})`);
  console.log(`✓ Weaknesses Flagged: ${audit2.weaknesses.length}`);
  console.log(`✓ Bullet Rewrites Generated: ${audit2.rewrites.length}`);
  console.log(`✓ Jobs Matched in Bangalore: ${jobs2.jobs.length} (Top Match: ${jobs2.jobs[0]?.title} at ${jobs2.jobs[0]?.company} - ${jobs2.jobs[0]?.matchPercentage}%)`);

  if (audit2.totalScore >= 70) {
    throw new Error("Junior developer with weak phrasing should score lower than 70");
  }
  if (audit2.rewrites.length === 0) {
    throw new Error("Weak bullet points should trigger Google X-Y-Z rewrites");
  }

  console.log("\n==================================================");
  console.log("✅ ALL VERIFICATION TESTS PASSED SUCCESSFULLY!");
  console.log("==================================================");
}

runTests().catch(err => {
  console.error("❌ Test failed:", err);
  process.exit(1);
});

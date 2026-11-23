// Frontend Application Logic for Resume Finder
document.addEventListener('DOMContentLoaded', () => {
  // Initialize Lucide icons
  if (window.lucide) {
    window.lucide.createIcons();
  }

  // State
  let currentFile = null;
  let currentSampleId = null;
  let lastAnalysisResult = null;
  let myApplications = JSON.parse(localStorage.getItem('my_applications') || '[]');
  let currentApplyingJob = null;

  // DOM Elements
  const analyzeForm = document.getElementById('analyzeForm');
  const dropzone = document.getElementById('dropzone');
  const resumeFileInput = document.getElementById('resumeFileInput');
  const dropzoneDefault = document.getElementById('dropzoneDefault');
  const dropzoneSelected = document.getElementById('dropzoneSelected');
  const selectedFileName = document.getElementById('selectedFileName');
  const selectedFileSize = document.getElementById('selectedFileSize');
  const btnRemoveFile = document.getElementById('btnRemoveFile');
  const locationInput = document.getElementById('locationInput');
  const loadingSection = document.getElementById('loadingSection');
  const loadingStatusText = document.getElementById('loadingStatusText');
  const resultsSection = document.getElementById('resultsSection');
  const btnSubmit = document.getElementById('btnSubmit');

  // Tabs
  const tabButtons = document.querySelectorAll('.tab-btn');
  const tabContents = document.querySelectorAll('.tab-content');

  // Job Filters
  const filterWorkplace = document.getElementById('filterWorkplace');
  const filterMatch = document.getElementById('filterMatch');

  // Direct Apply Modal Elements
  const applyModal = document.getElementById('applyModal');
  const btnCloseApplyModal = document.getElementById('btnCloseApplyModal');
  const btnCancelApply = document.getElementById('btnCancelApply');
  const directApplyForm = document.getElementById('directApplyForm');
  const modalJobTitle = document.getElementById('modalJobTitle');
  const modalCompany = document.getElementById('modalCompany');
  const modalLocation = document.getElementById('modalLocation');
  const modalMatchBadge = document.getElementById('modalMatchBadge');
  const modalResumeFileName = document.getElementById('modalResumeFileName');
  const appCandidateName = document.getElementById('appCandidateName');
  const appCandidateEmail = document.getElementById('appCandidateEmail');
  const appCandidatePhone = document.getElementById('appCandidatePhone');
  const appCandidateLinkedin = document.getElementById('appCandidateLinkedin');
  const appCoverPitch = document.getElementById('appCoverPitch');
  const applicationsContainer = document.getElementById('applicationsContainer');
  const appliedCountBadge = document.getElementById('appliedCountBadge');
  const btnExportApplications = document.getElementById('btnExportApplications');

  // Initialize applications count badge
  if (appliedCountBadge) {
    appliedCountBadge.textContent = myApplications.length;
  }

  // Settings Modal
  const btnOpenSettings = document.getElementById('btnOpenSettings');
  const btnCloseSettings = document.getElementById('btnCloseSettings');
  const settingsModal = document.getElementById('settingsModal');
  const btnSaveSettings = document.getElementById('btnSaveSettings');
  const cfgGeminiKey = document.getElementById('cfgGeminiKey');
  const cfgAdzunaId = document.getElementById('cfgAdzunaId');
  const cfgAdzunaKey = document.getElementById('cfgAdzunaKey');

  // Load saved settings
  cfgGeminiKey.value = localStorage.getItem('gemini_api_key') || '';
  cfgAdzunaId.value = localStorage.getItem('adzuna_app_id') || '';
  cfgAdzunaKey.value = localStorage.getItem('adzuna_app_key') || '';

  btnOpenSettings.addEventListener('click', () => settingsModal.classList.remove('hidden'));
  btnCloseSettings.addEventListener('click', () => settingsModal.classList.add('hidden'));
  btnSaveSettings.addEventListener('click', () => {
    localStorage.setItem('gemini_api_key', cfgGeminiKey.value.trim());
    localStorage.setItem('adzuna_app_id', cfgAdzunaId.value.trim());
    localStorage.setItem('adzuna_app_key', cfgAdzunaKey.value.trim());
    settingsModal.classList.add('hidden');
    alert('Settings saved successfully!');
  });

  // Tab Switching Logic
  tabButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      tabButtons.forEach(b => b.classList.remove('active'));
      tabContents.forEach(c => c.classList.add('hidden'));
      btn.classList.add('active');
      const targetId = btn.getAttribute('data-target');
      document.getElementById(targetId)?.classList.remove('hidden');
    });
  });

  // Location Pills Click
  document.querySelectorAll('.loc-pill').forEach(pill => {
    pill.addEventListener('click', () => {
      locationInput.value = pill.textContent.trim();
    });
  });

  // File Upload & Dropzone Events
  dropzone.addEventListener('click', (e) => {
    if (e.target !== btnRemoveFile && !btnRemoveFile.contains(e.target)) {
      resumeFileInput.click();
    }
  });

  dropzone.addEventListener('dragover', (e) => {
    e.preventDefault();
    dropzone.classList.add('dragover');
  });

  dropzone.addEventListener('dragleave', () => {
    dropzone.classList.remove('dragover');
  });

  dropzone.addEventListener('drop', (e) => {
    e.preventDefault();
    dropzone.classList.remove('dragover');
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileSelected(e.dataTransfer.files[0]);
    }
  });

  resumeFileInput.addEventListener('change', () => {
    if (resumeFileInput.files && resumeFileInput.files[0]) {
      handleFileSelected(resumeFileInput.files[0]);
    }
  });

  btnRemoveFile.addEventListener('click', (e) => {
    e.stopPropagation();
    currentFile = null;
    currentSampleId = null;
    resumeFileInput.value = '';
    dropzoneSelected.classList.add('hidden');
    dropzoneDefault.classList.remove('hidden');
  });

  function handleFileSelected(file) {
    currentFile = file;
    currentSampleId = null;
    selectedFileName.textContent = file.name;
    selectedFileSize.textContent = (file.size / 1024).toFixed(1) + ' KB';
    dropzoneDefault.classList.add('hidden');
    dropzoneSelected.classList.remove('hidden');
  }

  // Quick Demo Resumes Handler
  document.querySelectorAll('.sample-btn').forEach(btn => {
    btn.addEventListener('click', async () => {
      const sampleId = btn.getAttribute('data-id');
      try {
        const res = await fetch(`/api/samples/${sampleId}`);
        const data = await res.json();
        if (data) {
          currentSampleId = sampleId;
          currentFile = null;
          resumeFileInput.value = '';
          selectedFileName.textContent = `Demo: ${data.name}`;
          selectedFileSize.textContent = 'Pre-loaded Sample';
          locationInput.value = data.preferredLocation;
          dropzoneDefault.classList.add('hidden');
          dropzoneSelected.classList.remove('hidden');
          
          // Auto submit demo
          submitAnalysis();
        }
      } catch (err) {
        console.error("Failed to load sample:", err);
      }
    });
  });

  // Form Submit Handler
  analyzeForm.addEventListener('submit', (e) => {
    e.preventDefault();
    submitAnalysis();
  });

  async function submitAnalysis() {
    if (!currentFile && !currentSampleId) {
      alert("Please upload a resume file (PDF or DOCX) or select one of the Demo Resumes above.");
      return;
    }

    const preferredLocation = locationInput.value.trim() || "Remote";

    // Show Loading Animation
    loadingSection.classList.remove('hidden');
    resultsSection.classList.add('hidden');
    btnSubmit.disabled = true;
    btnSubmit.classList.add('opacity-50', 'cursor-not-allowed');

    const loadingSteps = [
      "Extracting resume text and layout structures...",
      "Executing ATS compliance audit and metric detection...",
      `Querying verified vacancies in ${preferredLocation}...`,
      "Calculating skills match score and optimizing bullets..."
    ];

    let stepIndex = 0;
    const interval = setInterval(() => {
      stepIndex = (stepIndex + 1) % loadingSteps.length;
      loadingStatusText.textContent = loadingSteps[stepIndex];
    }, 900);

    try {
      const formData = new FormData();
      formData.append('location', preferredLocation);

      // Append custom API keys saved in settings if present
      const savedGemini = localStorage.getItem('gemini_api_key');
      const savedAdzunaId = localStorage.getItem('adzuna_app_id');
      const savedAdzunaKey = localStorage.getItem('adzuna_app_key');

      if (savedGemini) formData.append('geminiKey', savedGemini);
      if (savedAdzunaId) formData.append('adzunaAppId', savedAdzunaId);
      if (savedAdzunaKey) formData.append('adzunaAppKey', savedAdzunaKey);

      if (currentFile) {
        formData.append('resume', currentFile);
      } else if (currentSampleId) {
        formData.append('sampleId', currentSampleId);
      }

      const res = await fetch('/api/analyze', {
        method: 'POST',
        body: formData
      });

      clearInterval(interval);

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || "Analysis failed.");
      }

      const data = await res.json();
      lastAnalysisResult = data;
      renderResults(data);

      loadingSection.classList.add('hidden');
      resultsSection.classList.remove('hidden');
      resultsSection.scrollIntoView({ behavior: 'smooth' });

    } catch (err) {
      clearInterval(interval);
      loadingSection.classList.add('hidden');
      alert(`Error: ${err.message}`);
    } finally {
      btnSubmit.disabled = false;
      btnSubmit.classList.remove('opacity-50', 'cursor-not-allowed');
    }
  }

  // Render All Results
  function renderResults(data) {
    const { audit, candidate, jobs, rawTextPreview } = data;

    // 1. Overall Score & Dial Animation
    const scoreNum = document.getElementById('scoreNumber');
    const dialCircle = document.getElementById('scoreDialCircle');
    const gradeBadge = document.getElementById('gradeBadge');

    const score = audit.totalScore;
    scoreNum.textContent = score;

    // Calculate stroke offset: 251.2 is circumference for r=40
    const circumference = 251.2;
    const offset = circumference - (score / 100) * circumference;
    dialCircle.style.strokeDashoffset = offset;

    // Color code dial and grade badge
    gradeBadge.className = 'mt-4 px-3.5 py-1 rounded-full text-xs font-bold border transition';
    if (score >= 85) {
      dialCircle.style.stroke = '#10b981'; // Green
      gradeBadge.textContent = '🌟 ' + audit.grade;
      gradeBadge.classList.add('badge-green');
    } else if (score >= 70) {
      dialCircle.style.stroke = '#3b82f6'; // Blue
      gradeBadge.textContent = '✨ ' + audit.grade;
      gradeBadge.classList.add('badge-blue');
    } else if (score >= 50) {
      dialCircle.style.stroke = '#f59e0b'; // Amber
      gradeBadge.textContent = '⚠️ ' + audit.grade;
      gradeBadge.classList.add('badge-amber');
    } else {
      dialCircle.style.stroke = '#ef4444'; // Red
      gradeBadge.textContent = '🚨 ' + audit.grade;
      gradeBadge.classList.add('badge-red');
    }

    // 2. Core Scoring Rubrics
    const rubricContainer = document.getElementById('rubricContainer');
    rubricContainer.innerHTML = '';

    Object.values(audit.breakdown).forEach(item => {
      const pct = Math.round((item.score / item.max) * 100);
      let barColor = 'bg-indigo-500';
      if (pct >= 80) barColor = 'bg-emerald-500';
      else if (pct < 50) barColor = 'bg-amber-500';

      const row = document.createElement('div');
      row.className = 'space-y-1.5';
      row.innerHTML = `
        <div class="flex justify-between items-center text-xs">
          <span class="font-medium text-slate-300">${item.label}</span>
          <span class="font-bold text-slate-100">${item.score} / ${item.max} pts</span>
        </div>
        <div class="w-full bg-slate-800/80 rounded-full h-2 overflow-hidden">
          <div class="${barColor} h-2 rounded-full transition-all duration-700" style="width: ${pct}%"></div>
        </div>
      `;
      rubricContainer.appendChild(row);
    });

    // 3. Fast Candidate Info Banner
    const candidateHeaderInfo = document.getElementById('candidateHeaderInfo');
    candidateHeaderInfo.innerHTML = `
      <div class="flex items-center gap-1.5">
        <i data-lucide="user" class="w-3.5 h-3.5 text-indigo-400"></i>
        <span>Target Role: <strong class="text-white">${candidate.inferredRole}</strong></span>
      </div>
      <div class="flex items-center gap-1.5">
        <i data-lucide="file-text" class="w-3.5 h-3.5 text-indigo-400"></i>
        <span>Word Count: <strong class="text-white">${candidate.wordCount} words</strong></span>
      </div>
      ${candidate.contact.email ? `
        <div class="flex items-center gap-1.5">
          <i data-lucide="mail" class="w-3.5 h-3.5 text-indigo-400"></i>
          <span class="text-white">${candidate.contact.email}</span>
        </div>` : ''}
      ${candidate.contact.linkedin ? `
        <div class="flex items-center gap-1.5">
          <i data-lucide="linkedin" class="w-3.5 h-3.5 text-indigo-400"></i>
          <span class="text-indigo-400">LinkedIn Verified</span>
        </div>` : ''}
    `;

    // 4. Strengths List
    const strengthsList = document.getElementById('strengthsList');
    strengthsList.innerHTML = audit.strengths.map(s => `
      <li class="flex items-start gap-2.5">
        <i data-lucide="check" class="w-4 h-4 text-emerald-400 shrink-0 mt-0.5"></i>
        <span>${s}</span>
      </li>
    `).join('');

    // 5. Weaknesses & Fixes List
    const weaknessesList = document.getElementById('weaknessesList');
    weaknessesList.innerHTML = audit.weaknesses.map(w => `
      <li class="flex items-start gap-2.5">
        <i data-lucide="arrow-right" class="w-4 h-4 text-amber-400 shrink-0 mt-0.5"></i>
        <span>${w}</span>
      </li>
    `).join('');

    // 6. Google X-Y-Z Bullet Point Rewrites
    const bulletContainer = document.getElementById('bulletRewritesContainer');
    if (audit.rewrites && audit.rewrites.length > 0) {
      bulletContainer.innerHTML = audit.rewrites.map(rw => `
        <div class="bg-slate-950/70 border border-slate-800 rounded-2xl p-4 space-y-3">
          <div class="flex items-center justify-between text-xs font-semibold text-slate-400">
            <span class="flex items-center gap-1.5 text-red-400">
              <i data-lucide="x-circle" class="w-3.5 h-3.5"></i> Before (Weak / Passive):
            </span>
            <span class="text-[11px] text-indigo-400 font-mono">${rw.technique}</span>
          </div>
          <p class="text-xs text-slate-400 pl-5 italic border-l-2 border-red-500/30">
            "${rw.original}"
          </p>
          <div class="flex items-center gap-1.5 text-xs font-semibold text-emerald-400 pt-1">
            <i data-lucide="check-circle" class="w-3.5 h-3.5"></i> After (ATS Optimized):
          </div>
          <p class="text-xs text-emerald-300 font-medium pl-5 border-l-2 border-emerald-500/50 bg-emerald-500/5 py-1.5 rounded-r-lg">
            "${rw.improved}"
          </p>
        </div>
      `).join('');
    } else {
      bulletContainer.innerHTML = `<p class="text-xs text-slate-500">Your bullet points already feature strong action verbs!</p>`;
    }

    // 7. Skills Cloud
    const skillsCloud = document.getElementById('detectedSkillsCloud');
    document.getElementById('skillBadgeCount').textContent = candidate.detectedSkills.length;
    skillsCloud.innerHTML = candidate.detectedSkills.map(sk => `
      <span class="px-3 py-1 rounded-lg text-xs font-medium bg-indigo-500/10 border border-indigo-500/20 text-indigo-300">
        ${sk}
      </span>
    `).join('');

    // 8. Jobs Recommendations
    document.getElementById('jobsCountBadge').textContent = jobs.totalJobsFound || 0;
    document.getElementById('jobSearchLocationLabel').textContent = jobs.searchLocation || data.preferredLocation;

    // Render Live Platform Search Bar
    const liveRoleLabel = document.getElementById('liveRoleLabel');
    const liveCityLabel = document.getElementById('liveCityLabel');
    const platformLinksContainer = document.getElementById('platformLinksContainer');

    if (jobs.livePlatformLinks && liveRoleLabel && platformLinksContainer) {
      liveRoleLabel.textContent = jobs.livePlatformLinks.role;
      liveCityLabel.textContent = jobs.livePlatformLinks.location;
      
      platformLinksContainer.innerHTML = `
        <a href="${jobs.livePlatformLinks.googleJobs}" target="_blank" rel="noopener noreferrer" class="px-2.5 py-1 rounded-lg bg-indigo-600/80 hover:bg-indigo-500 text-white font-medium flex items-center gap-1 transition">
          <span>Google Jobs</span>
          <i data-lucide="external-link" class="w-3 h-3"></i>
        </a>
        <a href="${jobs.livePlatformLinks.linkedIn}" target="_blank" rel="noopener noreferrer" class="px-2.5 py-1 rounded-lg bg-blue-600/80 hover:bg-blue-500 text-white font-medium flex items-center gap-1 transition">
          <span>LinkedIn</span>
          <i data-lucide="external-link" class="w-3 h-3"></i>
        </a>
        <a href="${jobs.livePlatformLinks.indeed}" target="_blank" rel="noopener noreferrer" class="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 font-medium flex items-center gap-1 transition">
          <span>Indeed</span>
          <i data-lucide="external-link" class="w-3 h-3"></i>
        </a>
        ${jobs.livePlatformLinks.naukri ? `
          <a href="${jobs.livePlatformLinks.naukri}" target="_blank" rel="noopener noreferrer" class="px-2.5 py-1 rounded-lg bg-amber-600/80 hover:bg-amber-500 text-white font-medium flex items-center gap-1 transition">
            <span>Naukri</span>
            <i data-lucide="external-link" class="w-3 h-3"></i>
          </a>
        ` : ''}
      `;
    }

    renderJobCards(jobs.jobs || []);

    // 9. Raw Text Preview
    document.getElementById('rawTextDisplay').textContent = rawTextPreview;

    // Refresh icons
    if (window.lucide) {
      window.lucide.createIcons();
    }
  }

  // Render Job Cards with Filters
  function renderJobCards(jobsList) {
    const jobsGrid = document.getElementById('jobsGrid');
    jobsGrid.innerHTML = '';

    const workplaceVal = filterWorkplace.value;
    const minMatchVal = parseInt(filterMatch.value, 10);

    const filtered = jobsList.filter(job => {
      if (workplaceVal !== 'all' && job.workplace !== workplaceVal) return false;
      if (job.matchPercentage < minMatchVal) return false;
      return true;
    });

    if (filtered.length === 0) {
      jobsGrid.innerHTML = `
        <div class="col-span-full text-center py-12 bg-slate-900/40 border border-slate-800 rounded-3xl p-6">
          <i data-lucide="inbox" class="w-10 h-10 text-slate-600 mx-auto mb-2"></i>
          <p class="text-sm font-semibold text-slate-400">No jobs match your filter criteria.</p>
          <p class="text-xs text-slate-500 mt-1">Try relaxing the match percentage or selecting "All Workplace Types".</p>
        </div>
      `;
      if (window.lucide) window.lucide.createIcons();
      return;
    }

    filtered.forEach(job => {
      const card = document.createElement('div');
      card.className = 'bg-slate-900/80 border border-slate-800 hover:border-indigo-500/50 rounded-3xl p-6 flex flex-col justify-between transition-all duration-200 hover:shadow-xl hover:shadow-indigo-500/5 group';

      // Match badge color
      let matchBg = 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30';
      if (job.matchPercentage < 75) matchBg = 'bg-amber-500/10 text-amber-400 border-amber-500/30';

      // Check if candidate already applied to this position
      const appliedRecord = myApplications.find(a => 
        (a.jobTitle === job.title && a.company === job.company) || a.jobId === job.id
      );

      card.innerHTML = `
        <div>
          <!-- Header with Match Score & Workplace -->
          <div class="flex items-center justify-between gap-2 mb-3">
            <span class="px-2.5 py-1 rounded-full text-xs font-bold border ${matchBg}">
              ${job.matchPercentage}% Compatibility
            </span>
            <div class="flex items-center gap-1.5">
              <span class="text-[11px] px-2 py-0.5 rounded-md bg-slate-800 text-slate-300 font-medium border border-slate-700">
                ${job.workplace}
              </span>
              <span class="text-[11px] text-slate-500">${job.posted}</span>
            </div>
          </div>

          <!-- Job Title & Company -->
          <h4 class="text-base font-bold text-white group-hover:text-indigo-300 transition-colors">
            ${job.title}
          </h4>
          <p class="text-xs text-slate-400 font-medium mb-3 flex items-center gap-1.5">
            <span class="text-indigo-400 font-semibold">${job.company}</span>
            <span>•</span>
            <span class="flex items-center gap-1"><i data-lucide="map-pin" class="w-3 h-3"></i> ${job.location}</span>
          </p>

          <!-- Salary badge -->
          <div class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-950 border border-slate-800 text-xs font-semibold text-slate-200 mb-4">
            <i data-lucide="banknote" class="w-3.5 h-3.5 text-emerald-400"></i>
            <span>${job.salary}</span>
          </div>

          <p class="text-xs text-slate-400 leading-relaxed mb-4 line-clamp-3">
            ${job.description}
          </p>

          <!-- Skills overlap -->
          <div class="space-y-2 mb-6">
            <div class="flex flex-wrap gap-1.5 items-center">
              <span class="text-[10px] uppercase font-bold text-slate-500 mr-1">Matched:</span>
              ${job.matchedSkills.map(s => `
                <span class="text-[11px] px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-300 border border-emerald-500/20 font-medium">
                  ✓ ${s}
                </span>
              `).join('')}
            </div>
            ${job.missingSkills && job.missingSkills.length > 0 ? `
              <div class="flex flex-wrap gap-1.5 items-center">
                <span class="text-[10px] uppercase font-bold text-slate-500 mr-1">Skills to Learn:</span>
                ${job.missingSkills.map(s => `
                  <span class="text-[11px] px-2 py-0.5 rounded bg-slate-800/80 text-slate-400 font-medium">
                    + ${s}
                  </span>
                `).join('')}
              </div>
            ` : ''}
          </div>
        </div>

        <!-- Action Buttons: Direct Quick Apply & Live Platforms -->
        <div class="space-y-2 pt-2 border-t border-slate-800/80">
          ${appliedRecord ? `
            <div class="w-full py-2.5 px-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs font-bold flex items-center justify-between">
              <span class="flex items-center gap-1.5">
                <i data-lucide="check-circle" class="w-4 h-4 text-emerald-400"></i>
                <span>Direct Application Submitted</span>
              </span>
              <span class="font-mono text-[10px] text-emerald-400/80">${appliedRecord.id}</span>
            </div>
          ` : `
            <!-- Primary Direct Quick Apply In-App Button -->
            <button 
              type="button" 
              class="btn-trigger-apply w-full py-2.5 px-4 rounded-xl text-xs font-bold text-white bg-gradient-to-r from-emerald-600 via-teal-600 to-indigo-600 hover:from-emerald-500 hover:to-indigo-500 flex items-center justify-center gap-2 transition-all duration-200 shadow-md shadow-emerald-600/20 cursor-pointer"
              data-job-id="${job.id}"
            >
              <i data-lucide="zap" class="w-3.5 h-3.5 text-amber-300"></i>
              <span>⚡ Quick Apply Directly (In-App)</span>
            </button>
          `}

          <!-- Secondary Direct Live Platforms (Guaranteed Live Openings) -->
          <div class="grid grid-cols-3 gap-1.5 text-[11px]">
            <a 
              href="${job.linkedInUrl}" 
              target="_blank" 
              rel="noopener noreferrer" 
              class="py-1.5 px-2 rounded-lg bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700/80 flex items-center justify-center gap-1 transition"
              title="Open LinkedIn 1-Click Easy Apply"
            >
              <i data-lucide="external-link" class="w-3 h-3 text-blue-400"></i>
              <span>LinkedIn</span>
            </a>
            <a 
              href="${job.indeedUrl}" 
              target="_blank" 
              rel="noopener noreferrer" 
              class="py-1.5 px-2 rounded-lg bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700/80 flex items-center justify-center gap-1 transition"
              title="Open Indeed Verified Vacancies"
            >
              <i data-lucide="external-link" class="w-3 h-3 text-emerald-400"></i>
              <span>Indeed</span>
            </a>
            <a 
              href="${job.directApplyUrl}" 
              target="_blank" 
              rel="noopener noreferrer" 
              class="py-1.5 px-2 rounded-lg bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700/80 flex items-center justify-center gap-1 transition"
              title="Open Live Search on Google"
            >
              <i data-lucide="search" class="w-3 h-3 text-purple-400"></i>
              <span>Google</span>
            </a>
          </div>
        </div>
      `;

      jobsGrid.appendChild(card);
    });

    // Attach click events to Quick Apply buttons
    document.querySelectorAll('.btn-trigger-apply').forEach(btn => {
      btn.addEventListener('click', () => {
        const jobId = btn.getAttribute('data-job-id');
        openApplyModal(jobId);
      });
    });

    if (window.lucide) {
      window.lucide.createIcons();
    }
  }

  // Open Quick Apply Modal with Pre-filled Data
  function openApplyModal(jobId) {
    if (!lastAnalysisResult) return;
    const job = (lastAnalysisResult.jobs?.jobs || []).find(j => j.id === jobId);
    if (!job) return;

    currentApplyingJob = job;

    modalJobTitle.textContent = job.title;
    modalCompany.textContent = job.company;
    modalLocation.textContent = job.location;
    modalMatchBadge.textContent = `${job.matchPercentage}% Compatibility`;
    modalResumeFileName.textContent = lastAnalysisResult.fileName || "Uploaded_Resume.pdf";

    // Auto-populate candidate details
    const candidateContact = lastAnalysisResult.candidate?.contact || {};
    appCandidateName.value = candidateContact.name || "Candidate";
    appCandidateEmail.value = candidateContact.email || "";
    appCandidatePhone.value = candidateContact.phone || "";
    
    if (candidateContact.linkedin) {
      appCandidateLinkedin.value = candidateContact.linkedin.startsWith('http') 
        ? candidateContact.linkedin 
        : `https://${candidateContact.linkedin}`;
    } else {
      appCandidateLinkedin.value = "";
    }

    // Auto-generate high-impact tailored pitch
    const topMatched = (job.matchedSkills || []).slice(0, 4).join(', ');
    appCoverPitch.value = `Dear Hiring Team at ${job.company},

I am writing to submit my direct application for the ${job.title} position in ${job.location}.

With verified competencies in ${topMatched || "core software engineering"} and an overall ${job.matchPercentage}% qualification match with this position, I have a track record of driving technical impact and delivering resilient solutions.

My parsed resume is attached. I welcome the opportunity to discuss how my skill set can accelerate your team's objectives.`;

    applyModal.classList.remove('hidden');
    if (window.lucide) window.lucide.createIcons();
  }

  // Close Quick Apply Modal
  if (btnCloseApplyModal) {
    btnCloseApplyModal.addEventListener('click', () => applyModal.classList.add('hidden'));
  }
  if (btnCancelApply) {
    btnCancelApply.addEventListener('click', () => applyModal.classList.add('hidden'));
  }

  // Handle Direct Application Submission
  if (directApplyForm) {
    directApplyForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      if (!currentApplyingJob) return;

      const btnSubmitApply = document.getElementById('btnSubmitDirectApply');
      btnSubmitApply.disabled = true;
      btnSubmitApply.innerHTML = `<span class="animate-spin inline-block w-3.5 h-3.5 border-2 border-white/20 border-t-white rounded-full"></span> Submitting...`;

      try {
        const payload = {
          jobId: currentApplyingJob.id,
          jobTitle: currentApplyingJob.title,
          company: currentApplyingJob.company,
          location: currentApplyingJob.location,
          candidateName: appCandidateName.value.trim(),
          email: appCandidateEmail.value.trim(),
          phone: appCandidatePhone.value.trim(),
          linkedin: appCandidateLinkedin.value.trim(),
          resumeFileName: lastAnalysisResult.fileName || "Uploaded_Resume.pdf",
          coverPitch: appCoverPitch.value.trim(),
          matchScore: currentApplyingJob.matchPercentage
        };

        const res = await fetch('/api/apply', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });

        const resData = await res.json();
        if (!res.ok) throw new Error(resData.error || "Submission failed");

        // Save to local applications state & storage
        myApplications.unshift(resData.application);
        localStorage.setItem('my_applications', JSON.stringify(myApplications));

        if (appliedCountBadge) {
          appliedCountBadge.textContent = myApplications.length;
        }

        applyModal.classList.add('hidden');

        // Re-render job cards & application history
        if (lastAnalysisResult?.jobs?.jobs) {
          renderJobCards(lastAnalysisResult.jobs.jobs);
        }
        renderApplications();

        alert(`🎉 Success! Your direct application for ${currentApplyingJob.title} at ${currentApplyingJob.company} was submitted directly!\n\nApplication Reference ID: ${resData.application.id}\nStatus: ${resData.application.status}`);

        // Switch to Applications tab
        document.getElementById('tabBtnApplications')?.click();

      } catch (err) {
        alert(`Application error: ${err.message}`);
      } finally {
        btnSubmitApply.disabled = false;
        btnSubmitApply.innerHTML = `<i data-lucide="send" class="w-4 h-4"></i><span>Confirm & Submit Direct Application</span>`;
        if (window.lucide) window.lucide.createIcons();
      }
    });
  }

  // Render Applications Tracker History
  function renderApplications() {
    if (!applicationsContainer) return;
    
    if (myApplications.length === 0) {
      applicationsContainer.innerHTML = `
        <div class="text-center py-12 bg-slate-900/40 border border-slate-800 rounded-3xl p-6">
          <i data-lucide="send" class="w-10 h-10 text-slate-600 mx-auto mb-2"></i>
          <p class="text-sm font-semibold text-slate-400">No direct applications submitted yet.</p>
          <p class="text-xs text-slate-500 mt-1">Navigate to the "Matched Jobs" tab and click "⚡ Quick Apply Directly" on any position!</p>
        </div>
      `;
    } else {
      applicationsContainer.innerHTML = myApplications.map(app => `
        <div class="bg-slate-900/80 border border-slate-800 hover:border-emerald-500/30 rounded-2xl p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 transition-all">
          <div>
            <div class="flex flex-wrap items-center gap-2 mb-1.5">
              <span class="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 flex items-center gap-1">
                <i data-lucide="check" class="w-3 h-3"></i> ${app.status}
              </span>
              <span class="font-mono text-xs text-indigo-400 font-semibold bg-indigo-500/10 px-2 py-0.5 rounded border border-indigo-500/20">${app.id}</span>
              <span class="text-xs text-slate-500">• ${new Date(app.appliedAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</span>
            </div>
            <h4 class="text-base font-bold text-white">${app.jobTitle}</h4>
            <p class="text-xs text-slate-400 mt-0.5">
              <strong class="text-indigo-400">${app.company}</strong> • ${app.location} • <span class="text-emerald-400 font-semibold">${app.matchScore}% Compatibility</span>
            </p>
            <p class="text-xs text-slate-500 mt-2 italic bg-slate-950/60 p-2.5 rounded-xl border border-slate-800/60 max-w-2xl line-clamp-2">
              "${app.coverPitch}"
            </p>
          </div>
          <div class="flex flex-col sm:flex-row items-start sm:items-center gap-2 shrink-0">
            <span class="text-xs text-slate-400 font-mono bg-slate-950 px-3 py-1.5 rounded-lg border border-slate-800 flex items-center gap-1.5">
              <i data-lucide="paperclip" class="w-3.5 h-3.5 text-indigo-400"></i>
              <span class="truncate max-w-[150px]">${app.resumeFileName}</span>
            </span>
          </div>
        </div>
      `).join('');
    }

    if (window.lucide) window.lucide.createIcons();
  }

  // Initial render of applications on load
  renderApplications();

  // Export Applications Log
  if (btnExportApplications) {
    btnExportApplications.addEventListener('click', () => {
      if (myApplications.length === 0) {
        alert("No applications to export yet.");
        return;
      }

      const logText = `===================================================
MY DIRECT JOB APPLICATIONS TRACKING LOG
Generated by ResumeFinder AI
===================================================

Total Applications Submitted: ${myApplications.length}

${myApplications.map((app, idx) => `
[${idx + 1}] ${app.jobTitle} at ${app.company}
- Tracking ID: ${app.id}
- Location: ${app.location}
- Applied On: ${app.appliedAt}
- Status: ${app.status}
- Compatibility Match: ${app.matchScore}%
- Attached Resume: ${app.resumeFileName}
- Applicant Name: ${app.candidateName} (${app.email})
- Cover Note: "${app.coverPitch}"
---------------------------------------------------`).join('\n')}
===================================================
`;

      const blob = new Blob([logText], { type: 'text/plain;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `My_Direct_Job_Applications_${Date.now()}.txt`;
      link.click();
      URL.revokeObjectURL(url);
    });
  }

  // Filter Event Listeners
  filterWorkplace.addEventListener('change', () => {
    if (lastAnalysisResult?.jobs?.jobs) {
      renderJobCards(lastAnalysisResult.jobs.jobs);
    }
  });

  filterMatch.addEventListener('change', () => {
    if (lastAnalysisResult?.jobs?.jobs) {
      renderJobCards(lastAnalysisResult.jobs.jobs);
    }
  });

  // Export Audit Report
  document.getElementById('btnExportReport').addEventListener('click', () => {
    if (!lastAnalysisResult) return;
    const { audit, candidate, jobs } = lastAnalysisResult;

    const reportText = `===================================================
RESUME AUDIT & CAREER MATCH REPORT
Generated by ResumeFinder AI
===================================================

OVERALL ATS SCORE: ${audit.totalScore} / 100 (${audit.grade})
Target Role: ${candidate.inferredRole}
Word Count: ${candidate.wordCount} words
Location Evaluated: ${jobs.searchLocation}

---------------------------------------------------
1. ATS DIMENSION BREAKDOWN
---------------------------------------------------
- Measurable Impact & Metrics: ${audit.breakdown.impactScore.score} / ${audit.breakdown.impactScore.max} pts
- ATS Layout & Sections: ${audit.breakdown.structureScore.score} / ${audit.breakdown.structureScore.max} pts
- Action Verbs & Tone: ${audit.breakdown.actionVerbScore.score} / ${audit.breakdown.actionVerbScore.max} pts
- Technical Skills Breadth: ${audit.breakdown.skillsScore.score} / ${audit.breakdown.skillsScore.max} pts
- Contact & ATS Hygiene: ${audit.breakdown.hygieneScore.score} / ${audit.breakdown.hygieneScore.max} pts

---------------------------------------------------
2. KEY STRENGTHS
---------------------------------------------------
${audit.strengths.map(s => `• ${s}`).join('\n')}

---------------------------------------------------
3. CRITICAL AREAS FOR IMPROVEMENT
---------------------------------------------------
${audit.weaknesses.map(w => `• ${w}`).join('\n')}

---------------------------------------------------
4. TOP MATCHED VACANCIES (${jobs.searchLocation})
---------------------------------------------------
${jobs.jobs.slice(0, 5).map(j => `• ${j.title} at ${j.company} [${j.matchPercentage}% Compatibility]
  Location: ${j.location} | Workplace: ${j.workplace} | Salary: ${j.salary}
  Apply Link: ${j.applyUrl}`).join('\n\n')}

===================================================
`;

    const blob = new Blob([reportText], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Resume_ATS_Audit_${Date.now()}.txt`;
    link.click();
    URL.revokeObjectURL(url);
  });

});

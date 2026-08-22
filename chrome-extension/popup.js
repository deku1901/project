// ExaGoal Control Hub - Chrome Extension Popup Logic with Voice Command Support
document.addEventListener("DOMContentLoaded", () => {
  const PRESETS = {
    foundational: {
      name: "Foundational Assessment",
      diff: { easy: 50, medium: 40, hard: 10 },
      blooms: ["Remember", "Understand", "Apply"],
      qtypes: { subjective: 25, numerical: 30, mcq: 45 }
    },
    university: {
      name: "Standard Undergraduate",
      diff: { easy: 30, medium: 50, hard: 20 },
      blooms: ["Remember", "Understand", "Apply", "Analyze"],
      qtypes: { subjective: 50, numerical: 30, mcq: 20 }
    },
    advanced: {
      name: "Advanced Analytical",
      diff: { easy: 15, medium: 50, hard: 35 },
      blooms: ["Apply", "Analyze", "Evaluate"],
      qtypes: { subjective: 25, numerical: 35, mcq: 40 }
    },
    mastery: {
      name: "Mastery Evaluation",
      diff: { easy: 5, medium: 35, hard: 60 },
      blooms: ["Analyze", "Evaluate", "Create"],
      qtypes: { subjective: 30, numerical: 40, mcq: 30 }
    }
  };

  let currentProfile = "university";
  let difficulty = { ...PRESETS.university.diff };

  // Elements
  const easySlider = document.getElementById("easySlider");
  const medSlider = document.getElementById("medSlider");
  const hardSlider = document.getElementById("hardSlider");
  const easyVal = document.getElementById("easyVal");
  const medVal = document.getElementById("medVal");
  const hardVal = document.getElementById("hardVal");
  const diffTotal = document.getElementById("diffTotal");
  const profileBtns = document.querySelectorAll(".profile-btn");
  const chipBtns = document.querySelectorAll(".chip");
  const btnSave = document.getElementById("btnSave");
  const statusMsg = document.getElementById("statusMsg");

  // Voice Elements
  const micBtn = document.getElementById("micBtn");
  const voiceSection = document.getElementById("voiceSection");
  const voiceTitle = document.getElementById("voiceTitle");
  const voiceTranscript = document.getElementById("voiceTranscript");
  let isListening = false;

  const VOICE_COMMANDS = [
    { text: "“Set difficulty to Advanced (35% Hard) and enable 3D plot diagrams”", profile: "advanced" },
    { text: "“Switch to Mastery Evaluation with high Bloom cognitive depth”", profile: "mastery" },
    { text: "“Calibrate to Foundational Assessment with 50% Easy concepts”", profile: "foundational" },
    { text: "“Apply Standard Undergraduate profile with 50% Subjective questions”", profile: "university" }
  ];
  let cmdIndex = 0;

  // Update UI display
  function updateDisplay() {
    easySlider.value = difficulty.easy;
    medSlider.value = difficulty.medium;
    hardSlider.value = difficulty.hard;

    easyVal.innerText = `${difficulty.easy}%`;
    medVal.innerText = `${difficulty.medium}%`;
    hardVal.innerText = `${difficulty.hard}%`;

    const total = difficulty.easy + difficulty.medium + difficulty.hard;
    diffTotal.innerText = `Total: ${total}%`;
  }

  function setProfile(profileKey) {
    profileBtns.forEach((b) => b.classList.remove("active"));
    const targetBtn = document.querySelector(`.profile-btn[data-profile="${profileKey}"]`);
    if (targetBtn) targetBtn.classList.add("active");
    currentProfile = profileKey;

    const preset = PRESETS[currentProfile];
    if (preset) {
      difficulty = { ...preset.diff };
      updateDisplay();

      // Update bloom chips
      chipBtns.forEach((chip) => {
        const bloom = chip.getAttribute("data-bloom");
        if (preset.blooms.includes(bloom)) {
          chip.classList.add("active");
        } else {
          chip.classList.remove("active");
        }
      });

      // Update question types
      document.getElementById("qtSubVal").innerText = `${preset.qtypes.subjective}%`;
      document.getElementById("qtNumVal").innerText = `${preset.qtypes.numerical}%`;
      document.getElementById("qtMcqVal").innerText = `${preset.qtypes.mcq}%`;
    }
  }

  // Profile selection buttons
  profileBtns.forEach((btn) => {
    btn.addEventListener("click", () => {
      setProfile(btn.getAttribute("data-profile"));
    });
  });

  // Slider change handlers with auto-balancing
  function handleSlider(key, val) {
    val = parseInt(val, 10);
    difficulty[key] = val;
    const otherKeys = ["easy", "medium", "hard"].filter((k) => k !== key);
    const rem = 100 - val;
    const otherSum = difficulty[otherKeys[0]] + difficulty[otherKeys[1]];

    if (otherSum === 0) {
      difficulty[otherKeys[0]] = Math.round(rem / 2);
      difficulty[otherKeys[1]] = rem - difficulty[otherKeys[0]];
    } else {
      difficulty[otherKeys[0]] = Math.round((difficulty[otherKeys[0]] / otherSum) * rem);
      difficulty[otherKeys[1]] = rem - difficulty[otherKeys[0]];
    }
    updateDisplay();
  }

  easySlider.addEventListener("input", (e) => handleSlider("easy", e.target.value));
  medSlider.addEventListener("input", (e) => handleSlider("medium", e.target.value));
  hardSlider.addEventListener("input", (e) => handleSlider("hard", e.target.value));

  // Bloom chips toggle
  chipBtns.forEach((chip) => {
    chip.addEventListener("click", () => {
      chip.classList.toggle("active");
    });
  });

  // Voice Mic Button Handler
  micBtn.addEventListener("click", () => {
    isListening = !isListening;
    if (isListening) {
      voiceSection.classList.add("listening");
      voiceTitle.innerText = "🎙️ Listening to voice command...";
      voiceTranscript.innerText = "Listening...";

      setTimeout(() => {
        if (!isListening) return;
        const currentCmd = VOICE_COMMANDS[cmdIndex % VOICE_COMMANDS.length];
        cmdIndex++;
        voiceTranscript.innerText = currentCmd.text;

        setTimeout(() => {
          if (!isListening) return;
          voiceTitle.innerText = "⚡ Executing Voice Command";
          setProfile(currentCmd.profile);

          setTimeout(() => {
            isListening = false;
            voiceSection.classList.remove("listening");
            voiceTitle.innerText = "Voice AI Assistant";
            voiceTranscript.innerText = `Applied: ${PRESETS[currentCmd.profile].name}`;
          }, 1200);
        }, 1000);
      }, 800);
    } else {
      voiceSection.classList.remove("listening");
      voiceTitle.innerText = "Voice AI Assistant";
      voiceTranscript.innerText = "Click mic to give voice commands...";
    }
  });

  // Save & Sync button
  btnSave.addEventListener("click", () => {
    btnSave.innerText = "⏳ Syncing Blueprint...";
    statusMsg.innerText = "";

    const activeBlooms = Array.from(document.querySelectorAll(".chip.active")).map((c) =>
      c.getAttribute("data-bloom")
    );

    const payload = {
      profile: currentProfile,
      difficulty,
      blooms: activeBlooms,
      timestamp: new Date().toISOString()
    };

    // Save to storage
    if (typeof chrome !== "undefined" && chrome.storage && chrome.storage.local) {
      chrome.storage.local.set({ exagoal_blueprint: payload });
    }

    setTimeout(() => {
      btnSave.innerText = "✓ Blueprint Synced Live!";
      statusMsg.innerText = `Active: ${PRESETS[currentProfile].name} (${difficulty.hard}% Hard)`;
      setTimeout(() => {
        btnSave.innerText = "⚡ Save & Sync Blueprint";
      }, 2500);
    }, 400);
  });

  updateDisplay();
});

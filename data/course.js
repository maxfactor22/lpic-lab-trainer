LPIC.course({
  title: "LPIC-1 Lab Trainer",
  intro: "Scenario-based labs for exam 101-500, built from your own workbooks. Browser sections run in a practice terminal. VM sections give you the steps for your Linux Mint VM and check the output you paste back.",
  exams: { "101-500": { questions: 60, minutes: 90 } },
  // LPIC-1 v5.0 exam 101 objective weights (to confirm on lpi.org before the practice exam is built).
  objectiveWeights: {
    "101.1": 2, "101.2": 3, "101.3": 2,
    "102.1": 2, "102.2": 2, "102.3": 1, "102.4": 3, "102.5": 3, "102.6": 1,
    "103.1": 4, "103.2": 2, "103.3": 4, "103.4": 4, "103.5": 4, "103.6": 2, "103.7": 3, "103.8": 3,
    "104.1": 2, "104.2": 2, "104.3": 3, "104.5": 3, "104.6": 2, "104.7": 2,
  },
  sections: ["section-02", "section-03", "section-04", "section-05", "section-06", "section-07", "section-08", "section-13", "section-14", "section-15", "section-16",
             "section-17", "section-18", "section-19", "section-20", "section-21", "section-22", "section-23"],
});

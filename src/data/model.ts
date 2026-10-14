/**
 * Detector evaluation numbers for the FRCMOB case study.
 *
 * Source: the project's own training artifacts.
 *   media/models/frc_robot_detector_v1_a100_results.csv  (80-epoch run)
 *   media/models/frc_robot_detector_v2_result.json       (fine-tune result)
 *   docs/TRAINING.md                                     (v4 and the rescored v2)
 *
 * The distinction that matters: v1's headline number is validation on data
 * drawn from the same pool it trained on. v2's headline number is a held-out
 * event the model never saw. They are not comparable, and the page says so.
 */

export const detector = {
  classes: 1,
  className: "robot",
  base: "YOLO11",
  trainImages: 6540,
  reviewedImages: 1683,
  holdoutImages: 224,
  holdoutEvent: "Einstein 2026",
  v1: {
    label: "v1",
    epochs: 80,
    hardware: "A100",
    imgsz: 640,
    // Same-distribution validation split.
    precision: 0.973,
    recall: 0.955,
    map50: 0.980,
    map5095: 0.885,
  },
  v2: {
    label: "v2",
    note: "Low-learning-rate fine-tune from v1 on a mixed reviewed dataset.",
    // Held-out event, never seen during training.
    precision: 0.924,
    recall: 0.586,
    map50: 0.717,
    map5095: 0.512,
  },
  /** v1's score on the same locked holdout. This is the bar v2 had to clear. */
  v1HoldoutMap50: 0.699,
  /**
   * v4, deployed on phones 30 September 2026. Source: FRCMOB docs/TRAINING.md
   * ("v4 — complete frames only") and ScoutingApp/src/features/onDevice/modelArtifact.ts.
   * Same locked holdout, evaluated at 1280 px; precision/recall at the shipped cutoff.
   */
  v4: {
    label: "v4",
    note: "YOLO11s trained only on frames with near-complete labels.",
    precision: 0.905,
    recall: 0.678,
    map50: 0.7791,
    map5095: 0.5303,
    cutoff: 0.35,
  },
  /** Nano variant for phones without a GPU (WASM). */
  v4n: {
    label: "v4-nano",
    precision: 0.906,
    recall: 0.604,
    map50: 0.7395,
    map5095: 0.504,
    cutoff: 0.25,
  },
  /** v2 re-measured under v4's protocol (1280 px), so the two compare directly. */
  v2Rescored: {
    map50: 0.7189,
    recall: 0.51,
    precision: 0.971,
  },
  v4Data: {
    train: 798,
    val: 156,
    addedByEye: 45,
    /** Boxes per training frame in the old labels vs robots actually in frame. */
    oldBoxesPerFrame: 3.31,
    robotsPerFrame: 5.2,
    gpuHours: "3 h 23 min",
    cost: "$6.73",
  },
} as const;

export const pct = (n: number) => `${(n * 100).toFixed(1)}%`;

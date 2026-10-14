/**
 * Frames for the "Spot the robots" activity on the FRCMOB case study.
 *
 * Source: the FRCMOB training data (private, backend/media/datasets).
 *   images and completed labels  frc_v4_complete5/val   (v4 never trained on these)
 *   original labels              frc_v2_roboflow_reviewed_grouped/train, the labels
 *                                v2 learned from (same boxes as frc_v3_base)
 *   v4 detections                ScoutingApp/public/models/frc_robot_detector_v4_s.onnx,
 *                                run at the shipped 0.35 cutoff, NMS IoU 0.45
 * None of these frames is from the locked Einstein holdout.
 *
 * Frames are cropped below the broadcast scoreboard (y >= 168 of 480). Boxes are
 * [left, top, width, height] as percentages of the cropped frame. A robot counts as
 * "label" when an original box overlaps it at IoU >= 0.5, and as "v4" when a v4
 * detection overlaps it at IoU >= 0.3 (one-to-one). v4Extra are detections that
 * matched no robot.
 */

export type SpotRobot = { box: readonly number[]; label: boolean; v4: boolean };
export type SpotFrame = {
  src: string;
  event: string;
  width: number;
  height: number;
  robots: SpotRobot[];
  v4Extra: number[][];
};

export const spotFrames: SpotFrame[] = [
  {
    // OTOfavQlQXc_2026txhou_qm11_t08211
    src: "/img/frcmob/spot/frame-1.jpg",
    event: "2026txhou · Qualification 11",
    width: 1280,
    height: 312,
    robots: [
      { box: [50.31, 33.17, 3.12, 9.29], label: true, v4: true },
      { box: [21.09, 43.43, 5.47, 14.74], label: true, v4: true },
      { box: [25.27, 40.38, 3.28, 9.29], label: true, v4: true },
      { box: [67.5, 76.12, 5.86, 21.47], label: true, v4: false },
      { box: [70.32, 59.12, 5.56, 16.62], label: false, v4: true },
      { box: [10.14, 62.94, 4.95, 18.91], label: false, v4: true },
    ],
    v4Extra: [],
  },
  {
    // cuiTG0R22Ng_2026txhou_qm16_t11601
    src: "/img/frcmob/spot/frame-2.jpg",
    event: "2026txhou · Qualification 16",
    width: 1280,
    height: 312,
    robots: [
      { box: [39.45, 34.94, 3.67, 8.97], label: true, v4: true },
      { box: [69.8, 44.23, 7.58, 18.91], label: true, v4: true },
      { box: [54.02, 34.94, 4.38, 9.94], label: true, v4: true },
      { box: [69.69, 47.44, 4.77, 16.35], label: true, v4: false },
      { box: [54.86, 30.57, 6.32, 13.72], label: false, v4: true },
      { box: [14.02, 59.61, 5.06, 16.22], label: false, v4: true },
    ],
    v4Extra: [],
  },
  {
    // zTiPColmmiE_2026txmca_qm1_t09351
    src: "/img/frcmob/spot/frame-3.jpg",
    event: "2026txmca · Qualification 1",
    width: 1280,
    height: 312,
    robots: [
      { box: [44.69, 29.01, 5.08, 16.03], label: true, v4: true },
      { box: [72.42, 30.29, 4.3, 12.5], label: true, v4: true },
      { box: [60.35, 28.21, 2.58, 8.01], label: true, v4: false },
      { box: [24.9, 28.94, 3.47, 12.13], label: false, v4: false },
      { box: [25.49, 26.6, 5.78, 13.23], label: false, v4: true },
      { box: [37.89, 28.59, 4.84, 9.54], label: false, v4: true },
    ],
    v4Extra: [],
  },
  {
    // cuiTG0R22Ng_2026txhou_qm16_t13486
    src: "/img/frcmob/spot/frame-4.jpg",
    event: "2026txhou · Qualification 16",
    width: 1280,
    height: 312,
    robots: [
      { box: [44.77, 33.01, 3.59, 9.62], label: true, v4: true },
      { box: [70.74, 53.53, 5.0, 17.31], label: true, v4: true },
      { box: [24.02, 36.86, 3.36, 9.62], label: true, v4: true },
      { box: [56.13, 33.17, 4.92, 10.58], label: true, v4: true },
      { box: [18.92, 50.59, 6.1, 15.98], label: false, v4: true },
      { box: [36.79, 33.27, 5.35, 10.72], label: false, v4: true },
    ],
    v4Extra: [],
  },
  {
    // cuiTG0R22Ng_2026txhou_qm16_t11978
    src: "/img/frcmob/spot/frame-5.jpg",
    event: "2026txhou · Qualification 16",
    width: 1280,
    height: 312,
    robots: [
      { box: [30.94, 51.92, 5.78, 17.63], label: true, v4: true },
      { box: [40.98, 35.58, 3.52, 8.97], label: true, v4: true },
      { box: [71.21, 44.71, 6.02, 14.74], label: true, v4: true },
      { box: [22.11, 39.85, 4.46, 10.11], label: false, v4: true },
      { box: [37.53, 36.25, 3.65, 9.52], label: false, v4: true },
      { box: [69.44, 51.16, 4.99, 13.1], label: false, v4: false },
    ],
    v4Extra: [[37.65, 35.63, 6.86, 10.28]],
  },
];

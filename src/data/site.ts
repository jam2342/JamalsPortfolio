/**
 * Central site identity and contact details.
 * Edit here; every page reads from this file.
 */

export const site = {
  name: "Jamal Mammadzada",
  role: "Student researcher and engineer",
  location: "Allen, Texas",
  email: "jamalmammadzada13@gmail.com",
  github: "jam2342",
  githubUrl: "https://github.com/jam2342",
  // Deliberately not shown on the homepage. Contact page + resume only.
  phone: "(945) 274-4297",
  school: "Allen High School",
  graduation: "June 2027",
  program: "International Baccalaureate Diploma Programme",
  coursework: ["IB Mathematics HL II", "AP Physics C: Electricity and Magnetism"],
  resume: "/Jamal_Mammadzada_Resume.pdf",
  resumeDocx: "/Jamal_Mammadzada_Resume.docx",
  resumeVisual: "/Jamal_Mammadzada_Resume_Visual.pdf",
  resumeVisualDocx: "/Jamal_Mammadzada_Resume_Visual.docx",
  description:
    "Jamal Mammadzada builds machine-learning, robotics, cybersecurity, and educational systems, from computer-vision match analysis to Windows hardening automation and robot kits for younger students.",
} as const;

export const nav = [
  { label: "Work", href: "/work/" },
  { label: "Research", href: "/research/" },
  { label: "Experience", href: "/experience/" },
  { label: "About", href: "/about/" },
  { label: "Contact", href: "/contact/" },
] as const;

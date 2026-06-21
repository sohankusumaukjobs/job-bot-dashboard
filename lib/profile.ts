/**
 * Single source of truth for the dashboard owner's identity. Reused by the
 * welcome screen and the header profile chip so the name/role is set once.
 */
export const PROFILE = {
  name: "Sohan",
  fullName: "Sohan Kusuma",
  initials: "SK",
  /** Short caption shown under the name — tweak freely. */
  role: "Job-Hunt Command Center",
} as const;

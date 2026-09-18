// Local examples shared by the public previews. No account data is used.
export const previewTasks = [
  { id: "brief", title: "Define the project brief", description: "Agree on the goals and scope.", category: "Design", completed: true, allocatedTimeMs: 86400000, position: { x: 0, y: 140 } },
  { id: "wireframes", title: "Map out the key pages", description: "Create the initial wireframes.", category: "Design", completed: false, allocatedTimeMs: 259200000, position: { x: 240, y: 40 } },
  { id: "visuals", title: "Explore the visual direction", description: "Choose typography and colors.", category: "Design", completed: false, allocatedTimeMs: 172800000, position: { x: 240, y: 240 } },
  { id: "build", title: "Build the landing page", description: "Bring the approved designs to life.", category: "Development", completed: false, allocatedTimeMs: 345600000, position: { x: 480, y: 140 } },
  { id: "review", title: "Review and launch", description: "Check the experience before launch.", category: "Development", completed: false, allocatedTimeMs: 172800000, position: { x: 720, y: 140 } },
];
export const previewEdges = [
  { id: "brief-wireframes", source: "brief", target: "wireframes" },
  { id: "brief-visuals", source: "brief", target: "visuals" },
  { id: "wireframes-build", source: "wireframes", target: "build" },
  { id: "visuals-build", source: "visuals", target: "build" },
  { id: "build-review", source: "build", target: "review" },
];
export const previewCategories = ["Design", "Development"];
export const previewNoop = () => {};

// Explicit UTC dates and ISO labels keep server and browser output identical.
export const previewKickoff = new Date("2026-09-14T00:00:00Z");
export const previewDeadline = new Date("2026-10-16T00:00:00Z");
export const previewNowMs = Date.parse("2026-09-18T00:00:00Z");
export const formatPreviewDate = (date: Date) => date.toISOString().slice(0, 10);
export const previewSpans = {
  Design: { start: previewKickoff, end: new Date("2026-09-30T00:00:00Z") },
  Development: { start: new Date("2026-09-30T00:00:00Z"), end: previewDeadline },
};
export const previewTasksByCategory = Object.fromEntries(previewCategories.map(category => [category, previewTasks.filter(task => task.category === category)]));

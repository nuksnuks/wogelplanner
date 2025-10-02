import fs from "fs";
import path from "path";
import { GetStaticPaths } from "next";

// This file will be imported in your [id]/taskflow.tsx and [id].tsx pages
// It reads the project-ids.json file generated at build time

export function getProjectIdsFromFile(): string[] {
  const filePath = path.join(process.cwd(), "project-ids.json");
  if (!fs.existsSync(filePath)) return [];
  const data = fs.readFileSync(filePath, "utf-8");
  return JSON.parse(data);
}

// Example usage in getStaticPaths:
// import { getProjectIdsFromFile } from "../../getProjectIdsFromFile";
// export const getStaticPaths: GetStaticPaths = async () => {
//   const ids = getProjectIdsFromFile();
//   return {
//     paths: ids.map(id => ({ params: { id } })),
//     fallback: false,
//   };
// };

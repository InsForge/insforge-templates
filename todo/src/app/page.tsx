import { TodoApp } from "./todo-app";

function getProjectIdFromLinkFile(): string | null {
  try {
    const fs = require("fs");
    const path = require("path");
    let dir = process.cwd();
    const root = path.parse(dir).root;
    while (dir !== root) {
      const filePath = path.join(dir, ".insforge", "project.json");
      if (fs.existsSync(filePath)) {
        const content = JSON.parse(fs.readFileSync(filePath, "utf-8"));
        return content.project_id ?? null;
      }
      dir = path.dirname(dir);
    }
    return null;
  } catch {
    return null;
  }
}

function getDashboardUrl(): string {
  const projectId = getProjectIdFromLinkFile();
  if (projectId) {
    return `https://insforge.dev/dashboard/project/${projectId}?route=/dashboard/database/tables`;
  }
  return "https://insforge.dev/dashboard";
}

export default function Home() {
  const dashboardUrl = getDashboardUrl();
  return <TodoApp dashboardUrl={dashboardUrl} />;
}

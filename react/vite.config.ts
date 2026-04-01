import fs from 'fs';
import path from 'path';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

function getInsforgeProjectId(): string | null {
  try {
    let dir = __dirname;
    while (dir !== path.dirname(dir)) {
      const filePath = path.join(dir, '.insforge', 'project.json');
      if (fs.existsSync(filePath)) {
        const content = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
        return content.project_id ?? null;
      }
      dir = path.dirname(dir);
    }
    return null;
  } catch {
    return null;
  }
}

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  define: {
    __INSFORGE_PROJECT_ID__: JSON.stringify(getInsforgeProjectId()),
  },
});

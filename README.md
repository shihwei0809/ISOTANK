<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# Run and deploy your AI Studio app

This project is a React application set up with Vite and TypeScript. It includes a pre-configured GitHub Action for deploying to GitHub Pages.

## 🚀 Quick Start

### Prerequisites
- **Node.js** (v18 or higher recommended)
- **npm** (comes with Node.js)

### Local Development

1.  **Install dependencies:**
    ```bash
    npm install
    ```

2.  **Configure Environment:**
    - Rename `.env.example` to `.env` (if it exists) or create a `.env` file.
    - Set your API keys (e.g., `GEMINI_API_KEY`).

3.  **Start the development server:**
    ```bash
    npm run dev
    ```
    Open your browser and navigate to the URL shown in the terminal (usually `http://localhost:3000` or `http://localhost:5173`).

## 📦 Deployment

This repository is configured to automatically deploy to **GitHub Pages** whenever you push to the `main` branch.

### Setup GitHub Pages
1. Go to your repository **Settings**.
2. Navigate to **Pages** (under "Code and automation").
3. Under **Build and deployment** > **Source**, select **GitHub Actions**.
4. The deployment will trigger automatically on your next push to `main`.

### Manual Build
To build the project locally (outputs to `dist/`):
```bash
npm run build
```
To preview the production build locally:
```bash
npm run preview
```

## 🛠 Project Structure

- `src/` - Application source code
- `.github/workflows/` - CI/CD configuration
- `vite.config.ts` - Vite configuration


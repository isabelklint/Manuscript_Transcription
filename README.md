<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# Run and deploy your AI Studio app

This contains everything you need to run your app locally.

View your app in AI Studio: https://ai.studio/apps/c391348c-6db3-4b9d-a4e9-610b8ff92fc6

## Run Locally

**Prerequisites:**  Node.js


1. Install dependencies:
   `npm install`
2. Set the `GEMINI_API_KEY` in [.env.local](.env.local) to your Gemini API key
3. Run the app:
   `npm run dev`

DESCRIPTION:
TEI Manuscript Workspace — a browser-based tool for transcribing and encoding historical manuscripts into TEI P5 XML format.
Purpose: Isabel Klint (Lancaster University) is transcribing a specific 18th-century bilingual Mazatec–Spanish manuscript (Vocabulario en Ydioma Mazateco, 1796, UVA MSS 01784) into a structured XML format for linguistic/corpus research.
Core workflow:
Fill in manuscript metadata (title, author, repository, physical description, project details)
Enter transcription entries line by line, each capturing:
Layout position (column 1, column 2, or across)
Line number
Old/normalized spellings in Mazatec (old_maz/new_maz) and Spanish (old_spa/new_spa) with uncertainty flags
English gloss
IPA transcription
Kirkby set references (a comparative linguistic data structure with proto-form, daughter words, and page refs)
Variant readings and editorial/linguistic notes
A live XML preview panel on the right renders the full TEI P5 document in real time
Download the XML locally or save/open via Google Drive
Technical stack: React + TypeScript + Vite, Tailwind CSS, Google Drive API (optional, requires a client ID env var). State is auto-saved to localStorage.

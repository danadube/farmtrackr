# FarmTrackr Web App

A modern web-based farm contact management system built with Next.js, React, and TypeScript.

## Features

- **Contact Management**: Add, edit, and manage farm contacts
- **Import/Export**: Support for CSV and Excel files
- **Google Sheets Integration**: Sync with existing farm spreadsheets
- **Responsive Design**: Works on desktop, tablet, and mobile
- **Modern UI**: Clean, intuitive interface with Tailwind CSS

## Farm Spreadsheets

The app integrates with the following farm Google Sheets:

- Alicante
- Cielo  
- Escala
- Ivy
- Presidential
- Santo Tomas
- Sunterrace
- Versailles
- Victoria Falls

## Getting Started

1. Install dependencies:
```bash
yarn install
```

2. Set up environment variables:
```bash
cp .env.example .env.local
```

3. Run the development server:
```bash
yarn dev
```

4. Open [http://localhost:3000](http://localhost:3000) in your browser.

## Google Sheets Setup

To enable Google Sheets integration:

1. Create a Google Service Account
2. Download the credentials JSON file
3. Share your farm spreadsheets with the service account email
4. Add the credentials to your environment variables

## Deployment

The app is ready for deployment on Vercel, Netlify, or any other hosting platform that supports Next.js.

## Tech Stack

- **Framework**: Next.js 14
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **Database**: Prisma with PostgreSQL
- **Authentication**: Google OAuth (for Sheets integration)
- **File Processing**: Papa Parse (CSV), XLSX (Excel)

## License

Private - All rights reserved.

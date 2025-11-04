# FarmTrackr Web - Farm CRM Application

## Overview
FarmTrackr Web is a modern, web-based Customer Relationship Management (CRM) application designed specifically for farm operations. Built with Next.js, TypeScript, and Tailwind CSS, it provides a responsive interface accessible from any device.

## Current Status: DEVELOPMENT ✅
- **Modern Web Framework**: Next.js 14 with TypeScript
- **Responsive Design**: Tailwind CSS with farm-themed aesthetics
- **Component Architecture**: Reusable React components
- **Type Safety**: Full TypeScript implementation

## Key Features

### Dashboard
- **Overview Statistics**: Total contacts, farms, and recent activity
- **Quick Actions**: Add contact, import/export, print labels, documents
- **Recent Contacts**: Latest additions with easy access
- **Modern UI**: Clean, farm-themed design with green accents

### Contact Management
- **Contact Listing**: Searchable and filterable contact list
- **Contact Details**: Comprehensive contact information
- **Farm Organization**: Group contacts by farm
- **Search & Filter**: Real-time search with multiple criteria

### Navigation
- **Sidebar Navigation**: Clean, organized menu structure
- **Responsive Design**: Works on desktop, tablet, and mobile
- **Active States**: Clear indication of current page
- **Quick Access**: Easy navigation between features

## Technical Architecture

### Core Technologies
- **Framework**: Next.js 14 with App Router
- **Language**: TypeScript for type safety
- **Styling**: Tailwind CSS with custom farm theme
- **Icons**: Lucide React for consistent iconography
- **State Management**: React hooks and local state

### Project Structure
```
farmtrackr-web/
├── src/
│   ├── app/                    # Next.js App Router pages
│   │   ├── page.tsx           # Dashboard (Home)
│   │   ├── contacts/          # Contact management
│   │   └── layout.tsx         # Root layout
│   ├── components/            # Reusable React components
│   ├── lib/                   # Utility functions
│   └── types/                 # TypeScript type definitions
├── tailwind.config.ts         # Tailwind configuration
├── tsconfig.json              # TypeScript configuration
└── package.json               # Dependencies and scripts
```

## Design System

### Color Palette
- **Primary Green**: Farm-themed green gradient
- **Neutral Grays**: Clean, professional grays
- **Accent Colors**: Subtle blues and greens
- **Status Colors**: Success, warning, error states

### Typography
- **Font Family**: Inter (Google Fonts)
- **Weights**: 300, 400, 500, 600, 700
- **Hierarchy**: Clear heading and body text distinction

### Components
- **Cards**: Rounded corners with subtle shadows
- **Buttons**: Consistent styling with hover states
- **Forms**: Clean input fields with focus states
- **Navigation**: Sidebar with active state indicators

## Getting Started

### Prerequisites
- Node.js 18.20.4+
- Yarn package manager

### Installation
```bash
# Install dependencies
yarn install

# Start development server
yarn dev

# Build for production
yarn build

# Start production server
yarn start
```

### Development
The app runs on `http://localhost:3000` by default.

## Features Implemented

### ✅ Completed
- **Dashboard**: Overview with statistics and quick actions
- **Contact Listing**: Searchable contact list with mock data
- **Navigation**: Sidebar navigation with active states
- **Responsive Design**: Works on all screen sizes
- **Type Safety**: Full TypeScript implementation

### 🚧 In Progress
- **Contact Forms**: Add/edit contact functionality
- **Import/Export**: CSV and Excel file handling
- **Data Persistence**: Database integration
- **Authentication**: User login system

### 📋 Planned
- **Document Management**: File upload and organization
- **Label Printing**: Address label generation
- **Data Quality**: Contact validation and cleanup
- **Reporting**: Analytics and export features

## Migration from Swift

This web version is based on the Swift FarmTrackr app architecture:

### Preserved Features
- **Contact Model**: Same data structure and fields
- **Navigation Structure**: Similar menu organization
- **Visual Design**: Farm-themed aesthetics
- **Core Functionality**: Contact management focus

### Enhanced Features
- **Cross-Platform**: Works on any device with a browser
- **Modern UI**: Updated design patterns and components
- **Responsive**: Optimized for all screen sizes
- **Web Standards**: Uses modern web technologies

## Archive Structure
The `/archive/` directory contains:
- **swift-app/**: Original Swift FarmTrackr application
- **docs/**: Historical documentation and setup guides
- **resources/**: Test files, scripts, and assets

## Contributing
This is a development project. For feature requests or bug reports, please refer to the development roadmap.

## License
Private project for farm operations.

---
*Last updated: October 29, 2025*
*Status: Development - Web-based Farm CRM*

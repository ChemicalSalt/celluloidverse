
# Celluloidverse

> An AI-powered universe of storytelling—AI-crafted shorts and full-length cinematic videos.

## 🚀 Live Demo

[https://celluloidverse-7d324.web.app](https://celluloidverse-7d324.web.app)

---

## 📦 Features

- **AI Shorts**: Auto-fetches YouTube Shorts (≤ 60 s) from your channel.  
- **AI Videos**: Retrieves full-length videos (> 60 s) via YouTube Data API v3.  
- **Dark & Light Mode**: Follows system preference & manual toggle (sun/moon icon).  
- **Firebase-Powered**:  
  - Hosting & rewrites for SPA routing  
  - Firestore for form submissions  
  - Authentication (email/password + OAuth)  
  - reCAPTCHA v3 on Contact form  
- **SEO & Verification**:  
  - Google site-verification meta tag  
  - robots.txt & sitemap.xml served with correct headers  
- **Responsive & Modern**: React + Vite + Tailwind CSS v4, utility-first  
- **Auto-Updates**: New YouTube content appears without manual work  

---

## 🛠️ Getting Started

### Prerequisites

- Node.js ≥ 16.x & npm  
- Firebase project with Hosting, Firestore & Auth  
- YouTube Data API v3 key  

### Setup

1. **Clone & install**  
   ```bash
   git clone https://github.com/ChemicalSalt/Celluloidverse.git
   cd Celluloidverse
   npm install

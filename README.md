# 📹 VMeet – AI-Powered Video Conferencing App

VMeet is a web-based real-time video conferencing application built with **Next.js**, **TypeScript**, **Tailwind CSS**, and **Stream SDKs**. It offers secure authentication using **Clerk**, AI-assisted chat via **Gemini**, and advanced meeting tools like **live polling**, **recordings**, **reactions**, **closed captions**, and more.

> ✅ Inspired by modern conferencing tools like Zoom, Google Meet, and Discord—VMeet goes beyond basics with an AI-enhanced, interactive user experience.

---

## 🚀 Features

- 🔐 **Clerk Authentication**  
  Secure user sign-up/sign-in and session management using Clerk.

- 🎥 **Stream.io Video SDK**  
  Host & join video calls with features like screen sharing, mic/cam toggles, and real-time stats.

- 💬 **Chat System with AI**  
  Gemini-powered @AI chatbot responds with contextual replies, summaries, and answers.

- 📊 **Poll System + Poll History**  
  Create and vote in real-time polls. View complete session history for accountability.

- 🎙️ **Live Captions**  
  Turn on real-time subtitles powered by Stream's closed caption API with color customization.

- 🔈 **Soundboard Effects**  
  Discord-style buttons for reactions like clap, laugh, buzzer (sent via Stream events).

- 📁 **Dashboard & Meeting Tools**  
  - Schedule future meetings  
  - Access past meeting logs and recordings  
  - Personal meeting room for spontaneous sessions  
  - Secure playback via signed S3 URLs

- ⚙️ **Call Stats Panel**  
  Network health, latency, resolution, bitrate, and quality drops visible live.

- 📱 **Fully Responsive UI**  
  Optimized for mobile with adaptive layout, enlarged buttons, and hamburger menus.

---

## 🖥️ Tech Stack

| Category         | Tech Used                                 |
|------------------|-------------------------------------------|
| Framework        | Next.js (App Router)                      |
| Language         | TypeScript                                |
| UI Libraries     | Tailwind CSS, shadcn UI                   |
| Auth             | Clerk (`^6.21.0`)                         |
| Video/Chat SDK   | getstream.io (`video-react-sdk ^1.18.4`) |
| AI Integration   | Google Gemini API (`@google/genai`)       |
| Icons            | Lucide, Heroicons                         |

---

## 📂 Folder Structure (Simplified)

├── app/ # Next.js App Router (auth, meeting, home pages)
├── components/ # Chat, Poll, VoteButton, Captions, Soundboard, etc.
├── public/ # Images, SVGs, soundboard audio files
├── hooks/ # Custom React logic for meeting state
├── lib/ # Utility functions (formatting, constants)
├── providers/ # Context providers (StreamClientProvider, ClerkProvider)


________________________________________________________________________________________________________________________________________________________________________________




🧠 Project Highlights
🧠 Real-time AI chatbot using Gemini with @AI tag

🗳️ Instant polling with dynamic vote updates and historical tracking

🔐 Secure authentication and role management via Clerk

🎬 Recording and S3-based secure playback

💡 Built using modular, reusable, and scalable architecture






This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.

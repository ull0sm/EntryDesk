<div align="center">
  <h1>🥋 EntryDesk</h1>
  <p><strong>The Open-Source Tournament Operations & Event Management Platform</strong></p>

  [![GitHub stars](https://img.shields.io/github/stars/ull0sm/entrydesk?style=flat-square)](https://github.com/ull0sm/entrydesk/stargazers)
  [![GitHub forks](https://img.shields.io/github/forks/ull0sm/entrydesk?style=flat-square)](https://github.com/ull0sm/entrydesk/network/members)
  [![GitHub issues](https://img.shields.io/github/issues/ull0sm/entrydesk?style=flat-square)](https://github.com/ull0sm/entrydesk/issues)
  [![Contributors](https://img.shields.io/github/contributors/ull0sm/entrydesk?style=flat-square)](https://github.com/ull0sm/entrydesk/graphs/contributors)
</div>
<hr />

## 📖 About EntryDesk

Most grassroots martial arts events still operate on fragmented spreadsheets, paper entries, and ad-hoc messaging. 

**EntryDesk** is a highly optimized, role-based dashboard designed to standardize and scale martial arts tournaments. It provides a reproducible, self-hosted infrastructure that empowers local communities, dojos, and federations to run professional-grade events without the lock-in and high friction of paid proprietary software.

## 🌍 Open Source Impact & Maintainership

**Maintainers & Project Owners:** [@ull0sm](https://github.com/ull0sm) and [@bugsNburgers](https://github.com/bugsNburgers) 

As the primary maintainer, my vision is to ship core operational infrastructure to the martial arts ecosystem. EntryDesk acts as a public good for organizers globally. I actively maintain the codebase, review pull requests, and manage the database schema to ensure security, high performance, and accessibility for any organization wanting to host a tournament.

## 🌟 Key Features

### 🛠️ For Organizers
- **Full-Lifecycle Event Management**: Effortlessly create, schedule, and manage public or private events.
- **Approval Workflows**: Review and manage coach applications through a dedicated pipeline.
- **Unified Entry Management**: Leverage real-time views (`organizer_entries_view`) for comprehensive roster access.
- **Frictionless Export**: Instant Excel/CSV data dumps for operational bracket management.
- **Advanced Dashboards**: Interactive, deep-linked analytics cards tailored for operational velocity.

### 🥋 For Coaches
- **Roster & Dojo Hub**: Centralized location for managing students and dojo metadata.
- **Registration Pipelines**: Seamlessly map eligible students to upcoming events.
- **Entry State Machine**: Track granular statuses (`draft`, `submitted`, `approved`, `rejected`).

### 💻 Product & Design Architecture
- **Instant Feedback**: Optimistic UI loops, determinate loading overlays, and smooth transition APIs.
- **History-Aware Navigation**: Context-preserving "one-step back" behavior eliminating frustrating list-jumps.
- **Modern Aesthetic**: Clean, athletic-inspired design using [Tailwind CSS v4](https://tailwindcss.com/) and [Radix UI](https://www.radix-ui.com/).

## 🛠 Tech Stack

- **Framework**: [Next.js](https://nextjs.org/) (App Router)
- **UI & Styling**: [React](https://react.dev/), [Tailwind CSS v4](https://tailwindcss.com/)
- **Backend & Database**: [Supabase](https://supabase.com/)
  - Authentication (Email/Password + Google OAuth)
  - PostgreSQL Database (Tables + RLS Policies)

## 🚀 Quick Start & Installation

We've made spinning up a local instance of EntryDesk as smooth as possible.
    
👉 **See the [QUICKSETUP.md](QUICKSETUP.md) guide for detailed installation, environment, and database configuration instructions.**

## 📚 Documentation & Contributing

We believe robust software is built collaboratively. We welcome issues, bug reports, and pull requests!

- **[Contribution Guidelines](CONTRIBUTING.md)**: How to submit features and fixes.
- **[Changelog](CHANGELOG.md)**: Explore our latest updates and roadmaps.

## 🤝 Contributors

EntryDesk is made possible by our amazing community. Thank you to everyone who has helped build and improve this platform!

**Core Maintainers:** [@ull0sm](https://github.com/ull0sm) and [@bugsNburgers](https://github.com/bugsNburgers)

### All Contributors
<a href="https://github.com/ull0sm/entrydesk/graphs/contributors">
  <img src="https://contrib.rocks/image?repo=ull0sm/entrydesk" alt="Contributors list" />
</a>

---

<div align="center">
  <i>Built with ❤️ for the karate community</i>
</div>

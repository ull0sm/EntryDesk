# Contributing to EntryDesk

First off, thank you for considering contributing to EntryDesk! We welcome contributions from everyone. Whether it's reporting a bug, suggesting a feature, or writing code, your help is appreciated and helps the platform grow.

## 🛠 Getting Started

1. **Fork the Repository**: Start by forking the EntryDesk repository to your own GitHub account.
2. **Clone Locally**: Clone your fork to your local machine.
   ```bash
   git clone https://github.com/ull0sm/entrydesk.git
   cd entrydesk
   ```
3. **Set Up the Project**: Follow the Setup instructions in the `README.md` to install dependencies and configure your local Supabase instance.
   ```bash
   npm install
   ```

## 🌿 Branching Strategy

- **`main`**: The main production-ready branch.
- **Feature Branches**: Please create a new branch for each feature or bug fix.
  - Recommended naming convention: `feature/your-feature-name` or `fix/issue-description`
  - Example: `git checkout -b feature/dynamic-dashboard`

## 💻 Making Changes

### Code Style & Standards
- **Next.js App Router**: Familiarize yourself with Next.js App Router conventions (e.g., Server vs. Client Components, route handlers). Find Next.js documentation at [nextjs.org/docs](https://nextjs.org/docs).
- **Styling**: We use Tailwind CSS v4 and Radix UI components. Please utilize the existing UI components and design system variables when building new features to maintain a clean, consistent aesthetic.
- **Code Quality**: Before committing, ensure your code is clean and passes ESLint checks.
  ```bash
  npm run lint
  ```

### Committing Your Changes
Please write clear, meaningful commit messages. Good commit messages help track changes and understand the project's history.
- Use the present tense ("Add feature" not "Added feature").
- Reference any relevant issues or pull requests.

## 🚀 Submitting a Pull Request

1. Push your changes to your fork:
   ```bash
   git push origin your-branch-name
   ```
2. Open a Pull Request against the `main` branch of the original repository.
3. Describe your changes clearly and in detail in the PR description. Include screenshots or videos if you have made UI modifications!
4. A maintainer will review your PR, request changes if necessary, and ultimately merge your code.

## 🐛 Reporting Bugs & Requesting Features

Even if you don't write code, your feedback is crucial! You can contribute by opening an issue:
- **Bugs**: Please provide steps to reproduce, the expected behavior, and the actual behavior you experienced. Include browser and OS details if relevant.
- **Features**: Explain why the feature would be beneficial and how you envision it working in the context of the EntryDesk dashboard.

---

Built with ❤️ for the karate community

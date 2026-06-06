import { ArrowUpRight, Github, Mail } from 'lucide-react'
import { MaterialWebLoader } from '@/components/portfolio/material-web-loader'

const projects = [
  {
    name: 'EntryDesk',
    description:
      'Open-source tournament operations platform for martial arts events with role-based workflows and fast event execution.',
    href: 'https://github.com/ull0sm/EntryDesk',
    stack: ['Next.js', 'Supabase', 'Tailwind CSS'],
  },
  {
    name: 'HonorLog',
    description:
      'A focused discipline and habit tracking experience designed to keep consistency visible with clean progress loops.',
    href: 'https://github.com/ull0sm/HonorLog',
    stack: ['React', 'TypeScript', 'UX Systems'],
  },
  {
    name: 'FitTrack',
    description:
      'A practical fitness tracking application for logging sessions, measuring momentum, and turning workouts into data.',
    href: 'https://github.com/ull0sm/FitTrack',
    stack: ['Frontend', 'Data Tracking', 'Product Design'],
  },
]

export default function Page() {
  return (
    <main className="min-h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 text-slate-100">
      <MaterialWebLoader />

      <section className="mx-auto max-w-6xl px-6 pb-20 pt-24 md:px-10">
        <p className="text-sm uppercase tracking-[0.28em] text-emerald-300">Portfolio</p>
        <h1 className="mt-4 text-4xl font-semibold tracking-tight md:text-6xl">
          I build clean, high-impact products.
        </h1>
        <p className="mt-6 max-w-3xl text-lg text-slate-300">
          I am ull0sm, an open-source-focused builder shipping modern web products with elegant UX and reliable execution.
          My work blends product clarity, engineering depth, and minimal design.
        </p>

        <div className="mt-8 flex flex-wrap gap-3">
          <md-filled-button href="https://github.com/ull0sm" target="_blank" rel="noreferrer">
            <span className="inline-flex items-center gap-2">
              <Github className="h-4 w-4" /> GitHub
            </span>
          </md-filled-button>
          <md-outlined-button href="mailto:hello@ull0sm.dev" rel="noreferrer">
            <span className="inline-flex items-center gap-2">
              <Mail className="h-4 w-4" /> Contact
            </span>
          </md-outlined-button>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-6 pb-24 md:px-10">
        <h2 className="text-2xl font-semibold md:text-3xl">Selected projects</h2>

        <div className="mt-8 grid gap-6 md:grid-cols-3">
          {projects.map((project) => (
            <article key={project.name} className="rounded-2xl border border-slate-800 bg-slate-900/70 p-6 shadow-lg">
              <div className="flex items-center justify-between gap-4">
                <h3 className="text-xl font-semibold">{project.name}</h3>
                <a
                  href={project.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={`View ${project.name} on GitHub (opens in new tab)`}
                  className="text-emerald-300 hover:text-emerald-200"
                >
                  <ArrowUpRight className="h-4 w-4" />
                </a>
              </div>

              <p className="mt-4 text-sm leading-6 text-slate-300">{project.description}</p>

              <md-chip-set className="mt-5 flex flex-wrap gap-2">
                {project.stack.map((item) => (
                  <md-assist-chip key={item} label={item} />
                ))}
              </md-chip-set>

              <div className="mt-6">
                <md-filled-tonal-button
                  href={project.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={`View ${project.name} repository (opens in new tab)`}
                >
                  View repository
                </md-filled-tonal-button>
              </div>
            </article>
          ))}
        </div>
      </section>
    </main>
  )
}

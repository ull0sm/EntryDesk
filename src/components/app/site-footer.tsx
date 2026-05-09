'use client'

import Link from 'next/link'
import Image from 'next/image'
import { Github } from 'lucide-react'
import { Button } from '@/components/ui/button'

export function SiteFooter() {
    const year = new Date().getFullYear()

    const socialLinks = [
        {
            icon: <Github className="h-4 w-4" />,
            href: 'https://github.com/ull0sm/EntryDesk',
            label: 'GitHub',
        },
    ]

    const mainLinks = [
        { href: '/#features', label: 'Features' },
        { href: '/#upcoming-events', label: 'Events' },
        { href: '/contact', label: 'Contact' },
        { href: '/login', label: 'Login' },
    ]

    const legalLinks = [
        { href: '/privacy', label: 'Privacy' },
        { href: '/terms', label: 'Terms' },
    ]

    return (
        <footer
            id="contact"
            className="scroll-mt-24 relative isolate overflow-hidden border-t border-border/40 bg-background/70 dark:border-white/[0.08] dark:bg-background/60"
        >
            {/* Background image */}
            <div
                aria-hidden="true"
                className="pointer-events-none absolute inset-0 -z-10 bg-cover bg-[center_35%] opacity-75 blur-[1px] scale-105 dark:opacity-80"
                style={{ backgroundImage: "url('/footer bg.webp')" }}
            />

            {/* Gradient overlay */}
            <div
                aria-hidden="true"
                className="pointer-events-none absolute inset-0 -z-10 bg-gradient-to-b from-background/28 via-background/40 to-background/58 dark:from-background/18 dark:via-background/32 dark:to-background/52"
            />

            {/* Main card */}
            <div className="relative z-10 mx-auto max-w-6xl px-4 pb-6 pt-14 sm:px-6 xl:max-w-[95vw] xl:px-8">
                <div className="rounded-3xl border border-border/60 bg-background/35 p-8 shadow-sm backdrop-blur-[2px] dark:border-white/[0.12] dark:bg-background/25 md:p-10">

                    {/* Top row: brand left, socials right */}
                    <div className="flex items-center justify-between">
                        <a
                            href="/"
                            aria-label="EntryDesk"
                            className="inline-flex items-center gap-1.5 rounded-full border border-border/60 bg-muted/30 px-3 py-1 text-xs font-medium text-muted-foreground dark:border-white/[0.12] dark:bg-white/[0.04] transition-colors hover:bg-muted/50"
                        >
                            <span className="relative h-3.5 w-3.5 overflow-hidden rounded-full">
                                <Image
                                    src="/favicon.ico"
                                    alt="EntryDesk logo"
                                    fill
                                    className="object-cover"
                                    sizes="14px"
                                />
                            </span>
                            <span className="font-semibold">EntryDesk</span>
                        </a>

                        {/* Social icon buttons */}
                        {socialLinks.length > 0 && (
                            <ul className="flex list-none gap-2">
                                {socialLinks.map((link, i) => (
                                    <li key={i}>
                                        <Button
                                            variant="secondary"
                                            size="icon"
                                            className="h-9 w-9 rounded-full bg-muted/40 hover:bg-muted/70 dark:bg-white/[0.06] dark:hover:bg-white/[0.12] border border-border/50 dark:border-white/[0.10]"
                                            asChild
                                        >
                                            <a href={link.href} target="_blank" rel="noreferrer" aria-label={link.label}>
                                                {link.icon}
                                            </a>
                                        </Button>
                                    </li>
                                ))}
                            </ul>
                        )}
                    </div>

                    {/* Divider */}
                    <div className="my-6 border-t border-border/50 dark:border-white/[0.08]" />

                    {/* Bottom row: copyright left, links right */}
                    <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                        {/* Copyright block */}
                        <div className="text-sm leading-relaxed text-muted-foreground">
                            <div>© {year} EntryDesk. All rights reserved.</div>
                        </div>

                        {/* Nav + legal links stacked right */}
                        <div className="flex flex-col items-start gap-2 sm:items-end">
                            {mainLinks.length > 0 && (
                                <ul className="flex list-none flex-wrap gap-x-5 gap-y-1 sm:justify-end">
                                    {mainLinks.map((link, i) => (
                                        <li key={i}>
                                            <Link
                                                href={link.href}
                                                className="text-sm font-medium text-foreground/80 underline-offset-4 transition-colors hover:text-foreground hover:underline"
                                            >
                                                {link.label}
                                            </Link>
                                        </li>
                                    ))}
                                </ul>
                            )}
                            {legalLinks.length > 0 && (
                                <ul className="flex list-none flex-wrap gap-x-5 gap-y-1 sm:justify-end">
                                    {legalLinks.map((link, i) => (
                                        <li key={i}>
                                            <Link
                                                href={link.href}
                                                className="text-sm text-muted-foreground underline-offset-4 transition-colors hover:text-foreground hover:underline"
                                            >
                                                {link.label}
                                            </Link>
                                        </li>
                                    ))}
                                </ul>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </footer>
    )
}
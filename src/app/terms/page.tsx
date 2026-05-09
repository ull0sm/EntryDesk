import React from "react";

export const metadata = {
  title: 'Terms of Service | EntryDesk',
  description: 'Terms & Conditions for EntryDesk',
}

export default function TermsPage() {
  return (
    <main className="min-h-screen bg-background pb-12">
      <div className="border-b border-border/40">
        <div className="mx-auto max-w-4xl px-4 py-12 sm:px-6 xl:px-8">
          <h1 className="text-4xl font-bold tracking-tight">Terms & Conditions</h1>
          <p className="mt-2 text-muted-foreground">Effective Date: May 8, 2026</p>
          <p className="text-muted-foreground">Last Updated: May 8, 2026</p>
        </div>
      </div>

      <div className="mx-auto max-w-4xl px-4 py-12 sm:px-6 xl:px-8">
        <div className="prose prose-sm dark:prose-invert max-w-none space-y-8">
          <section>
            <h2 className="text-2xl font-semibold mb-4">1. Acceptance of Terms</h2>
            <p className="text-muted-foreground">
              By accessing or using the hosted EntryDesk service at <a href="https://entrydesk.shorinkai.in" className="text-primary hover:underline" target="_blank" rel="noopener noreferrer">entrydesk.shorinkai.in</a> (&quot;Service&quot;), you agree to be bound by these Terms & Conditions (&quot;Terms&quot;). If you do not agree, do not use the Service.
            </p>
            <p className="text-muted-foreground mt-2">
              These Terms apply only to the hosted version of EntryDesk. If you are self-hosting EntryDesk under its open-source license, these Terms do not govern your use &mdash; refer to the project&apos;s license file on GitHub instead.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">2. Description of Service</h2>
            <p className="text-muted-foreground">
              EntryDesk is a tournament operations and event management platform for martial arts organizations. It provides tools for organizers to create and manage events, coaches to manage dojo rosters and submit entries, and real-time entry tracking and approval workflows.
            </p>
            <p className="text-muted-foreground mt-2">
              The Service is provided free of charge in its current form. We reserve the right to introduce pricing in the future, with advance notice to existing users.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">3. Eligibility and Account Registration</h2>
            <p className="text-muted-foreground mb-2">To use the Service, you must:</p>
            <ul className="list-disc list-inside space-y-1 text-muted-foreground pl-2">
              <li>Be at least <strong>18 years old</strong>, or be a legally recognized organization.</li>
              <li>Provide accurate and complete registration information.</li>
              <li>Keep your account credentials secure and not share them with others.</li>
            </ul>
            <p className="text-muted-foreground mt-2">
              You are responsible for all activity that occurs under your account.
            </p>
            <p className="text-muted-foreground mt-2">
              We reserve the right to refuse registration or suspend accounts at our discretion.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">4. User Roles and Responsibilities</h2>
            
            <h3 className="text-xl font-medium mb-2">4a. Organizers</h3>
            <p className="text-muted-foreground mb-4">
              Organizers are responsible for the accuracy of event information they publish, including dates, eligibility rules, and deadlines. Organizers must not create fraudulent or misleading events.
            </p>

            <h3 className="text-xl font-medium mb-2">4b. Coaches</h3>
            <p className="text-muted-foreground mb-2">Coaches are responsible for:</p>
            <ul className="list-disc list-inside space-y-1 text-muted-foreground pl-2 mb-4">
              <li>The accuracy of athlete/student data they enter.</li>
              <li>Ensuring they have appropriate consent from athletes (and guardians of minor athletes) to submit their data to EntryDesk.</li>
              <li>Using the platform only for legitimate tournament registration purposes.</li>
            </ul>

            <h3 className="text-xl font-medium mb-2">4c. All Users</h3>
            <p className="text-muted-foreground mb-2">All users agree not to:</p>
            <ul className="list-disc list-inside space-y-1 text-muted-foreground pl-2">
              <li>Upload false, misleading, or fraudulent information.</li>
              <li>Attempt to gain unauthorized access to other accounts or system resources.</li>
              <li>Use the Service for any unlawful purpose.</li>
              <li>Interfere with or disrupt the Service or its infrastructure.</li>
              <li>Scrape, reverse-engineer, or attempt to extract data from the platform beyond normal use.</li>
              <li>Impersonate another person or organization.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">5. Intellectual Property</h2>
            
            <h3 className="text-xl font-medium mb-2">5a. EntryDesk Platform</h3>
            <p className="text-muted-foreground mb-4">
              The EntryDesk source code is open-source and available on GitHub under its designated license. The name &quot;EntryDesk,&quot; associated branding, and logo are owned by the project maintainer. You may not use these without prior written permission, except as required by the open-source license (e.g., attribution).
            </p>

            <h3 className="text-xl font-medium mb-2">5b. Your Content</h3>
            <p className="text-muted-foreground">
              You retain ownership of any data you submit to EntryDesk (event information, athlete rosters, etc.). By submitting data to the Service, you grant us a limited license to store and process that data solely to provide the Service to you.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">6. Data and Privacy</h2>
            <p className="text-muted-foreground">
              Your use of the Service is also governed by our <a href="/privacy" className="text-primary hover:underline">Privacy Policy</a>, which is incorporated into these Terms by reference. By using the Service, you agree to the data practices described in the Privacy Policy.
            </p>
            <p className="text-muted-foreground mt-2">
              <strong>Coaches who submit athlete data are acting as independent data controllers</strong> for the purposes of that data. EntryDesk acts as a data processor. Coaches are responsible for compliance with applicable data protection laws (including obtaining consent from athletes or their guardians).
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">7. Acceptable Use</h2>
            <p className="text-muted-foreground mb-2">The Service is intended solely for legitimate martial arts tournament management. Prohibited uses include (but are not limited to):</p>
            <ul className="list-disc list-inside space-y-1 text-muted-foreground pl-2 mb-4">
              <li>Creating events for activities that are illegal in the relevant jurisdiction.</li>
              <li>Submitting data for individuals who have not consented to participate.</li>
              <li>Using the platform to discriminate against individuals based on protected characteristics.</li>
              <li>Any use that violates applicable local, national, or international law.</li>
            </ul>
            <p className="text-muted-foreground">
              We reserve the right to remove any content and suspend any account that violates this policy.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">8. Availability and Service Changes</h2>
            <p className="text-muted-foreground mb-2">We aim to keep the Service available but cannot guarantee uninterrupted access. The Service is provided on an &quot;as-is&quot; and &quot;as-available&quot; basis. We may:</p>
            <ul className="list-disc list-inside space-y-1 text-muted-foreground pl-2 mb-4">
              <li>Modify, suspend, or discontinue any part of the Service at any time.</li>
              <li>Perform maintenance that results in temporary downtime.</li>
              <li>Change features or pricing with reasonable advance notice.</li>
            </ul>
            <p className="text-muted-foreground">
              We will try to provide notice before making significant changes that affect existing users.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">9. Disclaimer of Warranties</h2>
            <p className="text-muted-foreground mb-2">
              To the fullest extent permitted by law, EntryDesk is provided <strong>&quot;as is&quot;</strong> without warranties of any kind, express or implied, including but not limited to warranties of merchantability, fitness for a particular purpose, or non-infringement.
            </p>
            <p className="text-muted-foreground mb-2">We do not warrant that:</p>
            <ul className="list-disc list-inside space-y-1 text-muted-foreground pl-2">
              <li>The Service will be error-free or uninterrupted.</li>
              <li>Data exports will be complete or accurate in all cases.</li>
              <li>The Service will meet your specific operational requirements.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">10. Limitation of Liability</h2>
            <p className="text-muted-foreground mb-2">To the maximum extent permitted by applicable law, the EntryDesk maintainer shall not be liable for:</p>
            <ul className="list-disc list-inside space-y-1 text-muted-foreground pl-2 mb-4">
              <li>Any indirect, incidental, special, or consequential damages arising from your use of the Service.</li>
              <li>Loss of data, tournament entries, or event information.</li>
              <li>Losses arising from reliance on data exports or reports generated by the Service.</li>
              <li>Any actions taken by organizers, coaches, or third parties using the platform.</li>
            </ul>
            <p className="text-muted-foreground">
              Our total liability for any claim arising from your use of the Service shall not exceed the amount you have paid us in the 12 months preceding the claim (which, if the Service is free, is zero).
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">11. Indemnification</h2>
            <p className="text-muted-foreground mb-2">You agree to indemnify and hold harmless EntryDesk and its maintainer from any claims, damages, losses, or expenses (including legal fees) arising from:</p>
            <ul className="list-disc list-inside space-y-1 text-muted-foreground pl-2">
              <li>Your use of the Service in violation of these Terms.</li>
              <li>Your submission of data for athletes without proper consent.</li>
              <li>Any content or data you submit to the Service.</li>
              <li>Your violation of any applicable law or third-party rights.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">12. Account Termination</h2>
            
            <h3 className="text-xl font-medium mb-2">By You</h3>
            <p className="text-muted-foreground mb-4">
              You may delete your account at any time by contacting us at <strong>hello@ull0sm.in</strong> or <strong>hello@suprateekyawagal.in</strong>. Your data will be handled per the Privacy Policy.
            </p>

            <h3 className="text-xl font-medium mb-2">By Us</h3>
            <p className="text-muted-foreground mb-2">We may suspend or terminate your account, with or without notice, if you:</p>
            <ul className="list-disc list-inside space-y-1 text-muted-foreground pl-2 mb-4">
              <li>Violate these Terms or the Acceptable Use policy.</li>
              <li>Engage in fraudulent or harmful activity.</li>
              <li>Misuse the platform in a way that affects other users.</li>
            </ul>
            <p className="text-muted-foreground">
              Upon termination, your right to use the Service ceases immediately.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">13. Open Source and Self-Hosting</h2>
            <p className="text-muted-foreground mb-2">EntryDesk is open-source software. If you self-host EntryDesk:</p>
            <ul className="list-disc list-inside space-y-1 text-muted-foreground pl-2">
              <li>These Terms do not apply to your self-hosted instance.</li>
              <li>You are responsible for your own legal compliance, data protection, and security.</li>
              <li>You must comply with the terms of the project&apos;s open-source license.</li>
              <li>The name &quot;EntryDesk&quot; and associated branding may not be used in a way that implies official affiliation without permission.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">14. Governing Law and Disputes</h2>
            <p className="text-muted-foreground">
              These Terms are governed by the laws of <strong>India</strong>, without regard to conflict of law principles. Any disputes arising from these Terms or the Service shall be subject to the exclusive jurisdiction of the courts of <strong>Bengaluru, Karnataka, India</strong>.
            </p>
            <p className="text-muted-foreground mt-2">
              If you are located in a different country, local laws may apply additional rights or restrictions that supplement these Terms.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">15. Changes to These Terms</h2>
            <p className="text-muted-foreground">
              We may update these Terms periodically. When we do, we will update the &quot;Last Updated&quot; date. Material changes will be communicated via email or a notice on the Service. Your continued use of the Service after changes take effect constitutes your acceptance of the revised Terms.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">16. Contact</h2>
            <p className="text-muted-foreground mb-4">For any questions about these Terms, contact:</p>
            <div className="space-y-1 text-muted-foreground">
              <p><strong>EntryDesk Maintainers</strong></p>
              <p>Emails: <strong>hello@ull0sm.in</strong>, <strong>hello@suprateekyawagal.in</strong></p>
              <p>GitHub Profiles: <a href="https://github.com/ull0sm" className="text-primary hover:underline">@ull0sm</a>, <a href="https://github.com/bugsNburgers" className="text-primary hover:underline">@bugsNburgers</a></p>
              <p>Repository: <a href="https://github.com/ull0sm/entrydesk" className="text-primary hover:underline">EntryDesk</a></p>
            </div>
          </section>
        </div>
      </div>
    </main>
  )
}

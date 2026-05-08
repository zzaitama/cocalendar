export const metadata = {
  title: "Privacy Policy — CoCalendar",
  description: "Privacy policy for CoCalendar family calendar app",
}

const LAST_UPDATED = "May 7, 2026"
const CONTACT_EMAIL = "timonsandymei@gmail.com"

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-[#FAF9F7] dark:bg-gray-950">
      <div className="max-w-2xl mx-auto px-6 py-16">

        <a href="/" className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-gray-900 dark:hover:text-white transition-colors mb-10">
          ← Back to CoCalendar
        </a>

        <h1 className="text-4xl font-extrabold text-gray-900 dark:text-white mb-2">Privacy Policy</h1>
        <p className="text-sm text-gray-400 mb-10">Last updated: {LAST_UPDATED}</p>

        <div className="prose prose-gray dark:prose-invert max-w-none space-y-8 text-gray-700 dark:text-gray-300 leading-relaxed">

          <section>
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-3">Overview</h2>
            <p>
              CoCalendar is a private family calendar application built for personal household use.
              It is not a commercial product and is not available to the general public.
              This policy explains what data the app accesses and how it is used.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-3">Who can use this app</h2>
            <p>
              Access is restricted to authorized family members only. Sign-in is handled
              exclusively through Google OAuth. No public registration is available.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-3">What data we access</h2>
            <p>When you sign in with Google, CoCalendar requests access to:</p>
            <ul className="list-disc pl-6 mt-2 space-y-1">
              <li><strong>Google Calendar</strong> — to read and create calendar events on your behalf</li>
              <li><strong>Basic profile information</strong> — your name and email address, used solely for authentication</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-3">How we use your data</h2>
            <ul className="list-disc pl-6 space-y-1">
              <li>Calendar events are displayed within the app and on the household wall display</li>
              <li>Your Google OAuth refresh token is stored securely in an encrypted Redis database (Upstash) solely to keep the wall display running without requiring repeated logins</li>
              <li>Photos you upload for the screensaver are stored in Cloudinary under the app owner&apos;s account</li>
              <li>Chore and task data is stored in the same encrypted Redis database</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-3">What we do not do</h2>
            <ul className="list-disc pl-6 space-y-1">
              <li>We do not sell, share, or transfer your data to any third party</li>
              <li>We do not use your data for advertising or analytics</li>
              <li>We do not store your Google password or any credentials beyond OAuth tokens</li>
              <li>We do not access any Google data beyond what is explicitly listed above</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-3">Third-party services</h2>
            <p>CoCalendar uses the following third-party services to function:</p>
            <ul className="list-disc pl-6 mt-2 space-y-1">
              <li><strong>Google OAuth &amp; Google Calendar API</strong> — authentication and calendar data</li>
              <li><strong>Vercel</strong> — application hosting</li>
              <li><strong>Upstash Redis</strong> — encrypted data storage for chores, settings, and auth tokens</li>
              <li><strong>Cloudinary</strong> — photo storage for the screensaver feature</li>
              <li><strong>Open-Meteo</strong> — weather data (no personal data sent)</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-3">Data retention</h2>
            <p>
              OAuth tokens are retained in Redis for as long as the app is in use.
              You can revoke access at any time by visiting{" "}
              <a href="https://myaccount.google.com/permissions" target="_blank" rel="noopener noreferrer"
                className="text-blue-500 underline">
                Google Account Permissions
              </a>{" "}
              and removing CoCalendar. Uploaded photos can be deleted through the app&apos;s Settings page.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-3">Security</h2>
            <p>
              All data in transit is encrypted via HTTPS. Redis data is encrypted at rest by Upstash.
              The app enforces strict Content Security Policy headers and does not expose sensitive
              tokens to the client.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-3">Contact</h2>
            <p>
              Questions about this policy? Email{" "}
              <a href={`mailto:${CONTACT_EMAIL}`} className="text-blue-500 underline">
                {CONTACT_EMAIL}
              </a>
            </p>
          </section>

        </div>
      </div>
    </div>
  )
}

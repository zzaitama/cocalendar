export const metadata = {
  title: "Terms of Service — CoCalendar",
  description: "Terms of service for CoCalendar family calendar app",
}

const LAST_UPDATED = "May 7, 2026"
const CONTACT_EMAIL = "timonsandymei@gmail.com"

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-[#FAF9F7] dark:bg-gray-950">
      <div className="max-w-2xl mx-auto px-6 py-16">

        <a href="/" className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-gray-900 dark:hover:text-white transition-colors mb-10">
          ← Back to CoCalendar
        </a>

        <h1 className="text-4xl font-extrabold text-gray-900 dark:text-white mb-2">Terms of Service</h1>
        <p className="text-sm text-gray-400 mb-10">Last updated: {LAST_UPDATED}</p>

        <div className="prose prose-gray dark:prose-invert max-w-none space-y-8 text-gray-700 dark:text-gray-300 leading-relaxed">

          <section>
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-3">What this is</h2>
            <p>
              CoCalendar is a private family calendar and household management application.
              It is not a commercial service. Access is limited to authorized family members only.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-3">Acceptable use</h2>
            <p>By using CoCalendar, you agree to:</p>
            <ul className="list-disc pl-6 mt-2 space-y-1">
              <li>Use the app only for its intended purpose — managing household events, chores, and schedules</li>
              <li>Not attempt to access, modify, or interfere with any other user&apos;s data</li>
              <li>Not share your login credentials or the kiosk secret URL with anyone outside the household</li>
              <li>Not attempt to reverse-engineer, exploit, or circumvent any security measures</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-3">Google services</h2>
            <p>
              CoCalendar accesses Google Calendar on your behalf via OAuth. Your use of Google services
              through this app is also subject to{" "}
              <a href="https://policies.google.com/terms" target="_blank" rel="noopener noreferrer"
                className="text-blue-500 underline">Google&apos;s Terms of Service</a>.
              You can revoke CoCalendar&apos;s access to your Google account at any time from your{" "}
              <a href="https://myaccount.google.com/permissions" target="_blank" rel="noopener noreferrer"
                className="text-blue-500 underline">Google Account settings</a>.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-3">Availability</h2>
            <p>
              CoCalendar is provided as-is for personal household use. There are no uptime guarantees.
              The app may be updated, changed, or taken offline at any time without notice.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-3">Limitation of liability</h2>
            <p>
              CoCalendar is a personal project. It is not liable for any missed events, lost data,
              or other issues arising from use of the app. Always maintain your own records for
              important events and appointments.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-3">Changes to these terms</h2>
            <p>
              These terms may be updated at any time. Continued use of the app constitutes
              acceptance of the current terms.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-3">Contact</h2>
            <p>
              Questions? Email{" "}
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

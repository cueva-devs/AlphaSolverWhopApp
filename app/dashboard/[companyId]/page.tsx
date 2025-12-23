import { headers } from "next/headers";
import Link from "next/link";
import { whopsdk } from "@/lib/whop-sdk";

export default async function DashboardPage({
	params,
}: {
	params: Promise<{ companyId: string }>;
}) {
	const { companyId } = await params;
	// Ensure the user is logged in on whop.
	const { userId } = await whopsdk.verifyUserToken(await headers());

	// Fetch the neccessary data we want from whop.
	const [company, user, access] = await Promise.all([
		whopsdk.companies.retrieve(companyId),
		whopsdk.users.retrieve(userId),
		whopsdk.users.checkAccess(companyId, { id: userId }),
	]);

	const displayName = user.name || `@${user.username}`;

	return (
		<div className="min-h-screen bg-[var(--bg-primary)]">
			{/* Header */}
			<header className="border-b border-[var(--border)] bg-[var(--bg-secondary)]">
				<div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
					<div className="flex items-center gap-2">
						<span className="text-[var(--accent)] text-2xl font-bold">α</span>
						<span className="text-sm font-semibold tracking-tight text-[var(--text-primary)]">ALPHASOLVER</span>
						<span className="badge badge-accent ml-3">Dashboard</span>
					</div>
					<a href="https://docs.whop.com/apps" target="_blank" rel="noopener noreferrer">
						<button className="btn btn-soft btn-sm">
							Developer Docs
						</button>
					</a>
				</div>
			</header>

			<div className="max-w-6xl mx-auto px-6 py-8 space-y-8">
				{/* Welcome */}
				<div className="chart-container p-6">
					<h1 className="text-2xl font-semibold text-[var(--text-primary)] mb-2">
						Welcome, <span className="text-[var(--accent)]">{displayName}</span>
					</h1>
					<p className="text-sm text-[var(--text-muted)]">
						This is your app's admin dashboard. Replace this template with your own app configuration.
					</p>
				</div>

				{/* Data Sections */}
				<div className="grid lg:grid-cols-3 gap-6">
					{/* Company Data */}
					<div className="sidebar-panel">
						<h2 className="section-header">Company Data</h2>
						<JsonViewer data={company} />
					</div>

					{/* User Data */}
					<div className="sidebar-panel">
						<h2 className="section-header">User Data</h2>
						<JsonViewer data={user} />
					</div>

					{/* Access Data */}
					<div className="sidebar-panel">
						<h2 className="section-header">Access Data</h2>
						<JsonViewer data={access} />
					</div>
				</div>

				{/* Help Section */}
				<div className="dash-card p-6">
					<h3 className="text-base font-semibold text-[var(--text-primary)] mb-3">
						Getting Started
					</h3>
					<ul className="space-y-2 text-sm text-[var(--text-secondary)]">
						<li className="flex items-start gap-2">
							<span className="text-[var(--accent)]">1.</span>
							<span>Customize this dashboard to manage your app settings</span>
						</li>
						<li className="flex items-start gap-2">
							<span className="text-[var(--accent)]">2.</span>
							<span>Use the Whop SDK to fetch and update user/company data</span>
						</li>
						<li className="flex items-start gap-2">
							<span className="text-[var(--accent)]">3.</span>
							<span>Deploy your changes and test in the Whop marketplace</span>
						</li>
					</ul>
					<div className="mt-4 pt-4 border-t border-[var(--border)]">
						<a 
							href="https://docs.whop.com/apps" 
							target="_blank" 
							rel="noopener noreferrer"
							className="text-sm text-[var(--accent)] hover:underline"
						>
							Read the full documentation →
						</a>
					</div>
				</div>
			</div>
		</div>
	);
}

function JsonViewer({ data }: { data: unknown }) {
	return (
		<pre className="text-xs font-mono text-[var(--text-muted)] bg-[var(--bg-tertiary)] border border-[var(--border)] rounded-lg p-4 max-h-64 overflow-y-auto">
			<code>{JSON.stringify(data, null, 2)}</code>
		</pre>
	);
}

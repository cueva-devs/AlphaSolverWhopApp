import { WhopApp } from "@whop/react/components";
import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
	title: "AlphaSolver — Monte Carlo Simulation for Prop Traders | Know Your True Odds",
	description: "Calculate your real probability of passing any prop firm challenge before you pay. Upload your trade log, run 10,000+ Monte Carlo simulations, and get your exact pass rate, expected costs, and personalized trading plan. Supports Topstep, Take Profit Trader, Apex, Tradeify, and more.",
	keywords: "prop firm challenge simulator, Monte Carlo trading simulation, prop trading odds calculator, futures prop firm, Topstep simulator, trading probability calculator, prop firm pass rate, evaluation challenge simulator, funded trader odds",
	openGraph: {
		title: "AlphaSolver — Know Your True Odds Before You Pay",
		description: "Monte Carlo simulation engine for prop traders. Calculate your real pass probability across 10,000+ simulated evaluations.",
		type: "website",
		locale: "en_US",
		siteName: "AlphaSolver",
	},
	twitter: {
		card: "summary_large_image",
		title: "AlphaSolver — Monte Carlo Simulation for Prop Traders",
		description: "Know your real probability of passing any prop firm challenge. Run 10,000 simulations with your actual trading statistics.",
	},
	robots: {
		index: true,
		follow: true,
	},
};

export default function RootLayout({
	children,
}: Readonly<{
	children: React.ReactNode;
}>) {
	return (
		<html lang="en" suppressHydrationWarning>
			<head>
				<link rel="preconnect" href="https://fonts.googleapis.com" />
				<link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
				<link href="https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;500;600;700&family=Instrument+Serif:ital@0;1&display=swap" rel="stylesheet" />
			</head>
			<body>
				<WhopApp accentColor="blue" appearance="inherit">
					{children}
				</WhopApp>
			</body>
		</html>
	);
}

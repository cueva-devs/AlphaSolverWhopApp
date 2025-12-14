import { WhopApp } from "@whop/react/components";
import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
	title: "AlphaSolver — Monte Carlo Simulation for Prop Traders",
	description: "Know your true odds before you pay. Upload your trade log and see your real probability of passing any prop firm challenge.",
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

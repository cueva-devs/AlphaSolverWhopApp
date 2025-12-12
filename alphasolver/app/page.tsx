import { Button, Card, Heading, Text } from "@whop/react/components";
import Link from "next/link";

export default function Page() {
	return (
		<div className="min-h-screen bg-gray-1 flex items-center justify-center p-6">
			<Card size="3" variant="surface" className="max-w-2xl w-full text-center">
				<Heading size="8" className="mb-4">
					AlphaSolver
				</Heading>
				<Text size="4" color="gray" className="mb-6">
					Prop Trading Evaluation Simulator
				</Text>
				<Text size="3" color="gray" className="mb-8">
					Run Monte Carlo simulations to evaluate your trading strategy's probability of passing prop firm challenges.
				</Text>
				<div className="flex flex-col sm:flex-row gap-4 justify-center">
					<Link href="/discover" className="block">
						<Button variant="solid" color="blue" size="3">
							Discover AlphaSolver
						</Button>
					</Link>
					<Text size="2" color="gray" className="flex items-center justify-center">
						Access the app through your Whop experience
					</Text>
				</div>
			</Card>
		</div>
	);
}

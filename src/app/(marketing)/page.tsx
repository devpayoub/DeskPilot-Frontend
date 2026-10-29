import { Chokepoint } from "./_components/chokepoint";
import { Hero } from "./_components/hero";
import { HowItWorks } from "./_components/how-it-works";
import { Proof } from "./_components/proof";
import { Tooling } from "./_components/tooling";

/**
 * Public landing page.
 *
 * Lives in its own route group so it does not inherit the dashboard shell, and
 * stays outside the `proxy.ts` matcher (which guards `/dashboard/*` only), so it is
 * reachable without a session.
 */
export default function LandingPage() {
  return (
    <>
      <Hero />
      <Tooling />
      <Chokepoint />
      <HowItWorks />
      <Proof />
    </>
  );
}

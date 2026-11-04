import type { Metadata } from "next";

import { SecuritySections } from "./_components/security-sections";

export const metadata: Metadata = {
  title: "Security",
};

/**
 * The account's own security, which follows it across workspaces.
 *
 * Deliberately not a copy of the dashboards every product seems to require: there is
 * no 2FA switch and no list of recovery codes here, because the API has neither, and
 * a disabled control that promises a future feature is how a person ends up trusting
 * a protection they do not have. What is real — the password, and every credential
 * signed out with it — is on this page.
 */
export default function SecurityPage() {
  return <SecuritySections />;
}

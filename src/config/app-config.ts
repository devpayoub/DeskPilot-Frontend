import packageJson from "../../package.json";

const currentYear = new Date().getFullYear();

export const APP_CONFIG = {
  name: "DeskPilot",
  version: packageJson.version,
  copyright: `© ${currentYear}, DeskPilot.`,
  meta: {
    title: "DeskPilot — IT helpdesk agent with guardrails",
    description:
      "An AI agent that investigates IT support tickets on a real Windows host, and changes things only behind a human approval bound to the exact arguments.",
  },
};

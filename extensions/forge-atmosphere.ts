/**
 * Forge Atmosphere Extension
 *
 * Purely visual atmosphere for the Forge theme. It owns only the surfaces the
 * theme schema cannot express: header, working indicator, terminal title, and
 * collapsed-thinking label. No tools, prompts, model settings, or workflow
 * behavior are changed.
 */

import { readFileSync } from "node:fs";
import os from "node:os";
import path from "node:path";
import type {
	ExtensionAPI,
	ExtensionContext,
	Theme,
	WorkingIndicatorOptions,
} from "@mariozechner/pi-coding-agent";

const ACTIVE_THEME = "forge";
const HIDDEN_THINKING_LABEL = "tempering…";
const TITLE_FRAMES = ["⚒", "✦", "◆", "◇"]; // strike → spark → ember → cool

const FG = {
	steelDim: "\x1b[38;2;90;110;128m",
	steel: "\x1b[38;2;149;167;186m",
	copperDim: "\x1b[38;2;160;96;58m",
	copperCore: "\x1b[38;2;208;106;50m",
	copperHot: "\x1b[38;2;240;151;95m",
	copperWhite: "\x1b[38;2;255;220;174m",
	reset: "\x1b[39m",
};

const WORKING_INDICATOR: WorkingIndicatorOptions = {
	// Symmetric ember ramp that flashes white-hot at the strike, then cools.
	frames: [
		color("◇", FG.steelDim),
		color("◇", FG.steel),
		color("◆", FG.copperDim),
		color("◆", FG.copperCore),
		color("✦", FG.copperHot),
		color("✦", FG.copperWhite),
		color("✦", FG.copperHot),
		color("◆", FG.copperCore),
		color("◆", FG.copperDim),
		color("◇", FG.steel),
		color("◇", FG.steelDim),
	],
	intervalMs: 80,
};

function color(text: string, ansi: string): string {
	return `${ansi}${text}${FG.reset}`;
}

function settingsPaths(cwd: string): string[] {
	const projectPaths: string[] = [];
	let current = path.resolve(cwd);

	while (true) {
		projectPaths.push(path.join(current, ".pi", "settings.json"));
		const parent = path.dirname(current);
		if (parent === current) break;
		current = parent;
	}

	return [path.join(os.homedir(), ".pi", "agent", "settings.json"), ...projectPaths.reverse()];
}

function getActiveTheme(cwd = process.cwd()): string | null {
	let activeTheme: string | null = null;

	for (const settingsPath of settingsPaths(cwd)) {
		try {
			const settings = JSON.parse(readFileSync(settingsPath, "utf-8"));
			if (typeof settings.theme === "string") activeTheme = settings.theme;
		} catch {
			// Missing or unreadable settings files are expected.
		}
	}

	return activeTheme;
}

function cwdName(ctx?: ExtensionContext): string {
	const cwd = ctx?.cwd || process.cwd();
	return path.basename(cwd) || cwd;
}

function sessionName(pi: ExtensionAPI): string | null {
	const name = pi.getSessionName?.();
	return name && name.trim() ? name.trim() : null;
}

function forgeTitle(pi: ExtensionAPI, ctx?: ExtensionContext): string {
	const name = sessionName(pi);
	const cwd = cwdName(ctx);
	return name ? `π · forge · ${name} · ${cwd}` : `π · forge · ${cwd}`;
}

function vanillaTitle(pi: ExtensionAPI, ctx?: ExtensionContext): string {
	const name = sessionName(pi);
	const cwd = cwdName(ctx);
	return name ? `π - ${name} - ${cwd}` : `π - ${cwd}`;
}

function shortModel(ctx: ExtensionContext): string {
	return ctx.model?.id
		?.replace(/-20\d{6}/, "")
		|| "—";
}

function row(theme: Theme, label: string, value: string, valueColor: "accent" | "text" | "warning"): string {
	return `   ${theme.fg("dim", label.padEnd(7))} ${theme.fg(valueColor, value)}`;
}

function forgeHeader(ctx: ExtensionContext, theme: Theme): string[] {
	const block = "█";
	const eye = `${theme.fg("text", block)}${theme.fg("dim", "▌")}`;
	const copperTop = (text: string) => theme.fg("accent", text);
	const copperLeg = (text: string) => color(text, FG.copperDim);

	return [
		"",
		`     ${eye}  ${eye}`,
		`  ${copperTop(block.repeat(14))}`,
		`     ${copperLeg(block.repeat(2))}    ${copperLeg(block.repeat(2))}`,
		`     ${copperLeg(block.repeat(2))}    ${copperLeg(block.repeat(2))}`,
		`     ${copperLeg(block.repeat(2))}    ${copperLeg(block.repeat(2))}`,
		`     ${copperLeg(block.repeat(2))}    ${copperLeg(block.repeat(2))}`,
		"",
		`   ${theme.fg("warning", theme.bold("pi · forge"))}`,
		`   ${theme.fg("muted", "matte systems atelier")}`,
		"",
		row(theme, "model", shortModel(ctx), "accent"),
		row(theme, "cwd", cwdName(ctx), "text"),
		row(theme, "theme", ACTIVE_THEME, "warning"),
		"",
	];
}

function supports(target: object, key: string): boolean {
	return key in target && typeof (target as Record<string, unknown>)[key] === "function";
}

export default function (pi: ExtensionAPI) {
	if (getActiveTheme() !== ACTIVE_THEME) return;

	let enabled = true;
	let titleTimer: ReturnType<typeof setInterval> | undefined;
	let titleFrame = 0;
	let lastContext: ExtensionContext | undefined;

	function stopTitleSpinner(ctx?: ExtensionContext, title?: string): void {
		if (titleTimer) {
			clearInterval(titleTimer);
			titleTimer = undefined;
		}
		titleFrame = 0;
		const activeCtx = ctx || lastContext;
		if (activeCtx?.hasUI && supports(activeCtx.ui, "setTitle")) {
			activeCtx.ui.setTitle(title ?? forgeTitle(pi, activeCtx));
		}
	}

	function startTitleSpinner(ctx: ExtensionContext): void {
		if (!enabled || !ctx.hasUI || !supports(ctx.ui, "setTitle")) return;
		lastContext = ctx;
		stopTitleSpinner(ctx, forgeTitle(pi, ctx));
		titleTimer = setInterval(() => {
			const frame = TITLE_FRAMES[titleFrame % TITLE_FRAMES.length];
			ctx.ui.setTitle(`${frame} ${forgeTitle(pi, ctx)}`);
			titleFrame++;
		}, 280);
	}

	function applyOn(ctx: ExtensionContext): void {
		enabled = true;
		lastContext = ctx;
		if (!ctx.hasUI) return;

		if (supports(ctx.ui, "setHeader")) {
			ctx.ui.setHeader((_tui, theme) => ({
				render: () => forgeHeader(ctx, theme),
				invalidate() {},
			}));
		}
		if (supports(ctx.ui, "setWorkingIndicator")) {
			ctx.ui.setWorkingIndicator(WORKING_INDICATOR);
		}
		if (supports(ctx.ui, "setHiddenThinkingLabel")) {
			ctx.ui.setHiddenThinkingLabel(HIDDEN_THINKING_LABEL);
		}
		if (supports(ctx.ui, "setTitle")) {
			ctx.ui.setTitle(forgeTitle(pi, ctx));
		}
	}

	function applyOff(ctx?: ExtensionContext): void {
		enabled = false;
		const activeCtx = ctx || lastContext;
		stopTitleSpinner(activeCtx, activeCtx ? vanillaTitle(pi, activeCtx) : undefined);
		if (!activeCtx?.hasUI) return;

		if (supports(activeCtx.ui, "setHeader")) {
			activeCtx.ui.setHeader(undefined);
		}
		if (supports(activeCtx.ui, "setWorkingIndicator")) {
			activeCtx.ui.setWorkingIndicator(undefined);
		}
		if (supports(activeCtx.ui, "setHiddenThinkingLabel")) {
			activeCtx.ui.setHiddenThinkingLabel();
		}
		if (supports(activeCtx.ui, "setTitle")) {
			activeCtx.ui.setTitle(vanillaTitle(pi, activeCtx));
		}
	}

	pi.on("session_start", async (_event, ctx) => {
		if (enabled) applyOn(ctx);
	});

	pi.on("agent_start", async (_event, ctx) => {
		startTitleSpinner(ctx);
	});

	pi.on("agent_end", async (_event, ctx) => {
		if (enabled) stopTitleSpinner(ctx, forgeTitle(pi, ctx));
	});

	pi.on("session_shutdown", async (_event, ctx) => {
		applyOff(ctx);
	});

	pi.registerCommand("forge-atmosphere", {
		description: "Show or toggle the visual Forge atmosphere [on|off].",
		handler: async (args, ctx) => {
			const arg = args.trim().toLowerCase();
			if (arg === "on") {
				applyOn(ctx);
				if (ctx.hasUI) ctx.ui.notify("forge-atmosphere on", "info");
				return;
			}
			if (arg === "off") {
				applyOff(ctx);
				if (ctx.hasUI) ctx.ui.notify("forge-atmosphere off", "info");
				return;
			}
			if (!arg) {
				if (ctx.hasUI) ctx.ui.notify(`forge-atmosphere: ${enabled ? "on" : "off"}`, "info");
				return;
			}
			if (ctx.hasUI) ctx.ui.notify("usage: /forge-atmosphere [on|off]", "error");
		},
	});
}

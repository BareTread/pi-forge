/**
 * Forge Atmosphere Extension
 *
 * Purely visual atmosphere for the Forge theme. It owns only the surfaces the
 * theme schema cannot express: header, working indicator, working message,
 * terminal title, and collapsed-thinking label. No tools, prompts, model
 * settings, or workflow behavior are changed.
 *
 * Design language: metal under heat. A single temperature ramp (cold iron →
 * white-hot) and a single easing curve (fast strike, slow cool) drive every
 * animated surface — the ignition header, the working ember, the title pulse —
 * so all motion reads as one material responding to one fire: ignition → strike
 * → quench.
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
// The hammer is a fixed anchor; only the spark beside it animates, so the
// title never flickers or shifts. Ignition → strike → quench ends at clean rest.
const TITLE_FRAMES = ["⚒ ✦", "⚒ ◆", "⚒ ◇", "⚒ ·", "⚒ ·", "⚒ ·"];
const QUENCH_FRAMES = ["⚒ ◇", "⚒ ·"] as const;
const QUENCH_INTERVAL_MS = 350;

// The working message walks a real forging sequence, one stage per turn.
// "tempering…" is reserved for the collapsed-thinking label.
const FORGE_STAGES = [
	"heating the stock…",
	"drawing out…",
	"upsetting…",
	"punching…",
	"shaping…",
	"planishing…",
	"annealing…",
	"quenching…",
];

// ─── Temperature ────────────────────────────────────────────────────────────
// Index is temperature: 0 cold iron → 6 white-hot. Every glowing element has a
// resting temperature; animation only shifts that temperature up or down the
// same ramp, which is what keeps the motion cohesive.

const EMBER = [
	"\x1b[38;2;64;61;56m", // 0 cold iron
	"\x1b[38;2;94;82;68m", // 1 warming graphite
	"\x1b[38;2;95;50;28m", // 2 deep copper
	"\x1b[38;2;160;96;58m", // 3 dim copper
	"\x1b[38;2;208;106;50m", // 4 copper core
	"\x1b[38;2;240;151;95m", // 5 hot copper
	"\x1b[38;2;255;220;174m", // 6 white-hot
] as const;

const STEEL_DIM = "\x1b[38;2;90;110;128m";
const RESET = "\x1b[39m";

function color(text: string, ansi: string): string {
	return `${ansi}${text}${RESET}`;
}

function ember(temp: number, text: string): string {
	const clamped = Math.max(0, Math.min(EMBER.length - 1, Math.round(temp)));
	return color(text, EMBER[clamped]);
}

// ─── Working ember ──────────────────────────────────────────────────────────
// Asymmetric by design: 4 frames up, 7 frames down, 3 cold rest beats.
// A strike is sudden; cooling is not.

const WORKING_INDICATOR: WorkingIndicatorOptions = {
	frames: [
		ember(0, "·"), // cold rest
		color("◇", STEEL_DIM), // first light
		ember(4, "◆"), // heat rises fast
		ember(5, "✦"), // strike
		ember(6, "✦"), // white-hot peak
		ember(5, "✦"), // the long cool begins
		ember(4, "◆"),
		ember(4, "◆"),
		ember(3, "◆"),
		ember(3, "◇"),
		color("◇", STEEL_DIM),
		color("·", STEEL_DIM),
		ember(1, "·"),
		ember(0, "·"), // back to cold iron
	],
	intervalMs: 90,
};

// ─── Ignition ───────────────────────────────────────────────────────────────
// Temperature offsets applied to every glowing header element on session
// start: cold iron, heat up, overshoot white-hot at the strike, settle to
// rest. The timer stops on the last step — zero idle cost afterwards.

const IGNITION = [-5, -4, -3, -2, -1, 1, 0] as const;
const IGNITION_INTERVAL_MS = 170;

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
	return ctx.model?.id?.replace(/-20\d{6}/, "") || "—";
}

function row(theme: Theme, label: string, value: string, valueColor: "accent" | "text" | "warning"): string {
	return `   ${theme.fg("dim", label.padEnd(7))} ${theme.fg(valueColor, value)}`;
}

// ─── Header ─────────────────────────────────────────────────────────────────

function glyphLines(offset: number, theme: Theme): string[] {
	const block = "█";
	const eye = `${ember(6 + offset, block)}${theme.fg("dim", "▌")}`;
	// Crown: symmetric heat gradient, hottest where the hammer lands.
	const crown =
		ember(3 + offset, block.repeat(2)) +
		ember(4 + offset, block.repeat(3)) +
		ember(5 + offset, block.repeat(4)) +
		ember(4 + offset, block.repeat(3)) +
		ember(3 + offset, block.repeat(2));
	const leg = (temp: number) => `     ${ember(temp, block.repeat(2))}    ${ember(temp, block.repeat(2))}`;

	return [
		`     ${eye}  ${eye}`,
		`  ${crown}`,
		// Legs cool toward the feet — the mark was just stamped.
		leg(4 + offset),
		leg(3 + offset),
		leg(3 + offset),
		leg(2 + offset),
	];
}

function heatLine(offset: number, width: number): string {
	const span = Math.max(0, Math.min(30, width - 4));
	if (span === 0) return "";
	const segment = Math.ceil(span / 5);
	let line = "";
	let remaining = span;
	// Stepped gradient, hot at the wordmark and cooling to the right.
	for (const temp of [5, 4, 3, 2, 1]) {
		if (remaining <= 0) break;
		const n = Math.min(segment, remaining);
		line += ember(temp + offset, "─".repeat(n));
		remaining -= n;
	}
	return `   ${line}`;
}

/** Truncate to `width` visible characters, preserving ANSI escapes. */
function clipAnsi(line: string, width: number): string {
	let visible = 0;
	let out = "";
	for (let i = 0; i < line.length; ) {
		if (line[i] === "\x1b") {
			const end = line.indexOf("m", i);
			if (end === -1) break;
			out += line.slice(i, end + 1);
			i = end + 1;
			continue;
		}
		if (visible >= width) {
			i++;
			continue;
		}
		out += line[i];
		visible++;
		i++;
	}
	return out;
}

function forgeHeader(ctx: ExtensionContext, theme: Theme, offset: number, width: number): string[] {
	const lines = [
		"",
		...glyphLines(offset, theme),
		"",
		`   ${theme.bold(ember(4 + offset, "pi · forge"))}`,
		`   ${theme.fg("muted", "heat · hammer · hold")}`,
		heatLine(offset, width),
		row(theme, "model", shortModel(ctx), "accent"),
		row(theme, "cwd", cwdName(ctx), "text"),
		row(theme, "theme", ACTIVE_THEME, "warning"),
		"",
	];
	return lines.map((line) => clipAnsi(line, width));
}

// Structural subset of the TUI instance — all the header needs to animate.
type RenderHost = { requestRender(): void };

function ignitionHeaderFactory(ctx: ExtensionContext) {
	return (tui: RenderHost, theme: Theme) => {
		let step = 0;
		let timer: ReturnType<typeof setInterval> | undefined = setInterval(() => {
			step++;
			if (step >= IGNITION.length - 1) {
				step = IGNITION.length - 1;
				clearInterval(timer);
				timer = undefined;
			}
			tui.requestRender();
		}, IGNITION_INTERVAL_MS);

		return {
			render: (width: number) => forgeHeader(ctx, theme, IGNITION[step], width),
			invalidate() {},
			dispose() {
				if (timer) clearInterval(timer);
				timer = undefined;
			},
		};
	};
}

function supports(target: object, key: string): boolean {
	return key in target && typeof (target as Record<string, unknown>)[key] === "function";
}

export default function (pi: ExtensionAPI) {
	if (getActiveTheme() !== ACTIVE_THEME) return;

	let enabled = true;
	let titleTimer: ReturnType<typeof setInterval> | undefined;
	let titleFrame = 0;
	let forgeStage = 0;
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
		stopTitleSpinner(ctx, enabled ? forgeTitle(pi, ctx) : vanillaTitle(pi, ctx));
		if (!enabled || !ctx.hasUI || !supports(ctx.ui, "setTitle")) return;
		lastContext = ctx;
		titleTimer = setInterval(() => {
			const frame = TITLE_FRAMES[titleFrame % TITLE_FRAMES.length];
			ctx.ui.setTitle(`${frame} ${forgeTitle(pi, ctx)}`);
			titleFrame++;
		}, 300);
	}

	function playTitleQuench(ctx: ExtensionContext): void {
		const canQuench = enabled && ctx.hasUI && supports(ctx.ui, "setTitle");
		stopTitleSpinner(ctx, canQuench ? `${QUENCH_FRAMES[0]} ${forgeTitle(pi, ctx)}` : undefined);
		if (!canQuench) return;
		lastContext = ctx;
		let frame = 1;

		// A strike is sudden; cooling is not. Resolve through two held beats.
		const advanceQuench = () => {
			if (frame < QUENCH_FRAMES.length) {
				ctx.ui.setTitle(`${QUENCH_FRAMES[frame]} ${forgeTitle(pi, ctx)}`);
				frame++;
				titleTimer = setTimeout(advanceQuench, QUENCH_INTERVAL_MS);
				return;
			}
			titleTimer = undefined;
			ctx.ui.setTitle(forgeTitle(pi, ctx));
		};
		titleTimer = setTimeout(advanceQuench, QUENCH_INTERVAL_MS);
	}

	function applyOn(ctx: ExtensionContext): void {
		enabled = true;
		lastContext = ctx;
		if (!ctx.hasUI) return;

		if (supports(ctx.ui, "setHeader")) {
			ctx.ui.setHeader(ignitionHeaderFactory(ctx));
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
		if (supports(activeCtx.ui, "setWorkingMessage")) {
			activeCtx.ui.setWorkingMessage();
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
		if (enabled && ctx.hasUI && supports(ctx.ui, "setWorkingMessage")) {
			ctx.ui.setWorkingMessage(FORGE_STAGES[forgeStage % FORGE_STAGES.length]);
			forgeStage++;
		}
	});

	pi.on("agent_end", async (_event, ctx) => {
		if (enabled) playTitleQuench(ctx);
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

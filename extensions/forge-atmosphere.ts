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
import type { ThinkingLevel } from "@mariozechner/pi-agent-core";
import type {
	AgentEndEvent,
	ExtensionAPI,
	ExtensionContext,
	Theme,
	WorkingIndicatorOptions,
} from "@mariozechner/pi-coding-agent";

const ACTIVE_THEME = "forge";
const HIDDEN_THINKING_LABEL = "tempering…";

// The working message walks a real forging sequence, one stage per turn.
// "tempering…" is reserved for the collapsed-thinking label.
const FORGE_STAGES = [
	"kindling…",
	"stoking the forge…",
	"bringing to heat…",
	"striking…",
	"drawing out…",
	"hammering…",
	"shaping…",
	"planishing…",
	"honing…",
	"burnishing…",
	"quenching…",
];

// ─── Temperature ────────────────────────────────────────────────────────────
// Index is temperature: 0 cold iron → 6 white-hot. Every glowing element has a
// resting temperature; animation only shifts that temperature up or down the
// same ramp, which is what keeps the motion cohesive.

const EMBER_RGB = [
	[64, 61, 56], // 0 cold iron
	[94, 82, 68], // 1 warming graphite
	[95, 50, 28], // 2 deep copper
	[160, 96, 58], // 3 dim copper
	[208, 106, 50], // 4 copper core
	[240, 151, 95], // 5 hot copper
	[255, 220, 174], // 6 white-hot
] as const;
const EMBER_256 = [237, 239, 237, 131, 167, 209, 223] as const;

function hasTruecolor(): boolean {
	const colorTerm = process.env.COLORTERM?.toLowerCase();
	if (colorTerm === "truecolor" || colorTerm === "24bit") return true;
	return /(?:direct|truecolor|24bit|kitty|wezterm|alacritty|ghostty|foot)/i.test(process.env.TERM ?? "");
}

const TRUECOLOR = hasTruecolor();
const EMBER = EMBER_RGB.map(([r, g, b], index) =>
	TRUECOLOR ? `\x1b[38;2;${r};${g};${b}m` : `\x1b[38;5;${EMBER_256[index]}m`,
);
const STEEL_DIM = TRUECOLOR ? "\x1b[38;2;90;110;128m" : "\x1b[38;5;60m";
const RESET = "\x1b[39m";

function color(text: string, ansi: string): string {
	return `${ansi}${text}${RESET}`;
}

function ember(temp: number, text: string): string {
	const clamped = Math.max(0, Math.min(EMBER.length - 1, Math.round(temp)));
	return color(text, EMBER[clamped]);
}

// ─── Working ember ──────────────────────────────────────────────────────────
// One asymmetric curve for every working surface: strike fast, cool slow, rest.
// Thinking level changes only its amplitude and duration.

const HEAT_CURVE = [0, 1, 4, 5, 6, 5, 4, 4, 3, 3, 1, 0, 0, 0] as const;
const HEAT_PROFILES = {
	off: { ceiling: 0, intervalMs: 70 },
	minimal: { ceiling: 2, intervalMs: 70 },
	low: { ceiling: 3, intervalMs: 75 },
	medium: { ceiling: 4, intervalMs: 90 },
	high: { ceiling: 5, intervalMs: 105 },
	xhigh: { ceiling: 6, intervalMs: 120 },
	max: { ceiling: 6, intervalMs: 120 },
} as const;

type HeatProfile = (typeof HEAT_PROFILES)[keyof typeof HEAT_PROFILES];

function heatProfile(level: ThinkingLevel): HeatProfile {
	return HEAT_PROFILES[level];
}

function scaledTemp(sourceTemp: number, profile: HeatProfile): number {
	return Math.round((sourceTemp * profile.ceiling) / (EMBER.length - 1));
}

function heatGlyph(sourceTemp: number, profile: HeatProfile): string {
	if (profile.ceiling === 0) return sourceTemp >= 3 ? "◇" : "·";
	const temp = scaledTemp(sourceTemp, profile);
	return temp >= 5 ? "✦" : temp >= 3 ? "◆" : temp >= 1 ? "◇" : "·";
}

function workingIndicator(level: ThinkingLevel): WorkingIndicatorOptions {
	const profile = heatProfile(level);
	return {
		frames: HEAT_CURVE.map((temp) => {
			const glyph = heatGlyph(temp, profile);
			return profile.ceiling === 0 ? color(glyph, STEEL_DIM) : ember(scaledTemp(temp, profile), glyph);
		}),
		intervalMs: profile.intervalMs,
	};
}

function titleFrames(profile: HeatProfile): string[] {
	return HEAT_CURVE.map((temp) => `⚒ ${heatGlyph(temp, profile)}`);
}

const ERROR_HISS_FRAMES = ["⚒ ✦", "⚒ ◇"] as const;
const STEEL_REST_FRAME = "⚒ ·";
const ERROR_HISS_INTERVAL_MS = 120;

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

function supports(target: object, key: string): boolean {
	return key in target && typeof (target as Record<string, unknown>)[key] === "function";
}

function agentAborted(messages: AgentEndEvent["messages"]): boolean {
	return messages.some(
		(message) => message.role === "assistant" && (message.stopReason === "error" || message.stopReason === "aborted"),
	);
}

export default function (pi: ExtensionAPI) {
	if (getActiveTheme() !== ACTIVE_THEME) return;

	let enabled = true;
	let ignitionTimer: ReturnType<typeof setInterval> | undefined;
	let ignitionStep = IGNITION.length - 1;
	let ignitionHost: RenderHost | undefined;
	let titleTimer: ReturnType<typeof setInterval> | undefined;
	let titleFrame = 0;
	let forgeStage = 0;
	let lastContext: ExtensionContext | undefined;

	function stopIgnition(settle = false): void {
		if (ignitionTimer !== undefined) {
			clearInterval(ignitionTimer);
			ignitionTimer = undefined;
		}
		if (settle && ignitionHost && ignitionStep !== IGNITION.length - 1) {
			ignitionStep = IGNITION.length - 1;
			ignitionHost.requestRender();
		}
		ignitionHost = undefined;
	}

	function ignitionHeaderFactory(ctx: ExtensionContext) {
		return (tui: RenderHost, theme: Theme) => {
			stopIgnition();
			ignitionStep = 0;
			ignitionHost = tui;
			ignitionTimer = setInterval(() => {
				ignitionStep++;
				if (ignitionStep >= IGNITION.length - 1) {
					ignitionStep = IGNITION.length - 1;
					stopIgnition();
				}
				tui.requestRender();
			}, IGNITION_INTERVAL_MS);

			return {
				render: (width: number) => forgeHeader(ctx, theme, IGNITION[ignitionStep], width),
				invalidate() {},
				dispose() {
					stopIgnition();
				},
			};
		};
	}

	function stopTitleSpinner(ctx?: ExtensionContext, title?: string): void {
		if (titleTimer !== undefined) {
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
		const profile = heatProfile(pi.getThinkingLevel());
		const frames = titleFrames(profile);
		ctx.ui.setTitle(`${frames[0]} ${forgeTitle(pi, ctx)}`);
		titleFrame = 1;
		titleTimer = setInterval(() => {
			ctx.ui.setTitle(`${frames[titleFrame % frames.length]} ${forgeTitle(pi, ctx)}`);
			titleFrame++;
		}, profile.intervalMs * 2);
	}

	function playTitleSequence(
		ctx: ExtensionContext,
		frames: readonly string[],
		intervalMs: number,
		restFrame?: string,
	): void {
		const canPlay = enabled && ctx.hasUI && supports(ctx.ui, "setTitle");
		stopTitleSpinner(ctx, canPlay ? `${frames[0]} ${forgeTitle(pi, ctx)}` : undefined);
		if (!canPlay) return;
		lastContext = ctx;
		let frame = 1;

		const advance = () => {
			if (frame < frames.length) {
				ctx.ui.setTitle(`${frames[frame]} ${forgeTitle(pi, ctx)}`);
				frame++;
				titleTimer = setTimeout(advance, intervalMs);
				return;
			}
			titleTimer = undefined;
			ctx.ui.setTitle(restFrame ? `${restFrame} ${forgeTitle(pi, ctx)}` : forgeTitle(pi, ctx));
		};
		titleTimer = setTimeout(advance, intervalMs);
	}

	function playTitleQuench(ctx: ExtensionContext): void {
		const profile = heatProfile(pi.getThinkingLevel());
		const frames = HEAT_CURVE.slice(8, 12).map((temp) => `⚒ ${heatGlyph(temp, profile)}`);
		playTitleSequence(ctx, frames, profile.intervalMs * 2);
	}

	function playErrorHiss(ctx: ExtensionContext): void {
		playTitleSequence(ctx, ERROR_HISS_FRAMES, ERROR_HISS_INTERVAL_MS, STEEL_REST_FRAME);
	}

	function applyWorkingIndicator(ctx: ExtensionContext, level = pi.getThinkingLevel()): void {
		if (enabled && ctx.hasUI && supports(ctx.ui, "setWorkingIndicator")) {
			ctx.ui.setWorkingIndicator(workingIndicator(level));
		}
	}

	function applyOn(ctx: ExtensionContext): void {
		enabled = true;
		lastContext = ctx;
		if (!ctx.hasUI) return;

		if (supports(ctx.ui, "setHeader")) {
			ctx.ui.setHeader(ignitionHeaderFactory(ctx));
		}
		applyWorkingIndicator(ctx);
		if (supports(ctx.ui, "setHiddenThinkingLabel")) {
			ctx.ui.setHiddenThinkingLabel(HIDDEN_THINKING_LABEL);
		}
		if (supports(ctx.ui, "setTitle")) {
			ctx.ui.setTitle(forgeTitle(pi, ctx));
		}
	}

	function applyOff(ctx?: ExtensionContext): void {
		enabled = false;
		stopIgnition();
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
		stopIgnition(true);
		applyWorkingIndicator(ctx);
		startTitleSpinner(ctx);
		if (enabled && ctx.hasUI && supports(ctx.ui, "setWorkingMessage")) {
			ctx.ui.setWorkingMessage(FORGE_STAGES[forgeStage % FORGE_STAGES.length]);
			forgeStage++;
		}
	});

	pi.on("thinking_level_select", async (event, ctx) => {
		applyWorkingIndicator(ctx, event.level);
		if (enabled && !ctx.isIdle()) startTitleSpinner(ctx);
	});

	pi.on("agent_end", async (event, ctx) => {
		if (!enabled) return;
		if (agentAborted(event.messages)) playErrorHiss(ctx);
		else playTitleQuench(ctx);
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

/*!
   Copyright 2026 Microsoft Corporation

   Licensed under the Apache License, Version 2.0 (the "License");
   you may not use this file except in compliance with the License.
   You may obtain a copy of the License at

       http://www.apache.org/licenses/LICENSE-2.0

   Unless required by applicable law or agreed to in writing, software
   distributed under the License is distributed on an "AS IS" BASIS,
   WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
   See the License for the specific language governing permissions and
   limitations under the License.
*/

import { styleText, type InspectColor } from "node:util";

export type StyleFunction = (text: string) => string;

type Style = ((strings: TemplateStringsArray, ...values: unknown[]) => string) & {
    bgHex(color: string): StyleFunction;
    bold: StyleFunction;
    cyan: StyleFunction;
    gray: StyleFunction;
    green: StyleFunction;
    hex(color: string): StyleFunction;
    red: StyleFunction;
    redBright: StyleFunction;
    reset: StyleFunction;
    white: StyleFunction;
    yellow: StyleFunction;
};

function applyStyle(format: InspectColor | readonly InspectColor[], text: string) {
    return styleText(format, text, { stream: process.stdout });
}

function ansi(code: string, resetCode: string, text: string) {
    return process.stdout.isTTY ? `\x1b[${code}m${text}\x1b[${resetCode}m` : text;
}

function rgbFromHex(color: string) {
    const value = color.replace(/^#/, "");
    const int = Number.parseInt(value.length === 3 ? value.replace(/./g, "$&$&") : value, 16);
    return [(int >> 16) & 0xff, (int >> 8) & 0xff, int & 0xff] as const;
}

function style(format: InspectColor): StyleFunction {
    return text => applyStyle(format, text);
}

function styleTemplate(strings: TemplateStringsArray, ...values: unknown[]) {
    let text = strings[0];
    for (let i = 0; i < values.length; i++) {
        text += String(values[i]) + strings[i + 1];
    }
    return text.replace(/\{([^{}\s]+)(?: ([^{}]*))?\}/g, (_, format: string, content = "") =>
        format === "reset" ? content : applyStyle(format.split(".") as InspectColor[], content)
    );
}

const styles = Object.assign(styleTemplate, {
    bgHex: (color: string) => (text: string) => {
        const [red, green, blue] = rgbFromHex(color);
        return ansi(`48;2;${red};${green};${blue}`, "49", text);
    },
    bold: style("bold"),
    cyan: style("cyan"),
    gray: style("gray"),
    green: style("green"),
    hex: (color: string) => (text: string) => {
        const [red, green, blue] = rgbFromHex(color);
        return ansi(`38;2;${red};${green};${blue}`, "39", text);
    },
    red: style("red"),
    redBright: style("redBright"),
    reset: (text: string) => text,
    white: style("white"),
    yellow: style("yellow"),
}) satisfies Style;

export function hexToRgb(color: string) {
    return rgbFromHex(color);
}

export default styles;

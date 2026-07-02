/*!
   Copyright 2019 Microsoft Corporation

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

import { parseArgs } from "node:util";
import { getDefaultSettingsFile, readSettings } from "./settings.js";

type ParsedArgs = ReturnType<typeof parseCommandLine>;

const helpText = `focus-dt [options]

Authentication options:
      --username             GitHub Username
      --token                GitHub Auth Token. Uses %GITHUB_API_TOKEN%,
                             %FOCUS_DT_GITHUB_API_TOKEN%, or %AUTH_TOKEN% if available

Configuration options:
      --config               Loads settings from a JSON file
                             [default: "${getDefaultSettingsFile()}"]
      --save                 Saves settings to '%HOMEDIR%/.focus-dt/config.json' and exits
      --save-to              Saves settings to the specified file and exits

Browser options:
      --chromePath           The path to the chromium-based browser executable to use
      --chromeUserDataDir    The path to your chrome user data directory.
      --chromeProfile        The name of the chrome profile you want to use.
      --port                 The remote debugging port to use to wait for the chrome tab to exit
      --timeout              The number of milliseconds to wait for the debugger to attach

Options:
      --skipped              Include previously skipped items
      --needsReview          Include items from the 'Needs Maintainer Review' column
      --needsAction          Include items from the 'Needs Maintainer Action' column
      --oldest               Sort so that the least recently updated cards come first
      --newest               Sort so that the most recently updated cards come first
      --draft                Include 'Draft' PRs
      --wip                  Include work-in-progress (WIP) PRs
      --merge                Set the default merge option: merge, squash, or rebase
      --approve              Set the approval option: manual, auto, always, or only
  -v, --verbose              Increases the log level
  -h, --help                 Show help
`;

function parseCommandLine() {
    const { values } = parseArgs({
        allowNegative: true,
        options: {
            username: { type: "string" },
            token: { type: "string" },
            config: { type: "string", default: getDefaultSettingsFile() },
            save: { type: "boolean" },
            "save-to": { type: "string" },
            skipped: { type: "boolean" },
            needsReview: { type: "boolean" },
            needsAction: { type: "boolean" },
            oldest: { type: "boolean" },
            newest: { type: "boolean" },
            draft: { type: "boolean" },
            wip: { type: "boolean" },
            merge: { type: "string" },
            approve: { type: "string" },
            chromePath: { type: "string" },
            chromeUserDataDir: { type: "string" },
            chromeProfile: { type: "string" },
            port: { type: "string" },
            timeout: { type: "string" },
            verbose: { type: "boolean", short: "v" },
            help: { type: "boolean", short: "h" },
        }
    });

    if (values.help) {
        console.log(helpText);
        process.exit(0);
    }

    if (values.save && values["save-to"]) {
        fail("Arguments --save and --save-to are mutually exclusive.");
    }
    if (values.oldest !== undefined && values.newest !== undefined) {
        fail("Arguments --oldest and --newest are mutually exclusive.");
    }
    if (values.merge !== undefined && values.merge !== "merge" && values.merge !== "squash" && values.merge !== "rebase") {
        fail("Argument --merge must be one of: merge, squash, rebase.");
    }
    if (values.approve !== undefined && values.approve !== "manual" && values.approve !== "auto" && values.approve !== "always" && values.approve !== "only") {
        fail("Argument --approve must be one of: manual, auto, always, only.");
    }
    if (values.port !== undefined && Number.isNaN(Number(values.port))) {
        fail("Argument --port must be a number.");
    }
    if (values.timeout !== undefined && Number.isNaN(Number(values.timeout))) {
        fail("Argument --timeout must be a number.");
    }

    const config = values.config ?? getDefaultSettingsFile();
    const settings = readSettings(config);
    return {
        ...settings,
        ...values,
        config,
        oldest: values.newest !== undefined ? !values.newest : values.oldest ?? settings.oldest,
        port: values.port !== undefined ? Number(values.port) : settings.port,
        timeout: values.timeout !== undefined ? Number(values.timeout) : settings.timeout,
    };
}

function fail(message: string): never {
    console.error(message);
    console.error("Use --help to show usage.");
    process.exit(1);
}

export const argv: ParsedArgs = parseCommandLine();

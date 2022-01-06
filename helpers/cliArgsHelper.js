const commandLineArgs = require("command-line-args");
const chalk = require("chalk");
const constants = require("./constants");
const { InputValidator } = require("./inputValidator");

class CliArgsHelper {
    inputValidator = new InputValidator();

    constructor(logFn) {
        this.log = logFn;
    }

    _getPlatformByKey(cliKey) {
        const platform = constants.cliArgsPlatforms.find((p) => p.cliKey === cliKey);
        if (!platform) {
            throw new Error(`No platform found for key '${cliKey}', should have been validated before...`);
        }
        return platform.fullname;
    }

    _getUi5LibSourceByKey(cliKey) {
        const ui5LibSource = constants.cliArgsUi5LibSources.find((s) => s.cliKey === cliKey);
        if (!ui5LibSource) {
            throw new Error(`No ui5 lib source found for key '${cliKey}', should have been validated before...`);
        }
        return ui5LibSource.fullname;
    }

    _getBoolean(value) {
        if (!value) return undefined;

        value = value.toLowerCase();
        if (value === "true") {
            return true;
        } else if (value === "false") {
            return false;
        } else {
            return undefined;
        }
    }

    parseCmdArgs() {
        const optionDefinitions = [
            {
                name: "projectname", //
                alias: "n",
                type: String
            },
            {
                name: "namespaceUI5", //
                alias: "s",
                type: String
            },
            {
                name: "platform", //
                alias: "p",
                type: String
            },
            {
                name: "viewtype", //
                alias: "v",
                type: String
            },
            {
                name: "ui5libs", //
                alias: "l",
                type: String
            },
            {
                name: "newdir", //
                alias: "d",
                // we have 3 states: true, false and not provided via cmd args, so Boolean can't be used
                type: String
            },
            {
                name: "codeassist", //
                alias: "c",
                // we have 3 states: true, false and not provided via cmd args, so Boolean can't be used
                type: String
            }
        ];
        const cliOptions = commandLineArgs(optionDefinitions, { partial: true });
        return cliOptions;
    }

    mergeAnswersWithCliOptions = function (answers, cliOptions) {
        // we have to check if the property is defined in answers, because if the user provides
        // invalid input, the property won't be removed from cliOptions, but it would (of course)
        // still be invalid. In case it's invalid the user is forced to provide the property
        // via prompt, and therefore the property will be valid proviveded in the answers variable
        const projectname = answers.projectname ? answers.projectname : cliOptions.projectname;
        const namespaceUI5 = answers.namespaceUI5 ? answers.namespaceUI5 : cliOptions.namespaceUI5;
        const platform = answers.platform ? answers.platform : this._getPlatformByKey(cliOptions.platform);
        const viewtype = answers.viewtype ? answers.viewtype : cliOptions.viewtype;
        const ui5libs = answers.ui5libs ? answers.ui5libs : this._getUi5LibSourceByKey(cliOptions.ui5libs);
        const newdir = answers.newdir ? answers.newdir : this._getBoolean(cliOptions.newdir);
        const codeassist = answers.codeassist ? answers.codeassist : this._getBoolean(cliOptions.codeassist);

        return {
            projectname,
            namespaceUI5,
            platform,
            viewtype,
            ui5libs,
            newdir,
            codeassist
        };
    };

    getSelectedPlatform(props, cliOptions) {
        // selected platform provided by the prompt holds the fullname (e.g. "SAP Launchpad service")
        // if it's provided as a cmd argument it holds the cli key (e.g. "launchpadSrv").
        // So we have to map the cli key to the cli key, because the generator will expect the fullname
        let platform = props.platform;

        if (!platform) {
            const selectedPlatform = constants.cliArgsPlatforms.find((p) => p.cliKey === cliOptions.platform);
            platform = selectedPlatform.fullname;
        }
        return platform;
    }

    isValidProjectNameProvided(projectName) {
        // Yeoman doesn't allow empty values, so we have to check that, for values coming from cli arguments
        if (!projectName) {
            return false;
        }

        const isValid = this.inputValidator.isValidProjectName(projectName);
        // when it's invalid and a value was provided --> log that value is invalid
        if (!isValid) {
            this.log(chalk.red("Invalid project name provided, will ask for it..."));
        }

        return isValid;
    }

    isValidNamespaceProvided(namespace) {
        // Yeoman doesn't allow empty values, so we have to check that, for values coming from cli arguments
        if (!namespace) {
            return false;
        }

        const isValid = this.inputValidator.isValidNamespace(namespace);
        // when it's invalid and a value was provided --> log that value is invalid
        if (!isValid) {
            this.log(chalk.red("Invalid namespace provided, will ask for it..."));
        }

        return isValid;
    }

    isValidPlatformProvided(platform) {
        const isValid = constants.cliArgsPlatforms.some((p) => p.cliKey === platform);
        // when it's invalid and a value was provided --> log that value is invalid
        if (!isValid && platform) {
            this.log(chalk.red("Invalid platform provided, will ask for it..."));
        }

        return isValid;
    }

    isValidUi5LibSourceProvided(ui5LibSource, platform) {
        // If platform = Launchpad service, UI5 must be served from the SAPUI5 CDN. So we have to check...
        if (platform === constants.platformOptions.launchpadSrv) {
            const selectedUi5LibSource = constants.cliArgsUi5LibSources.find((p) => p.cliKey === ui5LibSource);

            if (selectedUi5LibSource.fullname !== constants.ui5LibSrcOptions.cdnSapUi5) {
                this.log(chalk.yellow("Invalid UI5 lib source parameter for selected platform. Will ask for it..."));
                return false;
            }
        }

        const isValid = constants.cliArgsUi5LibSources.some((s) => s.cliKey === ui5LibSource);
        // when it's invalid and a value was provided --> log that value is invalid
        if (!isValid && ui5LibSource) {
            this.log(chalk.red("Invalid UI5 library source provided, will ask for it..."));
        }

        return isValid;
    }

    isValidViewTypeProvided(viewtype) {
        const isValid = constants.viewTypes.some((s) => s === viewtype);
        // when it's invalid and a value was provided --> log that value is invalid
        if (!isValid && viewtype) {
            this.log(chalk.red("Invalid view type provided, will ask for it..."));
        }

        return isValid;
    }

    isValidBooleanProvided(value) {
        const parsedValue = this._getBoolean(value);

        if (parsedValue === true || parsedValue === false) {
            return true;
        } else {
            // if the value isn't true or false, but a value was provided -> log that the value is invalid
            if (value) {
                this.log(chalk.red("Invalid bool parameter provided, will ask for it..."));
            }

            return false;
        }
    }
}

exports.CliArgsHelper = CliArgsHelper;

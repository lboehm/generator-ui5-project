"use strict";
const { throws } = require("assert");
const Generator = require("yeoman-generator"),
    fileaccess = require("../../helpers/fileaccess"),
    { InputValidator } = require("../../helpers/inputValidator"),
    constants = require("../../helpers/constants"),
    { CliArgsHelper } = require("../../helpers/cliArgsHelper"),
    path = require("path"),
    chalk = require("chalk"),
    yosay = require("yosay"),
    glob = require("glob");

module.exports = class extends Generator {
    static displayName = "Create a new OpenUI5/SAPUI5 project";

    prompting() {
        const inputValidator = new InputValidator(this.log);
        const cliArgsHelper = new CliArgsHelper(this.log);
        const cliOptions = cliArgsHelper.parseCmdArgs();

        if (!this.options.embedded) {
            this.log(yosay(`Welcome to the ${chalk.red("easy-ui5-project")} generator!`));
        }

        return this.prompt([
            {
                type: "input",
                name: "projectname",
                message: "How do you want to name this project?",
                validate: (s) => {
                    if (inputValidator.isValidProjectName(s)) {
                        return true;
                    }

                    return "Please use alpha numeric characters only for the project name.";
                },
                default: "myUI5App",
                when: !cliArgsHelper.isValidProjectNameProvided(cliOptions.projectname)
            },
            {
                type: "input",
                name: "namespaceUI5",
                message: "Which namespace do you want to use?",
                validate: (s) => {
                    if (inputValidator.isValidNamespace(s)) {
                        return true;
                    }
                    return "Please use alpha numeric characters and dots only for the namespace.";
                },
                default: "com.myorg",
                when: !cliArgsHelper.isValidNamespaceProvided(cliOptions.namespaceUI5)
            },
            {
                type: "list",
                name: "platform",
                message: "On which platform would you like to host the application?",
                choices: constants.platforms,
                default: constants.platformStaticWebserver,
                when: !cliArgsHelper.isValidPlatformProvided(cliOptions.platform)
            },
            {
                type: "list",
                name: "viewtype",
                message: "Which view type do you want to use?",
                choices: constants.viewTypes,
                default: "XML",
                when: !cliArgsHelper.isValidViewTypeProvided(cliOptions.viewtype)
            },
            {
                type: "list",
                name: "ui5libs",
                message: "Where should your UI5 libs be served from?",
                choices: (props) => {
                    const platform = cliArgsHelper.getSelectedPlatform(props, cliOptions);
                    return platform !== "SAP Launchpad service"
                        ? constants.ui5LibSources
                        : [constants.ui5LibSrcOptions.cdnSapUi5];
                },
                default: (props) => {
                    const platform = cliArgsHelper.getSelectedPlatform(props, cliOptions);
                    return platform !== "SAP Launchpad service"
                        ? constants.ui5LibSrcOptions.cdnOpenUi5
                        : constants.ui5LibSrcOptions.localOpenUi5;
                },
                when: (props) => {
                    const platform = cliArgsHelper.getSelectedPlatform(props, cliOptions);
                    return !cliArgsHelper.isValidUi5LibSourceProvided(cliOptions.ui5libs, platform);
                }
            },
            {
                type: "confirm",
                name: "newdir",
                message: "Would you like to create a new directory for the project?",
                default: true,
                when: !cliArgsHelper.isValidBooleanProvided(cliOptions.newdir)
            },
            {
                type: "confirm",
                name: "codeassist",
                message: "Would you like to add JavaScript code assist libraries to the project?",
                default: true,
                when: !cliArgsHelper.isValidBooleanProvided(cliOptions.codeassist)
            }
        ]).then((answers) => {
            // We don't know if all, none or just some parameters were set via cli args
            // so we have to merge those two objects
            const params = cliArgsHelper.mergeAnswersWithCliOptions(answers, cliOptions);

            // we have to set destination root before saving information to the config file
            // because otherwise the config file can't be created
            if (params.newdir) {
                this.destinationRoot(`${params.namespaceUI5}.${params.projectname}`);
            }

            this.config.set("projectname", params.projectname);
            this.config.set("namespaceUI5", params.namespaceUI5);
            this.config.set("platform", params.platform);
            this.config.set("viewtype", params.viewtype);
            this.config.set("ui5libs", params.ui5libs);
            this.config.set("newdir", params.newdir);
            this.config.set("codeassist", params.codeassist);
            this.config.set("namespaceURI", params.namespaceUI5.split(".").join("/"));
        });
    }

    async writing() {
        const oConfig = this.config.getAll();

        this.sourceRoot(path.join(__dirname, "templates"));
        glob.sync("**", {
            cwd: this.sourceRoot(),
            nodir: true
        }).forEach((file) => {
            const sOrigin = this.templatePath(file);
            const sTarget = this.destinationPath(file.replace(/^_/, "").replace(/\/_/, "/"));

            this.fs.copyTpl(sOrigin, sTarget, oConfig);
        });

        if (oConfig.codeassist) {
            let tsconfig = {
                compilerOptions: {
                    module: "none",
                    noEmit: true,
                    checkJs: true,
                    allowJs: true,
                    types: ["@sapui5/ts-types"]
                }
            };
            let eslintrc = {
                plugins: ["@sap/ui5-jsdocs"],
                extends: ["plugin:@sap/ui5-jsdocs/recommended", "eslint:recommended"]
            };

            await fileaccess.writeJSON.call(this, "/tsconfig.json", tsconfig);
            await fileaccess.manipulateJSON.call(this, "/.eslintrc", eslintrc);
        }

        const oSubGen = Object.assign({}, oConfig);
        oSubGen.isSubgeneratorCall = true;
        oSubGen.cwd = this.destinationRoot();
        oSubGen.modulename = "uimodule";

        if (oConfig.platform !== "Static webserver" && oConfig.platform !== "SAP NetWeaver") {
            this.composeWith(require.resolve("../additionalmodules"), oSubGen);
        }

        this.composeWith(require.resolve("../newwebapp"), oSubGen);
    }

    async addPackage() {
        const oConfig = this.config.getAll();
        let packge = {
            name: oConfig.projectname,
            version: "0.0.1",
            scripts: {
                start: "ui5 serve --config=uimodule/ui5.yaml  --open index.html",
                "build:ui": "run-s ",
                test: "run-s lint karma",
                "karma-ci": "karma start karma-ci.conf.js",
                clearCoverage: "shx rm -rf coverage",
                karma: "run-s clearCoverage karma-ci",
                lint: "eslint ."
            },
            devDependencies: {
                shx: "^0.3.3",
                "@ui5/cli": "^2.14.1",
                "ui5-middleware-livereload": "^0.5.8",
                karma: "^6.3.9",
                "karma-chrome-launcher": "^3.1.0",
                "karma-coverage": "^2.1.0",
                "karma-ui5": "^2.3.4",
                "npm-run-all": "^4.1.5",
                eslint: "^7.32.0"
            },
            ui5: {
                dependencies: ["ui5-middleware-livereload"]
            }
        };

        if (oConfig.platform !== "Static webserver" && oConfig.platform !== "SAP NetWeaver") {
            packge.devDependencies["ui5-middleware-cfdestination"] = "^0.7.3";
            (packge.devDependencies["ui5-task-zipper"] = "^0.4.7"), (packge.devDependencies["cross-var"] = "^1.1.0");
            packge.devDependencies["mbt"] = "^1.2.7";
            packge.ui5.dependencies.push("ui5-middleware-cfdestination");
            packge.ui5.dependencies.push("ui5-task-zipper");

            if (
                oConfig.platform === "Application Router @ Cloud Foundry" ||
                oConfig.platform === "SAP HTML5 Application Repository service for SAP BTP" ||
                oConfig.platform === "SAP Launchpad service"
            ) {
                packge.scripts["build:mta"] = "mbt build";
                packge.scripts[
                    "deploy:cf"
                ] = `cross-var cf deploy mta_archives/${oConfig.projectname}_$npm_package_version.mtar`;
                packge.scripts["deploy"] = "run-s build:mta deploy:cf";
            } else if (oConfig.platform === "Application Router @ SAP HANA XS Advanced") {
                packge.scripts["build:mta"] = "mbt build -p=xsa";
                packge.scripts[
                    "deploy:cf"
                ] = `cross-var xs deploy mta_archives/${oConfig.projectname}_$npm_package_version.mtar`;
                packge.scripts["deploy"] = "run-s build:mta deploy:xs";
            }

            if (oConfig.platform === "SAP Launchpad service") {
                packge.scripts.start = "ui5 serve --config=uimodule/ui5.yaml  --open test/flpSandbox.html";
            }
        }

        if (oConfig.platform === "SAP NetWeaver") {
            packge.devDependencies["ui5-task-nwabap-deployer"] = "*";
            packge.devDependencies["ui5-middleware-route-proxy"] = "*";
            packge.ui5.dependencies.push("ui5-task-nwabap-deployer");
            packge.ui5.dependencies.push("ui5-middleware-route-proxy");
            packge.scripts["deploy"] = "run-s build:ui";
        }

        if (oConfig.codeassist) {
            packge.devDependencies["@sap/eslint-plugin-ui5-jsdocs"] = "^2.0.5";
            packge.devDependencies["@sapui5/ts-types"] = "^1.96.0"; //keep this line in sync with ui5.yaml version
        }

        await fileaccess.writeJSON.call(this, "/package.json", packge);
    }

    install() {
        this.config.set("setupCompleted", true);
        this.installDependencies({
            bower: false,
            npm: true
        });
    }

    end() {
        this.spawnCommandSync("git", ["init", "--quiet"], {
            cwd: this.destinationPath()
        });
        this.spawnCommandSync("git", ["add", "."], {
            cwd: this.destinationPath()
        });
        this.spawnCommandSync(
            "git",
            ["commit", "--quiet", "--allow-empty", "-m", "Initialize repository with easy-ui5"],
            {
                cwd: this.destinationPath()
            }
        );
    }
};

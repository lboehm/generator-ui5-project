/**
 * View Types as Array
 */
exports.viewTypes = ["XML", "JSON", "JS", "HTML"];

/**
 * Platforms as object (used for accessing constants directly in code)
 */
exports.platformOptions = {
    staticWebserver: "Static webserver",
    appRouterCf: "Application Router @ Cloud Foundry",
    appRepBtp: "SAP HTML5 Application Repository service for SAP BTP",
    launchpadSrv: "SAP Launchpad service",
    appRouterHanaXs: "Application Router @ SAP HANA XS Advanced",
    netweaver: "SAP NetWeaver"
};

/**
 * Platforms as array (used for providing a list of values in the yeoman prompt)
 */
exports.platforms = Object.values(this.platformOptions);

/**
 * Platforms with mapping of the cli key (that is provided as a cli argument) to the actual value
 */
exports.cliArgsPlatforms = [
    {
        cliKey: "staticWebserver",
        fullname: this.platformOptions.staticWebserver
    },
    {
        cliKey: "appRouterCf",
        fullname: this.platformOptions.appRouterCf
    },
    {
        cliKey: "appRepBtp",
        fullname: this.platformOptions.appRepBtp
    },
    {
        cliKey: "launchpadSrv",
        fullname: this.platformOptions.launchpadSrv
    },
    {
        cliKey: "appRouterHanaXs",
        fullname: this.platformOptions.appRouterHanaXs
    },
    {
        cliKey: "netweaver",
        fullname: this.platformOptions.netweaver
    }
];

/**
 * UI5 Library source options as object (used for accessing constants directly in code)
 */
exports.ui5LibSrcOptions = {
    cdnOpenUi5: "Content delivery network (OpenUI5)",
    cdnSapUi5: "Content delivery network (SAPUI5)",
    localOpenUi5: "Local resources (OpenUI5)",
    localSapUi5: "Local resources (SAPUI5)"
};

/**
 * UI5 Library source options as array (used for providing a list of values in the yeoman prompt)
 */
exports.ui5LibSources = Object.values(this.ui5LibSrcOptions);

/**
 * Platforms with mapping of the cli key (that is provided as a cli argument) to the actual value
 */
exports.cliArgsUi5LibSources = [
    {
        cliKey: "cdnOpenUi5",
        fullname: this.ui5LibSrcOptions.cdnOpenUi5
    },
    {
        cliKey: "cdnSapUi5",
        fullname: this.ui5LibSrcOptions.cdnSapUi5
    },
    {
        cliKey: "localOpenUi5",
        fullname: this.ui5LibSrcOptions.localOpenUi5
    },
    {
        cliKey: "localSapUi5",
        fullname: this.ui5LibSrcOptions.localSapUi5
    }
];

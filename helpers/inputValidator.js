class InputValidator {
    isValidProjectName(projectName) {
        if (/^\d*[a-zA-Z][a-zA-Z0-9]*$/g.test(projectName)) {
            return true;
        } else {
            return false;
        }
    }

    isValidNamespace(namespace) {
        if (/^[a-zA-Z0-9_\.]*$/g.test(namespace)) {
            return true;
        } else {
            return false;
        }
    }
}

exports.InputValidator = InputValidator;

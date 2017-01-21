# Lambda Environment Variables
> A package for decrypting Lambda environment variables encrypted by AWS KMS

The purpose of this package is the easily decrypt and fetch environment variables in Lambda functions, using KMS for decryption. The package supports getting environment variables that have been encrypted in Lambda using a default service key, however the main purpose is for decrypting variables that were encrypted using a custom KMS key. For more information on Lambda environment variables and encryption keys, see the [AWS Documentation](http://docs.aws.amazon.com/lambda/latest/dg/env_variables.html).

Before implementing it is recommended you read the [notes](#notes) section
## Contents
- [Usage](#usage)
- [Notes](#notes)
- [Contributing](#contributing)

## Usage
### Add lambda-env-vars to your project
```console
$ npm install --save lambda-env-vars
```
If you're using yarn:
```console
$ yarn add lambda-env-vars
```

### Lambda Handler Example
It's important that the instance of the class is defined outside the handler, in order to utilize global variable caching, to cut down on KMS decryption charges.

ES6 Example:
```javascript
import LambdaEnvVars from 'lambda-env-vars';
const lambdaEnvVars = new LambdaEnvVars()

function handler(event, context, callback) {
  // Get an environment variable encrypted using a custom KMS key.
  lambdaEnvVars.getEncryptedVariable('envVarKey')
    .then((decryptedValue) => {
      doSomethingWithEnvVar(decryptedValue);
    });

  // Get an environment variable that uses a default service key.
  const simpleKeyVariable = lambdaEnvVars.getSimpleVariable('simpleEnvVarKey');
  doSomethingWithSimpleKey(simpleKeyVariable);
}

export { handler };
```

ES5 Example:
```javascript
var LambdaEnvVars = require('lambda-env-vars');
var lambdaEnvVars = new LambdaEnvVars.default();

exports.handler = (event, context, callback) => {
  console.error(lambdaEnvVars.decryptedVariables);
  lambdaEnvVars.getEncryptedVariable('testVariable')
    .then((result) => console.error(result));
};

```

## API Reference

### Get an encrypted variable
```javascript
lambdaEnvVars.getEncryptedVariable('envVarKey');
```
Parameters:

| Name | Type | Default | Info |
| --- | --- | --- | --- |
| variableName | string | '' | The key in process.env to which the variable is stored under. |

Returns a promise that resolves the decrypted value, or rejects an error if there were issues connecting to KMS or issues with the encrypted payload.

### Get an environment variable decrypted using a default service key
```javascript
const value = lambdaEnvVars.getSimpleVariable('envVarKey');
```
Parameters:

| Name | Type | Default | Info |
| --- | --- | --- | --- |
| variableName | string | '' | The key in process.env to which the variable is stored under. |

Returns the string value of the environment variable. No decryption takes plae in code as this is done before Lambda is called.

## Notes
 - In order to use the decryption feature you'll have to set a KMS encryption key on your lambda function.
 - The package depends on the aws-sdk, however it is not listed as a dependency as it should be installed on your lambda environment by default.
 - The package stores decrypted variables outside the handler so that variables are only encrypted once per lambda container.
 - The current version of the interface relies on Promises, callback support will be added in the future.

## Contributing
- Start a feature branch from master
- Tests should be written in the test directory for any new features.
- Code should follow the installed style guide of airbnb.
- Tests and linting can be run with `npm test`.
- Once your feature is complete submit a PR to the master branch.

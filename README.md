# Lambda Environment Variables
> A package for decrypting Lambda environment variables encrypted by AWS KMS

The purpose of this package is the easily decrypt and fetch environment variables in Lambda functions, using KMS for decryption. The package supports getting environment variables that have been encrypted in Lambda using a default service key, however the main purpose is for decrypting variables that were encrypted using a custom KMS key. For more information on Lambda environment variables and encryption keys, see the [AWS Documentation](http://docs.aws.amazon.com/lambda/latest/dg/env_variables.html).

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
```javascript
import lambdaEnvVars from 'lambda-env-vars';

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

export { handler }
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
 - The package stores decrypted variables outside the handler so that variables are only encrypted once per container.
 - The current version of the interface relies on Promises, callback support will be added in the future.

## Contributing
- Start a feature branched from master
- Tests should be written for any new features in the test directory.
- Code should follow the installed style guide of airbnb.
- Tests and linting can be run with `npm test`.
- Once your feature is complete submit a PR to the master branch.

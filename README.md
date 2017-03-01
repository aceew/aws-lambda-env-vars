# Lambda Environment Variables
> A package for decrypting Lambda environment variables encrypted by AWS KMS

[![Coverage Status](https://coveralls.io/repos/github/aceew/aws-lambda-env-vars/badge.svg?branch=master)](https://coveralls.io/github/aceew/aws-lambda-env-vars?branch=master)
[![Build Status](https://travis-ci.org/aceew/aws-lambda-env-vars.svg?branch=master)](https://travis-ci.org/aceew/aws-lambda-env-vars)

The purpose of this package is the easily decrypt and fetch environment variables in Lambda functions, using KMS for decryption. The package supports getting environment variables that have been encrypted in Lambda using a default service key, however the main purpose is for decrypting variables that were encrypted using a custom KMS key. For more information on Lambda environment variables and encryption keys, see the [AWS Documentation](http://docs.aws.amazon.com/lambda/latest/dg/env_variables.html).

Before implementing it is recommended you read the [notes](#notes) section

## Contents
- [Usage](#usage)
- [FAQs](#FAQs)
- [Contributing](#contributing)

## Usage

### AWS config
When using encrypted environment variables you will need to create a KMS key in IAM and give usage permission to the role that your Lambda function has been assigned. You then need to configure your Lambda function to use the new KMS key by default. This can be found in the Lambda function under
`Configuration -> Advanced settings -> KMS key`.

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
const lambdaEnvVars = new LambdaEnvVars();

function handler(event, context, callback) {
  // Get an environment variable encrypted using a custom KMS key.
  lambdaEnvVars.getCustomDecryptedValue('envVarKey')
    .then((decryptedValue) => {
      doSomethingWithDecryptedValue(decryptedValue);
    });

  // Get an environment variable that uses a default service key.
  const simpleKeyVariable = lambdaEnvVars.getDefaultDecryptedValue('simpleEnvVarKey');
  doSomethingWithSimpleVariable(simpleKeyVariable);
}

export { handler };
```

ES5 Example:
```javascript
var LambdaEnvVars = require('lambda-env-vars');
var lambdaEnvVars = new LambdaEnvVars.default();

exports.handler = (event, context, callback) => {
  lambdaEnvVars.getCustomDecryptedValue('testVariable')
    .then(doSomethingWithDecryptedValue);

  const simpleKeyVariable = lambdaEnvVars.getDefaultDecryptedValue('simpleEnvVarKey');
  doSomethingWithSimpleVariable(simpleKeyVariable);
};

```

## API Reference

### Decrypt an environment variable that uses a custom KMS key
Uses KMS to decrypt the cipher text stored under the environment variable of the specified key name. Caches the decrypted variable in the global scope so it is only decrypted once per container, cutting down on KMS decryption costs.

```javascript
lambdaEnvVars.getCustomDecryptedValue('envVarKey');
```
Parameters:

| Name | Type | Default | Info |
| --- | --- | --- | --- |
| variableName | string | '' | The key in process.env to which the variable is stored under. |

Returns a promise that resolves the decrypted value, or rejects an error if there were issues connecting to KMS or issues with the encrypted payload.

### Decrypt multiple environment variables that use a custom KMS key
Like the single variable, uses KMS to decrypt the cipher text stored under keys in the `process.env` object (Lambda environment variables). Again, the decrypted values are cached in the global scope, so the variables are only encrypted once per Lambda container. Multiple environment variable keys can be specified and they will be returned as keys to an object where the values are decrypted.

```javascript
lambdaEnvVars.getCustomDecryptedValueList(['envVarKey1', 'envVarKey2']);
// returns { envVarKey1: 'Decrypted variable', envVarKey2: 'Decrypted variable' }
```

Parameters:

| Name | Type | Default | Info |
| --- | --- | --- | --- |
| variableNames | Array | [] | Keys in process.env to which encrypted environment variables are stored under. |

Returns an object containing the decrypted values where the keys are the items specified in the params `variableNames`.


### Get an environment variable decrypted using a default service key
Returns the variable stored under `process.env` for the specified key. Default service key encrypted variables are decrypted before the Lambda invocation meaning the decrypted value is already available under `process.env`.

```javascript
const value = lambdaEnvVars.getDefaultDecryptedValue('envVarKey');
```
Parameters:

| Name | Type | Default | Info |
| --- | --- | --- | --- |
| variableName | string | '' | The key in process.env to which the variable is stored under. |

Returns the string value of the environment variable. No decryption takes place in code as this is done before Lambda is called.

## FAQs

### My Lambda config exceeds 4KB. What do I do?
Lambda imposes a 4KB limit on function config, this is inclusive of environment variables. By using a few encrypted environment variables it easy to quickly reach this limit.

### Why is the aws-sdk a dev dependency?
The package depends on the aws-sdk, however it is not listed as a dependency as it should be installed on your lambda environment by default.

### Doesn't KMS decryption quite expensive?
Yes, however as it is recommended in AWS's KMS helper code, the decrypted variables are stored in memory so only the first invocation of a Lambda function container incurs a KMS cost. All requests after this point will receive the var stored in memory.


## Contributing
- Start a feature branch from master
- Tests should be written in the test directory for any new features.
- Code should follow the installed style guide of airbnb.
- Tests and linting can be run with `npm test`.
- Once your feature is complete submit a PR to the master branch.

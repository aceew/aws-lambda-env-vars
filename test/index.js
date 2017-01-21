// eslint-disable-next-line
import test from 'ava';

import LambdaEnvVars from './../src/index';

const lambdaEnvVars = new LambdaEnvVars();

// Stub KMS decryption.
const decryptedValueStub = 'Pretend that this is decrypted please';
const decryptPromiseStub = () => {
  const result = {
    Plaintext: {
      toString() {
        return decryptedValueStub;
      },
    },
  };

  return Promise.resolve(result);
};

// eslint-disable-next-line
lambdaEnvVars.kms.decrypt = () => ({ promise: decryptPromiseStub });

test('Getting simple variables that exist', (t) => {
  const varKey = 'exists';
  lambdaEnvVars.process.env[varKey] = 'I do exist';
  const simpleVar = lambdaEnvVars.getDefaultDecryptedValue(varKey);
  t.is(simpleVar, process.env.exists);
  delete lambdaEnvVars.process.env[varKey];
});

test('Getting simple variables that don\'t exist', (t) => {
  const simpleVar = lambdaEnvVars.getDefaultDecryptedValue();
  t.is(simpleVar, '');
});

test('Getting encrypted vars that have already been decrypted', (t) => {
  const variableKey = 'randomVarKey';
  lambdaEnvVars.decryptedVariables[variableKey] = 'I have been decrypted';
  return lambdaEnvVars.getCustomDecryptedValue(variableKey)
    .then((result) => {
      t.is(result, lambdaEnvVars.decryptedVariables[variableKey]);
      delete lambdaEnvVars.decryptedVariables[variableKey];
    });
});

test('Getting encrypted vars that don\'t exist', (t) => {
  const variableKey = 'randomVarKey1';
  return lambdaEnvVars.getCustomDecryptedValue(variableKey)
    .then((result) => {
      t.is(result, '');
    });
});

test('Getting encrypted vars when an empty string is specified', t => (
  lambdaEnvVars.getCustomDecryptedValue()
    .then((result) => {
      t.is(result, '');
    })
));

test(
  'Getting encrypted vars that have not yet been decrypted and setting it in decrypted vars',
  (t) => {
    const variableKey = 'randomVarKey2';
    lambdaEnvVars.process.env[variableKey] = 'I have not been decrypted';

    return lambdaEnvVars.getCustomDecryptedValue(variableKey)
      .then((result) => {
        t.is(result, decryptedValueStub);
        t.is(lambdaEnvVars.decryptedVariables[variableKey], decryptedValueStub);
        delete lambdaEnvVars.process.env[variableKey];
      });
  });

test('Decrypting a variable', (t) => {
  const variableKey = 'randomVarKey3';
  lambdaEnvVars.process.env[variableKey] = 'I have not been decrypted';

  return lambdaEnvVars.decryptVariable(variableKey)
    .then((result) => {
      t.is(result, decryptedValueStub);
      delete lambdaEnvVars.process.env[variableKey];
    });
});

test('Setting a decrypted variable', (t) => {
  const variableKey = 'randomVarKey4';
  const value = 'I have not been decrypted';

  const result = lambdaEnvVars.setEncryptedVariable(variableKey, value);
  t.is(result, value);
});

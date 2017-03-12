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

test('Decrypting list of env vars returns a promise that resolves the values', (t) => {
  const keys = ['keyName1', 'keyName2'];
  keys.forEach((keyName) => {
    lambdaEnvVars.process.env[keyName] = 'Some value';
  });

  return lambdaEnvVars.getCustomDecryptedValueList(keys, {})
    .then((resultObject) => {
      t.is(typeof resultObject, 'object');

      keys.forEach((keyName) => {
        t.is(resultObject[keyName], decryptedValueStub);
        delete lambdaEnvVars.process.env[keyName];
      });
    });
});

test('Decrypting list of env vars when an empty array is specified, returns empty object', t => (
  lambdaEnvVars.getCustomDecryptedValueList()
    .then((result) => {
      t.is(typeof result, 'object');
      t.is(Object.keys(result).length, 0);
    })
));

test('Setting default parameters', (t) => {
  const defaultEnvVarsInstance = new LambdaEnvVars({ location: 's3' });
  t.is(typeof defaultEnvVarsInstance.defaultParams, 'object');
  t.is(defaultEnvVarsInstance.defaultParams.location, 's3');
});

test('Building request params: Rejects when location is invalid', (t) => {
  const params = { location: 'invalid' };
  return lambdaEnvVars.buildParams(params)
    .catch((error) => {
      t.is(typeof error.message, 'string');
    });
});

test('Building request params: Rejects when s3Config is empty', (t) => {
  const params = { location: 's3' };
  return lambdaEnvVars.buildParams(params)
    .catch((error) => {
      t.is(typeof error.message, 'string');
    });
});

test('Building request params: Rejects when s3Config is missing bucketName', (t) => {
  const params = {
    location: 's3',
    s3Config: {
      bucketRegion: 'bucketRegion',
      fileName: 'fileName',
    },
  };

  return lambdaEnvVars.buildParams(params)
    .catch((error) => {
      t.is(typeof error.message, 'string');
    });
});

test('Building request params: Rejects when s3Config is missing bucketRegion', (t) => {
  const params = {
    location: 's3',
    s3Config: {
      bucketName: 'bucketName',
      fileName: 'fileName',
    },
  };

  return lambdaEnvVars.buildParams(params)
    .catch((error) => {
      t.is(typeof error.message, 'string');
    });
});

test('Building request params: Rejects when s3Config is missing fileName', (t) => {
  const params = {
    location: 's3',
    s3Config: {
      bucketName: 'bucketName',
      bucketRegion: 'bucketRegion',
    },
  };

  return lambdaEnvVars.buildParams(params)
    .catch((error) => {
      t.is(typeof error.message, 'string');
    });
});

test('Building request params: Resolves the params object', (t) => {
  const params = {
    location: 's3',
    s3Config: {
      bucketName: 'bucketName',
      bucketRegion: 'bucketRegion',
      fileName: 'fileName',
    },
  };

  return lambdaEnvVars.buildParams(params)
    .then((result) => {
      t.is(typeof result, 'object');
    });
});

test('Building request params: Uses the default params defined by the constructor', t => (
  lambdaEnvVars.buildParams()
    .then((result) => {
      t.is(typeof result, 'object');
    })
));


test('Getting var from s3 file: Resolves the variable when it\'s already set', () => {

});

test('Getting var from s3 file: Rejects when the s3 file is not valid json', () => {

});

test('Getting var from s3 file: Resolves the file once fetched from S3', () => {

});

test('Getting var from s3 file: Resolves the file once fetched from S3', () => {

});

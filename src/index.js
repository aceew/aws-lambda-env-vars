// eslint-disable-next-line
const AWS = require('aws-sdk');

const decryptedVariables = {};
const s3StoredVariables = {};

export default class LambdaEnvVars {
  /**
   * Injects the node process API and sets the isntance of AWS KMS.
   *
   * @param {Object} params
   * Default params to be sent with each request.
   *
   * @param {string} params.location
   * Location of the environment variables. ENUM ('lambdaConfig', 's3')
   *
   * @param {Object} params.s3Config
   * Config used to get the an env var file from S3.
   *
   * @param {string} params.s3Config.bucketName
   * @param {string} params.s3Config.bucketRegion
   * @param {string} params.s3Config.fileName
   *
   * @return {Object}
   * Instance of EnvVars.
   */
  constructor(params = {}) {
    this.defaultParams = {
      location: 'lambdaConfig',
      s3Config: {},
    };

    this.defaultParams = Object.assign(this.defaultParams, params);
    this.process = process;
    this.kms = new AWS.KMS({ apiVersion: '2014-11-01' });
    this.s3 = new AWS.S3({ apiVersion: '2006-03-01' });
    this.decryptedVariables = decryptedVariables;
    this.s3Vars = s3StoredVariables;
    this.availableStoreLocations = [
      's3',
      'lambdaConfig',
    ];
  }

  /**
   * Returns a variable stored simply in the process.env node API.
   *
   * @param {string} variableName
   * The key of the environment variable to fetch.
   *
   * @return {string}
   * Returns the environment variable if it is set, else an empty string.
   */
  getDefaultDecryptedValue(variableName = '') {
    return this.process.env[variableName] || '';
  }

  /**
   * Gets the decrypted value of an encrypted variable. Will check to see if this has been decrypted
   * already by checking the in-memory/global cariable cache of decrypted variables.
   *
   * @param {string} variableName
   * The key in process.env to which the variable is stored under.
   *
   * @param {Object} params
   * Params to state where the environment variable is stored.
   *
   * @param {string} params.location
   * Location of the environment variables. ENUM ('lambdaConfig', 's3')
   *
   * @param {Object} params.s3Config
   * Config used to get the an env var file from S3.
   *
   * @param {string} params.s3Config.bucketName
   * @param {string} params.s3Config.bucketRegion
   * @param {string} params.s3Config.fileName
   *
   * @return {Promise}
   * A promise that resolves the value if it is available, else an empty string if it not set in
   * the node environment variables, or a rejected promise if KMS couldn't decypt the value.
   */
  getCustomDecryptedValue(variableName = '', params = {}) {
    return this.buildParams(params)
      .then((builtParams) => {
        if (builtParams.location === 's3') {
          return this.getVarFromS3File(variableName, params.s3Config);
        }

        if (this.decryptedVariables[variableName]) {
          return Promise.resolve(this.decryptedVariables[variableName]);
        }

        if (variableName === '' || !this.process.env[variableName]) {
          return Promise.resolve('');
        }

        return this.decryptVariable(variableName)
          .then(result => this.setEncryptedVariable(variableName, result));
      });
  }

  /**
   * Gets an env var from a file within S3.
   *
   * @param {Object}
   * @return {Promise}
   * Promise that resolves the variable name
   */
  getVarFromS3File(variableName = '', s3Config = {}) {
    if (
      this.s3Vars[s3Config.bucketRegion] &&
      this.s3Vars[s3Config.bucketRegion][s3Config.bucketName] &&
      this.s3Vars[s3Config.bucketRegion][s3Config.bucketName][s3Config.fileName] &&
      this.s3Vars[s3Config.bucketRegion][s3Config.bucketName][s3Config.fileName][variableName]
    ) {
      return Promise.resolve(
        this.s3Vars[s3Config.bucketRegion][s3Config.bucketName][s3Config.fileName][variableName],
      );
    }

    return Promise.resolve();
  }

  /**
   * Validates the parameters that should state where to get the environment variables from. Returns
   * the built parameters.
   *
   * @param {Object} params
   * Object containing the parameters.
   *
   * @param {string} params.location
   * Location of the environment variables. ENUM ('lambdaConfig', 's3')
   *
   * @return {Promise}
   * Resolves the params for the call or rejects an error.
   */
  buildParams(params = {}) {
    const callParams = Object.assign({}, this.defaultParams, params);

    if (this.availableStoreLocations.indexOf(callParams.location) < 0) {
      const availableOptions = this.availableStoreLocations.join(', ');
      const errorMessage = `Field 'location' must be one of the following ${availableOptions}`;
      return Promise.reject(new Error(errorMessage));
    }

    if (
      params.location === 's3' &&
        (
          !params.s3Config ||
          !params.s3Config.bucketName ||
          !params.s3Config.bucketRegion ||
          !params.s3Config.fileName
        )
    ) {
      const errorMessage = 's3Config.bucketName, s3Config.bucketRegion, s3Config.fileName are required when location is \'s3\'';
      return Promise.reject(new Error(errorMessage));
    }

    return Promise.resolve(callParams);
  }

  /**
   * Decrypts a list of environment variables and returns them in an object where the keys are the
   * env variable keys and the values are the decrypted values.
   *
   * @param {string[]} variableNames
   * An array of environment variable keys to decrypt.
   *
   * @param {Object} params
   * Params to state where the environment variable is stored.
   *
   * @return {Promise}
   * A promise that resolves an object containing the decrypted values where the keys are the items
   * specified in the params variableNames.
   */
  getCustomDecryptedValueList(variableNames = [], params = {}) {
    const decryptedVariablesObject = {};

    const decryptedValuePromiseList = variableNames.map(envVar => (
      this.getCustomDecryptedValue(envVar, params)
        .then((decryptedValue) => {
          decryptedVariablesObject[envVar] = decryptedValue;
        })
    ));

    return Promise.all(decryptedValuePromiseList)
      .then(() => decryptedVariablesObject);
  }

  /**
   * Sets the environment variable to the decryptedVariable object so it is cached per container.
   *
   * @param {string} variableName
   * The key in process.env to which the variable is stored under.
   *
   * @param {mixed} variableName
   * The data to store in decryptedVariables.
   *
   * @return {string}
   * Returns the variable passed in for the purpose of promise chaining.
   */
  setEncryptedVariable(variableName, value) {
    this.decryptedVariables[variableName] = value;
    return value;
  }

  /**
   * Uses AWS KMS to decrypt the variable, which is then resolved in the promise return value.
   *
   * @param {string} variableKey
   * The variable key to decrypt.
   *
   * @return {Promise}
   * Resolves a promise that resolves the decrypted value or resolves.
   */
  decryptVariable(variableKey) {
    const encrypted = this.process.env[variableKey];
    return this.kms.decrypt({ CiphertextBlob: new Buffer(encrypted, 'base64') }).promise()
      .then(data => data.Plaintext.toString('ascii'));
  }
}

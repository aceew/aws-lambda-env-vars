// eslint-disable-next-line
const AWS = require('aws-sdk');

const decryptedVariables = {};

export default class LambdaEnvVars {
  /**
   * Injects the node process API and sets the isntance of AWS KMS.
   *
   * @return {Object}
   * Instance of EnvVars.
   */
  constructor() {
    this.process = process;
    this.kms = new AWS.KMS();
    this.decryptedVariables = decryptedVariables;
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
   * @return {Promise}
   * A promise that resolves the value if it is available, else an empty string if it not set in
   * the node environment variables, or a rejected promise if KMS couldn't decypt the value.
   */
  getCustomDecryptedValue(variableName = '') {
    if (this.decryptedVariables[variableName]) {
      return Promise.resolve(this.decryptedVariables[variableName]);
    }

    if (variableName === '' || !this.process.env[variableName]) {
      return Promise.resolve('');
    }

    return this.decryptVariable(variableName)
      .then(result => this.setEncryptedVariable(variableName, result));
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

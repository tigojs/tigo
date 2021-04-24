/**
 * Request tigo API
 * @param {object} opts Options
 * @param {string} opts.prefix Prefix of API URL.
 * @param {string} opts.host To build prefix automatically, you should fill in this option to specify the host.
 * @param {number} opts.port Not necessary if port is 80 or 443.
 * @param {boolean} opts.https If true, using https to request API.
 * @param {string} opts.base Base path of API, like /api.
 * @param {string} opts.ak Your tigo API AccessKey
 * @param {string} opts.sk Your tigo API SecertKey
 */
export function getAgent(opts: {
    prefix?: string;
    host?: string;
    port?: number;
    https?: boolean;
    base?: string;
    ak: string;
    sk: string;
}): request.SuperAgentStatic & request.Request;
import request = require("superagent");

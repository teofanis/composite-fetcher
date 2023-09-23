// eslint-disable-next-line import/no-extraneous-dependencies, @typescript-eslint/no-var-requires
const fetchMock = require('fetch-mock');

const fetch = fetchMock.sandbox();

module.exports = fetch;

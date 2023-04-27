const {
  METAMASK_STALELIST_URL,
  METAMASK_HOTLIST_DIFF_URL,
  ListNames,
} = require('@metamask/phishing-controller');

// last updated must not be 0
const lastUpdated = 1;
const defaultHotlist = { data: [] };
const defaultStalelist = {
  version: 2,
  tolerance: 2,
  lastUpdated,
  eth_phishing_detect_config: {
    fuzzylist: [],
    allowlist: [],
    blocklist: [],
    name: ListNames.MetaMask,
  },
  phishfort_hotlist: {
    blocklist: [],
    name: ListNames.Phishfort,
  },
};

const emptyHtmlPage = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="utf-8">
    <title>title</title>
  </head>
  <body>
    Empty page
  </body>
</html>`;

/**
 * Setup fetch mocks for the phishing detection feature.
 *
 * The mock configuration will show that "127.0.0.1" is blocked. The dynamic lookup on the warning
 * page can be customized, so that we can test both the MetaMask and PhishFort block cases.
 *
 * @param {import('mockttp').Mockttp} mockServer - The mock server.
 * @param {object} mockPhishingConfigResponseConfig - The response for the dynamic phishing
 * @param {number} mockPhishingConfigResponseConfig.statusCode - The status code for the response.
 * @param {string[]} mockPhishingConfigResponseConfig.blocklist - The blocklist for the response.
 * configuration lookup performed by the warning page.
 */
async function setupPhishingDetectionMocks(
  mockServer,
  mockPhishingConfigResponseConfig = {
    statusCode: 200,
    blocklist: [],
  },
) {
  const { statusCode, blocklist } = mockPhishingConfigResponseConfig;

  await mockServer.forGet(METAMASK_STALELIST_URL).thenCallback(() => {
    return {
      statusCode,
      json: {
        data: {
          ...defaultStalelist,
          eth_phishing_detect_config: {
            ...defaultStalelist.eth_phishing_detect_config,
            blocklist,
          },
        },
      },
    };
  });

  await mockServer
    .forGet(`${METAMASK_HOTLIST_DIFF_URL}/${lastUpdated}`)
    .thenCallback(() => {
      return {
        statusCode: 200,
        json: defaultHotlist,
      };
    });

  await mockServer
    .forGet('https://github.com/MetaMask/eth-phishing-detect/issues/new')
    .thenCallback(() => {
      return {
        statusCode: 200,
        body: emptyHtmlPage,
      };
    });

  await mockServer
    .forGet('https://github.com/phishfort/phishfort-lists/issues/new')
    .thenCallback(() => {
      return {
        statusCode: 200,
        body: emptyHtmlPage,
      };
    });
}

/**
 * Setup fallback mocks for default behaviour of the phishing detection feature.
 *
 * This sets up default mocks for a mockttp server when included in test/e2e/mock-e2e.js
 *
 * @param {import('mockttp').Mockttp} mockServer - The mock server.
 */

async function mockEmptyStalelistAndHotlist(mockServer) {
  await mockServer.forGet(METAMASK_STALELIST_URL).thenCallback(() => {
    return {
      statusCode: 200,
      json: { ...defaultStalelist },
    };
  });

  await mockServer.forGet(`${METAMASK_HOTLIST_DIFF_URL}/0`).thenCallback(() => {
    return {
      statusCode: 200,
      json: defaultHotlist,
    };
  });
}

module.exports = {
  setupPhishingDetectionMocks,
  METAMASK_HOTLIST_DIFF_URL,
  METAMASK_STALELIST_URL,
  mockEmptyStalelistAndHotlist,
};

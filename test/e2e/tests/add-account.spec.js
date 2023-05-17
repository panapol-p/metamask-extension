const { strict: assert } = require('assert');
const {
  convertToHexValue,
  withFixtures,
  regularDelayMs,
  completeImportSRPOnboardingFlow,
} = require('../helpers');
const enLocaleMessages = require('../../../app/_locales/en/messages.json');
const FixtureBuilder = require('../fixture-builder');

describe('Add account', function () {
  const testSeedPhrase =
    'forum vessel pink push lonely enact gentle tail admit parrot grunt dress';
  const testPassword = 'correct horse battery staple';
  const ganacheOptions = {
    accounts: [
      {
        secretKey:
          '0x53CB0AB5226EEBF4D872113D98332C1555DC304443BEE1CF759D15798D3C55A9',
        balance: convertToHexValue(25000000000000000000),
      },
    ],
  };
  const secondAccount = '0x3ED0eE22E0685Ebbf07b2360A8331693c413CC59';
  const thirdAccount = '0xD38d853771Fb546bd8B18b2F3638491bC0B0E906';

  it('should display correct new account name after create', async function () {
    await withFixtures(
      {
        fixtures: new FixtureBuilder().build(),
        ganacheOptions,
        title: this.test.title,
      },
      async ({ driver }) => {
        await driver.navigate();
        await driver.fill('#password', 'correct horse battery staple');
        await driver.press('#password', driver.Key.ENTER);

        await driver.clickElement('[data-testid="account-menu-icon"]');
        await driver.clickElement(
          '[data-testid="multichain-account-menu-add-account"]',
        );

        await driver.fill('.new-account-create-form input', '2nd account');
        await driver.clickElement({ text: 'Create', tag: 'button' });
        const accountName = await driver.waitForSelector({
          css: '[data-testid="account-menu-icon"]',
          text: '2nd',
        });
        assert.equal(await accountName.getText(), '2nd account');
      },
    );
  });

  it('should add the same account addresses when a secret recovery phrase is imported, the account is locked, and the same secret recovery phrase is imported again', async function () {
    await withFixtures(
      {
        fixtures: new FixtureBuilder({ onboarding: true }).build(),
        ganacheOptions,
        title: this.test.title,
        failOnConsoleError: false,
      },
      async ({ driver }) => {
        await driver.navigate();

        await completeImportSRPOnboardingFlow(
          driver,
          testSeedPhrase,
          testPassword,
        );

        await driver.clickElement('[data-testid="account-menu-icon"]');
        await driver.clickElement(
          '[data-testid="multichain-account-menu-add-account"]',
        );

        await driver.fill('.new-account-create-form input', '2nd account');
        await driver.clickElement({ text: 'Create', tag: 'button' });

        // Open account menu again
        await driver.clickElement('[data-testid="account-menu-icon"]');

        // Select account details for second account
        await driver.clickElement(
          '.multichain-account-list-item--selected [data-testid="account-list-item-menu-button"]',
        );

        await driver.clickElement('[data-testid="account-list-menu-details"]');

        await driver.findVisibleElement('.popover-bg');

        // get the public address for the "second account"
        await driver.waitForSelector('.multichain-address-copy-button');
        const secondAccountAddress = await driver.findElement({
          text: secondAccount,
          tag: 'button',
        });

        const secondAccountPublicAddress = await secondAccountAddress.getText();
        await driver.clickElement('button[aria-label="Close"]');

        // generate a third accound
        await driver.clickElement('[data-testid="account-menu-icon"]');
        await driver.clickElement(
          '[data-testid="multichain-account-menu-add-account"]',
        );

        await driver.fill('.new-account-create-form input', '3rd account');
        await driver.clickElement({ text: 'Create', tag: 'button' });

        // Open account menu again
        await driver.clickElement('[data-testid="account-menu-icon"]');

        // Select account details for third account
        await driver.clickElement(
          '.multichain-account-list-item--selected [data-testid="account-list-item-menu-button"]',
        );

        await driver.clickElement('[data-testid="account-list-menu-details"]');

        // get the public address for the "third account"
        await driver.waitForSelector('.multichain-address-copy-button');
        const thirdAccountAddress = await driver.findElement({
          text: thirdAccount,
          tag: 'button',
        });

        const thirdAccountPublicAddress = await thirdAccountAddress.getText();
        await driver.clickElement('button[aria-label="Close"]');

        // lock account
        await driver.clickElement(
          '[data-testid="account-options-menu-button"]',
        );
        await driver.delay(regularDelayMs);

        await driver.clickElement('[data-testid="global-menu-lock"]');
        await driver.delay(regularDelayMs);

        // restore same seed phrase
        const restoreSeedLink = await driver.findClickableElement(
          '.unlock-page__link',
        );

        await restoreSeedLink.click();

        await driver.delay(regularDelayMs);

        await driver.pasteIntoField(
          '[data-testid="import-srp__srp-word-0"]',
          testSeedPhrase,
        );

        await driver.fill('#password', 'correct horse battery staple');
        await driver.fill('#confirm-password', 'correct horse battery staple');
        await driver.clickElement({
          text: enLocaleMessages.restore.message,
          tag: 'button',
        });
        await driver.delay(regularDelayMs);

        // recreate a "2nd account"
        await driver.clickElement('[data-testid="account-menu-icon"]');
        await driver.clickElement(
          '[data-testid="multichain-account-menu-add-account"]',
        );
        await driver.fill('.new-account-create-form input', '2nd account');
        await driver.clickElement({ text: 'Create', tag: 'button' });

        // Open account menu again
        await driver.clickElement('[data-testid="account-menu-icon"]');
        // Select account details for second account
        await driver.clickElement(
          '.multichain-account-list-item--selected [data-testid="account-list-item-menu-button"]',
        );

        await driver.clickElement('[data-testid="account-list-menu-details"]');

        await driver.findVisibleElement('.popover-bg');
        // get the public address for the "second account"
        await driver.waitForSelector('.multichain-address-copy-button');
        const recreatedSecondAccountAddress = await driver.findElement({
          text: secondAccount,
          tag: 'button',
        });

        assert.equal(
          await recreatedSecondAccountAddress.getText(),
          secondAccountPublicAddress,
        );
        await driver.clickElement('button[aria-label="Close"]');

        // re-generate a third accound
        await driver.clickElement('[data-testid="account-menu-icon"]');
        await driver.clickElement(
          '[data-testid="multichain-account-menu-add-account"]',
        );

        await driver.fill('.new-account-create-form input', '3rd account');
        await driver.clickElement({ text: 'Create', tag: 'button' });

        // Open account menu again
        await driver.clickElement('[data-testid="account-menu-icon"]');
        // Select account details for third account
        await driver.clickElement(
          '.multichain-account-list-item--selected [data-testid="account-list-item-menu-button"]',
        );
        await driver.clickElement('[data-testid="account-list-menu-details"]');

        // get the public address for the "third account"
        await driver.waitForSelector('.multichain-address-copy-button');
        const recreatedThirdAccountAddress = await driver.findElement({
          text: thirdAccount,
          tag: 'button',
        });
        assert.strictEqual(
          await recreatedThirdAccountAddress.getText(),
          thirdAccountPublicAddress,
        );
      },
    );
  });

  it('It should be possible to remove an account imported with a private key, but should not be possible to remove an account generated from the SRP imported in onboarding', async function () {
    const testPrivateKey =
      '14abe6f4aab7f9f626fe981c864d0adeb5685f289ac9270c27b8fd790b4235d6';

    await withFixtures(
      {
        fixtures: new FixtureBuilder().build(),
        ganacheOptions,
        title: this.test.title,
      },
      async ({ driver }) => {
        await driver.navigate();
        await driver.fill('#password', 'correct horse battery staple');
        await driver.press('#password', driver.Key.ENTER);

        await driver.delay(regularDelayMs);

        await driver.clickElement('[data-testid="account-menu-icon"]');

        await driver.clickElement(
          '[data-testid="multichain-account-menu-add-account"]',
        );
        await driver.fill('.new-account-create-form input', '2nd account');
        await driver.clickElement({ text: 'Create', tag: 'button' });

        // Open account menu again
        await driver.clickElement('[data-testid="account-menu-icon"]');

        // Show account list menu for second account
        await driver.clickElement(
          '.multichain-account-list-item--selected [data-testid="account-list-item-menu-button"]',
        );

        const menuItems = await driver.findElements('.menu-item');
        assert.equal(menuItems.length, 2);

        // click out of menu
        await driver.clickElement('.menu__background');

        // import with private key
        await driver.clickElement({ text: 'Import account', tag: 'button' });

        // enter private key',
        await driver.fill('#private-key-box', testPrivateKey);
        await driver.clickElement({ text: 'Import', tag: 'button' });

        // should show the correct account name
        const importedAccountName = await driver.findElement(
          '[data-testid="account-menu-icon"]',
        );
        assert.equal(await importedAccountName.getText(), 'Account 3');

        // Open account menu again
        await driver.clickElement('[data-testid="account-menu-icon"]');

        // Show account list menu for second account
        await driver.clickElement(
          '.multichain-account-list-item--selected [data-testid="account-list-item-menu-button"]',
        );

        const importedMenuItems = await driver.findElements('.menu-item');
        assert.equal(importedMenuItems.length, 3);

        await driver.findElement('[data-testid="account-list-menu-remove"]');
      },
    );
  });
});

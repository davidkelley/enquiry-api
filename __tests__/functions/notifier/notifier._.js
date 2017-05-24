'use strict';

import AWS from 'aws-sdk-mock';
import faker from 'faker';

jest.mock('../../__mocks__/request');

const mod = require('../../../handler');

const jestPlugin = require('serverless-jest-plugin');

const lambdaWrapper = jestPlugin.lambdaWrapper;

const wrapped = lambdaWrapper.wrap(mod, { handler: 'Notifier' });

describe('λ.notifier', () => {
  const region = "us-east-1";

  // TODO 
});

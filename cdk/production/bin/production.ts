#!/usr/bin/env node
import * as cdk from 'aws-cdk-lib';
import { ProductionStack } from '../lib/production-stack';

const app = new cdk.App();
new ProductionStack(app, 'ProductionStack', {
  env: { account: process.env.CDK_DEFAULT_ACCOUNT, region: process.env.CDK_DEFAULT_REGION },
});
#!/usr/bin/env node
import * as cdk from 'aws-cdk-lib';
import { AcceptPeeringStack } from '../lib/accept-peering-stack';

const app = new cdk.App();
new AcceptPeeringStack(app, 'AcceptPeeringStack', {
    env: {
        account: '836152826188',
        region: 'us-east-1', // o la región que uses
    },
});
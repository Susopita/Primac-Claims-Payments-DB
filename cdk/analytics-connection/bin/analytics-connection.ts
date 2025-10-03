#!/usr/bin/env node
import * as cdk from 'aws-cdk-lib';
import { AnalyticsConnectionStack } from '../lib/analytics-connection-stack';

const app = new cdk.App();
new AnalyticsConnectionStack(app, 'AnalyticsConnectionStack', {
});
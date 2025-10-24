#!/usr/bin/env node
import * as cdk from 'aws-cdk-lib';
import { AnalyticsConnectionStack } from '../lib/analytics-connection-stack';
import { EC2Client, DescribeVpcsCommand } from "@aws-sdk/client-ec2";

async function getVpcIdByName(
    name: string,
    accessKeyId: string,
    secretAccessKey: string,
    sessionToken?: string
): Promise<string> {
    const ec2 = new EC2Client({
        region: "us-east-1",
        credentials: {
            accessKeyId,
            secretAccessKey,
            sessionToken,
        },
    });

    const result = await ec2.send(
        new DescribeVpcsCommand({
            Filters: [{ Name: "tag:Name", Values: [name] }],
        })
    );

    if (!result.Vpcs || result.Vpcs.length === 0) {
        throw new Error(`No VPC found with name ${name}`);
    }

    return result.Vpcs[0].VpcId!;
}

getVpcIdByName(
    "vpc-de-produccion",
    process.env.EXTERNAL_ACCESS_KEY_ID!,
    process.env.EXTERNAL_SECRET_ACCESS_KEY!,
    process.env.EXTERNAL_SESSION_TOKEN
).then((externalVpcId) => {
    const app = new cdk.App();

    new AnalyticsConnectionStack(app, "AnalyticsConnectionStack", {
        env: { account: "111111111111", region: "us-east-1" },
        cassandraVpcId: externalVpcId,
        AccountAId: "",
    });
}).catch((err) => {
    console.error(err);
});
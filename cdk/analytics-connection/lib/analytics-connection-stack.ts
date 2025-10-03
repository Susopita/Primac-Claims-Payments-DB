import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
// import * as sqs from 'aws-cdk-lib/aws-sqs';

export class AnalyticsConnectionStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // AWS Account B

    // VPC de primac conexion analytics

    // Subnets Privada de VPC Primac Conexion Analytics (1 por zona, 1 zona)

    // Internet Gateway para VPC Primax Conexion Analytics

    // Security Group para VPC Primac Conexion Analytics

    // Peering Connection con AWS Account A

    // EC2 - conexion con analytics (only-read)

  }
}

import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
// import * as sqs from 'aws-cdk-lib/aws-sqs';

export class AcceptPeeringStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    const vpc = new ec2.Vpc(this, 'VPC', {
      restrictDefaultSecurityGroup: false,
      vpcName: 'xd2',
      maxAzs: 1,
      ipAddresses: ec2.IpAddresses.cidr('10.1.0.0/16'),
      subnetConfiguration: [
        {
          name: 'PrivateSubnet',
          subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS, // privada pero con salida a internet (via NAT)
          cidrMask: 24,
        },
      ],
      natGateways: 0, // solo un NAT gateway
      gatewayEndpoints: {}, // desactivar endpoints S3/DynamoDB
    });

    const other = ec2.Vpc.fromLookup(this, 'VPC_conID?', {
      vpcName: 'AcceptPeeringStack/VPC_conID?',
    });

    new ec2.CfnVPCPeeringConnection(this, 'VPCPeering', {
      vpcId: vpc.vpcId,
      peerVpcId: other.vpcId,
      peerOwnerId: '836152826188', // si está en otra cuenta
    });
  }
}

/*cdk bootstrap -r "arn:aws:iam::836152826188:role/LabRole" --profile "default" --template aws-cdk-bootstrap.yaml*/
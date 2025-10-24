import * as cdk from 'aws-cdk-lib';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import { Construct } from 'constructs';
// import * as sqs from 'aws-cdk-lib/aws-sqs';

interface ProductionStackProps extends cdk.StackProps {
  AccountAId: string;
  cassandraVpcId: string;
}

export class AnalyticsConnectionStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props: ProductionStackProps) {
    super(scope, id, props);

    // AWS Account B

    // ===============================
    // 🌐 VPC de Primac Analytics Conexion (1 AZ)
    // ===============================
    const vpc = new ec2.Vpc(this, 'PrimacVPC', {
      vpcName: 'primac-vpc',
      maxAzs: 1,
      subnetConfiguration: [
        {
          name: 'Cassandra Node Analytics Private Connection',
          subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS,
          cidrMask: 24,
        },
      ],
    });

    // Internet Gateway para VPC Primax Conexion Analytics

    const igw = new ec2.CfnInternetGateway(this, 'PrimacIGW');
    const igwAttachment = new ec2.CfnVPCGatewayAttachment(this, 'PrimacIGWAttachment', {
      vpcId: vpc.vpcId,
      internetGatewayId: igw.ref,
    });

    // Configurar rutas públicas explícitamente
    vpc.publicSubnets.forEach((subnet, index) => {
      const routeTable = new ec2.CfnRoute(this, `PublicRoute${index}`, {
        routeTableId: subnet.routeTable.routeTableId,
        destinationCidrBlock: '0.0.0.0/0',
        gatewayId: igw.ref,
      });
      routeTable.addDependency(igwAttachment);
    });

    // ===============================
    // 🔒 Security Groups
    // ===============================

    // Cassandra Node
    const nodeSG = new ec2.SecurityGroup(this, 'CassandraSecurityGroup', {
      vpc,
      allowAllOutbound: true,
      description: 'Security Group para DB Cassandra',
      securityGroupName: 'primac-db-sg',
    });
    nodeSG.addIngressRule(nodeSG, ec2.Port.allTraffic(), 'Comunicación entre nodos');

    // ===============================
    // 💻 AMI Ubuntu
    // ===============================
    const ubuntuAmi = ec2.MachineImage.lookup({
      name: 'ubuntu/images/hvm-ssd/ubuntu-focal-20.04-amd64-server-*',
      owners: ['099720109477'], // Canonical
    });

    const cassandraNode = new ec2.Instance(this, 'CassandraNode1', {
      vpc,
      vpcSubnets: { subnets: [vpc.privateSubnets[2]] },
      instanceType: ec2.InstanceType.of(ec2.InstanceClass.T3, ec2.InstanceSize.SMALL),
      machineImage: ubuntuAmi,
      securityGroup: nodeSG,
      keyName: 'primac-keypair',
    });

    // Peering Connection con AWS Account A
    const peering = new ec2.CfnVPCPeeringConnection(this, 'VPCPeering', {
      vpcId: vpc.vpcId,
      peerVpcId: props.cassandraVpcId,
      peerOwnerId: props.AccountAId, // si está en otra cuenta
    });

    /*
    // Ruta en VPC A para llegar a VPC B
    vpcA.privateSubnets.forEach((subnet, i) => {
      new ec2.CfnRoute(this, `RouteToVPCA-${i}`, {
        routeTableId: subnet.routeTable.routeTableId,
        destinationCidrBlock: vpcB.vpcCidrBlock,
        vpcPeeringConnectionId: peering.ref,
      });
    });

    // Ruta en VPC B para llegar a VPC A
    vpcB.privateSubnets.forEach((subnet, i) => {
      new ec2.CfnRoute(this, `RouteToVPCB-${i}`, {
        routeTableId: subnet.routeTable.routeTableId,
        destinationCidrBlock: vpcA.vpcCidrBlock,
        vpcPeeringConnectionId: peering.ref,
      });
    });
*/

  }
}

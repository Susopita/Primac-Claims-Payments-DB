import * as cdk from 'aws-cdk-lib';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import { Construct } from 'constructs';
// import * as sqs from 'aws-cdk-lib/aws-sqs';

export class ProductionStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // AWS Account A 

    // ===============================
    // 🌐 VPC de Primac (4 AZs)
    // ===============================
    // Subnets Publicas de VPC Primac (1 por zona, 2 zonas)
    // Subnets Privadas de VPC Primac (1 por zona, 2 zonas)

    const vpc = new ec2.Vpc(this, 'PrimacVPC', {
      vpcName: 'primac-vpc',
      ipAddresses: ec2.IpAddresses.cidr('10.0.0.0/16'),
      availabilityZones: ['us-east-1a', 'us-east-1b', 'us-east-1c', 'us-east-1d'],
      subnetConfiguration: [
        {
          name: 'public',
          subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS,
          cidrMask: 24,
        },
        {
          name: 'private',
          subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS,
          cidrMask: 24,
        },
      ],
    });

    // ===============================
    // 🌍 Internet Gateway y Routing
    // ===============================

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

    // API (Claims, Payments)
    const apiSG = new ec2.SecurityGroup(this, 'ApiSecurityGroup', {
      vpc,
      allowAllOutbound: true,
      description: 'Security Group para APIs (Claims, Payments)',
      securityGroupName: 'primac-api-sg',
    });
    apiSG.addIngressRule(ec2.Peer.anyIpv4(), ec2.Port.tcp(80), 'HTTP');
    apiSG.addIngressRule(ec2.Peer.anyIpv4(), ec2.Port.tcp(443), 'HTTPS');

    // Cassandra DB
    const cassandraSG = new ec2.SecurityGroup(this, 'CassandraSecurityGroup', {
      vpc,
      allowAllOutbound: true,
      description: 'Security Group para DB Cassandra',
      securityGroupName: 'primac-db-sg',
    });
    cassandraSG.addIngressRule(apiSG, ec2.Port.tcp(9042), 'Permitir conexión desde API');
    cassandraSG.addIngressRule(cassandraSG, ec2.Port.allTraffic(), 'Comunicación entre nodos');

    // ===============================
    // 💻 AMI Ubuntu (para todas las EC2)
    // ===============================
    const ubuntuAmi = ec2.MachineImage.lookup({
      name: 'ubuntu/images/hvm-ssd/ubuntu-focal-20.04-amd64-server-*',
      owners: ['099720109477'], // Canonical
    });

    /*
    // ===============================
    // 💻 Instancias de API (2 en distintas AZ)
    // ===============================
    const apiInstance1 = new ec2.Instance(this, 'ApiInstance1', {
      vpc,
      vpcSubnets: { subnets: [vpc.publicSubnets[0]] },
      instanceType: ec2.InstanceType.of(ec2.InstanceClass.T3, ec2.InstanceSize.MICRO),
      machineImage: ubuntuAmi,
      securityGroup: apiSG,
      keyName: 'primac-keypair',
    });

    const apiInstance2 = new ec2.Instance(this, 'ApiInstance2', {
      vpc,
      vpcSubnets: { subnets: [vpc.publicSubnets[1]] },
      instanceType: ec2.InstanceType.of(ec2.InstanceClass.T3, ec2.InstanceSize.MICRO),
      machineImage: ubuntuAmi,
      securityGroup: apiSG,
      keyName: 'primac-keypair',
    });

    // ===============================
    // ⚖️ Load Balancer para APIs
    // ===============================
    const lb = new elbv2.ApplicationLoadBalancer(this, 'PrimacALB', {
      vpc,
      internetFacing: true,
      loadBalancerName: 'primac-api-lb',
      securityGroup: apiSG,
    });

    // Target Group para las APIs
    const targetGroup = new elbv2.ApplicationTargetGroup(this, 'ApiTargetGroup', {
      vpc,
      port: 80,
      protocol: elbv2.ApplicationProtocol.HTTP,
      targets: [
        new elbv2_targets.InstanceTarget(apiInstance1),
        new elbv2_targets.InstanceTarget(apiInstance2),
      ],
      healthCheck: {
        path: '/',
        interval: cdk.Duration.seconds(30),
      },
    });

    // Listener para redirigir tráfico HTTP al target group
    lb.addListener('HttpListener', {
      port: 80,
      defaultTargetGroups: [targetGroup],
    });
    */

    // ===============================
    // 💻 Instancias Cassandra (2 en distintas AZ)
    // ===============================
    const cassandraNode1 = new ec2.Instance(this, 'CassandraNode1', {
      vpc,
      vpcSubnets: { subnets: [vpc.privateSubnets[2]] },
      instanceType: ec2.InstanceType.of(ec2.InstanceClass.T3, ec2.InstanceSize.SMALL),
      machineImage: ubuntuAmi,
      securityGroup: cassandraSG,
      keyName: 'primac-keypair',
    });

    const cassandraNode2 = new ec2.Instance(this, 'CassandraNode2', {
      vpc,
      vpcSubnets: { subnets: [vpc.privateSubnets[3]] },
      instanceType: ec2.InstanceType.of(ec2.InstanceClass.T3, ec2.InstanceSize.SMALL),
      machineImage: ubuntuAmi,
      securityGroup: cassandraSG,
      keyName: 'primac-keypair',
    });

    // ===============================
    // 🧭 Salidas (Outputs)
    // ===============================
    //new cdk.CfnOutput(this, 'LoadBalancerDNS', { value: lb.loadBalancerDnsName });
    //new cdk.CfnOutput(this, 'Api1PublicIP', { value: apiInstance1.instancePublicIp });
    //new cdk.CfnOutput(this, 'Api2PublicIP', { value: apiInstance2.instancePublicIp });
    new cdk.CfnOutput(this, 'CassandraNode1PrivateIP', { value: cassandraNode1.instancePrivateIp });
    new cdk.CfnOutput(this, 'CassandraNode2PrivateIP', { value: cassandraNode2.instancePrivateIp });

    // Conexion Privada entre nodos por IP's

  }
}

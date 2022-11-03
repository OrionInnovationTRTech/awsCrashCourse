import * as cdk from 'aws-cdk-lib';
import { CfnOutput } from 'aws-cdk-lib';
import { Construct } from 'constructs';
import { DbStack } from './nested-stacks/db-stack';
import { Ec2Stack } from './nested-stacks/ec2-stack';
import { LambdaStack } from './nested-stacks/lambda-stack';
import { NetworkStack } from './nested-stacks/network-stack';
import { S3Stack } from './nested-stacks/s3-stack';
import path from "path";
import dotenv from "dotenv";

dotenv.config({
  path: path.resolve(__dirname, "../.env")
})

export class MainStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    const envName = process.env.CDK_ENVIRONMENT_NAME as string;
    const appName = process.env.CDK_APP_NAME as string;

    const networkStack = new NetworkStack(this, "network-stack", {
      envName,
      appName,
      description: "Creates networks, subnets, security groups, gateways, route tables."
    });

    const dbStack = new DbStack(this, "db-stack", {
      envName,
      appName,
      dbSecurityGroup: networkStack.getDbSecurityGroup(),
      vpc: networkStack.getVpc(),
      dbSubnetGroup: networkStack.getDbSubnetGroup(),
      description: "Creates RDS clusters."
    });

    const ec2Stack = new Ec2Stack(this, "ec2-stack", {
      envName,
      appName,
      vpc: networkStack.getVpc(),
      bastionHostSecurityGroup: networkStack.getBastionHostSecurityGroup(),
      description: "Creates EC2 instances."
    });

    const s3Stack = new S3Stack(this, "s3-stack", {
      envName,
      appName,
      description: "Createst S3 buckets."
    });

    const lambdaStack = new LambdaStack(this, "lambda-stack", {
      envName,
      appName,
      assetsBucket: s3Stack.getAssetsBucket(),
      ssmPrivateKeyParameterName: `/ec2/keypair/${ec2Stack.getKeypair().attrKeyPairId}`,
      description: "Creates Lambda functions."
    });

    const {
      clusterEndpoint: {
        hostname: dbHost,
        port: dbPort
      }
    } = dbStack.getDbCluster();

    new CfnOutput(this, "ssh-port-forwarding-command", {
      exportName: "ssh-port-forwarding-command",
      value: `ssh -i keypair.pem -N -L ${dbPort}:${dbHost}:${dbPort} ec2-user@${ec2Stack.getBastionHost().instancePublicIp}`
    });

    new CfnOutput(this, "link-to-private-key", {
      exportName: "link-to-private-key",
      value: lambdaStack.getLinkToPrivateKey()
    });
  }
}

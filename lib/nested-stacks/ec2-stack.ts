import { NestedStack, NestedStackProps } from "aws-cdk-lib";
import { CfnKeyPair, IInstance, Instance, InstanceClass, InstanceSize, InstanceType, ISecurityGroup, ISubnet, IVpc, MachineImage, SubnetFilter } from "aws-cdk-lib/aws-ec2";
import { Construct } from "constructs";

interface Ec2StackProps extends NestedStackProps {
  envName: string;
  appName: string;
  vpc: IVpc;
  bastionHostSecurityGroup: ISecurityGroup;
}

export class Ec2Stack extends NestedStack {
  private readonly bastionHost: IInstance;
  private readonly keypair: CfnKeyPair;

  public getBastionHost() {
    return this.bastionHost;
  }

  public getKeypair() {
    return this.keypair;
  }
  
  constructor(scope: Construct, id: string, props: Ec2StackProps) {
    super(scope, id, props);

    const { envName, appName } = props;

    this.keypair = new CfnKeyPair(this, "keypair", {
      keyName: `${envName}-${appName}-keypair`,
      keyType: "rsa"
    });

    const subnet = props.vpc.selectSubnets({
      subnetGroupName: `${envName}-${appName}-public-nat-gw-subnets`
    }).subnets[0];

    this.bastionHost = new Instance(this, "bastion-host", {
      instanceName: `${envName}-${appName}-bastion-host`,
      instanceType: InstanceType.of(InstanceClass.T3, InstanceSize.MICRO),
      machineImage: MachineImage.latestAmazonLinux(),
      vpc: props.vpc,
      vpcSubnets: {
        subnets: [subnet]
      },
      availabilityZone: subnet.availabilityZone,
      securityGroup: props.bastionHostSecurityGroup,
      allowAllOutbound: true,
      keyName: this.keypair.keyName
    });
  }
}
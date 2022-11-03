import { CustomResource, NestedStack, NestedStackProps } from "aws-cdk-lib";
import { Effect, PolicyStatement } from "aws-cdk-lib/aws-iam";
import { Architecture, Runtime } from "aws-cdk-lib/aws-lambda";
import { NodejsFunction } from "aws-cdk-lib/aws-lambda-nodejs";
import { IBucket } from "aws-cdk-lib/aws-s3";
import { Provider } from "aws-cdk-lib/custom-resources";
import { Construct } from "constructs";
import path from "path";

interface LambdaStackProps extends NestedStackProps {
  envName: string;
  appName: string;
  assetsBucket: IBucket;
  ssmPrivateKeyParameterName: string;
}

export class LambdaStack extends NestedStack {

  private readonly linkToPrivateKey: string;

  public getLinkToPrivateKey() {
    return this.linkToPrivateKey;
  }

  constructor(scope: Construct, id: string, props: LambdaStackProps) {
    super(scope, id, props);

    const { envName, appName } = props;

    const getLinkForPrivateKey = new NodejsFunction(this, "get-link-for-private-key", {
      functionName: `${envName}-${appName}-get-link-for-private-key`,
      entry: path.join(__dirname, "../../resources/functions/get-link-for-private-key/app.ts"),
      handler: "lambdaHandler",
      architecture: Architecture.X86_64,
      runtime: Runtime.NODEJS_16_X,
      environment: {
        NODE_OPTIONS: "--enable-source-maps",
        PARAMETER_NAME: props.ssmPrivateKeyParameterName,
        BUCKET_NAME: props.assetsBucket.bucketName,
        URL_SHORTENER_SERVICE_BASE_URL: process.env.URL_SHORTENER_SERVICE_BASE_URL as string
      },
      bundling: {
        externalModules: [
          "aws-sdk"
        ],
        minify: false,
        sourceMap: true
      }
    });

    props.assetsBucket.grantReadWrite(getLinkForPrivateKey);

    getLinkForPrivateKey.addToRolePolicy(new PolicyStatement({
      effect: Effect.ALLOW,
      actions: [
        "ssm:GetParameter"
      ],
      resources: ["*"]
    }));

    const customResourceProvider = new Provider(this, "custom-resource-provider", {
      onEventHandler: getLinkForPrivateKey
    });

    const customResourceForLinkToPrivateKey = new CustomResource(this, "custom-resource-for-private-key", {
      serviceToken: customResourceProvider.serviceToken
    });

    this.linkToPrivateKey = customResourceForLinkToPrivateKey.getAttString("url");
  }
}
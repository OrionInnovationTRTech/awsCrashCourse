import { CustomResource, Duration, NestedStack } from "aws-cdk-lib";
import { ISecurityGroup, IVpc } from "aws-cdk-lib/aws-ec2";
import { PolicyStatement } from "aws-cdk-lib/aws-iam";
import { Architecture, IFunction, Runtime } from "aws-cdk-lib/aws-lambda";
import { NodejsFunction, NodejsFunctionProps } from "aws-cdk-lib/aws-lambda-nodejs";
import { IServerlessCluster } from "aws-cdk-lib/aws-rds";
import { IBucket } from "aws-cdk-lib/aws-s3";
import { Provider } from "aws-cdk-lib/custom-resources";
import { Construct } from "constructs";
import path from "path";
import BaseNestedStackProps from "../types/BaseNestedStackProps";

interface LambdaStackProps extends BaseNestedStackProps {
  assetsBucket: IBucket;
  ssmPrivateKeyParameterName: string;
  dbSecretName: string;
  dbCluster: IServerlessCluster;
  vpc: IVpc;
  lambdaSecurityGroup: ISecurityGroup;
  dbSecretAccessPolicy: PolicyStatement;
  ssmGetParameterPolicy: PolicyStatement;
  secretKey: string;
}

export class LambdaStack extends NestedStack {

  private readonly linkToPrivateKey: string;
  private readonly register: IFunction;
  private readonly authorizer: IFunction;
  private readonly props: LambdaStackProps;
  private readonly login: IFunction;
  private readonly createPost: IFunction;
  private readonly deletePost: IFunction;
  private readonly getAllPosts: IFunction;
  private readonly getPost: IFunction;

  public getLinkToPrivateKey() {
    return this.linkToPrivateKey;
  }

  public getRegister() {
    return this.register;
  }

  public getAuthorizer() {
    return this.authorizer;
  }

  public getLogin() {
    return this.login;
  }

  public getCreatePost() {
    return this.createPost;
  }

  public getDeletePost() {
    return this.deletePost;
  }

  public getGetAllPosts() {
    return this.getAllPosts;
  }

  public getGetPost() {
    return this.getPost;
  }

  private generateCommonLambdaProps(lambdaFunctionName: string, lambdaNeedsToConnectToRds: boolean = false): NodejsFunctionProps {
    const {
      appName,
      envName,
      vpc,
      lambdaSecurityGroup
    } = this.props;


    let options: NodejsFunctionProps = {
      functionName: `${envName}-${appName}-${lambdaFunctionName}`,
      entry: path.join(__dirname, `../../resources/functions/${lambdaFunctionName}/app.ts`),
      handler: "lambdaHandler",
      architecture: Architecture.X86_64,
      runtime: Runtime.NODEJS_16_X,
      timeout: Duration.seconds(10),
      memorySize: 512,
      bundling: {
        externalModules: [
          "aws-sdk"
        ],
        nodeModules: [
          "knex",
          "pg"
        ],
        minify: true,
        sourceMap: true
      },
    };

    if (lambdaNeedsToConnectToRds) {
      options = {
        ...options,
        vpc,
        vpcSubnets: {
          subnetGroupName: `${envName}-${appName}-private-lambda-subnet`
        },
        securityGroups: [
          lambdaSecurityGroup
        ]
      };
    }

    return options;
  }

  constructor(scope: Construct, id: string, props: LambdaStackProps) {
    super(scope, id, props);
    this.props = props;

    const getLinkForPrivateKey = new NodejsFunction(this, "get-link-for-private-key", {
      ...this.generateCommonLambdaProps("get-link-for-private-key"),
      environment: {
        NODE_OPTIONS: "--enable-source-maps",
        PARAMETER_NAME: props.ssmPrivateKeyParameterName,
        BUCKET_NAME: props.assetsBucket.bucketName,
        URL_SHORTENER_SERVICE_BASE_URL: process.env.URL_SHORTENER_SERVICE_BASE_URL!
      },
    });

    props.assetsBucket.grantReadWrite(getLinkForPrivateKey);

    getLinkForPrivateKey.addToRolePolicy(props.ssmGetParameterPolicy);

    const customResourceProvider = new Provider(this, "custom-resource-provider", {
      onEventHandler: getLinkForPrivateKey
    });

    const customResourceForLinkToPrivateKey = new CustomResource(this, "custom-resource-for-private-key", {
      serviceToken: customResourceProvider.serviceToken
    });

    this.linkToPrivateKey = customResourceForLinkToPrivateKey.getAttString("url");

    this.register = new NodejsFunction(this, "register", {
      ...this.generateCommonLambdaProps("register", true),
      environment: {
        NODE_OPTIONS: "--enable-source-maps",
        DB_SECRET_ID: props.dbSecretName
      }
    });

    props.dbCluster.grantDataApiAccess(this.register);
    this.register.addToRolePolicy(props.dbSecretAccessPolicy);

    this.authorizer = new NodejsFunction(this, "authorizer", {
      ...this.generateCommonLambdaProps("authorizer"),
      environment: {
        NODE_OPTIONS: "--enable-source-maps",
        SECRET_KEY: props.secretKey
      },
    });

    this.login = new NodejsFunction(this, "login", {
      ...this.generateCommonLambdaProps("login", true),
      environment: {
        NODE_OPTIONS: "--enable-source-maps",
        SECRET_KEY: props.secretKey,
        DB_SECRET_ID: props.dbSecretName
      }
    });

    props.dbCluster.grantDataApiAccess(this.login);
    this.login.addToRolePolicy(props.dbSecretAccessPolicy);


    this.createPost = new NodejsFunction(this, "create-post", {
      ...this.generateCommonLambdaProps("create-post", true),
      environment: {
        NODE_OPTIONS: "--enable-source-maps",
        DB_SECRET_ID: props.dbSecretName
      }
    });

    props.dbCluster.grantDataApiAccess(this.createPost);
    this.createPost.addToRolePolicy(props.dbSecretAccessPolicy);
    
    this.deletePost = new NodejsFunction(this, "delete-post", {
      ...this.generateCommonLambdaProps("delete-post", true),
      environment: {
        NODE_OPTIONS: "--enable-source-maps",
        DB_SECRET_ID: props.dbSecretName
      }
    });

    props.dbCluster.grantDataApiAccess(this.deletePost);
    this.deletePost.addToRolePolicy(props.dbSecretAccessPolicy);
    
    this.getAllPosts = new NodejsFunction(this, "get-all-posts", {
      ...this.generateCommonLambdaProps("get-all-posts", true),
      environment: {
        NODE_OPTIONS: "--enable-source-maps",
        DB_SECRET_ID: props.dbSecretName
      }
    });

    props.dbCluster.grantDataApiAccess(this.getAllPosts);
    this.getAllPosts.addToRolePolicy(props.dbSecretAccessPolicy);
    
    this.getPost = new NodejsFunction(this, "get-post", {
      ...this.generateCommonLambdaProps("get-post", true),
      environment: {
        NODE_OPTIONS: "--enable-source-maps",
        DB_SECRET_ID: props.dbSecretName
      }
    });

    props.dbCluster.grantDataApiAccess(this.getPost);
    this.getPost.addToRolePolicy(props.dbSecretAccessPolicy);
  }
}
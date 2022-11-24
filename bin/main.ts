#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from 'aws-cdk-lib';
import { MainStack } from '../lib/main-stack';


const app = new cdk.App();
new MainStack(app, 'MainStack', {
  stackName: `${process.env.ENVIRONMENT_NAME}-${process.env.CDK_APP_NAME}`,
  env: {
    account: process.env.AWS_ACCOUNT_ID,
    region: process.env.AWS_REGION 
  }
});
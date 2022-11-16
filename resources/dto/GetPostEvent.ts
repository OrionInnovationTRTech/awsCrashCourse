import { APIGatewayProxyEvent } from "aws-lambda";
import * as yup from "yup";

export interface GetPostEvent extends APIGatewayProxyEvent {
  pathParameters: {
    id: string;
  }
}

export const validationSchema = yup.object({
  pathParameters: yup.object({
    id: yup.string()
      .required()
  }).required()
});
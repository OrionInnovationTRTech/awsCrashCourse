import middy from "@middy/core";
import httpErrorHandler from "@middy/http-error-handler";
import { APIGatewayProxyEvent, APIGatewayProxyStructuredResultV2 } from "aws-lambda";
import { Knex } from "knex";
import container from "../../config/inversify.config";
import { TYPES } from "../../config/types";
import validator from "../../middlewares/validator";
import * as yup from "yup";
import ResponseUtils from "../../utils/ResponseUtils";

interface GetUserByIdEvent extends APIGatewayProxyEvent {
  pathParameters: {
    user_id: string;
  }
}

const validationSchema = yup.object({
  pathParameters: yup.object({
    user_id: yup.string()
      .required()
  })
    .required()
});

const handler = async (event: GetUserByIdEvent): Promise<APIGatewayProxyStructuredResultV2> => {

  const responseUtils = container.get<ResponseUtils>(TYPES.ResponseUtils);

  const {
    pathParameters: {
      user_id
    }
  } = event;

  const connection = await container.getAsync<Knex>(TYPES.Knex);

  const user = await connection.select("*")
    .from("users")
    .where({ id: user_id })
    .first();

  if (!user) {
    return responseUtils.notFound();
  }

  return responseUtils.success(user);
};

export const lambdaHandler = middy(handler)
  .use(httpErrorHandler())
  .use(validator(validationSchema));
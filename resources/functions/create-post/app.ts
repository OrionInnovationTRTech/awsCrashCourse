import "reflect-metadata";
import middy from "@middy/core";
import httpErrorHandler from "@middy/http-error-handler";
import jsonBodyParser from "@middy/http-json-body-parser";
import { APIGatewayProxyEvent, APIGatewayProxyStructuredResultV2 } from "aws-lambda";
import container from "../../config/inversify.config";
import { TYPES } from "../../config/types";
import { CreatePostEvent, validationSchema } from "../../dto/CreatePostEvent";
import validator from "../../middlewares/validator";
import IPostRepository from "../../repository/IPostRepository";
import ResponseUtils from "../../utils/ResponseUtils";
import RequestUtils from "../../utils/RequestUtils";

const handler = async (event: CreatePostEvent): Promise<APIGatewayProxyStructuredResultV2> => {
  const requestUtils = container.get<RequestUtils>(TYPES.RequestUtils);
  const responseUtils = container.get<ResponseUtils>(TYPES.ResponseUtils);

  const {
    body: {
      body,
      title
    },
    pathParameters: {
      user_id
    }
  } = event;

  const decodedJwt = requestUtils.decodeJwt(event);

  if (decodedJwt.user_id != user_id) {
    return responseUtils.unauthorized();
  }

  const postRepository = await container.getAsync<IPostRepository>(TYPES.PostRepository);

  const savedPost = await postRepository.createPost({
    user_id,
    body,
    title
  });

  return responseUtils.success(savedPost);
};

export const lambdaHandler = middy(handler)
  .use(httpErrorHandler())
  .use(jsonBodyParser())
  .use(validator(validationSchema));

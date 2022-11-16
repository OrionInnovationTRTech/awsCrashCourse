import "reflect-metadata";
import middy from "@middy/core";
import httpErrorHandler from "@middy/http-error-handler";
import jsonBodyParser from "@middy/http-json-body-parser";
import {
  APIGatewayProxyStructuredResultV2
} from "aws-lambda";
import container from "../../config/inversify.config";
import { TYPES } from "../../config/types";
import {
  GetPostEvent
} from "../../dto/GetPostEvent";
import IPostRepository from "../../repository/IPostRepository";
import ResponseUtils from "../../utils/ResponseUtils";

const handler = async (event: GetPostEvent): Promise<APIGatewayProxyStructuredResultV2> => {
  const responseUtils = container.get<ResponseUtils>(TYPES.ResponseUtils);

  const {
    pathParameters: {
      post_id
    }
  } = event;
  const postRepository = await container.getAsync<IPostRepository>(TYPES.PostRepository);
  const existingPost = await postRepository.getPostById(post_id);

  if (!existingPost) {
    return responseUtils.notFound();
  }

  return responseUtils.success(existingPost);
};

export const lambdaHandler = middy(handler)
  .use(httpErrorHandler())
  .use(jsonBodyParser());

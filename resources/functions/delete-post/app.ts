import "reflect-metadata";
import middy from "@middy/core";
import httpErrorHandler from "@middy/http-error-handler";
import {
  APIGatewayProxyStructuredResultV2
} from "aws-lambda";
import container from "../../config/inversify.config";
import { TYPES } from "../../config/types";
import {
  DeletePostEvent,
  validationSchema
} from "../../dto/DeletePostEvent";
import validator from "../../middlewares/validator";
import IPostRepository from "../../repository/IPostRepository";
import RequestUtils from "../../utils/RequestUtils";
import ResponseUtils from "../../utils/ResponseUtils";

const handler = async (event: DeletePostEvent): Promise<APIGatewayProxyStructuredResultV2> => {
  const requestUtils = container.get<RequestUtils>(TYPES.RequestUtils);
  const responseUtils = container.get<ResponseUtils>(TYPES.ResponseUtils);

  const {
    pathParameters: {
      user_id,
      post_id
    }
  } = event;

  const decodedJwt = requestUtils.decodeJwt(event);

  if (decodedJwt.user_id != user_id) {
    return responseUtils.unauthorized();
  }

  const postRepository = await container.getAsync<IPostRepository>(TYPES.PostRepository);
  const post = await postRepository.getPostById(post_id);

  if (!post) {
    return responseUtils.notFound();
  }

  if (decodedJwt.user_id != post.user_id) {
    return responseUtils.unauthorized();
  }

  await postRepository.deletePostById(post_id);

  return responseUtils.success();
};

export const lambdaHandler = middy(handler)
  .use(httpErrorHandler())
  .use(validator(validationSchema));

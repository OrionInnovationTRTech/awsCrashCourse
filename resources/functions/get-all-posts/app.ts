import { APIGatewayProxyStructuredResultV2 } from "aws-lambda";
import container from "../../config/inversify.config";
import { TYPES } from "../../config/types";
import IPostRepository from "../../repository/IPostRepository";
import ResponseUtils from "../../utils/ResponseUtils";

export const lambdaHandler = async (): Promise<APIGatewayProxyStructuredResultV2> => {
  const responseUtils = container.get<ResponseUtils>(TYPES.ResponseUtils);
  const postRepository = await container.getAsync<IPostRepository>(TYPES.PostRepository);
  const posts = await postRepository.getAllPosts();

  return responseUtils.success(posts);
};
import { PostInput } from "../dto/CreatePostEvent";
import Post from "../dto/Post";

export default interface IPostRepository {

  createPost(post: PostInput): Promise<Post>;
  getPostById(id: string | number): Promise<Post>;
  updatePost(post: Post): Promise<Post>;
  deletePostById(id: string | number): Promise<void>;
  getAllPosts(): Promise<Post[]>;
}
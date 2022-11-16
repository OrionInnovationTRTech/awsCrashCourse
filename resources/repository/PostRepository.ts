import { inject, injectable } from "inversify";
import { Knex } from "knex";
import { TYPES } from "../config/types";
import { PostInput } from "../dto/CreatePostEvent";
import Post from "../dto/Post";
import IPostRepository from "./IPostRepository";

@injectable()
export default class PostRepository implements IPostRepository {

  private knex: Knex;

  constructor(
    @inject(TYPES.Knex) knex: Knex
  ) {
    this.knex = knex;
  }

  public async createPost(post: PostInput): Promise<Post> {
    const [ savedPost ] = await this.knex.insert(post)
      .into("posts")
      .returning("*");

    return savedPost;
  }
  
  public async getPostById(id: string | number): Promise<Post> {
    return this.knex.select("*")
      .from("posts")
      .where({ id })
      .first();
  }

  public async updatePost(post: Post): Promise<Post> {
    const [ updatedPost ] = await this.knex("posts")
      .update(post)
      .where({ id: post.id })
      .returning("*");
    
    return updatedPost;
  }

  public async deletePostById(id: string | number): Promise<void> {
    await this.knex("posts")
      .delete()
      .where({ id });
  }

  public async getAllPosts(): Promise<Post[]> {
    return this.knex.select("*")
      .from("posts");
  }
}
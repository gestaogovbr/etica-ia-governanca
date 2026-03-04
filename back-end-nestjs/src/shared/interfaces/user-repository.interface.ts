export interface IUserRepository {
  findById(id: string): Promise<any>;
  findByEmail(email: string): Promise<any>;
  create(userData: any): Promise<any>;
  update(id: string, updateData: any): Promise<any>;
  delete(id: string): Promise<void>;
}
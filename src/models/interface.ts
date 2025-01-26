import mongoose, { Document } from 'mongoose';

export interface IUser extends Document {
    username: string;
    password: string;
    email: string;
}

export interface IProduct extends Document {
    productName: string;
    price: number;
}

export interface IPost extends Document {
    title: string;
    content: string;
    tags: string[];
    category: string;
    user: mongoose.Schema.Types.ObjectId;
    viewCount: number;
    likeCount: number;
}
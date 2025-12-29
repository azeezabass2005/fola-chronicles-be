import mongoose, {Document, Schema} from 'mongoose';
import {
    USER_STATUS,
    PUBLICATION_STATUS
} from "../common/constant";

export type UserStatus = (typeof USER_STATUS)[keyof typeof USER_STATUS];

export type PublicationStatus = (typeof PUBLICATION_STATUS)[keyof typeof PUBLICATION_STATUS];

export interface IUser extends Document {
    username: string;
    password: string;
    email: string;
    isVerified: boolean;
    role: number;
    status: UserStatus;
    lastLogin: string;
}

export interface IRefreshToken extends Document {
    userId: Schema.Types.ObjectId;
    token: string;
    expiresAt: Date;
    isRevoked: boolean;
    userAgent?: string;
    ipAddress?: string;
}

export interface IPost extends Document {
    title: string;
    content: string;
    tags: mongoose.Schema.Types.ObjectId[] | string[];
    category: mongoose.Schema.Types.ObjectId | string;
    slug: string;
    user: mongoose.Schema.Types.ObjectId;
    viewCount?: number;
    likeCount?: number;
    publicationStatus: PublicationStatus;
    // New Fields
    dislikeCount?: number;
    bookmarkCount?: number;
    commentCount?: number;
    readingTime?: number;
}

// Note: This is the same interface for tags or categories
export interface ITag extends Document {
    title: string;
}
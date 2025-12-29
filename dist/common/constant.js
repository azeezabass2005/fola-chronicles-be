"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PUBLICATION_STATUS = exports.USER_STATUS = exports.ROLE_MAP = exports.MODEL_NAME = void 0;
exports.MODEL_NAME = {
    USER: "User",
    POST: "Post",
    REFRESH_TOKEN: "RefreshToken",
    TAG: "Tag",
    CATEGORY: "Category"
};
exports.ROLE_MAP = {
    USER: 6483,
    ADMIN: 7832,
};
exports.USER_STATUS = {
    ACTIVE: "active",
    INACTIVE: "inactive",
    PENDING: "pending"
};
exports.PUBLICATION_STATUS = {
    DRAFT: "draft",
    PUBLISHED: "published",
    ARCHIVED: "archived",
    DELETED: "deleted"
};

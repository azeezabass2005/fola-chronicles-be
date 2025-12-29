/**
 * Service class for Tag-related database operations
 *
 * @description Extends the generic DBService with Tag-specific configurations
 * @extends {DBService<ITag>}
 */
import DBService from "../utils/db.utils";
import {ITag} from "../models/interface";
import Tag from "../models/tag.model";

class TagService extends DBService<ITag> {
    /**
     * Creates an instance of TagService
     *
     * @constructor
     */
    constructor() {
        // Initialize the service with the Tag model
        super(Tag, [])
    }

    async findOrCreateTags(titles: string[]) {
        const normalized = [...new Set(
            titles.map(t => t.trim().toLowerCase())
        )];

        if (normalized.length === 0) return [];
        await Tag.bulkWrite(
            normalized.map(title => ({
                updateOne: {
                    filter: { title },
                    update: { $setOnInsert: { title } },
                    upsert: true
                }
            }))
        );

        return Tag.find({ title: { $in: normalized } });
    }
}

export default TagService;
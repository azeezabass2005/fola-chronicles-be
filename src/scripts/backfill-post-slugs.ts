import PostService from "../services/post.service";

function createSlug(text: string): string {
    return text
        .toLowerCase()
        .trim()
        .normalize("NFKD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/[^a-z0-9\s-]/g, "")
        .replace(/\s+/g, "-")
        .replace(/-+/g, "-");
}

export async function backfillSlugs() {
    const postService = new PostService();
    const posts = await postService.find({ slug: { $exists: false } });

    for (const post of posts) {
        const baseSlug = createSlug(post.title);
        let slug = baseSlug;
        let counter = 1;

        // while (await postService.exists({ slug })) {
        //     slug = `${baseSlug}-${counter}`;
        //     counter++;
        // }

        post.slug = slug;
        await post.save();

        console.log(`✔ ${post._id} → ${slug}`);
    }

    console.log("🎉 Slug backfill complete");
    process.exit(0);
}

backfillSlugs().catch(err => {
    console.error(err);
    process.exit(1);
});

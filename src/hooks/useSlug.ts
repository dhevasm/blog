import { PrismaClient } from "../../generated/prisma";
const prisma = new PrismaClient();

export async function generatePostSlug(title: string): Promise<string> {
    const baseSlug = title.toLowerCase().replace(/ /g, '-').replace(/[^\w-]+/g, '');
    let slug = baseSlug;
    let counter = 2;

    while (await prisma.posts.findUnique({ where: { slug } })) {
        slug = `${baseSlug}-${counter}`;
        counter++;
    }

    return slug;
}

export function generateTagSlug(name: string): string {
    const slug = name.toLowerCase().replace(/ /g, '-').replace(/[^\w-]+/g, '');
    return slug;
}
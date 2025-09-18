import { NextResponse, NextRequest } from "next/server";
import { PrismaClient } from "../../../../generated/prisma";
import fs from "fs";
import path from "path";
import { generatePostSlug } from "@/hooks/useSlug";

const prisma = new PrismaClient();

interface postsData {
    title: string;
    content: string;
    slug: string;
    authorId: string;
    isPublished: boolean;
    thumbnail?: string;
}

export async function GET(){
    try{
        const posts = await prisma.posts.findMany({
            include: { tags: {
                select: { id: true, updatedAt: true, tag: { select: { name: true, slug: true } } }
            },
                 author: {
                    select: {
                        name: true,
                        email: true,
                        avatar: true,
                        createdAt: true
                    }
                }
            }
        });
        return NextResponse.json({status:"success", data: posts, message: 'Posts fetched successfully'}, {status: 200});       
    }catch(error){
        console.log(error);
        return NextResponse.json({ status:"error", message: error}, {status: 500});
    }
}

export async function POST(request: NextRequest){
    try{
        const data = await request.formData();
        const title = data.get('title')?.toString();
        const content = data.get('content')?.toString();
        const slug = await generatePostSlug(title as string);
        const authorId = data.get('authorId')?.toString();
        const isPublished = data.get('isPublished') == 'true';
        const tagsIds = data.getAll('tagsIds') as string[];
        const thumbnail = data.get('thumbnail') as File | null;

        const checkUser = await prisma.users.findUnique({where: {id: authorId}});
        if(!title) return NextResponse.json({status:"error", message: 'Title is required'}, {status: 400});
        if(!content) return NextResponse.json({status:"error", message: 'Content is required'}, {status: 400});
        if(!checkUser) return NextResponse.json({status:"error", message: 'Author not found'}, {status: 404});
        if(!authorId) return NextResponse.json({status:"error", message: 'Author ID is required'}, {status: 400});

        let thumbnailUrl: string | undefined = undefined;
        if (thumbnail) {
            const publicDir = path.join(process.cwd(), 'public', 'uploads', 'thumbnail');
            await fs.promises.mkdir(publicDir, { recursive: true });

            const ext = thumbnail.name.split('.').pop();
            const filename = `${slug}.${ext}`; 
            const filepath = path.join(publicDir, filename);
            
            await fs.promises.writeFile(filepath, Buffer.from(await thumbnail.arrayBuffer()));
            thumbnailUrl = `/uploads/thumbnail/${filename}`;
        }

        const postData: postsData = {
            title,
            content,
            slug,
            authorId,
            isPublished,
        };

        if (thumbnailUrl) {
            postData.thumbnail = thumbnailUrl;
        }

        const post = await prisma.posts.create({ data: postData });
        if(!post) return NextResponse.json({status:"error", message: 'Error creating post'}, {status: 500});

        if(tagsIds.length > 0){
            const existingTags = await prisma.tags.findMany({ where: { id: { in: tagsIds } } });
            if(tagsIds.length !== existingTags.length) return NextResponse.json({status:"error", message: 'Some tags not found'}, {status: 404});
            existingTags.forEach(async (tag) => {
                await prisma.post_has_tags.create({ data: { postId: post.id, tagId: tag.id } });
            });
        } 

        return NextResponse.json({ status: "success", data: post, message: 'Post created successfully' }, { status: 201 });
    }catch(error){
        console.log(error);
        return NextResponse.json({ status:"error", message: "Internal server error"}, {status: 500});
    }
}
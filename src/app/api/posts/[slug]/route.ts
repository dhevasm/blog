import { NextResponse, NextRequest } from "next/server";
import { PrismaClient } from "../../../../../generated/prisma";

import { generatePostSlug } from "@/hooks/useSlug";

const prisma = new PrismaClient();
type RouteParams = {
    params: { slug: string }
};

export async function GET(request: NextRequest, { params }: RouteParams){
    try{
        const { slug } = params;
        const post = await prisma.posts.findUnique({
            where: { slug },
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
        if(!post) return NextResponse.json({status:"error", message: 'Post not found'}, {status: 404}); 
        return NextResponse.json({status:"success", data: post, message: 'Post fetched successfully'}, {status: 200});       
    }catch(error){
        console.log(error);
        return NextResponse.json({ status:"error", message: error}, {status: 500});
    }
}

export async function DELETE(request: NextRequest, { params }: RouteParams){
    try{
        const { slug } = params;
        const post = await prisma.posts.delete({ where: { id : slug } });
        if(!post) return NextResponse.json({status:"error", message: 'Post not found'}, {status: 404}); 
        return NextResponse.json({status:"success", data: post, message: 'Post deleted successfully'}, {status: 200});
    }catch(error){
        console.log(error);
        return NextResponse.json({status: "error", message: "Internal server error"}, {status: 500});
    }
}

export async function PUT(request: NextRequest, { params }: RouteParams){
    try{
        const { slug } = params;
        const data = await request.formData();
        const title = data.get('title')?.toString();
        const content = data.get('content')?.toString();
        const newSlug = await generatePostSlug(title as string);
        const authorId = data.get('authorId')?.toString();
        const isPublished = data.get('isPublished') == 'true';

        const existingPost = await prisma.posts.findUnique({ where: { id : slug } });
        if(!existingPost) return NextResponse.json({status:"error", message: 'Post not found'}, {status: 404}); 
        if(!title) return NextResponse.json({status:"error", message: 'Title is required'}, {status: 400});
        if(!content) return NextResponse.json({status:"error", message: 'Content is required'}, {status: 400});
        if(!authorId) return NextResponse.json({status:"error", message: 'Author ID is required'}, {status: 400});
        const checkUser = await prisma.users.findUnique({where: {id: authorId}});
        if(!checkUser) return NextResponse.json({status:"error", message: 'Author not found'}, {status: 404});

        const post = await prisma.posts.update({ where: { id : slug }, data: { title, content,  slug: newSlug, authorId, isPublished } });
        if(!post) return NextResponse.json({status:"error", message: 'Error updating post'}, {status: 500});
        return NextResponse.json({status:"success", data: post, message: 'Post updated successfully'}, {status: 200});
    }catch(error){
        console.log(error);
        return NextResponse.json({status: "error", message: "Internal server error"}, {status: 500});
    }
}

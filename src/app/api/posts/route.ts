import { NextResponse, NextRequest } from "next/server";
import { PrismaClient } from "../../../../generated/prisma";
import { Jwt } from "jsonwebtoken";

const prisma = new PrismaClient();

export async function GET(request: NextRequest){
    try{
        const posts = await prisma.posts.findMany();
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
        if(!title) return NextResponse.json({status:"error", message: 'Title is required'}, {status: 400});
        const content = data.get('content')?.toString();
        if(!content) return NextResponse.json({status:"error", message: 'Content is required'}, {status: 400});
        const authorId = data.get('authorId')?.toString();
        const checkUser = await prisma.users.findUnique({where: {id: authorId}});
        if(!checkUser) return NextResponse.json({status:"error", message: 'Author not found'}, {status: 404});
        if(!authorId) return NextResponse.json({status:"error", message: 'Author ID is required'}, {status: 400});
    }catch(error){
        console.log(error);
        return NextResponse.json({ status:"error", message: "Internal server error"}, {status: 500});
    }
}
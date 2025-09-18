import { NextResponse, NextRequest } from "next/server";
import { PrismaClient } from "../../../../generated/prisma";
import { generateTagSlug } from "@/hooks/useSlug";

const prisma = new PrismaClient();

export async function GET(){
    try{
        const tags = await prisma.tags.findMany();
        return NextResponse.json({status:"success", data: tags, message: 'Tags fetched successfully'}, {status: 200});       
    }catch(error){
        console.log(error);
        return NextResponse.json({ status:"error", message: error}, {status: 500});
    }
}

export async function POST(request: NextRequest){
    try{
        const data = await request.formData();
        const name = data.get('name')?.toString();
        const createdBy = data.get('createdBy')?.toString();
        if(!name) return NextResponse.json({status:"error", message: 'Name is required'}, {status: 400});
        const existingTag = await prisma.tags.findUnique({where: {name}});
        if(existingTag) return NextResponse.json({status:"error", message: 'Tag already exists'}, {status: 400});
        if(!createdBy) return NextResponse.json({status:"error", message: 'CreatedBy is required'}, {status: 400});
        const user = await prisma.users.findUnique({where: {id: createdBy}});
        if(!user) return NextResponse.json({status:"error", message: 'User not found'}, {status: 404});
        const slug = await generateTagSlug(name as string);
        const tag = await prisma.tags.create({data: {name, slug, createdBy: {connect: {id: createdBy}}}});
        if(!tag) return NextResponse.json({status:"error", message: 'Error creating tag'}, {status: 500});
        return NextResponse.json({status:"success", data: tag, message: 'Tag created successfully'}, {status: 201});
    }catch(error){
        console.log(error);
        return NextResponse.json({ status:"error", message: error}, {status: 500});
    }
}
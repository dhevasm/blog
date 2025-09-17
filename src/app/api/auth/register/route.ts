import { NextResponse, NextRequest } from "next/server";
import { PrismaClient } from "../../../../../generated/prisma";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

export async function POST(request: NextRequest){
    try{
        const data = await request.formData();
        const name = data.get('name')?.toString();
        if(!name) return NextResponse.json({status:"error", message: 'Name is required'}, {status: 400});
        const email = data.get('email')?.toString();
        const checkEmail = await prisma.users.findUnique({where: {email}});
        if(checkEmail) return NextResponse.json({status:"error", message: 'Email already exists'}, {status: 400});
        if(!email) return NextResponse.json({status:"error", message: 'Email is required'}, {status: 400});
        const password = data.get('password')?.toString();
        if(!password) return NextResponse.json({status:"error", message: 'Password is required'}, {status: 400});

        const hashedPassword = await bcrypt.hash(password, 10);

        const user = await prisma.users.create({
            data: {
                name,
                email,
                password: hashedPassword
            }
        });

        if(!user) return NextResponse.json({status:"error", message: 'Error creating user'}, {status: 500});

        return NextResponse.json({status:"success", data: user, message: 'User created successfully'}, {status: 201});

    }catch(error){
        console.log(error);
        return NextResponse.json({ status:"error", message: "Internal server error"}, {status: 500});
    }

}
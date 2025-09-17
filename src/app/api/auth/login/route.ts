import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "../../../../../generated/prisma";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

const prisma = new PrismaClient();

export async function POST(request: NextRequest){
 try{
    const data = await request.formData();
    const email = data.get('email')?.toString();
    if(!email) return NextResponse.json({status:"error", message: 'Email is required'}, {status: 400});
    const password = data.get('password')?.toString();
    if(!password) return NextResponse.json({status:"error", message: 'Password is required'}, {status: 400});

    const user = await prisma.users.findUnique({ where: { email } });
    if (!user) return NextResponse.json({ status: "error", message: 'User not found' }, { status: 404 });

    const isValid = await bcrypt.compare(password, user.password);
    if (!isValid) return NextResponse.json({ status: "error", message: 'Invalid password' }, { status: 401 });

    const token = jwt.sign({ id: user.id }, process.env.JWT_SECRET as string, { expiresIn: '1h' });
    return NextResponse.json({ status: "success", token: token, message: 'Login successful' }, { status: 200 });

 }catch(error){
    console.log(error);
    return NextResponse.json({ status:"error", message: "Internal server error"}, {status: 500});
 }  
}
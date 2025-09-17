import { NextResponse, NextRequest } from "next/server";

export default async function POST(request: NextRequest){
    try{
        const data = await request.formData();
        const name = data.get('name')?.toString();
        if(!name) return NextResponse.json({message: 'Name is required'}, {status: 400});
        const email = data.get('email')?.toString();
        if(!email) return NextResponse.json({message: 'Email is required'}, {status: 400});
        const password = data.get('password')?.toString();
        if(!password) return NextResponse.json({message: 'Password is required'}, {status: 400});
    }catch(error){
        return NextResponse.json({message: 'error: '+error}, {status: 500});
    }

}
import { NextRequest,NextResponse } from "next/server";
export const runtime="nodejs";
export const maxDuration=60;
function privateHost(host:string){return /^(localhost|127\.|10\.|192\.168\.|172\.(1[6-9]|2\\d|3[01])\\.|169\.254\.)/i.test(host)||host.endsWith(".local")}
export async function GET(req:NextRequest){
 const raw=req.nextUrl.searchParams.get("url");if(!raw)return NextResponse.json({error:"URL wajib diisi."},{status:400});
 let u:URL;try{u=new URL(raw)}catch{return NextResponse.json({error:"URL tidak valid."},{status:400})}
 if(!["http:","https:"].includes(u.protocol)||privateHost(u.hostname))return NextResponse.json({error:"Host tidak diizinkan."},{status:400});
 try{
  const upstream=await fetch(u,{redirect:"error",signal:AbortSignal.timeout(20000),headers:{"User-Agent":"UniversalDownloader/1.0"}});
  if(!upstream.ok)return NextResponse.json({error:"Sumber menolak permintaan."},{status:502});
  const type=upstream.headers.get("content-type")||"application/octet-stream";
  const size=Number(upstream.headers.get("content-length")||0);
  if(type.includes("text/html")||type.includes("application/json"))return NextResponse.json({error:"URL bukan file media langsung."},{status:400});
  if(size>50*1024*1024)return NextResponse.json({error:"File melebihi batas 50 MB."},{status:413});
  if(!upstream.body)return NextResponse.json({error:"Tidak ada isi file."},{status:502});
  return new NextResponse(upstream.body,{headers:{"Content-Type":type,"Content-Disposition":"attachment; filename*=UTF-8''download","Cache-Control":"no-store","X-Content-Type-Options":"nosniff"}});
 }catch{return NextResponse.json({error:"Gagal mengambil file. Redirect atau host sumber mungkin tidak didukung."},{status:502})}
}
import { NextRequest, NextResponse } from "next/server";
export const runtime = "nodejs";
const known:[RegExp,string][]=[
 [/music\.youtube\.com/i,"YouTube Music"],[/youtube\.com|youtu\.be/i,"YouTube"],
 [/tiktok\.com/i,"TikTok"],[/instagram\.com/i,"Instagram"],
 [/facebook\.com|fb\.watch/i,"Facebook"],[/twitter\.com|x\.com/i,"X / Twitter"],
 [/drive\.google\.com/i,"Google Drive"]
];
function platform(url:string){return known.find(([r])=>r.test(url))?.[1]||"Website / Direct URL"}
function blockedHost(host:string){return /^(localhost|127\.|10\.|192\.168\.|172\.(1[6-9]|2\\d|3[01])\\.|169\.254\.)/i.test(host)||host.endsWith(".local")}
export async function GET(req:NextRequest){
 const raw=req.nextUrl.searchParams.get("url");if(!raw)return NextResponse.json({error:"Parameter URL wajib diisi."},{status:400});
 let u:URL;try{u=new URL(raw)}catch{return NextResponse.json({error:"URL tidak valid."},{status:400})}
 if(!["http:","https:"].includes(u.protocol)||blockedHost(u.hostname))return NextResponse.json({error:"URL atau host tidak diizinkan."},{status:400});
 const p=platform(u.toString());
 // Known streaming/social platforms are not treated as direct downloadable media.
 if(p!=="Website / Direct URL"&&p!=="Google Drive")return NextResponse.json({url:u.toString(),platform:p,kind:"platform",filename:"Konten platform",contentType:"Tidak diketahui",size:null,downloadable:false,message:"Platform ini memerlukan API resmi atau mekanisme ekspor yang diizinkan. Aplikasi tidak melewati pembatasan platform."});
 try{
  const response=await fetch(u,{method:"HEAD",redirect:"manual",signal:AbortSignal.timeout(8000),headers:{"User-Agent":"UniversalDownloader/1.0"}});
  const type=response.headers.get("content-type")||"application/octet-stream";
  const len=Number(response.headers.get("content-length")||0);
  const disposition=response.headers.get("content-disposition")||"";
  const match=disposition.match(/filename\\*?=(?:UTF-8''|")?([^";]+)/i);
  const fallback=decodeURIComponent(u.pathname.split("/").pop()||"download").replace(/[\\r\\n]/g,"");
  const filename=(match?.[1]||fallback).replace(/["']/g,"").slice(0,150);
  const downloadable=response.ok&&response.status<300&&!type.includes("text/html")&&!type.includes("application/json")&&(!len||len<=50*1024*1024);
  return NextResponse.json({url:u.toString(),platform:p,kind:"direct",filename,contentType:type,size:len||null,downloadable,message:downloadable?"File direct terdeteksi. Ukuran maksimum 50 MB.":"Sumber tidak memberikan file langsung yang dapat diunduh, atau melebihi batas 50 MB."});
 }catch{return NextResponse.json({url:u.toString(),platform:p,kind:"direct",filename:"File",contentType:"Tidak diketahui",size:null,downloadable:false,message:"Server sumber tidak merespons pemeriksaan HEAD. Coba direct URL lain."})}
}
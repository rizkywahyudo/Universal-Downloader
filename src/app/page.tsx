 "use client";
import { useEffect, useMemo, useState } from "react";
import { Download, Link2, ShieldCheck, Clock3, Trash2, Zap, Music2, Smartphone, Loader2 } from "lucide-react";

type Info = {url:string; platform:string; kind:string; filename:string; contentType:string; size:number|null; downloadable:boolean; message:string};
type HistoryItem = {url:string; filename:string; platform:string; at:number};
const HISTORY_KEY="ud_history_v1";
const hosts:[RegExp,string][]=[
 [/youtu\.be|youtube\.com/i,"YouTube"],[/music\.youtube\.com/i,"YouTube Music"],
 [/tiktok\.com/i,"TikTok"],[/instagram\.com/i,"Instagram"],
 [/facebook\.com|fb\.watch/i,"Facebook"],[/twitter\.com|x\.com/i,"X"],
 [/drive\.google\.com/i,"Google Drive"]
];
function platformOf(url:string){return hosts.find(([r])=>r.test(url))?.[1]||"Website / Direct URL";}
function niceSize(n:number|null){if(n===null)return "Tidak diketahui";const u=["B","KB","MB","GB"];let x=n,i=0;while(x>=1024&&i<u.length-1){x/=1024;i++}return `${x.toFixed(i?1:0)} ${u[i]}`}
function safeName(s:string){return s.replace(/[\\/:*?"<>|]/g,"_").slice(0,120)||"download";}
export default function Home(){
 const [url,setUrl]=useState(""); const [info,setInfo]=useState<Info|null>(null);
 const [loading,setLoading]=useState(false); const [error,setError]=useState("");
 const [history,setHistory]=useState<HistoryItem[]>([]);
 const [progress,setProgress]=useState(0); const [busy,setBusy]=useState(false);
 const [batch,setBatch]=useState("");
 useEffect(()=>{try{setHistory(JSON.parse(localStorage.getItem(HISTORY_KEY)||"[]"))}catch{}},[]);
 const platform=useMemo(()=>url.trim()?platformOf(url.trim()):"Menunggu URL", [url]);
 function saveHistory(item:HistoryItem){setHistory(old=>{const next=[item,...old.filter(x=>x.url!==item.url)].slice(0,30);localStorage.setItem(HISTORY_KEY,JSON.stringify(next));return next})}
 async function inspect(target=url){
  setError("");setInfo(null);setProgress(0);
  let parsed:URL;try{parsed=new URL(target.trim());if(!["http:","https:"].includes(parsed.protocol))throw Error()}catch{setError("Masukkan URL HTTP atau HTTPS yang valid.");return}
  setLoading(true);
  try{const r=await fetch(`/api/inspect?url=${encodeURIComponent(parsed.toString())}`);const data=await r.json();if(!r.ok)throw new Error(data.error||"URL tidak dapat diperiksa.");setInfo(data)}
  catch(e){setError(e instanceof Error?e.message:"Terjadi kesalahan.");}
  finally{setLoading(false)}
 }
 async function downloadOne(target:string, filename?:string){
  setError("");setBusy(true);setProgress(0);
  try{
   const r=await fetch(`/api/inspect?url=${encodeURIComponent(target)}`);const data:Info=await r.json();
   if(!r.ok||!data.downloadable)throw new Error(data.message||"Sumber ini bukan direct-download yang didukung.");
   const response=await fetch(`/api/proxy?url=${encodeURIComponent(target)}`);
   if(!response.ok)throw new Error("Transfer gagal. Server sumber mungkin memblokir akses lintas-origin atau unduhan.");
   const total=Number(response.headers.get("content-length")||0);
   const reader=response.body?.getReader(); if(!reader)throw new Error("Browser tidak mendukung streaming download.");
   const chunks:Uint8Array[]=[];let received=0;
   while(true){const {done,value}=await reader.read();if(done)break;if(value){chunks.push(value);received+=value.length;if(total)setProgress(Math.min(99,Math.round(received/total*100)));}}
   const blob=new Blob(chunks,{type:response.headers.get("content-type")||"application/octet-stream"});
   const a=document.createElement("a");const objectUrl=URL.createObjectURL(blob);a.href=objectUrl;a.download=safeName(filename||data.filename);document.body.appendChild(a);a.click();a.remove();URL.revokeObjectURL(objectUrl);setProgress(100);
   saveHistory({url:target,filename:filename||data.filename,platform:data.platform,at:Date.now()});
  }catch(e){setError(e instanceof Error?e.message:"Download gagal.");}
  finally{setBusy(false)}
 }
 async function runBatch(){
  const urls=batch.split(/\n|,/).map(x=>x.trim()).filter(Boolean).slice(0,5);
  if(!urls.length){setError("Masukkan minimal satu URL.");return}
  for(const u of urls){await downloadOne(u)}
 }
 function install(){const ev=(window as any).__pwaPrompt;if(ev){ev.prompt();}}
 useEffect(()=>{
  const handler=(e:Event)=>{e.preventDefault();(window as any).__pwaPrompt=e};
  window.addEventListener("beforeinstallprompt",handler);return()=>window.removeEventListener("beforeinstallprompt",handler);
 },[]);
 return <main className="shell">
  <header className="top"><div className="brand"><div className="logo"><Download size={23}/></div>Universal Downloader</div><button className="secondary" onClick={install}><Smartphone size={15} style={{verticalAlign:"middle",marginRight:6}}/>Install App</button></header>
  <section className="hero"><div className="eyebrow">Simple · Fast · Responsible</div><h1>One link. <span className="gradient">One download.</span></h1><p>Periksa dan unduh file langsung dari URL yang dapat diakses dan memang boleh Anda simpan.</p></section>
  <section className="panel">
   <div className="sectiontitle"><Link2 size={18} color="#7652b5"/> Paste link kamu</div>
   <div className="inputrow"><input className="urlinput" value={url} onChange={e=>setUrl(e.target.value)} onKeyDown={e=>e.key==="Enter"&&inspect()} placeholder="Tempel URL TikTok, YouTube, atau direct file URL..."/><button className="primary" disabled={loading||!url.trim()} onClick={()=>inspect()}>{loading?<Loader2 className="spin" size={17}/>:<Zap size={17}/>}Periksa URL</button></div>
   <div className="subtle">Platform terdeteksi: <b>{platform}</b></div>
   {error&&<div className="notice" role="alert">{error}</div>}
   {info&&<div className="result"><div className="resulthead"><b>{info.filename}</b><span className="status">{info.downloadable?"Direct file tersedia":"Akses terbatas"}</span></div><div className="meta">Platform: {info.platform}<br/>Tipe: {info.contentType}<br/>Ukuran: {niceSize(info.size)}<br/>{info.message}</div><div className="actions"><button className="primary" disabled={!info.downloadable||busy} onClick={()=>downloadOne(info.url)}><Download size={16}/>Download file</button><button className="secondary" onClick={()=>{navigator.clipboard.writeText(info.url)}}>Copy URL</button></div>{busy&&<><div className="progress"><div className="bar" style={{width:`${progress}%`}}/></div><div className="subtle">{progress?`${progress}%`:"Mengunduh..."}</div></>}</div>}
   <div className="notice"><ShieldCheck size={15} style={{verticalAlign:"middle",marginRight:6}}/>Gunakan hanya untuk file milik Anda, domain yang mengizinkan unduhan, atau konten yang Anda punya hak untuk simpan. Platform yang membatasi unduhan tidak akan dilewati.</div>
  </section>
  <div className="grid">
   <section className="panel"><h2 className="sectiontitle"><Zap size={18} color="#7652b5"/> Platform yang dikenali</h2><div className="platforms">{["TikTok","YouTube","YouTube Music","Instagram","Facebook","X / Twitter","Google Drive","Direct URL"].map(x=><span className="platform" key={x}>{x}</span>)}</div><p className="subtle">Deteksi nama platform bukan jaminan bahwa platform menyediakan akses download.</p></section>
   <section className="panel"><h2 className="sectiontitle"><Music2 size={18} color="#7652b5"/> Audio & kualitas</h2><p className="meta">Format dan kualitas mengikuti file sumber. MP3 hanya dapat diunduh jika URL memang menunjuk ke file audio MP3 yang dapat diakses. Konversi audio/video tidak dilakukan di Vercel.</p></section>
  </div>
  <div className="grid">
   <section className="panel"><h2 className="sectiontitle"><Download size={18} color="#7652b5"/> Batch download</h2><textarea className="urlinput" style={{width:"100%",minHeight:105,resize:"vertical"}} value={batch} onChange={e=>setBatch(e.target.value)} placeholder={"Satu URL per baris (maks. 5)\nhttps://example.com/file.pdf"}/><div className="actions"><button className="primary" onClick={runBatch} disabled={busy}>Mulai batch</button></div><p className="subtle">Maksimal 5 URL per batch. Setiap URL harus berupa direct file URL yang dapat diakses browser.</p></section>
   <section className="panel"><h2 className="sectiontitle"><Clock3 size={18} color="#7652b5"/> Riwayat download <button className="secondary" style={{marginLeft:"auto",padding:7}} onClick={()=>{setHistory([]);localStorage.removeItem(HISTORY_KEY)}}><Trash2 size={14}/></button></h2>{history.length===0?<p className="subtle">Belum ada riwayat.</p>:history.map((h,i)=><div className="historyitem" key={h.url+i}><div style={{minWidth:0}}><div style={{fontWeight:700}}>{h.filename}</div><div className="historyurl">{h.platform} · {new Date(h.at).toLocaleString("id-ID")}</div></div><button className="secondary" onClick={()=>{setUrl(h.url);inspect(h.url)}}>Buka</button></div>)}</section>
  </div>
  <footer className="footer">Universal Downloader · Lavender Premium · Riwayat tersimpan lokal di browser.</footer>
 </main>
}
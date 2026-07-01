import { createPageMetadata } from "@/lib/metadata";

export const metadata = createPageMetadata(
  "/crisis-support/",
  "Crisis support | Pathfinder Therapy"
);

export default function Page() {
  return (
    <main style={{minHeight:"100vh",background:"#071512",color:"#f4efe6",display:"grid",placeItems:"center",fontFamily:"Georgia, serif",padding:"2rem",textAlign:"center"}}>
      <div>
        <p style={{letterSpacing:"0.28em",textTransform:"uppercase",color:"#c99651",fontSize:"0.75rem"}}>Pathfinder Therapy</p>
        <h1 style={{fontSize:"clamp(3rem,8vw,6rem)",fontWeight:400,margin:"1rem 0"}}>crisis-support</h1>
        <p style={{fontFamily:"Arial, sans-serif",maxWidth:"38rem",lineHeight:1.7,opacity:.8}}>This page will be built in the next sprint. For now, return to the locked Arrival homepage.</p>
        <a href="/" style={{display:"inline-block",marginTop:"1.5rem",border:"1px solid #c99651",padding:"1rem 1.2rem",color:"#f4efe6",textDecoration:"none",textTransform:"uppercase",letterSpacing:"0.18em",fontFamily:"Arial, sans-serif",fontSize:"0.75rem"}}>Return home</a>
      </div>
    </main>
  )
}

import { useState, useEffect, useRef } from "react";

const LEVELS = [
  { name: "Beginner", minXP: 0, color: "#94a3b8" },
  { name: "Explorer", minXP: 100, color: "#60a5fa" },
  { name: "Builder", minXP: 300, color: "#34d399" },
  { name: "Champion", minXP: 600, color: "#f59e0b" },
  { name: "Legend", minXP: 1000, color: "#a78bfa" },
  { name: "Master", minXP: 2000, color: "#f472b6" },
];
const BADGES = [
  { id: "first_task", icon: "🌱", label: "First Step", desc: "Complete your first task" },
  { id: "streak_3", icon: "🔥", label: "On Fire", desc: "3-day streak" },
  { id: "streak_7", icon: "⚡", label: "Lightning", desc: "7-day streak" },
  { id: "on_time_5", icon: "⏰", label: "Punctual", desc: "5 tasks on time" },
  { id: "tasks_10", icon: "💪", label: "Momentum", desc: "Complete 10 tasks" },
  { id: "tasks_50", icon: "🏆", label: "Unstoppable", desc: "Complete 50 tasks" },
  { id: "perfect_day", icon: "⭐", label: "Perfect Day", desc: "All tasks done in a day" },
  { id: "early_bird", icon: "🌅", label: "Early Bird", desc: "Complete before due time" },
];
const CATEGORIES = ["Work","Health","Personal","Home","Finance","Social","Learning"];
const CAT_COLORS = { Work:"#6366f1",Health:"#10b981",Personal:"#f59e0b",Home:"#3b82f6",Finance:"#ef4444",Social:"#ec4899",Learning:"#8b5cf6" };
const MOODS = [{ emoji:"😫",label:"Struggling",mult:1.5 },{ emoji:"😐",label:"Okay",mult:1 },{ emoji:"😊",label:"Good",mult:1 },{ emoji:"🚀",label:"Energized",mult:1.2 }];
const TIPS = [
  "Break big tasks into 5-minute chunks. Starting is the hardest part!",
  "Try body doubling — work alongside someone (even virtually) to stay focused.",
  "Use the 2-minute rule: if it takes less than 2 min, do it now.",
  "Set a 'launch pad' — a spot for items you need tomorrow.",
  "Celebrate small wins! Every completed task is a victory.",
  "Use visual timers to make time feel more concrete.",
  "Reduce decision fatigue by prepping outfits & meals the night before.",
  "Anchor new habits to existing ones — habit stacking works!",
  "A 'done list' can be just as motivating as a to-do list!",
];

function getLevel(xp) { let l=LEVELS[0]; for(const x of LEVELS) if(xp>=x.minXP) l=x; return l; }
function getNextLevel(xp) { for(const l of LEVELS) if(xp<l.minXP) return l; return null; }

const SAMPLE = [
  { id:1,title:"Schedule dentist appointment",category:"Health",dueDate:new Date(Date.now()+86400000).toISOString().slice(0,16),priority:"medium",completed:false,completedAt:null,notes:"",xp:20 },
  { id:2,title:"Reply to work emails",category:"Work",dueDate:new Date(Date.now()+3600000).toISOString().slice(0,16),priority:"high",completed:false,completedAt:null,notes:"",xp:30 },
  { id:3,title:"30 min walk",category:"Health",dueDate:new Date(Date.now()-1000000).toISOString().slice(0,16),priority:"medium",completed:true,completedAt:new Date(Date.now()-1500000).toISOString(),notes:"",xp:25 },
];

export default function App() {
  const [tasks,setTasks]=useState(SAMPLE);
  const [totalXP,setXP]=useState(125);
  const [streak]=useState(2);
  const [badges,setBadges]=useState(["first_task"]);
  const [tab,setTab]=useState("today");
  const [showAdd,setShowAdd]=useState(false);
  const [showAI,setShowAI]=useState(false);
  const [anim,setAnim]=useState(null);
  const [mood,setMood]=useState(null);
  const [tipI,setTipI]=useState(0);
  const [form,setForm]=useState({title:"",category:"Personal",dueDate:"",priority:"medium",notes:""});
  const [catFilter,setCatFilter]=useState("All");
  const [aiText,setAiText]=useState("");
  const [aiLoading,setAiLoading]=useState(false);
  const [habits,setHabits]=useState([
    {id:1,title:"Morning medication",streak:4,done:false,icon:"💊"},
    {id:2,title:"Drink 8 glasses water",streak:1,done:false,icon:"💧"},
    {id:3,title:"10 min mindfulness",streak:0,done:false,icon:"🧘"},
  ]);
  const [timer,setTimer]=useState({s:25*60,running:false});
  const timerRef=useRef();
  const now=new Date();
  const todayStr=now.toDateString();
  const lv=getLevel(totalXP), nextLv=getNextLevel(totalXP);
  const xpPct=nextLv?((totalXP-lv.minXP)/(nextLv.minXP-lv.minXP))*100:100;
  const todayT=tasks.filter(t=>t.dueDate&&new Date(t.dueDate).toDateString()===todayStr);
  const upcomingT=tasks.filter(t=>t.dueDate&&new Date(t.dueDate)>now&&new Date(t.dueDate).toDateString()!==todayStr);
  const overdueT=tasks.filter(t=>!t.completed&&t.dueDate&&new Date(t.dueDate)<now&&new Date(t.dueDate).toDateString()!==todayStr);
  const viewTasks=(tab==="today"?todayT:tab==="upcoming"?upcomingT:overdueT).filter(t=>catFilter==="All"||t.category===catFilter);
  const completedToday=todayT.filter(t=>t.completed).length;
  const rate=todayT.length?Math.round(completedToday/todayT.length*100):0;

  useEffect(()=>{ const i=setInterval(()=>setTipI(x=>(x+1)%TIPS.length),8000); return()=>clearInterval(i); },[]);
  useEffect(()=>{
    if(timer.running){ timerRef.current=setInterval(()=>setTimer(p=>{ if(p.s<=1){clearInterval(timerRef.current);return{...p,running:false,s:0};} return{...p,s:p.s-1}; }),1000); }
    else clearInterval(timerRef.current);
    return()=>clearInterval(timerRef.current);
  },[timer.running]);

  function fmt(s){ return `${String(Math.floor(s/60)).padStart(2,"0")}:${String(s%60).padStart(2,"0")}`; }

  function complete(id){
    const task=tasks.find(t=>t.id===id); if(!task||task.completed) return;
    const n=new Date(), onTime=task.dueDate&&n<=new Date(task.dueDate);
    const mult=mood?(MOODS.find(m=>m.label===mood)?.mult||1):1;
    const bonus=Math.round(task.xp*mult*(onTime?1.2:1));
    setTasks(p=>p.map(t=>t.id===id?{...t,completed:true,completedAt:n.toISOString()}:t));
    setXP(p=>p+bonus); setAnim({id,xp:bonus,onTime});
    const ct=tasks.filter(t=>t.completed).length+1;
    const nb=[...badges];
    if(ct>=10&&!nb.includes("tasks_10")) nb.push("tasks_10");
    if(onTime&&!nb.includes("early_bird")) nb.push("early_bird");
    if(onTime){ const ot=tasks.filter(t=>t.completed&&t.completedAt&&t.dueDate&&new Date(t.completedAt)<=new Date(t.dueDate)).length+1; if(ot>=5&&!nb.includes("on_time_5")) nb.push("on_time_5"); }
    setBadges(nb); setTimeout(()=>setAnim(null),2500);
  }

  function addTask(){
    if(!form.title.trim()) return;
    setTasks(p=>[...p,{id:Date.now(),...form,completed:false,completedAt:null,xp:form.priority==="high"?30:form.priority==="medium"?20:10}]);
    setForm({title:"",category:"Personal",dueDate:"",priority:"medium",notes:""}); setShowAdd(false);
  }

  async function parseAI(){
    if(!aiText.trim()) return; setAiLoading(true);
    try{
      const r=await fetch("https://api.anthropic.com/v1/messages",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({model:"claude-sonnet-4-20250514",max_tokens:1000,messages:[{role:"user",content:`Parse this to-do list. Return ONLY a JSON array, no markdown. Each item: {"title":string,"category":"Work"|"Health"|"Personal"|"Home"|"Finance"|"Social"|"Learning","priority":"low"|"medium"|"high","notes":string}. List: "${aiText}"`}]})});
      const d=await r.json(); const txt=d.content.map(b=>b.text||"").join(""); const parsed=JSON.parse(txt.replace(/```json|```/g,"").trim());
      const tom=new Date(Date.now()+86400000).toISOString().slice(0,16);
      setTasks(p=>[...p,...parsed.map(t=>({id:Date.now()+Math.random(),title:t.title,category:t.category||"Personal",dueDate:tom,priority:t.priority||"medium",notes:t.notes||"",completed:false,completedAt:null,xp:t.priority==="high"?30:20}))]);
      setAiText(""); setShowAI(false);
    }catch(e){ alert("Could not parse. Please try again."); } setAiLoading(false);
  }

  function doneHabit(id){ setHabits(p=>p.map(h=>h.id===id?{...h,done:true,streak:h.streak+1}:h)); setXP(p=>p+15); }

  const missed=tasks.filter(t=>!t.completed&&t.dueDate&&new Date(t.dueDate)<now);
  const missedByCat=CATEGORIES.reduce((a,c)=>{a[c]=missed.filter(t=>t.category===c).length;return a},{});
  const topMissed=Object.entries(missedByCat).sort((a,b)=>b[1]-a[1])[0];

  const C={
    app:{fontFamily:"'Inter',-apple-system,sans-serif",background:"#0a0a14",minHeight:"100vh",color:"#e2e8f0",maxWidth:430,margin:"0 auto"},
    card:{background:"rgba(255,255,255,0.04)",border:"1px solid rgba(255,255,255,0.08)",borderRadius:16,padding:16,marginBottom:12},
    inp:{width:"100%",background:"rgba(255,255,255,0.06)",border:"1px solid rgba(255,255,255,0.1)",borderRadius:10,padding:"12px 14px",color:"#e2e8f0",fontSize:14,boxSizing:"border-box"},
    pBtn:{width:"100%",padding:14,background:"linear-gradient(135deg,#6366f1,#8b5cf6)",border:"none",borderRadius:12,color:"#fff",fontWeight:700,fontSize:16,cursor:"pointer"},
    tab:(a)=>({padding:"6px 13px",borderRadius:99,border:"none",cursor:"pointer",fontSize:12,fontWeight:600,whiteSpace:"nowrap",background:a?"linear-gradient(135deg,#6366f1,#8b5cf6)":"rgba(255,255,255,0.06)",color:a?"#fff":"#94a3b8"}),
  };

  return (
    <div style={C.app}>
      {/* HEADER */}
      <div style={{background:"linear-gradient(135deg,#13111f,#1e1a3a)",padding:"16px 20px 12px",position:"sticky",top:0,zIndex:50,borderBottom:"1px solid rgba(255,255,255,0.06)"}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:8}}>
          <div>
            <div style={{fontSize:10,color:"#818cf8",letterSpacing:2,textTransform:"uppercase"}}>⚡ Focus Quest</div>
            <div style={{fontSize:17,fontWeight:700,color:lv.color}}>{lv.name} <span style={{fontSize:12,color:"#64748b",fontWeight:400}}>· {totalXP} XP</span></div>
          </div>
          <div style={{textAlign:"right"}}>
            <div style={{fontSize:12,color:"#fbbf24"}}>🔥 {streak} day streak</div>
            <div style={{fontSize:12,color:"#94a3b8"}}>Today: {rate}% done</div>
          </div>
        </div>
        <div style={{background:"rgba(255,255,255,0.08)",borderRadius:99,height:5}}>
          <div style={{width:`${xpPct}%`,background:`linear-gradient(90deg,${lv.color},#a78bfa)`,height:"100%",borderRadius:99,transition:"width 0.5s"}}/>
        </div>
        {nextLv&&<div style={{fontSize:10,color:"#475569",marginTop:3}}>{nextLv.minXP-totalXP} XP to {nextLv.name}</div>}
      </div>

      {/* MOOD */}
      {!mood&&(
        <div style={{margin:"12px 16px 0",background:"rgba(99,102,241,0.12)",border:"1px solid rgba(99,102,241,0.25)",borderRadius:14,padding:"12px 16px"}}>
          <div style={{fontSize:12,color:"#a5b4fc",marginBottom:8}}>How are you feeling right now?</div>
          <div style={{display:"flex",gap:8}}>
            {MOODS.map(m=>(
              <button key={m.label} onClick={()=>setMood(m.label)} style={{flex:1,background:"rgba(255,255,255,0.05)",border:"1px solid rgba(255,255,255,0.08)",borderRadius:10,padding:"8px 4px",cursor:"pointer",color:"#e2e8f0",fontSize:11}}>
                <div style={{fontSize:22}}>{m.emoji}</div><div style={{marginTop:2}}>{m.label}</div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* TIP */}
      <div style={{margin:"10px 16px 0",background:"rgba(16,185,129,0.08)",border:"1px solid rgba(16,185,129,0.2)",borderRadius:10,padding:"10px 14px",display:"flex",gap:8,alignItems:"flex-start"}}>
        <span>💡</span><div style={{fontSize:11,color:"#6ee7b7",lineHeight:1.5}}>{TIPS[tipI]}</div>
      </div>

      {/* TABS */}
      <div style={{display:"flex",gap:4,padding:"10px 16px 4px",overflowX:"auto"}}>
        {[["today","📅 Today"],["upcoming","🔮 Upcoming"],["overdue",`⚠️ Overdue${overdueT.length?` (${overdueT.length})`:""}`],["habits","🌱 Habits"],["focus","⏱ Focus"],["insights","📊 Insights"],["badges","🏅 Badges"]].map(([t,l])=>(
          <button key={t} onClick={()=>setTab(t)} style={C.tab(tab===t)}>{l}</button>
        ))}
      </div>

      <div style={{padding:"8px 16px 110px"}}>

        {["today","upcoming","overdue"].includes(tab)&&(
          <>
            <div style={{display:"flex",gap:6,overflowX:"auto",paddingBottom:8}}>
              {["All",...CATEGORIES].map(c=>(
                <button key={c} onClick={()=>setCatFilter(c)} style={{...C.tab(catFilter===c),background:catFilter===c?(CAT_COLORS[c]||"#6366f1"):"rgba(255,255,255,0.05)"}}>{c}</button>
              ))}
            </div>
            {viewTasks.length===0&&(
              <div style={{textAlign:"center",padding:"40px 0",color:"#475569"}}>
                <div style={{fontSize:48,marginBottom:12}}>{tab==="overdue"?"🎉":"✨"}</div>
                <div style={{fontSize:14}}>{tab==="overdue"?"No overdue tasks!":tab==="today"?"No tasks for today.":"Nothing upcoming."}</div>
              </div>
            )}
            {viewTasks.map(task=>{
              const isOD=!task.completed&&task.dueDate&&new Date(task.dueDate)<now;
              const a=anim?.id===task.id;
              return(
                <div key={task.id} style={{background:task.completed?"rgba(16,185,129,0.07)":isOD?"rgba(239,68,68,0.07)":"rgba(255,255,255,0.04)",border:`1px solid ${task.completed?"rgba(16,185,129,0.25)":isOD?"rgba(239,68,68,0.25)":"rgba(255,255,255,0.07)"}`,borderRadius:14,padding:"14px 16px",marginBottom:10,transform:a?"scale(1.01)":"scale(1)",transition:"all 0.3s",position:"relative",overflow:"hidden"}}>
                  {a&&<div style={{position:"absolute",top:8,right:12,color:"#fbbf24",fontWeight:700,fontSize:13}}>+{anim.xp} XP ✨</div>}
                  <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start"}}>
                    <div style={{flex:1}}>
                      <div style={{display:"flex",gap:6,flexWrap:"wrap",marginBottom:5}}>
                        <span style={{fontSize:10,background:CAT_COLORS[task.category]+"25",color:CAT_COLORS[task.category],padding:"2px 8px",borderRadius:99,fontWeight:600}}>{task.category}</span>
                        <span style={{fontSize:10,color:task.priority==="high"?"#ef4444":task.priority==="medium"?"#f59e0b":"#64748b"}}>{task.priority==="high"?"🔴":task.priority==="medium"?"🟡":"🟢"} {task.priority}</span>
                      </div>
                      <div style={{fontWeight:600,fontSize:14,textDecoration:task.completed?"line-through":"none",color:task.completed?"#64748b":"#e2e8f0"}}>{task.title}</div>
                      {task.notes&&<div style={{fontSize:12,color:"#64748b",marginTop:3}}>{task.notes}</div>}
                      <div style={{fontSize:11,color:isOD?"#ef4444":"#64748b",marginTop:5}}>
                        📅 {task.dueDate&&new Date(task.dueDate).toLocaleString([],{month:"short",day:"numeric",hour:"2-digit",minute:"2-digit"})}
                        {task.completed&&task.completedAt&&<span style={{color:new Date(task.completedAt)<=new Date(task.dueDate)?"#10b981":"#f59e0b"}}> · {new Date(task.completedAt)<=new Date(task.dueDate)?"✅ On time!":"⏰ Late"}</span>}
                      </div>
                      <div style={{fontSize:11,color:"#6366f1",marginTop:3}}>+{task.xp} XP{!task.completed&&task.dueDate&&new Date(task.dueDate)>now?" (+20% on-time bonus)":""}</div>
                    </div>
                    {!task.completed
                      ?<button onClick={()=>complete(task.id)} style={{marginLeft:12,width:42,height:42,borderRadius:"50%",border:"2px solid #6366f1",background:"transparent",cursor:"pointer",fontSize:18,color:"#6366f1",flexShrink:0}}>○</button>
                      :<span style={{fontSize:22,marginLeft:12}}>✅</span>}
                  </div>
                </div>
              );
            })}
          </>
        )}

        {tab==="habits"&&(
          <div>
            <div style={{fontSize:12,color:"#64748b",marginBottom:14}}>Daily habits build structure. Complete them every day to maintain your streaks and earn bonus XP!</div>
            {habits.map(h=>(
              <div key={h.id} style={C.card}>
                <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                  <div style={{display:"flex",gap:12,alignItems:"center"}}>
                    <span style={{fontSize:30}}>{h.icon}</span>
                    <div>
                      <div style={{fontWeight:600,fontSize:14}}>{h.title}</div>
                      <div style={{fontSize:11,color:"#fbbf24"}}>🔥 {h.streak} day streak · +15 XP</div>
                    </div>
                  </div>
                  <button onClick={()=>!h.done&&doneHabit(h.id)} style={{width:40,height:40,borderRadius:"50%",border:`2px solid ${h.done?"#10b981":"#6366f1"}`,background:h.done?"rgba(16,185,129,0.2)":"transparent",cursor:h.done?"default":"pointer",fontSize:18}}>
                    {h.done?"✅":"○"}
                  </button>
                </div>
              </div>
            ))}
            <div style={{...C.card,background:"rgba(99,102,241,0.08)",border:"1px solid rgba(99,102,241,0.2)"}}>
              <div style={{fontSize:13,color:"#a5b4fc",fontWeight:600,marginBottom:8}}>💊 ADHD Habit Tips</div>
              <div style={{fontSize:12,color:"#94a3b8",lineHeight:1.9}}>• Take medication at the same time daily<br/>• Use a mirror checklist for visual reminders<br/>• Pair habits with existing routines<br/>• Celebrate every streak day — consistency compounds!</div>
            </div>
          </div>
        )}

        {tab==="focus"&&(
          <div>
            <div style={{fontSize:12,color:"#64748b",marginBottom:14}}>Pomodoro technique: focused work bursts followed by short breaks maximize your productivity.</div>
            <div style={{...C.card,textAlign:"center",padding:"32px 24px"}}>
              <div style={{fontSize:68,fontWeight:700,color:timer.running?"#818cf8":"#e2e8f0",letterSpacing:-2,marginBottom:16}}>{fmt(timer.s)}</div>
              <div style={{display:"flex",gap:8,justifyContent:"center",marginBottom:20}}>
                {[10,15,25,45].map(m=>(
                  <button key={m} onClick={()=>setTimer({s:m*60,running:false})} style={{padding:"6px 14px",borderRadius:99,border:"1px solid rgba(255,255,255,0.12)",background:timer.s===m*60&&!timer.running?"rgba(99,102,241,0.3)":"transparent",cursor:"pointer",color:"#e2e8f0",fontSize:13}}>{m}m</button>
                ))}
              </div>
              <div style={{display:"flex",gap:10,justifyContent:"center"}}>
                <button onClick={()=>setTimer(p=>({...p,running:!p.running}))} style={{...C.pBtn,width:"auto",padding:"12px 32px",fontSize:15}}>
                  {timer.running?"⏸ Pause":"▶ Start"}
                </button>
                <button onClick={()=>setTimer({s:25*60,running:false})} style={{padding:"12px 20px",borderRadius:12,border:"1px solid rgba(255,255,255,0.12)",background:"transparent",color:"#94a3b8",fontSize:18,cursor:"pointer"}}>↺</button>
              </div>
            </div>
            <div style={C.card}>
              <div style={{fontWeight:600,marginBottom:8}}>💡 Focus Tips for ADHD</div>
              <div style={{fontSize:12,color:"#94a3b8",lineHeight:1.9}}>• Put your phone in another room during sessions<br/>• Use noise-canceling headphones or white noise<br/>• Keep water nearby — dehydration worsens focus<br/>• Short 25-min sessions beat long unfocused hours<br/>• After 4 pomodoros, take a longer 15–30 min break</div>
            </div>
          </div>
        )}

        {tab==="insights"&&(
          <div>
            <div style={C.card}>
              <div style={{fontWeight:600,marginBottom:12}}>📊 Overview</div>
              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
                {[{l:"Tasks Done",v:tasks.filter(t=>t.completed).length,c:"#10b981"},{l:"On-Time Rate",v:"73%",c:"#6366f1"},{l:"Day Streak",v:`${streak} 🔥`,c:"#f59e0b"},{l:"Overdue",v:overdueT.length,c:"#ef4444"}].map(s=>(
                  <div key={s.l} style={{background:"rgba(255,255,255,0.04)",borderRadius:10,padding:12}}>
                    <div style={{fontSize:24,fontWeight:700,color:s.c}}>{s.v}</div>
                    <div style={{fontSize:11,color:"#64748b"}}>{s.l}</div>
                  </div>
                ))}
              </div>
            </div>
            {topMissed&&topMissed[1]>0&&(
              <div style={{...C.card,background:"rgba(239,68,68,0.07)",border:"1px solid rgba(239,68,68,0.2)"}}>
                <div style={{fontWeight:600,color:"#fca5a5",marginBottom:8}}>⚠️ Missed Task Trend</div>
                <div style={{fontSize:13,color:"#94a3b8"}}>You tend to miss <strong style={{color:"#e2e8f0"}}>{topMissed[0]}</strong> tasks most often ({topMissed[1]} missed). Try breaking them into smaller steps or scheduling them earlier in the day.</div>
              </div>
            )}
            <div style={{...C.card,background:"rgba(99,102,241,0.07)",border:"1px solid rgba(99,102,241,0.2)"}}>
              <div style={{fontWeight:600,color:"#a5b4fc",marginBottom:8}}>🤖 AI Suggestions</div>
              <div style={{fontSize:12,color:"#94a3b8",lineHeight:1.9}}>• Schedule high-priority tasks before noon when focus peaks<br/>• You complete more tasks on days you log your mood<br/>• Your habits are strongest Mon–Wed — pair harder tasks then<br/>• Consider blocking 9–10am as a "power hour" for your top 3 tasks</div>
            </div>
            <div style={C.card}>
              <div style={{fontWeight:600,marginBottom:12}}>📈 By Category</div>
              {CATEGORIES.map(cat=>{
                const total=tasks.filter(t=>t.category===cat).length;
                const done=tasks.filter(t=>t.category===cat&&t.completed).length;
                if(!total) return null;
                return(
                  <div key={cat} style={{marginBottom:10}}>
                    <div style={{display:"flex",justifyContent:"space-between",marginBottom:4}}>
                      <span style={{fontSize:12,color:CAT_COLORS[cat]}}>{cat}</span>
                      <span style={{fontSize:12,color:"#64748b"}}>{done}/{total}</span>
                    </div>
                    <div style={{background:"rgba(255,255,255,0.06)",borderRadius:99,height:5}}>
                      <div style={{width:`${Math.round(done/total*100)}%`,background:CAT_COLORS[cat],height:"100%",borderRadius:99}}/>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {tab==="badges"&&(
          <div>
            <div style={{fontSize:12,color:"#64748b",marginBottom:14}}>Earn badges by completing tasks, building streaks, and improving daily habits.</div>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
              {BADGES.map(b=>{
                const earned=badges.includes(b.id);
                return(
                  <div key={b.id} style={{background:earned?"rgba(99,102,241,0.12)":"rgba(255,255,255,0.03)",border:`1px solid ${earned?"rgba(99,102,241,0.4)":"rgba(255,255,255,0.06)"}`,borderRadius:14,padding:16,textAlign:"center",filter:earned?"none":"grayscale(1) opacity(0.35)"}}>
                    <div style={{fontSize:36,marginBottom:8}}>{b.icon}</div>
                    <div style={{fontWeight:600,fontSize:13}}>{b.label}</div>
                    <div style={{fontSize:11,color:"#64748b",marginTop:3}}>{b.desc}</div>
                    {earned&&<div style={{fontSize:10,color:"#818cf8",marginTop:6}}>✓ Earned</div>}
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* FABs */}
      <div style={{position:"fixed",bottom:24,right:20,display:"flex",flexDirection:"column",gap:10,zIndex:100}}>
        <button onClick={()=>setShowAI(true)} title="AI import" style={{width:50,height:50,borderRadius:"50%",border:"1px solid rgba(255,255,255,0.12)",background:"rgba(13,11,27,0.95)",cursor:"pointer",fontSize:20,boxShadow:"0 4px 20px rgba(0,0,0,0.5)"}}>📋</button>
        <button onClick={()=>setShowAdd(true)} style={{width:58,height:58,borderRadius:"50%",border:"none",background:"linear-gradient(135deg,#6366f1,#8b5cf6)",cursor:"pointer",fontSize:28,color:"#fff",boxShadow:"0 4px 24px rgba(99,102,241,0.55)"}}>+</button>
      </div>

      {/* ADD TASK MODAL */}
      {showAdd&&(
        <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.85)",zIndex:200,display:"flex",alignItems:"flex-end"}} onClick={()=>setShowAdd(false)}>
          <div style={{background:"#13111f",borderRadius:"20px 20px 0 0",padding:24,width:"100%",maxWidth:430,margin:"0 auto",borderTop:"1px solid rgba(255,255,255,0.1)"}} onClick={e=>e.stopPropagation()}>
            <div style={{fontWeight:700,fontSize:18,marginBottom:16}}>+ New Task</div>
            <input value={form.title} onChange={e=>setForm(p=>({...p,title:e.target.value}))} placeholder="What needs to be done?" style={{...C.inp,marginBottom:10}}/>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginBottom:10}}>
              <select value={form.category} onChange={e=>setForm(p=>({...p,category:e.target.value}))} style={{...C.inp,padding:"10px 12px"}}>
                {CATEGORIES.map(c=><option key={c} value={c} style={{background:"#13111f"}}>{c}</option>)}
              </select>
              <select value={form.priority} onChange={e=>setForm(p=>({...p,priority:e.target.value}))} style={{...C.inp,padding:"10px 12px"}}>
                <option value="low" style={{background:"#13111f"}}>🟢 Low</option>
                <option value="medium" style={{background:"#13111f"}}>🟡 Medium</option>
                <option value="high" style={{background:"#13111f"}}>🔴 High</option>
              </select>
            </div>
            <input type="datetime-local" value={form.dueDate} onChange={e=>setForm(p=>({...p,dueDate:e.target.value}))} style={{...C.inp,marginBottom:10,colorScheme:"dark"}}/>
            <textarea value={form.notes} onChange={e=>setForm(p=>({...p,notes:e.target.value}))} placeholder="Notes (optional)..." rows={2} style={{...C.inp,marginBottom:14,resize:"none"}}/>
            <button onClick={addTask} style={C.pBtn}>Add Task</button>
          </div>
        </div>
      )}

      {/* AI IMPORT MODAL */}
      {showAI&&(
        <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.85)",zIndex:200,display:"flex",alignItems:"flex-end"}} onClick={()=>setShowAI(false)}>
          <div style={{background:"#13111f",borderRadius:"20px 20px 0 0",padding:24,width:"100%",maxWidth:430,margin:"0 auto",borderTop:"1px solid rgba(255,255,255,0.1)"}} onClick={e=>e.stopPropagation()}>
            <div style={{fontWeight:700,fontSize:18,marginBottom:6}}>📋 AI Task Import</div>
            <div style={{fontSize:12,color:"#64748b",marginBottom:14}}>Type or paste your to-do list and AI will automatically parse it into categorized, prioritized tasks.</div>
            <textarea value={aiText} onChange={e=>setAiText(e.target.value)} placeholder="e.g. Buy groceries, Call doctor Tuesday 3pm, Finish report by Friday, Pay bills, Schedule car service..." rows={5} style={{...C.inp,marginBottom:14,resize:"none"}}/>
            <button onClick={parseAI} disabled={aiLoading} style={{...C.pBtn,opacity:aiLoading?0.6:1,cursor:aiLoading?"default":"pointer"}}>
              {aiLoading?"✨ Parsing with AI...":"✨ Parse Tasks with AI"}
            </button>
          </div>
        </div>
      )}
      <style>{`::-webkit-scrollbar{display:none} *{-webkit-tap-highlight-color:transparent}`}</style>
    </div>
  );
}

/* Additive Sales Phase 1. Load after admin.js and ai-config.js. */
(() => {
  'use strict';
  if(typeof adminSupabase==='undefined' || document.getElementById('csSales')) return;
  const host=document.getElementById('adminDashboard'); if(!host) return;
  const db=adminSupabase;
  const root=document.createElement('section'); root.id='csSales'; root.className='cs-sales'; root.hidden=true;
  // Static template only. All records and model output use textContent or value.
  root.innerHTML=`
    <header><p class="sales-kicker">CLEAN SCRUB · SALES WORKSPACE</p><h2>Turn today’s actions into bookings.</h2>
      <p>Find prospects, follow up and measure what turns into paid work.</p></header>
    <p id="salesStatus" class="sales-status" role="status" aria-live="polite"></p>
    <div id="salesBody" hidden>
    <nav aria-label="Sales sections"><button data-sales-tab="report" aria-pressed="true">Daily sales report</button>
      <button data-sales-tab="find" aria-pressed="false">Find customers</button><button data-sales-tab="pipeline" aria-pressed="false">Prospects & follow-ups</button></nav>
    <section data-sales-view="report">
      <div class="sales-actions"><label>Report date (South Africa)<input id="salesDate" type="date" required></label>
        <button id="salesRefreshReport">Refresh report</button><button id="salesDownload">Download report</button></div>
      <div id="salesReport"></div>
      <details><summary>Revenue goal settings</summary><form id="salesGoalForm" class="sales-form sales-two">
        <label>Target revenue (R)<input name="goal_amount" type="number" min="1" max="9999999999" step="0.01" required></label>
        <label>Start date<input name="goal_start" type="date" required></label><label>Deadline<input name="goal_end" type="date" required></label>
        <div class="sales-actions"><button type="submit">Save goal</button></div></form></details>
    </section>
    <section data-sales-view="find" hidden><h3>Five businesses to research</h3>
      <p>Search public map listings around Gqeberha for dealerships, workshops, accommodation and transport businesses.</p>
      <p class="sales-subtle">Results are possible service matches, not confirmed interest. Save relevant businesses to exclude them from the next search. Verify details before contacting anyone.</p>
      <div class="sales-actions"><button id="salesFind" class="sales-primary">Find 5 prospects</button><button id="salesGoManual">Add an enquiry or prospect</button></div>
      <p id="salesResearchNote" class="sales-subtle"></p><div id="salesResults" class="sales-list"></div>
      <p class="sales-subtle">Research: © <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener noreferrer">OpenStreetMap contributors · ODbL</a>. Coverage may be incomplete or outdated. No messages are sent by this workspace.</p>
    </section>
    <section data-sales-view="pipeline" hidden>
      <div class="sales-actions"><label>Search saved names<input id="salesSearch" maxlength="160" placeholder="Business or customer name"></label>
        <button id="salesSearchButton">Search / refresh</button><label>Show<select id="salesFilter"><option value="all">All loaded prospects</option><option value="due">Follow-ups due</option><option value="research">Research</option><option value="enquiry">Enquiries</option><option value="quoted">Quoted</option><option value="linked">Linked to bookings</option><option value="do_not_contact">Do not contact</option></select></label></div>
      <details id="salesAdd"><summary>Add an enquiry or prospect manually</summary><form id="salesAddForm" class="sales-form sales-two">
        <label>Name<input name="name" required maxlength="160"></label>
        <label>Record type<select name="stage"><option value="research">Business to research</option><option value="enquiry">Customer has enquired</option></select></label>
        <label>Category<select name="category"><option>Vehicle dealership</option><option>Vehicle workshop</option><option>Accommodation</option><option>Transport / logistics</option><option>Individual customer</option><option>Other</option></select></label>
        <label>Service of interest<input name="service" maxlength="160" placeholder="Vehicle detailing"></label>
        <button type="submit" class="sales-primary">Save record</button></form></details>
      <p class="sales-subtle">Record enquiries received by phone, WhatsApp or in person here. Unsubmitted website booking forms are not captured.</p>
      <p id="salesListCount" class="sales-meta"></p><div id="salesPipelineList" class="sales-list"></div><button id="salesMore" hidden>Load more saved records</button>
      <div id="salesDetail" class="sales-details" hidden>
        <h3 id="salesDetailName"></h3><p id="salesLinkedLabel" class="sales-subtle"></p>
        <form id="salesEditForm" class="sales-form sales-two">
          <label>Name<input name="name" required maxlength="160"></label><label>Category<input name="category" maxlength="80"></label>
          <label>Relevant service<input name="service" maxlength="160"></label><label>Area<input name="area" maxlength="160"></label>
          <label>Phone / WhatsApp<input name="phone" maxlength="40" placeholder="Verify this number first"></label><label>Email<input name="email" type="email" maxlength="254"></label>
          <label>Website<input name="website" type="url" maxlength="600"></label><label>Research source<input name="source_url" type="url" maxlength="600"></label>
          <label>Sales stage<select name="stage"><option value="research">Research</option><option value="contacted">Contacted</option><option value="enquiry">Enquiry / replied</option><option value="quoted">Quoted</option><option value="lost">Closed / lost</option><option value="do_not_contact">Do not contact</option></select></label>
          <label>Follow-up date (South Africa)<input name="follow_up_date" type="date"></label>
          <label>Quoted amount (R, optional)<input name="quote_amount" type="number" min="0" step="0.01"></label>
          <label>Permission basis<select name="permission_basis"><option value="unknown">Not recorded</option><option value="enquiry">Reply to their enquiry</option><option value="marketing">Agreed to marketing</option><option value="withdrawn">Withdrawn / do not contact</option></select></label>
          <label>Permission covers<select name="permission_channel"><option value="none">No channel</option><option value="whatsapp">WhatsApp</option><option value="email">Email</option><option value="both">WhatsApp and email</option></select></label>
          <label>When and how permission was given<textarea name="permission_evidence" maxlength="1000" rows="2"></textarea></label>
          <label class="sales-wide">Notes / latest response<textarea name="notes" maxlength="3000" rows="3"></textarea></label>
          <div class="sales-actions sales-wide"><button type="submit" class="sales-primary">Save changes</button><button type="button" id="salesWithdraw">Mark do not contact</button></div>
        </form>
        <div class="sales-notice">A public phone number or email does not establish permission. Record the relevant enquiry or agreement before approving a message. A quote is not revenue; link the actual booking below.</div>
        <details open><summary>Prepare a message for review</summary>
          <form id="salesDraftForm" class="sales-form">
            <div class="sales-two"><label>Channel<select name="channel"><option value="whatsapp">WhatsApp</option><option value="email">Email</option></select></label>
              <label>Instructions (optional)<input name="instructions" maxlength="600" placeholder="A short introduction about vehicle detailing"></label></div>
            <div><button id="salesGenerate" type="button">Generate AI draft</button></div>
            <label>Subject (email)<input name="subject" maxlength="180"></label>
            <label>Review and edit the message<textarea name="body" maxlength="4000" rows="6" required></textarea></label>
            <div><button type="submit">Save draft for approval</button></div>
          </form><div id="salesDrafts" class="sales-list"></div>
        </details>
        <details><summary>Link a real booking</summary><p class="sales-subtle">Search by customer name, phone or exact booking ID. One booking can belong to only one prospect.</p>
          <div class="sales-actions"><label>Booking search<input id="salesBookingSearch" maxlength="160"></label><button id="salesLoadBookings">Find bookings</button></div>
          <div class="sales-actions"><label>Matching bookings (up to 100)<select id="salesBookingSelect"></select></label><button id="salesLink">Link selected booking</button></div>
          <div id="salesLinks" class="sales-list"></div>
        </details>
        <details><summary>Record a response or activity</summary><form id="salesEventForm" class="sales-form">
          <label>Activity<select name="kind"><option value="note">Note</option><option value="reply">Customer response</option><option value="call">Phone call</option><option value="visit">Visit</option></select></label>
          <label>What happened?<textarea name="note" rows="3" required maxlength="3000"></textarea></label><div><button type="submit">Save activity</button></div>
        </form><p class="sales-subtle">Set the sales stage to Enquiry / replied when a prospect first makes an enquiry.</p><div id="salesTimeline"></div></details>
      </div>
    </section></div>`;
  const header=host.querySelector('.admin-dashboard-top'); if(header) header.after(root); else host.prepend(root);
  const $=id=>root.querySelector('#'+id), fields=form=>$(form).elements;
  const el=(tag,value,parent,cls)=>{const e=document.createElement(tag);if(value!==null)e.textContent=String(value??'');if(cls)e.className=cls;if(parent)parent.append(e);return e;};
  const clear=id=>$(id).replaceChildren();
  const action=(label,parent,fn)=>{const b=el('button',label,parent);b.type='button';b.addEventListener('click',fn);return b;};
  const money=value=>new Intl.NumberFormat('en-ZA',{style:'currency',currency:'ZAR'}).format(Number(value)||0);
  const today=()=>new Intl.DateTimeFormat('en-CA',{timeZone:'Africa/Johannesburg',year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date());
  const time=value=>value?new Date(value).toLocaleString('en-ZA',{timeZone:'Africa/Johannesburg',dateStyle:'medium',timeStyle:'short'}):'';
  const label=stage=>({research:'Research',contacted:'Contacted',enquiry:'Enquiry / replied',quoted:'Quoted',lost:'Closed / lost',do_not_contact:'Do not contact'}[stage]||stage);
  const permitted=p=>['enquiry','marketing'].includes(p.permission_basis)&&!['lost','do_not_contact'].includes(p.stage);
  const notice=(s,error=false)=>{$('salesStatus').textContent=s;$('salesStatus').dataset.error=String(error);};
  const safeURL=s=>{try{const u=new URL(s);return ['http:','https:'].includes(u.protocol)&&!u.username&&!u.password?u.href:'';}catch{return '';}};
  const link=(label,url,parent)=>{const href=safeURL(url);if(href){const a=el('a',label,parent);a.href=href;a.target='_blank';a.rel='noopener noreferrer';}};
  let epoch=0, owner=null, working=false, selected=null, prospects=[], links=[], report=null, more=false, aborter;
  function reset(){epoch++;owner=null;selected=null;prospects=[];links=[];report=null;aborter?.abort();root.hidden=true;$('salesBody').hidden=true;$('salesDetail').hidden=true;
    ['salesReport','salesResults','salesPipelineList','salesDrafts','salesTimeline','salesLinks','salesBookingSelect'].forEach(clear);
    root.querySelectorAll('form').forEach(f=>f.reset());$('salesSearch').value='';$('salesBookingSearch').value='';$('salesResearchNote').textContent='';$('salesDetailName').textContent='';$('salesLinkedLabel').textContent='';$('salesListCount').textContent='';notice('');working=false;}
  function freeze(value){root.querySelectorAll('button,input,select,textarea').forEach(e=>{e.disabled=value;});}
  async function run(task,success){
    if(!owner||working)return;
    const token=epoch;working=true;freeze(true);notice('Working…');
    const active=()=>{if(token!==epoch||!owner)throw Error('SESSION_CHANGED');};
    try{await task(active);active();if(success)notice(success);}
    catch(e){if(token===epoch)notice(e.message==='SESSION_CHANGED'?'Please sign in again.':e.message,true);}
    finally{if(token===epoch){working=false;freeze(false);}}
  }
  function check(result){if(result.error){const code=result.error.code;
    if(['42P01','42883','PGRST202','PGRST205'].includes(code))throw Error('Sales setup is missing. Run 04-sales-agent.sql in the existing Supabase project.');
    throw Error(result.error.message||'Could not save. Try again.');}return result.data;}
  async function rpc(name,args,active){const r=await db.rpc(name,args);active();return check(r);}
  async function worker(path,input,active){
    let url;try{url=new URL(window.CLEAN_SCRUB_AI?.chatUrl);if(url.protocol!=='https:'||url.username||url.password)throw Error();url.pathname=path;url.search='';url.hash='';}
    catch{throw Error('Check the Worker URL in ai-config.js.');}
    const auth=await db.auth.getSession();active();const session=auth.data?.session;if(!session)throw Error('Please sign in again.');
    aborter=new AbortController();const timer=setTimeout(()=>aborter?.abort(),60000);
    try{const response=await fetch(url.href,{method:'POST',headers:{'Content-Type':'application/json',Authorization:'Bearer '+session.access_token},body:JSON.stringify(input),signal:aborter.signal});active();
      let data;try{data=await response.json();}catch{throw Error('The Worker returned an unexpected response. Check the deployment.');}active();
      if(!response.ok)throw Error(data.error||'Request failed.');return data;
    }catch(e){if(e.name==='AbortError')throw Error('The request timed out. Your saved records are still available.');throw e;}finally{clearTimeout(timer);}
  }
  function tab(name){root.querySelectorAll('[data-sales-view]').forEach(e=>e.hidden=e.dataset.salesView!==name);root.querySelectorAll('[data-sales-tab]').forEach(e=>e.setAttribute('aria-pressed',String(e.dataset.salesTab===name)));}
  root.querySelectorAll('[data-sales-tab]').forEach(b=>b.addEventListener('click',()=>{tab(b.dataset.salesTab);if(b.dataset.salesTab==='pipeline')run(a=>loadProspects(a),'Saved prospects loaded.');}));
  async function sessionChanged(session){
    if(session?.user.id===owner)return;reset();if(!session)return;
    const token=epoch;
    try{const r=await db.from('cs_ai_admins').select('user_id').eq('user_id',session.user.id);if(token!==epoch)return;
      if(r.error||!r.data?.length)return;
      owner=session.user.id;root.hidden=false;$('salesBody').hidden=false;freeze(false);$('salesDate').value=today();$('salesDate').max=today();
      tab('report');await run(a=>loadReport(a),'Sales workspace ready.');
    }catch{if(token===epoch){root.hidden=false;notice('Could not check sales access. Refresh or sign in again.',true);}}
  }
  // Avoid awaiting Supabase calls inside the auth callback's lock.
  db.auth.onAuthStateChange((event,session)=>{if(!session)reset();else setTimeout(()=>sessionChanged(session),0);});
  db.auth.getSession().then(r=>sessionChanged(r.data?.session)).catch(()=>{});

  function reportText(r){
    const g=r.settings,p=r.period,f=r.funnel,b=r.daily_bookings,pipe=r.pipeline;
    const remaining=Math.max(0,Number(g.goal_amount)-Number(p.paid_revenue));
    return ['CLEAN SCRUB — DAILY SALES REPORT',r.report_date+' · South Africa','',
      `Goal period: ${g.goal_start} to ${g.goal_end}`,`Recorded paid revenue: ${money(p.paid_revenue)} / ${money(g.goal_amount)}`,`Remaining: ${money(remaining)}`,
      `Selected-day recorded paid revenue: ${money(r.today.paid_revenue)}`,`Selected-day bookings: ${b.pending} pending, ${b.confirmed} confirmed, ${b.completed} completed, ${b.cancelled} cancelled`,
      `Goal-period completed jobs: ${r.period_bookings.completed}`,`Customers by distinct recorded phone: ${r.period_bookings.customers_by_phone}`,
      `Saved enquiries: ${f.enquiries}; linked to a non-cancelled booking: ${f.converted}`,
      `Conversion: ${f.enquiries?Math.round(f.converted/f.enquiries*100)+'%':'No enquiries yet'}`,
      `Follow-ups due: ${pipe.followups_due}; tomorrow: ${pipe.followups_tomorrow}; missing permission: ${pipe.needs_permission}`,
      `Unpaid receipt value (not revenue): ${money(p.unpaid_receipt_value)}`,`Bookings with multiple paid receipts: ${r.duplicate_paid_booking_groups}`,'',
      'POPULAR SERVICES (completed jobs)',...r.services.map(x=>`${x.service}: ${x.completed_jobs}`),'','NEXT ACTIONS',...nextActions(r),'',
      'Revenue uses receipt rows currently marked Paid, dated by receipt creation in South Africa time. It is not bank-verified and is not profit. Multiple receipts for one booking may inflate totals; review them. Refunds are not tracked here.',
      'Booking status and pipeline use current records; historical reports are recalculations, not frozen snapshots. Customer count is an estimate from stored phone numbers. Conversion covers manually saved enquiries linked to non-cancelled bookings, not all website visitors.',
      'Nothing sent or published. Generated: '+time(r.generated_at)].join('\n');
  }
  function nextActions(r){const p=r.pipeline,a=[];
    if(p.followups_due)a.push(`Review ${p.followups_due} due follow-up(s) with recorded permission.`);
    if(p.followups_tomorrow)a.push(`Prepare ${p.followups_tomorrow} follow-up(s) for tomorrow.`);
    if(p.needs_permission)a.push(`Review ${p.needs_permission} record(s) missing contact permission before drafting an approach.`);
    if(p.quoted)a.push(`Review ${p.quoted} quoted prospect(s); link any resulting website bookings.`);
    if(r.daily_bookings.pending)a.push(`Check ${r.daily_bookings.pending} pending booking(s) in your booking dashboard.`);
    if(r.period.unpaid_receipts)a.push(`Check ${r.period.unpaid_receipts} unpaid receipt(s) and update payment records only when payment is confirmed.`);
    if(p.research)a.push(`Verify the fit and contact details of ${Math.min(5,p.research)} saved research prospect(s).`);
    else a.push('Research up to five relevant businesses and save those worth investigating.');
    a.push('Record new enquiries and customer responses so the conversion figures stay useful.');return a;
  }
  async function loadReport(active){
    const data=await rpc('cs_sales_report',{p_date:$('salesDate').value||today()},active);report=data;renderReport();
    for(const key of ['goal_amount','goal_start','goal_end'])fields('salesGoalForm')[key].value=data.settings[key];
  }
  function renderReport(){clear('salesReport');const r=report,p=r.period,g=r.settings;
    const target=Number(g.goal_amount),value=Number(p.paid_revenue),remaining=Math.max(0,target-value),percent=target?value/target*100:0;
    const goal=el('div',null,$('salesReport'),'sales-card');el('p',`Revenue goal · ${g.goal_start} to ${g.goal_end}`,goal,'sales-kicker');
    el('strong',money(value)+' / '+money(target),goal,'sales-number');const progress=el('progress',null,goal,'sales-progress');progress.max=100;progress.value=Math.max(0,Math.min(percent,100));progress.setAttribute('aria-label','Revenue goal progress');
    el('p',`${percent.toFixed(1)}% recorded · ${money(remaining)} remaining`,goal);
    const start=g.goal_start>r.report_date?g.goal_start:r.report_date;
    const days=Math.max(0,Math.round((Date.parse(g.goal_end+'T00:00:00Z')-Date.parse(start+'T00:00:00Z'))/86400000)+1);
    el('p',remaining===0?'Recorded target reached. Verify receipts before treating this as collected revenue.':days?`${days} calendar days including the selected day · ${money(remaining/days)} per day needed.`:'The deadline has passed. Review the result or set a new goal.',goal,'sales-subtle');
    const grid=el('div',null,$('salesReport'),'sales-grid sales-divider');
    const metric=(name,value,note)=>{const card=el('div',null,grid,'sales-card');el('span',name,card,'sales-stat-label');el('strong',value,card,'sales-number');if(note)el('p',note,card,'sales-subtle');};
    metric('Paid receipts · selected day',money(r.today.paid_revenue),r.today.paid_receipts+' receipt(s)');
    metric('Completed jobs · goal period',r.period_bookings.completed,'Pending: '+r.period_bookings.pending+' · confirmed: '+r.period_bookings.confirmed);
    metric('Saved enquiry → booking',r.funnel.enquiries?Math.round(r.funnel.converted/r.funnel.enquiries*100)+'%':'—',r.funnel.converted+' linked / '+r.funnel.enquiries+' saved enquiries');
    metric('Follow-ups due',r.pipeline.followups_due,'Tomorrow: '+r.pipeline.followups_tomorrow);
    metric('Customers · completed jobs',r.period_bookings.customers_by_phone,'Distinct stored phone numbers; formats may differ.');
    metric('Unpaid receipt value',money(p.unpaid_receipt_value),'Excluded from paid revenue.');
    el('p',`Bookings for ${r.report_date}: ${r.daily_bookings.pending} pending · ${r.daily_bookings.confirmed} confirmed · ${r.daily_bookings.completed} completed · ${r.daily_bookings.cancelled} cancelled.`,$('salesReport'));
    if(r.duplicate_paid_booking_groups)el('p',`Review ${r.duplicate_paid_booking_groups} booking(s) with multiple paid receipts. These rows are included and may overstate revenue.`,$('salesReport'),'sales-notice');
    const two=el('div',null,$('salesReport'),'sales-two sales-divider'), actions=el('div',null,two),popular=el('div',null,two);
    el('h3','Actions for today and tomorrow',actions);const ul=el('ul',null,actions);nextActions(r).forEach(a=>el('li',a,ul));
    el('h3','Popular services',popular);el('p','Ranked by completed jobs in the goal period.',popular,'sales-subtle');
    if(!r.services.length)el('p','No completed jobs recorded in this period yet.',popular);else{const list=el('ul',null,popular);r.services.forEach(s=>el('li',s.service+' — '+s.completed_jobs+' job(s)',list));}
    const notes=el('details',null,$('salesReport'));el('summary','How these figures are calculated',notes);
    el('p','Paid revenue sums receipts currently marked Paid, using their creation date in South Africa time. It is not bank-verified or profit. Quotes and unpaid receipts do not count. Refunds are not tracked here.',notes,'sales-subtle');
    el('p','Conversion counts saved enquiries in the goal period with an explicitly linked non-cancelled booking. Only recorded enquiries are included. Statuses and pipeline are current; choosing an earlier date recalculates today’s records rather than restoring a historical snapshot.',notes,'sales-subtle');
    el('p','Customer count groups completed bookings by stored phone number; missing numbers are excluded. Completed jobs missing a phone: '+r.period_bookings.completed_missing_phone+'.',notes,'sales-subtle');
    el('p','Updated '+time(r.generated_at)+'. Refresh after changing booking or receipt records.', $('salesReport'),'sales-meta');
  }
  $('salesRefreshReport').onclick=()=>run(loadReport,'Report refreshed.');
  $('salesDownload').onclick=()=>{if(!report)return;const blob=new Blob([reportText(report)],{type:'text/plain;charset=utf-8'}),u=URL.createObjectURL(blob),a=document.createElement('a');a.href=u;a.download='CleanScrub-Sales-'+report.report_date+'.txt';a.click();setTimeout(()=>URL.revokeObjectURL(u),1000);};
  $('salesGoalForm').onsubmit=e=>{e.preventDefault();run(async active=>{const f=fields('salesGoalForm');check(await db.from('cs_sales_settings').update({goal_amount:Number(f.goal_amount.value),goal_start:f.goal_start.value,goal_end:f.goal_end.value}).eq('id',true));active();await loadReport(active);},'Goal updated.');};

  $('salesFind').onclick=()=>run(async active=>{const r=await worker('/sales/find',{},active);clear('salesResults');
    $('salesResearchNote').textContent=`${r.researched} map entries checked · ${time(r.researched_at)}. ${r.notice}`;
    if(!r.prospects?.length)el('p','No new matches were returned. Work through saved prospects or add a business manually.',$('salesResults'),'sales-empty');
    for(const p of r.prospects||[]){const c=el('article',null,$('salesResults'),'sales-card');el('h3',p.name,c);el('span',p.category,c,'sales-pill');el('p',p.service,c);el('p',p.area,c,'sales-subtle');el('p',p.fit,c,'sales-subtle');
      const actions=el('div',null,c,'sales-actions');link('Map source',p.source_url,actions);link('Website',p.website,actions);
      action('Save prospect',actions,()=>run(async a=>{const {fit,...record}=p;const res=await db.from('cs_sales_prospects').insert(record).select().single();a();
        if(res.error?.code==='23505'){c.remove();notice('This business is already saved.');return;}check(res);c.remove();notice('Saved. Find it under Prospects & follow-ups.');}));
    }
  },'Research ready for your review.');
  $('salesGoManual').onclick=()=>{tab('pipeline');$('salesAdd').open=true;fields('salesAddForm').name.focus();run(loadProspects,'Add the enquiry or business below.');};
  async function loadProspects(active,append=false){
    let q=db.from('cs_sales_prospects').select('*').order('follow_up_date',{ascending:true,nullsFirst:false}).order('created_at',{ascending:false}).order('id');
    const search=$('salesSearch').value.trim();if(search)q=q.ilike('name','%'+search.replace(/[\\%_]/g,'\\$&')+'%');
    const offset=append?prospects.length:0;const data=check(await q.range(offset,offset+99));active();
    const l=check(await db.from('cs_sales_booking_links').select('*').order('created_at',{ascending:false}).limit(10000));active();links=l;
    prospects=append?[...prospects,...data]:data;more=data.length===100;renderPipeline();
  }
  function renderPipeline(){clear('salesPipelineList');const filter=$('salesFilter').value;
    const rows=prospects.filter(p=>filter==='all'||(filter==='due'?permitted(p)&&p.follow_up_date&&p.follow_up_date<=today():filter==='linked'?links.some(l=>l.prospect_id===p.id):p.stage===filter));
    $('salesListCount').textContent=`${rows.length} shown from ${prospects.length} loaded record(s).${more?' Load more for additional matches.':''}`;$('salesMore').hidden=!more;
    if(!rows.length)el('p','No matching records loaded. Add an enquiry or save a business from Find customers.',$('salesPipelineList'),'sales-empty');
    for(const p of rows){const b=action('', $('salesPipelineList'),()=>run(a=>openProspect(p.id,a),'Record opened.'));
      el('strong',p.name,b);el('p',p.service||p.category,b,'sales-subtle');el('span',label(p.stage),b,'sales-pill');
      const count=links.filter(l=>l.prospect_id===p.id).length;if(count)el('span',count+' booking link(s)',b,'sales-pill');
      if(p.follow_up_date)el('span',`Follow up ${p.follow_up_date}${permitted(p)?'':' · permission missing'}`,b,'sales-pill sales-due');
    }
  }
  $('salesSearchButton').onclick=()=>run(loadProspects,'Records refreshed.');$('salesMore').onclick=()=>run(a=>loadProspects(a,true),'More records loaded.');$('salesFilter').onchange=renderPipeline;
  $('salesSearch').onkeydown=e=>{if(e.key==='Enter'){e.preventDefault();$('salesSearchButton').click();}};
  $('salesAddForm').onsubmit=e=>{e.preventDefault();run(async a=>{const f=fields('salesAddForm'),data=check(await db.from('cs_sales_prospects').insert({name:f.name.value.trim(),category:f.category.value,service:f.service.value.trim(),stage:f.stage.value}).select().single());a();$('salesAddForm').reset();$('salesAdd').open=false;await loadProspects(a);await openProspect(data.id,a);},'Record saved. Add contact details and a follow-up date.');};
  async function openProspect(id,active){
    const r=check(await db.from('cs_sales_prospects').select('*').eq('id',id).single());active();selected=r;
    for(const f of Array.from(fields('salesEditForm')))if(f.name)f.value=r[f.name]??'';
    $('salesDetailName').textContent=r.name;$('salesDetail').hidden=false;$('salesDraftForm').reset();$('salesEventForm').reset();$('salesBookingSearch').value='';clear('salesBookingSelect');
    await loadDetail(active);$('salesDetail').scrollIntoView?.({behavior:'smooth',block:'start'});
  }
  async function loadDetail(active){
    const id=selected.id;
    const results=await Promise.all([db.from('cs_sales_drafts').select('*').eq('prospect_id',id).order('created_at',{ascending:false}).limit(30),
      db.from('cs_sales_events').select('*').eq('prospect_id',id).order('created_at',{ascending:false}).limit(50),
      db.from('cs_sales_booking_links').select('*').eq('prospect_id',id)]);active();
    const [drafts,events,bookingLinks]=results.map(check);renderDrafts(drafts);clear('salesTimeline');clear('salesLinks');
    $('salesLinkedLabel').textContent=bookingLinks.length?`${bookingLinks.length} website booking link(s). Booking statuses are shown in the booking dashboard.`:'No linked booking yet.';
    for(const e of events){const c=el('div',null,$('salesTimeline'),'sales-card');el('p',e.kind.replaceAll('_',' ')+' · '+time(e.created_at),c,'sales-meta');el('p',e.note,c);}
    if(!events.length)el('p','No activity recorded yet.',$('salesTimeline'),'sales-subtle');
    for(const l of bookingLinks){const c=el('div',null,$('salesLinks'),'sales-card');el('p','Website booking #'+l.booking_id,c);action('Remove link',c,()=>run(async a=>{await rpc('cs_sales_link_booking',{p_prospect:id,p_booking:l.booking_id,p_remove:true},a);await loadDetail(a);},'Link removed; the booking is unchanged.'));}
  }
  $('salesEditForm').onsubmit=e=>{e.preventDefault();run(async a=>{const values={};for(const f of Array.from(fields('salesEditForm')))if(f.name)values[f.name]=f.value.trim();
    values.follow_up_date=values.follow_up_date||null;values.quote_amount=values.quote_amount===''?null:Number(values.quote_amount);
    for(const key of ['source_url','website'])if(values[key]&&!safeURL(values[key]))throw Error('Use a valid http or https website address.');
    const data=check(await db.from('cs_sales_prospects').update(values).eq('id',selected.id).select().single());a();selected=data;await loadProspects(a);await openProspect(data.id,a);
  },'Changes saved.');};
  $('salesWithdraw').onclick=()=>run(async a=>{const id=selected.id;check(await db.from('cs_sales_prospects').update({stage:'do_not_contact',permission_basis:'withdrawn',permission_channel:'none',follow_up_date:null}).eq('id',id));a();await loadProspects(a);await openProspect(id,a);},'Marked do not contact. Unsent draft approvals were cleared.');
  $('salesGenerate').onclick=()=>run(async a=>{const f=fields('salesDraftForm'),r=await worker('/sales/draft',{prospect_id:selected.id,channel:f.channel.value,instructions:f.instructions.value},a);f.body.value=r.body;f.subject.value=r.subject||'';},'AI draft ready. Review and edit it, then save. Nothing sent.');
  $('salesDraftForm').onsubmit=e=>{e.preventDefault();run(async a=>{const f=fields('salesDraftForm');check(await db.from('cs_sales_drafts').insert({prospect_id:selected.id,channel:f.channel.value,subject:f.subject.value.trim(),body:f.body.value.trim()}));a();await loadDetail(a);f.body.value='';},'Draft saved for approval. Nothing sent.');};
  function renderDrafts(drafts){clear('salesDrafts');for(const d of drafts){const c=el('article',null,$('salesDrafts'),'sales-card');
    el('h4',d.channel==='email'?'Email draft':'WhatsApp draft',c);if(d.subject&&d.channel==='email')el('p',d.subject,c);el('pre',d.body,c,'sales-message');
    el('p',d.sent_manually_at?'Owner recorded manual sending: '+time(d.sent_manually_at):d.approved_at?'Approved for '+d.approved_recipient+' · not yet recorded as sent':'Awaiting your approval',c,'sales-meta');
    const buttons=el('div',null,c,'sales-actions');
    if(!d.sent_manually_at&&!d.approved_at)action('Approve reviewed draft',buttons,()=>run(async a=>{await rpc('cs_sales_approve',{p_draft:d.id},a);await loadDetail(a);},'Approved. Copy it and send it yourself if ready.'));
    if(d.approved_at&&!d.sent_manually_at){
      action('Copy approved message',buttons,()=>run(async a=>{
        // Recheck permission and recipient in the database immediately before exposing copy.
        await rpc('cs_sales_approve',{p_draft:d.id},a);
        if(!navigator.clipboard?.writeText)throw Error('Clipboard access is unavailable. Select and copy the reviewed text above.');
        await navigator.clipboard.writeText((d.channel==='email'&&d.subject?d.subject+'\n\n':'')+d.body);a();notice('Copied. Send manually in the chosen app. Nothing sent here.');
      }));
      action('I sent this manually',buttons,()=>run(async a=>{await rpc('cs_sales_mark_sent',{p_draft:d.id},a);await loadProspects(a);await openProspect(selected.id,a);},'Manual sending recorded. Delivery has not been verified.'));
    }
  }}
  $('salesLoadBookings').onclick=()=>run(async a=>{const rows=await rpc('cs_sales_bookings',{p_query:$('salesBookingSearch').value.trim()},a);clear('salesBookingSelect');
    const blank=el('option',rows.length?'Choose a booking':'No bookings found',$('salesBookingSelect'));blank.value='';
    for(const b of rows){const o=el('option',`#${b.id} · ${b.booking_date} · ${b.customer_name} · ${b.service} · ${b.status||'Pending'}${b.prospect_id?' · already linked':''}`,$('salesBookingSelect'));o.value=b.id;o.disabled=!!b.prospect_id||b.status==='Cancelled';}
  },'Booking search complete. Refine the name or ID if needed.');
  $('salesLink').onclick=()=>run(async a=>{const id=$('salesBookingSelect').value;if(!id)throw Error('Choose an available booking first.');await rpc('cs_sales_link_booking',{p_prospect:selected.id,p_booking:id},a);await loadProspects(a);await openProspect(selected.id,a);},'Booking linked. Refresh the report to update conversion.');
  $('salesEventForm').onsubmit=e=>{e.preventDefault();run(async a=>{const f=fields('salesEventForm');check(await db.from('cs_sales_events').insert({prospect_id:selected.id,kind:f.kind.value,note:f.note.value.trim()}));a();f.note.value='';await loadDetail(a);},'Activity recorded.');};
})();
